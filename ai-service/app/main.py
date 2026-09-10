from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.market_engine.gis_service import MarketEngine
from app.finance_engine.structuring_service import FinanceEngine
from app.scheme_engine.rule_evaluator import SchemeRuleEngine
from app.risk_engine.risk_analyzer import RiskEngine
from app.recommendation_engine.scoring_pipeline import RecommendationEngine
from app.simulation_engine.whatif_simulator import SimulationEngine
from app.rag_engine.retriever import RAGRetriever
from app.nlu_engine.multilingual_parser import MultilingualParser
from app.explainability.explanation_generator import ExplanationGenerator
from app.advisory_agent.udyam_sarthi import UdyamSarthiAgent

app = FastAPI(
    title="UdyamSarthi AI Specialist Analytics Microservice",
    description="Deterministic and ML engines for Hyper-Local Rural Micro-Enterprise Decision Support (MoSJE)",
    version="1.0.0"
)

# Enable CORS for Node backend and Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
market_engine = MarketEngine()
finance_engine = FinanceEngine()
scheme_engine = SchemeRuleEngine()
risk_engine = RiskEngine()
recommendation_engine = RecommendationEngine()
simulation_engine = SimulationEngine()
rag_retriever = RAGRetriever()
nlu_parser = MultilingualParser()
explainability_engine = ExplanationGenerator()
udyam_sarthi_agent = UdyamSarthiAgent()

# -----------------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------------
class ParseRequest(BaseModel):
    text: str

class MarketRequest(BaseModel):
    latitude: float = 20.1706
    longitude: float = 73.9840
    category_code: str = "VEGETABLE_FARMING"
    radius_km: float = 10.0

class FinanceRequest(BaseModel):
    project_cost: float
    available_capital: float
    liquid_reserve: float = 20000.0
    interest_rate: Optional[float] = None
    tenure_years: Optional[int] = None
    monthly_revenue: float = 60000.0
    monthly_expense: float = 38000.0

class ProfileRequest(BaseModel):
    name: Optional[str] = "Kisan Entrepreneur"
    social_category: str = "OBC"
    gender: Optional[str] = "MALE"
    annual_family_income: float = 180000.0
    latitude: float = 20.1706
    longitude: float = 73.9840
    available_capital: float = 300000.0
    liquid_reserve: float = 20000.0
    land_acres: float = 1.0
    has_shop_building: bool = False
    has_vehicle: bool = False
    has_machinery: bool = False
    has_electricity: bool = True
    has_water_source: bool = True
    has_internet: bool = True
    skills: List[str] = ["farming"]
    experience_years: int = 3
    business_interest: Optional[str] = None
    preferred_language: str = "hi"
    analysis_radius_km: float = 10.0

class SimulationRequest(BaseModel):
    scenario_a: Dict[str, Any]
    scenario_b: Dict[str, Any]

class RAGRequest(BaseModel):
    query: str
    top_k: int = 3

class AgentChatRequest(BaseModel):
    message: str
    profile: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = "default_session"

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "UdyamSarthi AI Microservice",
        "engines_loaded": ["Market", "Finance", "Scheme", "Risk", "Recommendation", "Simulation", "RAG", "NLU", "UdyamSarthiAgent"]
    }

@app.post("/api/agent/chat")
def chat_with_agent(req: AgentChatRequest):
    """
    Direct interface to UdyamSarthi Advisory Agent adhering to all 59 rules:
    Trilingual (HI/TE/EN/MIXED), zero hallucination, Section 12 profile tracking,
    deterministic math/schemes, what-if simulations, and explainability.
    """
    return udyam_sarthi_agent.process_turn(req.message, req.profile)

@app.post("/api/nlp/parse")
def parse_multilingual_query(req: ParseRequest):
    """Parses natural language query in Hindi, Telugu, or English into structured parameters."""
    return nlu_parser.parse_user_prompt(req.text)

@app.post("/api/market/analyze")
def analyze_market(req: MarketRequest):
    """Executes hyper-local GIS market analysis within configured radius."""
    return market_engine.analyze_market(req.latitude, req.longitude, req.category_code, req.radius_km)

@app.get("/api/market/competitors")
def get_competitors(latitude: float = 20.1706, longitude: float = 73.9840, radius_km: float = 10.0):
    """Retrieves all competitor and local market pins within radius."""
    return market_engine.get_nearby_competitors(latitude, longitude, radius_km)

@app.get("/api/market/places")
def get_places(latitude: float = 20.1706, longitude: float = 73.9840, radius_km: float = 10.0, category: str = "ALL"):
    """Retrieves all places, shops, suppliers, and institutions within radius."""
    return market_engine.get_nearby_places(latitude, longitude, radius_km, category)

@app.get("/api/market/categories")
def get_categories():
    """Retrieves all configurable business and ecosystem categories."""
    return market_engine.categories

@app.post("/api/finance/structure")
def structure_finances(req: FinanceRequest):
    """Computes SIH26091 concessional loan financing, reducing EMI, and DSCR."""
    return finance_engine.structure_project(
        project_cost=req.project_cost,
        available_capital=req.available_capital,
        liquid_reserve=req.liquid_reserve,
        custom_interest_rate=req.interest_rate,
        custom_tenure_years=req.tenure_years,
        base_monthly_revenue=req.monthly_revenue,
        base_monthly_expense=req.monthly_expense
    )

@app.post("/api/schemes/evaluate")
def evaluate_schemes(profile: Dict[str, Any], project_cost: float = 300000.0):
    """Runs deterministic rule checks for MoSJE concessional schemes."""
    return scheme_engine.evaluate_schemes(profile, project_cost)

@app.post("/api/recommendations")
def get_recommendations(req: Dict[str, Any] = Body(...)):
    """Executes full multi-factor decision pipeline to generate explainable recommendations."""
    norm = udyam_sarthi_agent.normalize_profile(req)
    
    cap = norm.get("financial", {}).get("capital") or req.get("available_capital") or req.get("capital") or 300000.0
    land = norm.get("land_workspace", {}).get("land_area") or req.get("land_acres") or 1.0
    radius = req.get("analysis_radius_km") or 10.0
    lang = norm.get("personal", {}).get("language") or req.get("preferred_language") or "hi"
    
    profile_dict = {
        "name": norm.get("personal", {}).get("name") or req.get("name") or "Entrepreneur",
        "social_category": norm.get("government", {}).get("social_category") or req.get("social_category") or "OBC",
        "gender": req.get("gender") or "MALE",
        "annual_family_income": req.get("annual_family_income") or 180000.0,
        "latitude": req.get("latitude") or 20.1706,
        "longitude": req.get("longitude") or 73.9840,
        "available_capital": cap,
        "liquid_reserve": req.get("liquid_reserve") or 20000.0,
        "land_acres": land,
        "has_shop_building": bool(req.get("has_shop_building")),
        "has_vehicle": bool(req.get("has_vehicle")),
        "has_machinery": bool(req.get("has_machinery")),
        "has_electricity": bool(req.get("has_electricity", True)),
        "has_water_source": bool(norm.get("resources", {}).get("water") or req.get("has_water_source", True)),
        "has_internet": bool(req.get("has_internet", True)),
        "skills": req.get("skills") or ["farming"],
        "experience_years": norm.get("farmer", {}).get("farming_experience_years") or req.get("experience_years") or 3,
        "business_interest": norm.get("business", {}).get("business_idea") or req.get("business_interest"),
        "preferred_language": lang,
        "analysis_radius_km": radius
    }
    
    results = recommendation_engine.evaluate_recommendations(profile_dict, radius)
    
    # Attach explainability to the top recommendation
    if results.get("top_recommendation"):
        top_rec = results["top_recommendation"]
        explanation = explainability_engine.generate_explanation(top_rec, lang)
        results["top_recommendation"]["explanation"] = explanation

    return results

@app.post("/api/simulation/whatif")
def simulate_whatif(req: SimulationRequest):
    """Runs comparative What-If financial simulation between Scenario A and Scenario B."""
    return simulation_engine.simulate_whatif(req.scenario_a, req.scenario_b)

@app.post("/api/rag/search")
def search_scheme_docs(req: RAGRequest):
    """Retrieves verified government scheme documentation with citations."""
    return rag_retriever.retrieve(req.query, req.top_k)
