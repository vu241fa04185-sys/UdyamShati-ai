import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.advisory_agent.udyam_sarthi import UdyamSarthiAgent

def test_udyam_sarthi_suite():
    agent = UdyamSarthiAgent()
    print("=== STARTING UDYAMSARTHI 59-POINT SPECIFICATION TEST SUITE ===")

    # TEST 1: Initial Greeting & Missing Capital Check (Rules 11, 35)
    print("\n--- Test 1: Initial Conversation & Asking Capital ---")
    t1 = agent.process_turn("Namaste! Mujhe business start karna hai.")
    print("Detected Lang:", t1["detected_language"])
    print("Intent:", t1["intent"])
    print("Action Type:", t1["action_type"])
    print("Reply Snippet:", t1["reply"][:120].replace('\n', ' '))
    assert t1["detected_language"] in ["HINDI", "MIXED"]
    assert t1["action_type"] in ["ASK_CAPITAL", "START_BUSINESS"]
    print("✔ Passed Test 1!")

    # TEST 2: Providing Capital & Remembering Context (Rules 12, 13, 18)
    print("\n--- Test 2: Ingesting Capital & Retaining Context ---")
    profile_turn1 = t1["updated_profile"]
    t2 = agent.process_turn("Mere paas 3 lakh rupaye hain aur 2 acre zameen hai.", profile_turn1)
    print("Extracted Capital:", t2["updated_profile"]["financial"]["capital"])
    print("Extracted Land:", t2["updated_profile"]["resources"]["land_acres"])
    print("Profile Completion:", t2["profile_completeness"])
    assert t2["updated_profile"]["financial"]["capital"] == 300000.0
    assert t2["updated_profile"]["resources"]["land_acres"] == 2.0
    print("✔ Passed Test 2!")

    # TEST 3: Language Switching to Telugu without Losing Context (Rules 8, 9, 48)
    print("\n--- Test 3: Language Switching to Telugu (Memory Preserved) ---")
    profile_turn2 = t2["updated_profile"]
    t3 = agent.process_turn("Telugu lo cheppandi, naaku dairy business gurinchi details kavali.", profile_turn2)
    print("Detected Lang:", t3["detected_language"])
    print("Preserved Capital:", t3["updated_profile"]["financial"]["capital"])
    print("Preserved Land:", t3["updated_profile"]["resources"]["land_acres"])
    assert t3["detected_language"] == "TELUGU"
    assert t3["updated_profile"]["financial"]["capital"] == 300000.0
    assert t3["updated_profile"]["resources"]["land_acres"] == 2.0
    print("Reply Snippet:", t3["reply"][:140].replace('\n', ' '))
    print("✔ Passed Test 3!")

    # TEST 4: Business Comparison (Rule 49)
    print("\n--- Test 4: Side-by-Side Business Comparison (Dairy vs Poultry) ---")
    t4 = agent.process_turn("Dairy aur poultry mein kya better hai?", t3["updated_profile"])
    print("Intent:", t4["intent"])
    print("Comparison Table Factors:", [row["factor"] for row in (t4["comparison_table"] or [])])
    assert t4["intent"] == "BUSINESS_COMPARISON"
    assert t4["comparison_table"] is not None
    assert len(t4["comparison_table"]) >= 4
    print("✔ Passed Test 4!")

    # TEST 5: Financial Analysis & Concessional EMI (Rules 24, 51)
    print("\n--- Test 5: Deterministic EMI & Concessional Loan Structure ---")
    t5 = agent.process_turn("5 lakh loan ki EMI kitni hogi?", t3["updated_profile"])
    print("Intent:", t5["intent"])
    print("Monthly EMI:", t5["financial_summary"]["monthly_emi"])
    print("Interest Rate:", t5["financial_summary"]["interest_rate_pct"])
    print("DSCR:", t5["financial_summary"]["dscr"])
    assert t5["intent"] in ["EMI_CALCULATION", "FINANCIAL_ANALYSIS"]
    assert t5["financial_summary"]["monthly_emi"] > 0
    assert t5["financial_summary"]["dscr"] > 1.0
    print("✔ Passed Test 5!")

    # TEST 6: What-If Simulation (Rules 29, 52)
    print("\n--- Test 6: What-If Scenario Simulation (3L vs 5L) ---")
    t6 = agent.process_turn("Agar mere paas 3 lakh ki jagah 5 lakh ho to kya hoga?", t3["updated_profile"])
    print("Intent:", t6["intent"])
    print("Simulation Deltas:", t6["financial_summary"]["deltas"])
    assert t6["intent"] == "WHAT_IF_SIMULATION"
    assert "project_cost" in t6["financial_summary"]["deltas"]
    print("✔ Passed Test 6!")

    # TEST 7: Out-of-Domain Protection (Rule 38)
    print("\n--- Test 7: Out-of-Domain Guardrail (Cricket query) ---")
    t7 = agent.process_turn("Who will win today's cricket match between India and Australia?")
    print("Intent:", t7["intent"])
    print("Reply:", t7["reply"])
    assert t7["intent"] == "OUT_OF_DOMAIN"
    assert "UdyamSarthi" in t7["reply"]
    print("✔ Passed Test 7!")

    # TEST 8: Full Recommendation with Recommendation vs Confidence Score (Rules 30, 31)
    print("\n--- Test 8: Full Explainable Recommendation & Dual Scores ---")
    t8 = agent.process_turn("Kaunsa business mere liye best rahega?", t2["updated_profile"])
    print("Recommendation Score:", t8["recommendation_score"])
    print("Confidence Score:", t8["confidence_score"])
    print("Sources:", t8["sources"])
    assert t8["recommendation_score"] is not None
    assert t8["confidence_score"] is not None
    assert len(t8["sources"]) >= 1
    print("✔ Passed Test 8!")

    # TEST 9: Step-by-Step Guided Form Filling & Location Ingestion (Rule 10, 11)
    print("\n--- Test 9: Step-by-Step Guided Form Filling ---")
    t9_a = agent.process_turn("Mujhe form bharna hai, sawal pucho step by step")
    print("Step 1 Intent:", t9_a["intent"], "Action:", t9_a["action_type"])
    assert t9_a["intent"] == "FORM_FILLING"
    assert t9_a["action_type"] == "ASK_LOCATION"

    t9_b = agent.process_turn("Mera naam Ramesh Kisan hai, Pimpalgaon village se hoon", t9_a["updated_profile"])
    print("Extracted Name:", t9_b["updated_profile"]["name"])
    print("Extracted Village:", t9_b["updated_profile"]["location"]["village"])
    assert t9_b["updated_profile"]["name"] == "Ramesh Kisan"
    assert t9_b["updated_profile"]["location"]["village"] == "Pimpalgaon"

    t9_c = agent.process_turn("Mere paas 2 lakh rupaye hain", t9_b["updated_profile"])
    print("Extracted Capital:", t9_c["updated_profile"]["financial"]["capital"])
    assert t9_c["updated_profile"]["financial"]["capital"] == 200000.0
    # TEST 10: Specific Business Interest & Conditional Questioning (Rule 37)
    print("\n--- Test 10: Business-Specific Conditional Questions (Dairy) ---")
    t10 = agent.process_turn("Mujhe dairy farming shuru karni hai", t9_c["updated_profile"])
    print("Intent:", t10["intent"], "Action:", t10["action_type"])
    assert t10["intent"] == "BUSINESS_INTEREST"
    assert t10["action_type"] == "ASK_DAIRY_DETAILS"
    assert "शेड" in t10["reply"] or "shed" in t10["reply"].lower()
    print("✔ Passed Test 10!")

    # TEST 11: Comprehensive 7-Factor Risk Analysis (Rule 28)
    print("\n--- Test 11: 7-Factor Risk Assessment (No Zero Risk) ---")
    t11 = agent.process_turn("Is business mein kya risk hai aur kitna nuksan ho sakta hai?", t10["updated_profile"])
    print("Intent:", t11["intent"], "Action:", t11["action_type"])
    assert t11["intent"] == "RISK_ANALYSIS"
    assert t11["action_type"] == "SHOW_RISK"
    assert "शून्य जोखिम" in t11["reply"] or "zero risk" in t11["reply"].lower()
    print("✔ Passed Test 11!")

    # TEST 12: Deterministic Scheme Eligibility Determination (Rule 27)
    print("\n--- Test 12: Scheme Qualification Determination ---")
    t12 = agent.process_turn("Kya main kisi sarkari loan scheme ke liye eligible hoon?", t10["updated_profile"])
    print("Intent:", t12["intent"], "Action:", t12["action_type"])
    assert t12["intent"] == "SCHEME_ELIGIBILITY"
    assert t12["action_type"] == "SHOW_SCHEMES"
    assert "पात्र" in t12["reply"] or "eligible" in t12["reply"].lower()
    print("✔ Passed Test 12!")

    # TEST 13: Break-Even Economics & Cashflow Analysis (Rule 24, 51)
    print("\n--- Test 13: Break-Even & Payback Analysis ---")
    t13 = agent.process_turn("Mera break even kab hoga aur profit margin kitna hai?", t10["updated_profile"])
    print("Intent:", t13["intent"], "Financial Summary:", t13["financial_summary"])
    assert t13["intent"] == "BREAK_EVEN_ANALYSIS"
    assert t13["financial_summary"]["break_even_monthly_revenue"] > 0
    assert t13["financial_summary"]["estimated_payback_months"] >= 6
    print("✔ Passed Test 13!")

    # TEST 14: Profile Summary & Completeness Audit (Rule 12, 34)
    print("\n--- Test 14: Profile State & Completeness Audit ---")
    t14 = agent.process_turn("Mera profile kya hai, details dikhao", t10["updated_profile"])
    print("Intent:", t14["intent"], "Action:", t14["action_type"])
    assert t14["intent"] == "PROFILE_QUERY"
    assert "Ramesh Kisan" in t14["reply"]
    assert "Pimpalgaon" in t14["reply"]
    print("✔ Passed Test 14!")

    print("\n🎉 ALL 14 UDYAMSARTHI SUITE TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_udyam_sarthi_suite()
