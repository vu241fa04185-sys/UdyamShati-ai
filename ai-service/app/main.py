from fastapi import FastAPI, HTTPException
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

app = FastAPI(
    title="UdyamSetu AI Specialist Analytics Microservice",
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

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "UdyamSetu AI Microservice",
        "engines_loaded": ["Market", "Finance", "Scheme", "Risk", "Recommendation", "Simulation", "RAG", "NLU"]
    }

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
def get_recommendations(profile: ProfileRequest):
    """Executes full multi-factor decision pipeline to generate explainable recommendations."""
    profile_dict = profile.model_dump()
    results = recommendation_engine.evaluate_recommendations(profile_dict, profile.analysis_radius_km)
    
    # Attach explainability to the top recommendation
    if results.get("top_recommendation"):
        top_rec = results["top_recommendation"]
        explanation = explainability_engine.generate_explanation(top_rec, profile.preferred_language)
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
