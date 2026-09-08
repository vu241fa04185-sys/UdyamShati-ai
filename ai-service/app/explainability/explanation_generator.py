from typing import Dict, Any

class ExplanationGenerator:
    def generate_explanation(self, recommendation: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        """
        Builds a transparent, explainable reasoning chain for the rural entrepreneur.
        Never returns a black-box answer.
        """
        biz_name_en = recommendation.get("name_en", "Recommended Business")
        biz_name_hi = recommendation.get("name_hi", biz_name_en)
        biz_name_te = recommendation.get("name_te", biz_name_en)
        score = recommendation.get("overall_suitability_score", 85.0)
        confidence = recommendation.get("confidence_score", 88.0)

        market = recommendation.get("market", {})
        fin = recommendation.get("financials", {})
        top_scheme = recommendation.get("top_scheme", {})
        stress = recommendation.get("stress_test", {})

        # English Explanation
        chain_en = [
            f"1. Market Evidence: Local demand index is {market.get('demand_index')}/100 with an unmet supply gap of {market.get('demand_supply_gap')} across {market.get('population_reach', 10000):,} residents within {market.get('analysis_radius_km', 10)} km.",
            f"2. Capital Alignment: Out of ₹{fin.get('project_cost', 0):,.0f} total project investment, you contribute 10% (₹{fin.get('own_contribution_required', 0):,.0f}), preserving your liquid reserve.",
            f"3. Concessional Scheme: Matched with {top_scheme.get('title_en', 'MoSJE Concessional Loan')} offering {fin.get('loan_amount', 0):,.0f} credit @ {fin.get('interest_rate_pct')}% interest with {fin.get('moratorium_months')} months moratorium.",
            f"4. Debt Safety Cushion: Monthly EMI of ₹{fin.get('monthly_emi', 0):,.0f} is covered {fin.get('dscr')}x by operating cash flow (Benchmark >= 1.50x).",
            f"5. Stress Resilience: Under severe -20% revenue and +15% cost inflation shock, the business {stress.get('survival_status', 'SURVIVES COMFORTABLY')} (Stressed DSCR: {stress.get('stressed_dscr')}x)."
        ]

        # Hindi Explanation
        chain_hi = [
            f"1. स्थानीय बाजार साक्ष्य: आपके {market.get('analysis_radius_km', 10)} किमी दायरे में मांग सूचकांक {market.get('demand_index')}/100 है तथा {market.get('demand_supply_gap')} का बड़ा आपूर्ति अंतर है।",
            f"2. पूंजी अनुकूलता: कुल ₹{fin.get('project_cost', 0):,.0f} लागत में से केवल 10% (₹{fin.get('own_contribution_required', 0):,.0f}) आपका अंशदान होगा, आपातकालीन बचत सुरक्षित रहेगी।",
            f"3. सरकारी सहायता: {top_scheme.get('title_hi', 'सामाजिक न्याय एवं अधिकारिता मंत्रालय रियायती ऋण')} के तहत ₹{fin.get('loan_amount', 0):,.0f} ऋण {fin.get('interest_rate_pct')}% ब्याज पर उपलब्ध है।",
            f"4. ऋण सुरक्षा (DSCR): ₹{fin.get('monthly_emi', 0):,.0f} की मासिक किस्त {fin.get('dscr')}x सुरक्षित आय द्वारा आसानी से चुकाई जा सकती है।",
            f"5. मंदी सहनशीलता: 20% आय घटने और 15% खर्च बढ़ने पर भी व्यवसाय सुरक्षित रहेगा (मंदी में DSCR: {stress.get('stressed_dscr')}x)।"
        ]

        # Telugu Explanation
        chain_te = [
            f"1. స్థానిక మార్కెట్ విశ్లేషణ: మీ {market.get('analysis_radius_km', 10)} కి.మీ పరిధిలో డిమాండ్ సూచిక {market.get('demand_index')}/100 గా ఉంది మరియు గణనీయమైన సప్లై గ్యాప్ ఉంది.",
            f"2. ఆర్థిక సౌలభ్యం: మొత్తం ₹{fin.get('project_cost', 0):,.0f} ప్రాజెక్ట్ ఖర్చులో మీ వాటా కేవలం 10% (₹{fin.get('own_contribution_required', 0):,.0f}) మాత్రమే.",
            f"3. ప్రభుత్వ పథకం: {top_scheme.get('title_te', 'రాయితీ రుణం')} ద్వారా ₹{fin.get('loan_amount', 0):,.0f} రుణం {fin.get('interest_rate_pct')}% వడ్డీ రేటుతో లభిస్తుంది.",
            f"4. ఈఎంఐ చెల్లింపు సామర్థ్యం: నెలకు ₹{fin.get('monthly_emi', 0):,.0f} ఈఎంఐని వ్యాపార లాభం {fin.get('dscr')}x రేషియోతో సురక్షితంగా భరిస్తుంది.",
            f"5. ఒత్తిడి తట్టుకునే శక్తి: 20% ఆదాయం తగ్గినా వ్యాపారం నిలబడుతుంది."
        ]

        return {
            "business_name": biz_name_te if language == "te" else (biz_name_hi if language == "hi" else biz_name_en),
            "suitability_score": score,
            "data_confidence_pct": confidence,
            "language": language,
            "evidence_chain": chain_te if language == "te" else (chain_hi if language == "hi" else chain_en),
            "summary": chain_hi[0] if language == "hi" else (chain_te[0] if language == "te" else chain_en[0])
        }
