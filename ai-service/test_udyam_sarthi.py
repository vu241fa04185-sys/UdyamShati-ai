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

    print("\n🎉 ALL 8 UDYAMSARTHI SUITE TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_udyam_sarthi_suite()
