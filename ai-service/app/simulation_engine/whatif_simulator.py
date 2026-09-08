from typing import Dict, Any
from app.finance_engine.structuring_service import FinanceEngine

class SimulationEngine:
    def __init__(self):
        self.finance_engine = FinanceEngine()

    def simulate_whatif(
        self,
        scenario_a: Dict[str, Any],
        scenario_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compares two distinct business scenarios (e.g. Capital ₹3L vs ₹5L, or 6.5% vs 9% interest).
        Returns side-by-side metrics and comparative impact assessment.
        """
        res_a = self.finance_engine.structure_project(
            project_cost=float(scenario_a.get("project_cost", 300000.0)),
            available_capital=float(scenario_a.get("available_capital", 300000.0)),
            liquid_reserve=float(scenario_a.get("liquid_reserve", 20000.0)),
            custom_interest_rate=float(scenario_a.get("interest_rate", 8.0)),
            custom_tenure_years=int(scenario_a.get("tenure_years", 7)),
            base_monthly_revenue=float(scenario_a.get("monthly_revenue", 60000.0)),
            base_monthly_expense=float(scenario_a.get("monthly_expense", 38000.0))
        )

        res_b = self.finance_engine.structure_project(
            project_cost=float(scenario_b.get("project_cost", 500000.0)),
            available_capital=float(scenario_b.get("available_capital", 500000.0)),
            liquid_reserve=float(scenario_b.get("liquid_reserve", 30000.0)),
            custom_interest_rate=float(scenario_b.get("interest_rate", 8.0)),
            custom_tenure_years=int(scenario_b.get("tenure_years", 7)),
            base_monthly_revenue=float(scenario_b.get("monthly_revenue", 90000.0)),
            base_monthly_expense=float(scenario_b.get("monthly_expense", 52000.0))
        )

        # Delta calculations
        delta_project_cost = res_b["project_cost"] - res_a["project_cost"]
        delta_loan = res_b["loan_amount"] - res_a["loan_amount"]
        delta_emi = res_b["monthly_emi"] - res_a["monthly_emi"]
        delta_profit = res_b["projected_monthly_operating_profit"] - res_a["projected_monthly_operating_profit"]
        delta_surplus = res_b["monthly_net_surplus_after_emi"] - res_a["monthly_net_surplus_after_emi"]
        delta_dscr = round(res_b["dscr"] - res_a["dscr"], 2)

        comparative_summary = (
            f"Scaling project cost from ₹{res_a['project_cost']:,.0f} to ₹{res_b['project_cost']:,.0f} increases "
            f"monthly operating profit by ₹{delta_profit:,.0f}, while raising monthly EMI by ₹{delta_emi:,.0f}. "
            f"Net monthly cash surplus after loan servicing changes by ₹{delta_surplus:,.0f} (DSCR: {res_a['dscr']}x vs {res_b['dscr']}x)."
        )

        return {
            "scenario_a": {
                "name": scenario_a.get("name", "Scenario A (Conservative)"),
                "results": res_a
            },
            "scenario_b": {
                "name": scenario_b.get("name", "Scenario B (Scaled Up)"),
                "results": res_b
            },
            "deltas": {
                "project_cost": delta_project_cost,
                "loan_amount": delta_loan,
                "monthly_emi": delta_emi,
                "monthly_operating_profit": delta_profit,
                "monthly_net_surplus": delta_surplus,
                "dscr": delta_dscr
            },
            "comparative_summary": comparative_summary
        }
