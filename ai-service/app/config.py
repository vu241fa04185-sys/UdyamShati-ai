import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

BUSINESS_CATALOG_PATH = DATA_DIR / "business_catalog.json"
LOCATIONS_PATH = DATA_DIR / "villages_and_locations.json"
COMPETITORS_PATH = DATA_DIR / "competitors.json"
SCHEMES_PATH = DATA_DIR / "schemes.json"
SCHEME_DOCS_PATH = DATA_DIR / "scheme_documents.json"
PLACES_CATALOG_PATH = DATA_DIR / "places_catalog.json"
CATEGORIES_PATH = DATA_DIR / "business_categories.json"

# SIH26091 Concessional Financing Parameters (MoSJE Standards)
BENEFICIARY_MARGIN_PCT = 10.0   # 10% own contribution
CONCESSIONAL_LOAN_PCT = 90.0    # 90% concessional loan

# Micro Finance Ceiling & Rates (SIH26091)
MICRO_FINANCE_MAX_PROJECT_COST = 140000.0  # Up to 1.40 Lakh
MICRO_FINANCE_MAX_LOAN = 125000.0          # Loan up to 1.25 Lakh
MICRO_FINANCE_INTEREST_RATE = 6.50         # 6.5% p.a.
MICRO_FINANCE_TENURE_YEARS = 3             # 3 years
MICRO_FINANCE_MORATORIUM_MONTHS = 3        # 3 months moratorium

# Term Loan Ceiling & Rates (SIH26091)
TERM_LOAN_MIN_PROJECT_COST = 140001.0      # > 1.40 Lakh
TERM_LOAN_MAX_PROJECT_COST = 5000000.0     # Up to 50 Lakh
TERM_LOAN_MAX_LOAN = 4500000.0             # Up to 45 Lakh
TERM_LOAN_INTEREST_RATE = 8.00             # 8.0% p.a.
TERM_LOAN_TENURE_YEARS = 7                 # 7 years
TERM_LOAN_MORATORIUM_MONTHS = 6            # 6 months moratorium

# Composite Decision Engine Weights (configurable)
WEIGHTS = {
    "market": 0.30,
    "capital": 0.20,
    "skill": 0.15,
    "profitability": 0.15,
    "competition": 0.10,
    "risk_safety": 0.10
}

# Market Opportunity Score Weights
MARKET_WEIGHTS = {
    "demand": 0.30,
    "demand_supply_gap": 0.25,
    "competition_inverse": 0.20,
    "pricing_potential": 0.15,
    "accessibility": 0.10
}
