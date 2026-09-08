import sys
from pathlib import Path
# Add ai-service to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.nlu_engine.multilingual_parser import MultilingualParser
from app.market_engine.gis_service import MarketEngine
from app.finance_engine.structuring_service import FinanceEngine
from app.scheme_engine.rule_evaluator import SchemeRuleEngine
from app.risk_engine.risk_analyzer import RiskEngine
from app.recommendation_engine.scoring_pipeline import RecommendationEngine
from app.simulation_engine.whatif_simulator import SimulationEngine
from app.rag_engine.retriever import RAGRetriever

def run_tests():
    print("=== TEST 1: Multilingual NLU Parsing ===")
    parser = MultilingualParser()
    sample_text = "Mere paas 3 lakh rupees hain, farming ka experience hai aur 2 acre land hai. Mere village mein koi profitable business suggest karo."
    parsed = parser.parse_user_prompt(sample_text)
    print("Input:", sample_text)
    print("Parsed output:", parsed)
    assert parsed["detected_language"] == "hi"
    assert parsed["entities"]["capital"] == 300000.0
    assert parsed["entities"]["land_acres"] == 2.0
    assert "farming" in parsed["entities"]["skills"]
    print("--> Multilingual NLU Test PASSED!\n")

    print("=== TEST 2: Market GIS Distance & Competitors ===")
    market = MarketEngine()
    nashik_lat, nashik_lon = 20.1706, 73.9840
    analysis = market.analyze_market(nashik_lat, nashik_lon, "VEGETABLE_FARMING", radius_km=10.0)
    print("Market Opportunity Analysis for VEGETABLE_FARMING:")
    print("  Reference Village:", analysis["reference_village"])
    print("  Population reach:", analysis["population_reach"])
    print("  Competitor count:", analysis["competitor_count"])
    print("  Demand index:", analysis["demand_index"])
    print("  Demand-Supply gap:", analysis["demand_supply_gap"])
    print("  Market score:", analysis["market_opportunity_score"])
    assert analysis["market_opportunity_score"] > 50
    print("--> Market Engine Test PASSED!\n")

    print("=== TEST 3: SIH26091 Financial Structuring ===")
    finance = FinanceEngine()
    # Test case: ₹3,00,000 project cost with ₹3,00,000 available capital
    fin_res = finance.structure_project(
        project_cost=300000.0,
        available_capital=300000.0,
        liquid_reserve=20000.0,
        base_monthly_revenue=62000.0,
        base_monthly_expense=38000.0
    )
    print("Financial Structure (Project Cost: ₹3,00,000):")
    print("  Scheme Tier:", fin_res["scheme_tier"])
    print("  Beneficiary Margin (10%):", fin_res["own_contribution_required"])
    print("  Loan Amount (90%):", fin_res["loan_amount"])
    print("  Monthly EMI (Reducing Balance @ 8% 7yr):", fin_res["monthly_emi"])
    print("  Monthly Operating Profit:", fin_res["projected_monthly_operating_profit"])
    print("  DSCR (Debt Service Coverage Ratio):", fin_res["dscr"])
    print("  Financial Viability:", fin_res["financial_viability"])
    assert fin_res["own_contribution_required"] == 30000.0
    assert fin_res["loan_amount"] == 270000.0
    assert fin_res["dscr"] >= 1.50
    print("--> Financial Structuring Test PASSED!\n")

    print("=== TEST 4: MoSJE Scheme Deterministic Rule Evaluation ===")
    scheme_engine = SchemeRuleEngine()
    profile = {
        "social_category": "OBC",
        "annual_family_income": 180000.0,
        "age": 30
    }
    schemes = scheme_engine.evaluate_schemes(profile, project_cost=300000.0)
    print(f"Matched {len(schemes)} total schemes.")
    eligible_schemes = [s for s in schemes if s["is_eligible"]]
    print("Eligible Schemes:")
    for s in eligible_schemes:
        print(f"  - {s['title_en']} ({s['scheme_code']}) @ {s['interest_rate_pct']}% interest (Verified: {s['last_verified_date']})")
    assert len(eligible_schemes) >= 2
    print("--> Scheme Rule Engine Test PASSED!\n")

    print("=== TEST 5: Risk Assessment & Stress Testing ===")
    risk_engine = RiskEngine()
    stress_res = risk_engine.stress_test(
        base_revenue=62000.0,
        base_expense=38000.0,
        monthly_emi=fin_res["monthly_emi"],
        revenue_shock_pct=-20.0,
        expense_shock_pct=15.0
    )
    print("Economic Shock Stress Test (-20% Revenue, +15% Expenses):")
    print("  Base Profit:", stress_res["base_monthly_profit"])
    print("  Stressed Profit:", stress_res["stressed_monthly_profit"])
    print("  Monthly EMI:", stress_res["monthly_emi"])
    print("  Stressed Net Cash Surplus:", stress_res["stressed_net_monthly_surplus"])
    print("  Stressed DSCR:", stress_res["stressed_dscr"])
    print("  Survival Status:", stress_res["survival_status"])
    assert stress_res["stressed_dscr"] > 0
    print("--> Risk Engine Test PASSED!\n")

    print("=== TEST 6: Full Decision Recommendation Pipeline ===")
    rec_engine = RecommendationEngine()
    rec_profile = {
        "name": "Ramesh Kisan",
        "social_category": "OBC",
        "available_capital": 300000.0,
        "liquid_reserve": 20000.0,
        "land_acres": 2.0,
        "has_water_source": True,
        "has_electricity": True,
        "skills": ["farming", "agriculture"],
        "latitude": 20.1706,
        "longitude": 73.9840,
        "analysis_radius_km": 10.0,
        "preferred_language": "hi"
    }
    recommendations = rec_engine.evaluate_recommendations(rec_profile)
    print(f"Viable candidates: {recommendations['viable_candidates_count']}")
    top = recommendations["top_recommendation"]
    print("Top Recommendation:", top["name_en"], f"(Score: {top['overall_suitability_score']}/100, Confidence: {top['confidence_score']}%)")
    print("  Top Scheme:", top["top_scheme"]["title_en"])
    print("  Why Recommended (EN):", top["why_recommended_en"])
    print("  Alternatives:")
    for alt in recommendations["alternatives"]:
        print(f"    - {alt['name_en']}: {alt['overall_suitability_score']}/100")
    assert top is not None
    assert top["overall_suitability_score"] > 70
    print("--> Recommendation Engine Test PASSED!\n")

    print("=== TEST 7: RAG Scheme Document Retrieval ===")
    rag = RAGRetriever()
    query = "What is the interest rate and moratorium for NBCFDC term loan?"
    chunks = rag.retrieve(query, top_k=2)
    print(f"Query: '{query}' -> Found {len(chunks)} relevant chunks:")
    for c in chunks:
        print(f"  - [{c['scheme_code']}] {c['title']} | Source: {c['source']}")
    assert len(chunks) > 0
    print("--> RAG Retriever Test PASSED!\n")

    print("ALL 7 AI SPECIALIST ENGINES VERIFIED AND PASSING SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
