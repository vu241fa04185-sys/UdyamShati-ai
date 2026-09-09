import math
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import (
    LOCATIONS_PATH, 
    COMPETITORS_PATH, 
    PLACES_CATALOG_PATH, 
    CATEGORIES_PATH, 
    MARKET_WEIGHTS
)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in km."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class MarketEngine:
    def __init__(self):
        self._load_data()

    def _load_data(self):
        try:
            with open(LOCATIONS_PATH, 'r', encoding='utf-8') as f:
                self.locations = json.load(f)
        except Exception:
            self.locations = []

        try:
            with open(COMPETITORS_PATH, 'r', encoding='utf-8') as f:
                self.competitors = json.load(f)
        except Exception:
            self.competitors = []

        try:
            with open(PLACES_CATALOG_PATH, 'r', encoding='utf-8') as f:
                self.places = json.load(f)
        except Exception:
            self.places = []

        try:
            with open(CATEGORIES_PATH, 'r', encoding='utf-8') as f:
                self.categories = json.load(f)
        except Exception:
            self.categories = []

    def find_nearest_location(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Finds the closest benchmark village/location in the dataset."""
        if not self.locations:
            return None
        closest = None
        min_dist = float('inf')
        for loc in self.locations:
            dist = haversine_distance_km(lat, lon, loc["latitude"], loc["longitude"])
            if dist < min_dist:
                min_dist = dist
                closest = {**loc, "distance_km": dist}
        return closest

    def get_nearby_places(
        self, 
        lat: float, 
        lon: float, 
        radius_km: float = 10.0, 
        category_filter: str = "ALL"
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all categorized places within the radius.
        Calculates straight-line distance and estimated road distance.
        """
        results = []
        for p in self.places:
            dist = haversine_distance_km(lat, lon, p["latitude"], p["longitude"])
            if dist <= radius_km:
                # Check category filtering
                cat_match = True
                if category_filter and category_filter != "ALL":
                    cat_match = (
                        p.get("category_group", "").upper() == category_filter.upper() or
                        p.get("category_code", "").upper() == category_filter.upper()
                    )
                if cat_match:
                    road_dist = round(dist * 1.25, 2) # Realistic rural road winding multiplier
                    results.append({
                        **p,
                        "distance_km": dist,
                        "road_distance_km": road_dist,
                        "estimated_travel_time_mins": max(2, int(round((road_dist / 30.0) * 60)))
                    })
        results.sort(key=lambda x: x["distance_km"])
        return results

    def search_places(
        self,
        lat: float,
        lon: float,
        query: str = "",
        category: str = "ALL",
        radius_km: float = 5.0
    ) -> Dict[str, Any]:
        """
        Searches places within radius with strict Haversine filtering and keyword/category matching.
        Zero hallucination: uses verified local places catalog.
        """
        self._load_data()
        q_lower = query.lower().strip()
        filtered = []

        for p in self.places:
            dist = haversine_distance_km(lat, lon, p["latitude"], p["longitude"])
            if dist > radius_km:
                continue

            # Check category match
            p_cat = (p.get("category_code") or p.get("category_id") or "").upper()
            if category and category != "ALL":
                if p_cat == category.upper():
                    filtered.append({**p, "distance_km": dist})
                    continue

            # Check keyword match
            if q_lower:
                name = p.get("name", "").lower()
                addr = p.get("address", "").lower()
                cat_label = p.get("category_label", "").lower()
                if q_lower in name or q_lower in addr or q_lower in cat_label or name in q_lower:
                    filtered.append({**p, "distance_km": dist})
                    continue
            elif not category or category == "ALL":
                filtered.append({**p, "distance_km": dist})

        filtered.sort(key=lambda x: x["distance_km"])
        count = len(filtered)
        area = round(math.pi * (radius_km ** 2), 2)
        density = round(count / area, 2) if area > 0 else 0.0
        nearest = filtered[0]["distance_km"] if count > 0 else None

        comp_level = "None" if count == 0 else ("Low" if count <= 2 else ("Moderate" if count <= 5 else "High"))

        return {
            "query": query,
            "category": category,
            "radius_km": radius_km,
            "total_count": count,
            "places": filtered,
            "nearest_km": nearest,
            "density_per_sq_km": density,
            "competition_level": comp_level,
            "area_sq_km": area
        }

    def get_nearby_competitors(self, lat: float, lon: float, radius_km: float = 10.0) -> List[Dict[str, Any]]:
        """Finds all competitors within the specified radius in km."""
        results = []
        for comp in self.competitors:
            dist = haversine_distance_km(lat, lon, comp["latitude"], comp["longitude"])
            if dist <= radius_km:
                results.append({
                    **comp,
                    "distance_km": dist,
                    "road_distance_km": round(dist * 1.25, 2)
                })
        results.sort(key=lambda x: x["distance_km"])
        return results

    def analyze_market(self, lat: float, lon: float, category_code: str, radius_km: float = 10.0) -> Dict[str, Any]:
        """
        Performs full hyper-local spatial market intelligence analysis.
        Computes the 10 spatial intelligence metrics and the deterministic Market Opportunity Score.
        """
        nearest_loc = self.find_nearest_location(lat, lon)
        nearby_all_places = self.get_nearby_places(lat, lon, radius_km, category_filter="ALL")
        nearby_competitors = [p for p in nearby_all_places if p.get("is_competitor")]
        nearby_suppliers = [p for p in nearby_all_places if p.get("is_supplier")]
        nearby_mandis = [p for p in nearby_all_places if p.get("is_mandi")]

        # Category-specific competitors
        category_competitors = [
            c for c in nearby_competitors 
            if c.get("category_code") == category_code or category_code in c.get("category_code", "")
        ]

        # Analyzed area in km² (pi * r^2)
        analyzed_area_sqkm = round(math.pi * (radius_km ** 2), 1)

        # 1. Competitor count
        comp_count = len(category_competitors)

        # 2. Competitor density per sq.km
        comp_density = round(comp_count / analyzed_area_sqkm, 3)

        # 3. Suppliers count
        suppliers_count = len(nearby_suppliers)

        # 4. Relevant shops count
        relevant_shops_count = len(nearby_all_places)

        # 5. Markets count
        markets_count = len(nearby_mandis)

        # 6 & 7. Nearest market distance (straight line and road)
        if nearby_mandis:
            nearest_mandi_dist = nearby_mandis[0]["distance_km"]
            nearest_mandi_road_dist = nearby_mandis[0]["road_distance_km"]
        elif nearest_loc:
            nearest_mandi_dist = float(nearest_loc.get("nearest_mandi_distance_km", 6.0))
            nearest_mandi_road_dist = round(nearest_mandi_dist * 1.25, 2)
        else:
            nearest_mandi_dist = 6.0
            nearest_mandi_road_dist = 7.5

        # 8. Nearest supplier distance
        nearest_supplier_dist = nearby_suppliers[0]["distance_km"] if nearby_suppliers else 3.5

        # Base demand ratings from benchmark location
        demand_rating = 75.0
        population = 10000
        households = 2000

        if nearest_loc:
            ratings = nearest_loc.get("market_demand_ratings", {})
            demand_rating = float(ratings.get(category_code, 75.0))
            population = int(nearest_loc.get("population", 10000))
            households = int(nearest_loc.get("households", 2000))

        # 9. Business concentration index (scale 0-100)
        business_concentration = min(100.0, round((relevant_shops_count / (radius_km * 1.5)) * 10.0, 1))

        # 10. Demand-Supply Gap
        # Estimated units per day scaled by population reach
        estimated_demand_units_day = int(round((population / 10.0) * (demand_rating / 100.0)))
        # Existing supply absorbs ~18-25% per competitor
        absorbed_ratio = min(0.95, max(0.15, comp_count * 0.22))
        existing_supply_units_day = int(round(estimated_demand_units_day * absorbed_ratio))
        gap_units_day = max(0, estimated_demand_units_day - existing_supply_units_day)
        
        supply_rating = min(100.0, max(15.0, comp_count * 22.0))
        demand_supply_gap = max(0.0, demand_rating - supply_rating)

        if demand_supply_gap > 35.0:
            opportunity_label = "High"
        elif demand_supply_gap > 15.0:
            opportunity_label = "Moderate"
        else:
            opportunity_label = "Saturated"

        # Competition score (fewer competitors = higher score)
        if comp_count == 0:
            comp_score = 95.0
        elif comp_count == 1:
            comp_score = 85.0
        elif comp_count == 2:
            comp_score = 70.0
        elif comp_count <= 4:
            comp_score = 50.0
        else:
            comp_score = 30.0

        # Accessibility score (closer to mandi & good road connectivity = higher)
        accessibility_score = max(35.0, min(100.0, 100.0 - (nearest_mandi_dist * 4.5)))

        # Pricing potential
        pricing_potential = min(100.0, max(45.0, demand_rating * 0.95))

        # Deterministic Market Opportunity Score:
        # 30% Demand + 25% Gap + 20% Competition + 15% Pricing + 10% Accessibility
        w = MARKET_WEIGHTS
        market_score = (
            w["demand"] * demand_rating +
            w["demand_supply_gap"] * demand_supply_gap +
            w["competition_inverse"] * comp_score +
            w["pricing_potential"] * pricing_potential +
            w["accessibility"] * accessibility_score
        )
        market_score = round(min(100.0, max(10.0, market_score)), 1)

        # Data confidence
        dist_to_benchmark = nearest_loc["distance_km"] if nearest_loc else 15.0
        confidence = 94.0 - min(35.0, dist_to_benchmark * 1.2)
        confidence = round(max(55.0, min(96.0, confidence)), 1)

        return {
            "category_code": category_code,
            "analysis_radius_km": radius_km,
            "analyzed_area_sqkm": analyzed_area_sqkm,
            "reference_village": nearest_loc.get("village_name", "Local Cluster") if nearest_loc else "Rural Cluster",
            "population_reach": population,
            "households_reach": households,
            
            # The 10 Hyper-Local Spatial Metrics:
            "competitor_count": comp_count,
            "competitor_density_per_sqkm": comp_density,
            "suppliers_count": suppliers_count,
            "relevant_shops_count": relevant_shops_count,
            "markets_count": markets_count,
            "nearest_market_distance_km": nearest_mandi_dist,
            "nearest_market_road_distance_km": nearest_mandi_road_dist,
            "nearest_supplier_distance_km": nearest_supplier_dist,
            "accessibility_score": round(accessibility_score, 1),
            "business_concentration": business_concentration,

            # Demand-Supply Gap Breakdown:
            "demand_index": round(demand_rating, 1),
            "supply_index": round(supply_rating, 1),
            "demand_supply_gap": round(demand_supply_gap, 1),
            "estimated_demand_units_day": estimated_demand_units_day,
            "existing_supply_units_day": existing_supply_units_day,
            "gap_units_day": gap_units_day,
            "opportunity_label": opportunity_label,

            # Deterministic Score & Weights:
            "competition_score": comp_score,
            "pricing_potential": round(pricing_potential, 1),
            "market_opportunity_score": market_score,
            "weights_used": w,
            "data_confidence_pct": confidence,
            
            "nearby_places": nearby_all_places,
            "competitors": category_competitors,
            "suppliers": nearby_suppliers,
            "mandis": nearby_mandis
        }
