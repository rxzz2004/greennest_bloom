import math
from datetime import date
from config import Config
from models import db, EventQuotation, DeliveryTelemetry

class LogisticsService:
    """
    Logistical geospatial computations (Haversine formula),
    Single-Event-Per-Day booking collision guards, and live telemetry generation.
    """

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates the great-circle distance between two points on the Earth's surface
        using the Haversine formula (Aprilinda et al., 2020).
        Returns distance in kilometers.
        """
        R = 6371.0  # Earth's mean radius in kilometers

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        distance = R * c
        return round(distance, 2)

    @classmethod
    def validate_venue_radius(cls, venue_lat: float, venue_lng: float):
        """
        Checks if the event venue is within the nursery's operational delivery network originating from
        Kalmane, Thirthahalli, Karnataka 577432 to nationwide destinations.
        """
        depot_lat = Config.DEPOT_LATITUDE
        depot_lng = Config.DEPOT_LONGITUDE
        distance = cls.haversine_distance(depot_lat, depot_lng, venue_lat, venue_lng)
        is_within_radius = distance <= Config.MAX_DELIVERY_RADIUS_KM
        
        # Calculate delivery surcharge for long distance line-haul (₹25/km beyond local 50km zone, capped)
        surcharge = 0.0
        if is_within_radius and distance > 50.0:
            surcharge = round(min((distance - 50.0) * 25.0, 15000.0), 2)

        if is_within_radius:
            if distance <= 50.0:
                zone_desc = "Local Malnad & Western Ghats direct dispatch zone"
            elif distance <= 350.0:
                zone_desc = "Statewide refrigerated express corridor"
            else:
                zone_desc = "Nationwide temperature-controlled air & highway corridor"
            message = f"Venue is {distance}km from Kalmane Mother Nursery (Thirthahalli, 577432). {zone_desc} active."
        else:
            message = f"Venue is {distance}km away, exceeding our {Config.MAX_DELIVERY_RADIUS_KM}km freshness preservation radius."

        return {
            "distance_km": distance,
            "max_allowed_radius_km": Config.MAX_DELIVERY_RADIUS_KM,
            "is_valid": is_within_radius,
            "surcharge": surcharge,
            "depot_location": Config.DEPOT_ADDRESS,
            "depot_pincode": Config.DEPOT_PINCODE,
            "message": message
        }

    @classmethod
    def check_event_date_availability(cls, target_date: date):
        """
        Enforces Single-Event-Per-Day Booking Constraint.
        Prevents equipment and floral master artisan double-booking.
        """
        existing_booking = EventQuotation.query.filter(
            EventQuotation.event_date == target_date,
            EventQuotation.status.in_(["approved", "booked"])
        ).first()

        if existing_booking:
            return {
                "is_available": False,
                "reason": f"A major commercial staging is already confirmed for {target_date.isoformat()} ({existing_booking.event_type.title()}). Our single-event-per-day master decorator policy restricts concurrent bookings."
            }

        return {
            "is_available": True,
            "reason": f"Date {target_date.isoformat()} is fully available for exclusive floral staging."
        }

    @staticmethod
    def generate_interpolated_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float, steps: int = 15):
        """
        Generates realistic route waypoints between depot and customer destination
        for live Leaflet GPS telemetry rendering over WebSockets.
        """
        points = []
        for i in range(steps + 1):
            fraction = i / float(steps)
            # Add subtle natural curve variation
            jitter = math.sin(fraction * math.pi) * 0.004
            lat = start_lat + fraction * (end_lat - start_lat) + jitter
            lng = start_lng + fraction * (end_lng - start_lng)
            points.append({"lat": round(lat, 6), "lng": round(lng, 6), "step": i})
        return points
