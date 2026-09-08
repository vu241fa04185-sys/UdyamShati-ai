from typing import List, Dict, Any

class RiskEngine:
    def evaluate_risks(
        self,
        business_meta: Dict[str, Any],
        market_analysis: Dict[str, Any],
        financial_analysis: Dict[str, Any],
        entrepreneur_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Evaluates 7 risk dimensions:
        Probability (1-5) x Impact (1-5) = Risk Score (1-25)
        """
        category_code = business_meta.get("category_code")
        risk_tier = business_meta.get("risk_tier", "MEDIUM")
        seasonality = business_meta.get("seasonality_factor", "LOW")

        # 1. Market Risk
        demand_gap = market_analysis.get("demand_supply_gap", 20.0)
        p_market = 2 if demand_gap >= 30 else (3 if demand_gap >= 15 else 4)
        i_market = 3
        market_risk = p_market * i_market

        # 2. Competition Risk
        comp_count = market_analysis.get("competitor_count", 0)
        p_comp = 1 if comp_count == 0 else (2 if comp_count == 1 else (3 if comp_count <= 3 else 4))
        i_comp = 3
        comp_risk = p_comp * i_comp

        # 3. Financial Risk (linked to DSCR and leverage)
        dscr = financial_analysis.get("dscr", 1.5)
        p_fin = 1 if dscr >= 1.8 else (2 if dscr >= 1.4 else (3 if dscr >= 1.15 else 5))
        i_fin = 4
        financial_risk = p_fin * i_fin

        # 4. Seasonal Risk
        if seasonality == "HIGH":
            p_season = 4
            i_season = 3
        elif seasonality == "MODERATE":
            p_season = 3
            i_season = 2
        else:
            p_season = 1
            i_season = 2
        seasonal_risk = p_season * i_season

        # 5. Supply Chain Risk
        p_supply = 3 if category_code in ["POULTRY_BROILER", "DAIRY_FARMING"] else 2
        i_supply = 3
        supply_risk = p_supply * i_supply

        # 6. Operational Risk
        p_ops = 3 if risk_tier == "HIGH" else (2 if risk_tier == "MEDIUM" else 1)
        i_ops = 3
        operational_risk = p_ops * i_ops

        # 7. Skill Risk
        required_skills = business_meta.get("skills_required", [])
        has_skill_match = any(s.lower() in [es.lower() for es in entrepreneur_skills] for s in required_skills)
        p_skill = 1 if has_skill_match else 3
        i_skill = 3
        skill_risk = p_skill * i_skill

        risk_factors = [
            {
                "dimension": "Market Demand Risk",
                "probability": p_market,
                "impact": i_market,
                "score": market_risk,
                "severity": self._get_severity(market_risk),
                "mitigation": "Establish multi-channel buyer linkages (local mandis, institutional caterers, and direct buyers) to buffer volume drops."
            },
            {
                "dimension": "Hyper-Local Competition",
                "probability": p_comp,
                "impact": i_comp,
                "score": comp_risk,
                "severity": self._get_severity(comp_risk),
                "mitigation": "Focus on high-freshness quality, reliable delivery schedules, and differentiated service standards."
            },
            {
                "dimension": "Financial & Debt Service Risk",
                "probability": p_fin,
                "impact": i_fin,
                "score": financial_risk,
                "severity": self._get_severity(financial_risk),
                "mitigation": "Maintain a minimum 2-month emergency EMI reserve in liquid savings and leverage concessional MoSJE interest rates."
            },
            {
                "dimension": "Seasonality & Weather Dependency",
                "probability": p_season,
                "impact": i_season,
                "score": seasonal_risk,
                "severity": self._get_severity(seasonal_risk),
                "mitigation": "Stagger production cycles and introduce complementary contra-cyclical value-added offerings during lean months."
            },
            {
                "dimension": "Supply Chain & Input Cost Inflation",
                "probability": p_supply,
                "impact": i_supply,
                "score": supply_risk,
                "severity": self._get_severity(supply_risk),
                "mitigation": "Pre-negotiate bulk feed/seed orders with local primary producer collectives to hedge against retail price spikes."
            },
            {
                "dimension": "Operational & Asset Downtime",
                "probability": p_ops,
                "impact": i_ops,
                "score": operational_risk,
                "severity": self._get_severity(operational_risk),
                "mitigation": "Implement preventive biosecurity / equipment upkeep routines and enroll in govt livestock/machinery insurance."
            },
            {
                "dimension": "Skill & Execution Readiness",
                "probability": p_skill,
                "impact": i_skill,
                "score": skill_risk,
                "severity": self._get_severity(skill_risk),
                "mitigation": "Attend free 5-day skill enhancement modules offered by RSETI or local Krishi Vigyan Kendra (KVK)."
            }
        ]

        # Calculate composite risk safety score (0 - 100)
        # Average risk score is out of 25; map to safety score where lower risk = higher safety
        avg_risk = sum(f["score"] for f in risk_factors) / len(risk_factors)
        risk_safety_score = round(max(20.0, min(95.0, 100.0 - (avg_risk * 3.2))), 1)

        overall_severity = "LOW" if avg_risk <= 7.0 else ("MEDIUM" if avg_risk <= 13.0 else "HIGH")

        return {
            "overall_severity": overall_severity,
            "average_risk_rating": round(avg_risk, 1),
            "risk_safety_score": risk_safety_score,
            "factors": risk_factors
        }

    def _get_severity(self, score: int) -> str:
        if score <= 6:
            return "LOW"
        elif score <= 13:
            return "MEDIUM"
        return "HIGH"

    def stress_test(
        self,
        base_revenue: float,
        base_expense: float,
        monthly_emi: float,
        revenue_shock_pct: float = -20.0,
        expense_shock_pct: float = 15.0
    ) -> Dict[str, Any]:
        """
        Simulates an adverse macro/micro shock:
        - Revenue drops by X% (e.g., -20%)
        - Input expenses increase by Y% (e.g., +15%)
        Recalculates Stressed Profit and Stressed DSCR.
        """
        stressed_revenue = base_revenue * (1.0 + (revenue_shock_pct / 100.0))
        stressed_expense = base_expense * (1.0 + (expense_shock_pct / 100.0))
        stressed_monthly_operating_profit = stressed_revenue - stressed_expense
        annual_stressed_cads = stressed_monthly_operating_profit * 12.0

        annual_debt_service = monthly_emi * 12.0
        if annual_debt_service > 0:
            stressed_dscr = round(annual_stressed_cads / annual_debt_service, 2)
        else:
            stressed_dscr = 9.99

        if stressed_dscr >= 1.25:
            survival_status = "SURVIVES COMFORTABLY"
            resilience_score = 90.0
            verdict_en = "Business retains adequate cash buffer even under combined 20% revenue drop and 15% cost inflation."
            verdict_hi = "20% आय कमी और 15% खर्च बढ़ने पर भी व्यवसाय सुरक्षित रूप से ईएमआई चुका सकता है।"
        elif stressed_dscr >= 1.00:
            survival_status = "SURVIVES TIGHTLY"
            resilience_score = 65.0
            verdict_en = "Business covers loan obligations under stress, but leaves minimal discretionary household surplus."
            verdict_hi = "कठिन परिस्थिति में ऋण चुकाया जा सकता है, पर बचत बहुत कम बचेगी।"
        else:
            survival_status = "DEBT DISTRESS / VULNERABLE"
            resilience_score = 35.0
            verdict_en = "Cash flow drops below EMI obligation under severe shock; emergency working capital support would be required."
            verdict_hi = "गंभीर मंदी में ईएमआई चुकाने में कठिनाई हो सकती है; आपातकालीन आरक्षित निधि आवश्यक है।"

        return {
            "revenue_shock_pct": revenue_shock_pct,
            "expense_shock_pct": expense_shock_pct,
            "base_monthly_revenue": round(base_revenue, 2),
            "stressed_monthly_revenue": round(stressed_revenue, 2),
            "base_monthly_expense": round(base_expense, 2),
            "stressed_monthly_expense": round(stressed_expense, 2),
            "base_monthly_profit": round(base_revenue - base_expense, 2),
            "stressed_monthly_profit": round(stressed_monthly_operating_profit, 2),
            "monthly_emi": round(monthly_emi, 2),
            "stressed_net_monthly_surplus": round(stressed_monthly_operating_profit - monthly_emi, 2),
            "stressed_dscr": stressed_dscr,
            "survival_status": survival_status,
            "resilience_score": resilience_score,
            "verdict_en": verdict_en,
            "verdict_hi": verdict_hi
        }
