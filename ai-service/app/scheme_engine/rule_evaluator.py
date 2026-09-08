import json
from typing import List, Dict, Any
from app.config import SCHEMES_PATH

class SchemeRuleEngine:
    def __init__(self):
        self._load_schemes()

    def _load_schemes(self):
        try:
            with open(SCHEMES_PATH, 'r', encoding='utf-8') as f:
                self.schemes = json.load(f)
        except Exception:
            self.schemes = []

    def evaluate_schemes(self, entrepreneur_profile: Dict[str, Any], project_cost: float) -> List[Dict[str, Any]]:
        """
        Deterministically evaluates entrepreneur eligibility against central and MoSJE schemes.
        Does NOT rely on LLM hallucinations for eligibility criteria.
        """
        social_cat = entrepreneur_profile.get("social_category", "OBC").upper()
        income = float(entrepreneur_profile.get("annual_family_income", 180000.0))
        age = int(entrepreneur_profile.get("age", 28))

        matched_schemes = []

        for scheme in self.schemes:
            rules_passed = []
            rules_failed = []
            is_eligible = True

            rules = scheme.get("rules", [])
            for r in rules:
                param = r.get("parameter")
                op = r.get("operator")
                thresh = r.get("threshold")
                desc = r.get("description", "")

                rule_status = True
                actual_val = None

                if param == "project_cost":
                    actual_val = project_cost
                    if op == "<=":
                        rule_status = project_cost <= float(thresh)
                    elif op == ">=":
                        rule_status = project_cost >= float(thresh)
                elif param == "social_category":
                    actual_val = social_cat
                    if op == "IN":
                        rule_status = social_cat in thresh or "ALL" in thresh
                    elif op == "==":
                        rule_status = social_cat == thresh or thresh == "ALL"
                elif param == "annual_family_income":
                    actual_val = income
                    if op == "<=":
                        rule_status = income <= float(thresh)
                elif param == "age":
                    actual_val = age
                    if op == ">=":
                        rule_status = age >= int(thresh)

                rule_eval = {
                    "parameter": param,
                    "requirement": f"{op} {thresh}",
                    "actual": actual_val,
                    "passed": rule_status,
                    "description": desc
                }

                if rule_status:
                    rules_passed.append(rule_eval)
                else:
                    rules_failed.append(rule_eval)
                    is_eligible = False

            # Check general project cost bounds
            min_cost = scheme.get("min_project_cost", 0)
            max_cost = scheme.get("max_project_cost", float('inf'))
            if project_cost < min_cost:
                is_eligible = False
                rules_failed.append({
                    "parameter": "min_project_cost",
                    "requirement": f">= ₹{min_cost:,.0f}",
                    "actual": project_cost,
                    "passed": False,
                    "description": f"Project cost below scheme minimum threshold of ₹{min_cost:,.0f}"
                })

            eligibility_score = round((len(rules_passed) / max(1, len(rules_passed) + len(rules_failed))) * 100, 1)

            matched_schemes.append({
                "scheme_code": scheme.get("scheme_code"),
                "organization": scheme.get("organization"),
                "title_en": scheme.get("title_en"),
                "title_hi": scheme.get("title_hi"),
                "title_te": scheme.get("title_te"),
                "scheme_type": scheme.get("scheme_type"),
                "description": scheme.get("description"),
                "interest_rate_pct": scheme.get("interest_rate_pct"),
                "beneficiary_margin_pct": scheme.get("beneficiary_margin_pct", 10.0),
                "concessional_loan_pct": scheme.get("concessional_loan_pct", 90.0),
                "max_loan_amount": scheme.get("max_loan_amount"),
                "tenure_years": scheme.get("tenure_years"),
                "moratorium_months": scheme.get("moratorium_months"),
                "subsidy_pct": scheme.get("subsidy_pct", 0.0),
                "source_url": scheme.get("source_url"),
                "last_verified_date": scheme.get("last_verified_date"),
                "official_portal_note": scheme.get("official_portal_note"),
                "is_eligible": is_eligible,
                "eligibility_score": eligibility_score,
                "rules_passed": rules_passed,
                "rules_failed": rules_failed,
                "disclaimer": "Final loan approval and concessional sanction are subject to official verification of documents by the designated State Channelizing Agency (SCA) or financing institution."
            })

        # Sort with eligible schemes first, then by lowest interest rate
        matched_schemes.sort(key=lambda x: (not x["is_eligible"], x["interest_rate_pct"]))
        return matched_schemes
