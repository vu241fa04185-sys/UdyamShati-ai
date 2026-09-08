import math
from typing import Dict, Any, List
from app.config import (
    BENEFICIARY_MARGIN_PCT,
    CONCESSIONAL_LOAN_PCT,
    MICRO_FINANCE_MAX_PROJECT_COST,
    MICRO_FINANCE_MAX_LOAN,
    MICRO_FINANCE_INTEREST_RATE,
    MICRO_FINANCE_TENURE_YEARS,
    MICRO_FINANCE_MORATORIUM_MONTHS,
    TERM_LOAN_MAX_PROJECT_COST,
    TERM_LOAN_MAX_LOAN,
    TERM_LOAN_INTEREST_RATE,
    TERM_LOAN_TENURE_YEARS,
    TERM_LOAN_MORATORIUM_MONTHS
)

def calculate_reducing_emi(principal: float, annual_interest_rate_pct: float, tenure_years: int) -> float:
    """Calculates monthly reducing balance EMI."""
    if principal <= 0:
        return 0.0
    r = (annual_interest_rate_pct / 100.0) / 12.0
    n = tenure_years * 12
    if r == 0:
        return round(principal / n, 2)
    emi = principal * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
    return round(emi, 2)

class FinanceEngine:
    def structure_project(
        self,
        project_cost: float,
        available_capital: float,
        liquid_reserve: float = 20000.0,
        custom_interest_rate: float = None,
        custom_tenure_years: int = None,
        base_monthly_revenue: float = 60000.0,
        base_monthly_expense: float = 38000.0
    ) -> Dict[str, Any]:
        """
        Structures the project finance according to SIH26091 concessional rules:
        - 10% Beneficiary Margin
        - 90% Concessional Loan
        - Checks Micro Finance vs Term Loan criteria
        """
        investable_own_capital = max(0.0, available_capital - liquid_reserve)

        # SIH26091 10/90 Standard Financing Split
        beneficiary_margin_required = project_cost * (BENEFICIARY_MARGIN_PCT / 100.0)
        loan_amount_required = project_cost - beneficiary_margin_required

        # Determine scheme category based on project cost
        if project_cost <= MICRO_FINANCE_MAX_PROJECT_COST:
            scheme_tier = "MICRO_FINANCE"
            max_loan_allowed = MICRO_FINANCE_MAX_LOAN
            interest_rate = custom_interest_rate if custom_interest_rate is not None else MICRO_FINANCE_INTEREST_RATE
            tenure_years = custom_tenure_years if custom_tenure_years is not None else MICRO_FINANCE_TENURE_YEARS
            moratorium_months = MICRO_FINANCE_MORATORIUM_MONTHS
        else:
            scheme_tier = "TERM_LOAN"
            max_loan_allowed = TERM_LOAN_MAX_LOAN
            interest_rate = custom_interest_rate if custom_interest_rate is not None else TERM_LOAN_INTEREST_RATE
            tenure_years = custom_tenure_years if custom_tenure_years is not None else TERM_LOAN_TENURE_YEARS
            moratorium_months = TERM_LOAN_MORATORIUM_MONTHS

        # Cap loan to scheme ceiling
        actual_loan_amount = min(loan_amount_required, max_loan_allowed)
        actual_own_contribution = project_cost - actual_loan_amount

        # Check own capital adequacy
        capital_deficit = max(0.0, actual_own_contribution - investable_own_capital)
        capital_sufficient = capital_deficit == 0.0

        # EMI Calculation
        monthly_emi = calculate_reducing_emi(actual_loan_amount, interest_rate, tenure_years)
        annual_debt_service = monthly_emi * 12.0

        # Operating Metrics
        monthly_operating_profit = base_monthly_revenue - base_monthly_expense
        annual_operating_cash_flow = monthly_operating_profit * 12.0

        # Monthly net cash after debt service
        monthly_net_surplus = monthly_operating_profit - monthly_emi

        # Debt Service Coverage Ratio (DSCR)
        # DSCR = Cash Available for Debt Service / Annual Debt Service
        if annual_debt_service > 0:
            dscr = round(annual_operating_cash_flow / annual_debt_service, 2)
        else:
            dscr = 9.99

        # Break-Even Analysis
        # Assuming fixed cost is EMI + 30% of operating expenses
        estimated_fixed_costs = monthly_emi + (base_monthly_expense * 0.35)
        gross_margin_ratio = (base_monthly_revenue - (base_monthly_expense * 0.65)) / max(1.0, base_monthly_revenue)
        gross_margin_ratio = max(0.15, min(0.90, gross_margin_ratio))
        break_even_revenue = round(estimated_fixed_costs / gross_margin_ratio, 2)

        # Viability Rating
        if dscr >= 1.75 and capital_sufficient:
            viability = "EXCELLENT"
            financial_score = 92.0
        elif dscr >= 1.40 and capital_sufficient:
            viability = "GOOD"
            financial_score = 84.0
        elif dscr >= 1.15:
            viability = "MODERATE"
            financial_score = 68.0
        else:
            viability = "STRESSED"
            financial_score = 45.0

        # Adjust score if capital is tight
        if not capital_sufficient:
            financial_score = max(30.0, financial_score - 20.0)

        # 5-Year Cash Flow Projection
        projections = []
        cummulative_surplus = 0.0
        for yr in range(1, min(6, tenure_years + 1)):
            # Annual revenue growth assumption 5%, expense growth 3.5%
            growth_factor_rev = (1 + 0.05) ** (yr - 1)
            growth_factor_exp = (1 + 0.035) ** (yr - 1)
            yr_rev = round(base_monthly_revenue * 12 * growth_factor_rev, 2)
            yr_exp = round(base_monthly_expense * 12 * growth_factor_exp, 2)
            yr_op = round(yr_rev - yr_exp, 2)
            yr_net = round(yr_op - annual_debt_service, 2)
            cummulative_surplus += yr_net
            projections.append({
                "year": f"Year {yr}",
                "revenue": yr_rev,
                "expenses": yr_exp,
                "operating_profit": yr_op,
                "debt_service": round(annual_debt_service, 2),
                "net_cash_flow": yr_net,
                "cummulative_surplus": round(cummulative_surplus, 2)
            })

        return {
            "project_cost": round(project_cost, 2),
            "scheme_tier": scheme_tier,
            "beneficiary_margin_pct": BENEFICIARY_MARGIN_PCT,
            "own_contribution_required": round(actual_own_contribution, 2),
            "investable_own_capital": round(investable_own_capital, 2),
            "capital_sufficient": capital_sufficient,
            "capital_deficit": round(capital_deficit, 2),
            "loan_amount": round(actual_loan_amount, 2),
            "interest_rate_pct": interest_rate,
            "tenure_years": tenure_years,
            "moratorium_months": moratorium_months,
            "monthly_emi": monthly_emi,
            "annual_debt_service": round(annual_debt_service, 2),
            "projected_monthly_revenue": round(base_monthly_revenue, 2),
            "projected_monthly_expense": round(base_monthly_expense, 2),
            "projected_monthly_operating_profit": round(monthly_operating_profit, 2),
            "monthly_net_surplus_after_emi": round(monthly_net_surplus, 2),
            "dscr": dscr,
            "break_even_monthly_revenue": break_even_revenue,
            "financial_viability": viability,
            "financial_score": financial_score,
            "projections": projections
        }
