import math
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import LOCATIONS_PATH, COMPETITORS_PATH, MARKET_WEIGHTS

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

    def get_nearby_competitors(self, lat: float, lon: float, radius_km: float = 10.0) -> List[Dict[str, Any]]:
        """Finds all competitors within the specified radius in km."""
        results = []
        for comp in self.competitors:
            dist = haversine_distance_km(lat, lon, comp["latitude"], comp["longitude"])
            if dist <= radius_km:
                results.append({
                    **comp,
                    "distance_km": dist
                })
        results.sort(key=lambda x: x["distance_km"])
        return results

    def analyze_market(self, lat: float, lon: float, category_code: str, radius_km: float = 10.0) -> Dict[str, Any]:
        """Performs hyper-local market analysis for a specific business category."""
        nearest_loc = self.find_nearest_location(lat, lon)
        nearby_all = self.get_nearby_competitors(lat, lon, radius_km)
        category_competitors = [c for c in nearby_all if c.get("category_code") == category_code]

        # Base demand ratings from benchmark location
        demand_rating = 75.0
        nearest_mandi_dist = 6.0
        population = 10000
        households = 2000

        if nearest_loc:
            ratings = nearest_loc.get("market_demand_ratings", {})
            demand_rating = float(ratings.get(category_code, 75.0))
            nearest_mandi_dist = float(nearest_loc.get("nearest_mandi_distance_km", 6.0))
            population = int(nearest_loc.get("population", 10000))
            households = int(nearest_loc.get("households", 2000))

        # Supply calculation based on competitor density
        comp_count = len(category_competitors)
        # Each competitor in radius absorbs ~20-25% of market supply capacity
        supply_rating = min(100.0, max(15.0, comp_count * 22.0))

        # Demand-supply gap
        demand_supply_gap = max(0.0, demand_rating - supply_rating)

        # Competition inverse score (fewer competitors = higher score)
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

        # Accessibility score (closer to mandi/high-grade roads = higher)
        accessibility_score = max(40.0, min(100.0, 100.0 - (nearest_mandi_dist * 4.0)))

        # Pricing potential
        pricing_potential = min(100.0, max(50.0, demand_rating * 0.95))

        # Market Opportunity Score formula:
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

        # Data Confidence Score:
        # Based on distance to known benchmark location & density of known data
        dist_to_benchmark = nearest_loc["distance_km"] if nearest_loc else 15.0
        confidence = 92.0 - min(40.0, dist_to_benchmark * 1.5)
        if comp_count == 0 and dist_to_benchmark > 10.0:
            confidence -= 10.0
        confidence = round(max(50.0, min(95.0, confidence)), 1)

        return {
            "category_code": category_code,
            "analysis_radius_km": radius_km,
            "reference_village": nearest_loc.get("village_name", "Local Cluster") if nearest_loc else "Rural Cluster",
            "population_reach": population,
            "households_reach": households,
            "nearest_mandi_distance_km": nearest_mandi_dist,
            "competitor_count": comp_count,
            "competitors": category_competitors,
            "demand_index": round(demand_rating, 1),
            "supply_index": round(supply_rating, 1),
            "demand_supply_gap": round(demand_supply_gap, 1),
            "competition_score": comp_score,
            "pricing_potential": round(pricing_potential, 1),
            "accessibility_score": round(accessibility_score, 1),
            "market_opportunity_score": market_score,
            "data_confidence_pct": confidence,
            "summary": f"{comp_count} competitor(s) found within {radius_km} km. Demand index is {demand_rating}/100 with a gap of {round(demand_supply_gap, 1)}."
        }
