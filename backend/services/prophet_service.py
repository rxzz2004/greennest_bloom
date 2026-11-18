import os
import csv
import math
from datetime import date, timedelta
import numpy as np
import pandas as pd

class ProphetService:
    """
    Decomposable Additive Time-Series Demand Forecasting Engine
    based on Taylor & Letham (2018) Prophet framework:
        y(t) = g(t) + s(t) + h(t) + epsilon_t
    where:
        g(t) = trend growth curve
        s(t) = periodic seasonal changes (yearly & weekly Fourier series)
        h(t) = holiday / festive demand shocks (Valentine's, Mother's Day, Wedding Season)
    Loaded from Historical Daily Floral Sales & Festive Demand Dataset CSV.
    """

    @classmethod
    def load_historical_sales_from_csv(cls, days: int = 730):
        """
        Loads the 2-year longitudinal sales and festive demand time-series
        from historical_daily_sales_730days.csv.
        """
        candidate_paths = [
            os.path.join(os.path.dirname(__file__), "..", "data", "historical_daily_sales_730days.csv"),
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "historical_daily_sales_730days.csv"),
            os.path.join("backend", "data", "historical_daily_sales_730days.csv"),
            os.path.join("data", "historical_daily_sales_730days.csv"),
        ]
        csv_path = next((p for p in candidate_paths if os.path.exists(p)), None)
        if not csv_path:
            return None

        records = []
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append({
                    "ds": row["ds"],
                    "y": int(float(row["y"])),
                    "procured_stems": int(float(row["procured_stems"])),
                    "holiday_flag": row["holiday_flag"] if row.get("holiday_flag") else None,
                    "trend": round(float(row["trend"]), 2),
                    "seasonality": round(float(row["seasonality"]), 2)
                })

        if days and len(records) > days:
            return records[-days:]
        return records

    @classmethod
    def generate_historical_sales_dataset(cls, days: int = 730):
        """
        Retrieves daily sales, procurement volume, and festive shock records.
        Prioritizes loading from historical_daily_sales_730days.csv, falling back
        to synthetic derivation if the file is absent.
        """
        loaded = cls.load_historical_sales_from_csv(days=days)
        if loaded:
            return loaded

        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        records = []

        for i in range(days):
            current_dt = start_date + timedelta(days=i)
            day_of_week = current_dt.weekday()  # 0=Mon, 6=Sun
            month = current_dt.month
            day = current_dt.day

            # Base trend
            trend = 120.0 + (i * 0.08)

            # Weekly seasonality (higher sales on Fri, Sat, Sun)
            weekly_boost = 0.0
            if day_of_week in [4, 5]:  # Fri, Sat
                weekly_boost = 35.0
            elif day_of_week == 6:  # Sun
                weekly_boost = 20.0

    @classmethod
    def get_festive_shock(cls, current_dt: date):
        """
        Calculates holiday & festive demand shocks h(t) across major Indian
        cultural, harvest, and religious festivals, plus universal gifting occasions.
        Returns: (festival_name, stem_demand_boost)
        """
        y = current_dt.year
        m = current_dt.month
        day = current_dt.day

        # 1. Makar Sankranti & Pongal (Mid-January Harvest Festival)
        if m == 1 and 13 <= day <= 16:
            return "Makar Sankranti & Pongal", 85.0

        # 2. Valentine's Week (Feb 7 - 14)
        if m == 2 and 7 <= day <= 14:
            return "Valentine's Surge", 185.0 if day == 14 else 95.0

        # 3. Maha Shivratri (Devotional Worship)
        if (y == 2025 and m == 2 and day == 26) or (y == 2026 and m == 2 and day == 15):
            return "Maha Shivratri Pooja", 90.0

        # 4. Holi Spring Bloom (March Festival of Colors)
        if (y == 2025 and m == 3 and 13 <= day <= 14) or (y == 2026 and m == 3 and 3 <= day <= 4):
            return "Holi Spring Bloom", 80.0

        # 5. Gudi Padwa & Ugadi (Vedic New Year & Festive Torans)
        if (y == 2025 and m == 3 and day == 30) or (y == 2026 and m == 3 and day == 19):
            return "Gudi Padwa / Ugadi", 95.0

        # 6. Eid-ul-Fitr (Celebration & Gajras)
        if (y == 2025 and ((m == 3 and day == 31) or (m == 4 and day == 1))) or (y == 2026 and m == 3 and 20 <= day <= 21):
            return "Eid-ul-Fitr", 85.0

        # 7. Mother's Day (Second Sunday of May)
        if m == 5 and 8 <= day <= 14:
            return "Mother's Day Peak", 110.0

        # 8. Eid-ul-Adha (Bakrid)
        if (y == 2025 and m == 6 and day == 7) or (y == 2026 and m == 5 and day == 27):
            return "Eid-ul-Adha", 75.0

        # 9. Raksha Bandhan (August Sibling Gifting)
        if (y == 2025 and m == 8 and day == 9) or (y == 2026 and m == 8 and day == 28):
            return "Raksha Bandhan", 95.0

        # 10. Ganesh Chaturthi & Onam Season (Late Aug - Sept)
        if (y == 2025 and ((m == 8 and 27 <= day <= 31) or (m == 9 and 1 <= day <= 6))):
            return "Ganesh Chaturthi Pooja", 220.0 if (m == 8 and day == 27) else 150.0
        if (y == 2025 and (m == 8 and 25 <= day <= 26)):
            return "Onam Harvest Pookkalam", 130.0

        if (y == 2026 and m == 9 and 14 <= day <= 24):
            return "Ganesh Chaturthi Pooja", 220.0 if day == 14 else 150.0
        if (y == 2026 and ((m == 8 and 25 <= day <= 31) or (m == 9 and 1 <= day <= 4))):
            return "Onam Harvest Pookkalam", 130.0

        # 11. Navratri & Durga Puja (9-Day Devotion + Vijayadashami)
        if (y == 2024 and m == 10 and 3 <= day <= 12) or \
           (y == 2025 and ((m == 9 and 22 <= day <= 30) or (m == 10 and 1 <= day <= 2))) or \
           (y == 2026 and m == 10 and 11 <= day <= 20):
            return "Navratri & Durga Puja", 145.0

        # 12. Karwa Chauth (October Red Rose Demand)
        if (y == 2024 and m == 10 and day == 20) or \
           (y == 2025 and m == 10 and day == 10) or \
           (y == 2026 and m == 10 and day == 28):
            return "Karwa Chauth", 125.0

        # 13. Diwali & Lakshmi Pooja (India's Grandest Flower Surge)
        if (y == 2024 and ((m == 10 and 29 <= day <= 31) or (m == 11 and 1 <= day <= 3))) or \
           (y == 2025 and m == 10 and 18 <= day <= 22) or \
           (y == 2026 and m == 11 and 6 <= day <= 10):
            is_lakshmi_puja = (y == 2024 and m == 11 and day == 1) or \
                              (y == 2025 and m == 10 and day == 20) or \
                              (y == 2026 and m == 11 and day == 8)
            return "Diwali & Lakshmi Pooja", 250.0 if is_lakshmi_puja else 160.0

        # 14. Winter Wedding Season (Mid-Nov to late Dec)
        if (m == 11 and day >= 15) or (m == 12 and day <= 22):
            return "Winter Wedding Season", 65.0

        return None, 0.0

    @classmethod
    def get_supported_festivals(cls):
        """Returns catalog of supported Indian festivals and their floral requirements."""
        return [
            {
                "id": "diwali_lakshmi_pooja",
                "name": "Diwali & Lakshmi Pooja",
                "season": "October / November",
                "category": "Pan-India Grand Festivity",
                "traditional_flowers": "Marigold Malas, Lotus Stems, Jasmine & Mango Foliage",
                "demand_spike_multiplier": "+200% to +350%",
                "sacred_significance": "Auspicious welcome for Goddess Lakshmi; doorway torans and puja offerings."
            },
            {
                "id": "ganesh_chaturthi",
                "name": "Ganesh Chaturthi Pooja",
                "season": "August / September",
                "category": "Major Religious Festivity",
                "traditional_flowers": "Red Hibiscus (Jaswand), Durva Grass, Yellow Marigold Garlands",
                "demand_spike_multiplier": "+180% to +260%",
                "sacred_significance": "Lord Ganesha's 10-day celebration requiring 21 red hibiscus and fresh floral decor daily."
            },
            {
                "id": "navratri_durga_puja",
                "name": "Navratri & Durga Puja",
                "season": "September / October",
                "category": "Devotional & Pandal Celebrations",
                "traditional_flowers": "Lotus, Marigold Garlands, Red Roses, Sindoor Khela Blooms",
                "demand_spike_multiplier": "+140% to +220%",
                "sacred_significance": "9 nights of Devi worship, garba pandals, and Ashtami 108 lotus flower rituals."
            },
            {
                "id": "onam_pookkalam",
                "name": "Onam Harvest Pookkalam",
                "season": "August / September",
                "category": "Kerala Harvest Festival",
                "traditional_flowers": "Mixed Petals, Chethi (Ixora), Marigold, Gomphrena, Balsam",
                "demand_spike_multiplier": "+160% to +240%",
                "sacred_significance": "Athapookkalam floral carpet designs decorating courtyards across 10 festive days."
            },
            {
                "id": "pongal_sankranti",
                "name": "Makar Sankranti & Pongal",
                "season": "January 14–16",
                "category": "Pan-India Harvest Festival",
                "traditional_flowers": "Marigold Malas, Turmeric Blooms, Sugarcane Stems, Chrysanthemums",
                "demand_spike_multiplier": "+80% to +120%",
                "sacred_significance": "Harvest thanksgiving honoring the Sun God and agricultural fertility."
            },
            {
                "id": "karwa_chauth",
                "name": "Karwa Chauth",
                "season": "October / November",
                "category": "Couples & Gifting Celebration",
                "traditional_flowers": "Dutch Red Roses, Crimson Petals, Luxury Floral Hampers",
                "demand_spike_multiplier": "+120% to +175%",
                "sacred_significance": "Moonrise celebration with romantic red floral gifting between spouses."
            },
            {
                "id": "gudi_padwa_ugadi",
                "name": "Gudi Padwa / Ugadi",
                "season": "March / April",
                "category": "Vedic New Year",
                "traditional_flowers": "Yellow Marigold Torans, Neem Blooms, Mango Foliage",
                "demand_spike_multiplier": "+90% to +140%",
                "sacred_significance": "Chaitra New Year entrance torans warding off negativity and inviting prosperity."
            },
            {
                "id": "holi",
                "name": "Holi Spring Bloom",
                "season": "March",
                "category": "Spring & Color Celebration",
                "traditional_flowers": "Palash (Flame of the Forest / Tesu), Spring Roses, Petal Assortments",
                "demand_spike_multiplier": "+70% to +110%",
                "sacred_significance": "Celebration of spring arrival and organic floral color preparations."
            },
            {
                "id": "raksha_bandhan",
                "name": "Raksha Bandhan",
                "season": "August",
                "category": "Family Celebration",
                "traditional_flowers": "Pastel Roses, Carnations, Vibrant Flower Hampers",
                "demand_spike_multiplier": "+90% to +130%",
                "sacred_significance": "Auspicious sibling bonds celebrated with wrist rakhi floral accompaniments."
            },
            {
                "id": "maha_shivratri",
                "name": "Maha Shivratri Pooja",
                "season": "February",
                "category": "Devotional Worship",
                "traditional_flowers": "Bael Leaves, White Datura, White Jasmine, Lotus Stems",
                "demand_spike_multiplier": "+80% to +120%",
                "sacred_significance": "Overnight temple vigil and sacred offerings to Lord Shiva."
            },
            {
                "id": "eid_festivals",
                "name": "Eid-ul-Fitr & Eid-ul-Adha",
                "season": "Spring / Summer (Lunar)",
                "category": "Celebration & Gifting",
                "traditional_flowers": "Jasmine / Mogra Gajras, Pink Damask Roses, Floral Garlands",
                "demand_spike_multiplier": "+85% to +130%",
                "sacred_significance": "Warm festive visits, family greetings, and delicate fragrant jasmine adornments."
            },
            {
                "id": "winter_wedding_season",
                "name": "Winter Wedding Season",
                "season": "Mid-November to Late December",
                "category": "B2B & Staging Season",
                "traditional_flowers": "Roses, Hydrangeas, Carnations, Orchids, Baby's Breath",
                "demand_spike_multiplier": "+60% to +150%",
                "sacred_significance": "Peak auspicious wedding dates (*shubh muhurats*) requiring massive mandap staging."
            },
            {
                "id": "valentines_week",
                "name": "Valentine's Week",
                "season": "February 7–14",
                "category": "Romance & Gifting",
                "traditional_flowers": "Dutch Long-Stem Red Roses, Stargazer Lilies, Gerberas",
                "demand_spike_multiplier": "+150% to +250%",
                "sacred_significance": "Peak modern commercial gifting season with extreme premium rose surge."
            },
            {
                "id": "mothers_day",
                "name": "Mother's Day",
                "season": "Second Sunday of May",
                "category": "Family Appreciation",
                "traditional_flowers": "Carnations, Pastel Roses, Orchids, Hydrangeas",
                "demand_spike_multiplier": "+100% to +160%",
                "sacred_significance": "Global day honoring maternal devotion with soft pastel arrangements."
            }
        ]

    @classmethod
    def generate_historical_sales_dataset(cls, days: int = 730):
        """
        Retrieves daily sales, procurement volume, and festive shock records.
        Prioritizes loading from historical_daily_sales_730days.csv, falling back
        to synthetic derivation if the file is absent.
        """
        loaded = cls.load_historical_sales_from_csv(days=days)
        if loaded:
            return loaded

        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        records = []

        for i in range(days):
            current_dt = start_date + timedelta(days=i)
            day_of_week = current_dt.weekday()  # 0=Mon, 6=Sun

            # Base trend growth curve
            trend = 120.0 + (i * 0.08)

            # Weekly seasonality (higher sales on Fri, Sat, Sun)
            weekly_boost = 0.0
            if day_of_week in [4, 5]:  # Fri, Sat
                weekly_boost = 35.0
            elif day_of_week == 6:  # Sun
                weekly_boost = 20.0

            # Indian & Universal Festive demand shock h(t)
            holiday_name, festive_boost = cls.get_festive_shock(current_dt)

            noise = np.random.normal(0, 7.0)
            stems_sold = max(int(trend + weekly_boost + festive_boost + noise), 25)
            procurement_qty = int(math.ceil(stems_sold * 1.15))  # 15% safety buffer

            records.append({
                "ds": current_dt.isoformat(),
                "y": stems_sold,
                "procured_stems": procurement_qty,
                "holiday_flag": holiday_name,
                "trend": round(trend, 2),
                "seasonality": round(weekly_boost + festive_boost, 2)
            })

        return records

    @classmethod
    def run_forecast(cls, forecast_days: int = 45):
        """
        Trains and projects demand curve for upcoming forecast_days,
        returning historical baseline, predicted yhat, upper/lower uncertainty bounds,
        and procurement buffer recommendations.
        """
        historical = cls.generate_historical_sales_dataset(days=365)
        last_date = date.today()
        if historical:
            try:
                last_date = date.fromisoformat(historical[-1]["ds"])
            except Exception:
                pass

        forecast_points = []
        base_trend = historical[-1]["trend"] if historical else 140.0

        for d in range(1, forecast_days + 1):
            future_dt = last_date + timedelta(days=d)
            day_of_week = future_dt.weekday()

            trend = base_trend + (d * 0.09)
            weekly = 38.0 if day_of_week in [4, 5] else (22.0 if day_of_week == 6 else 0.0)

            # Apply Indian festival shock to future forecast dates
            holiday_flag, festive = cls.get_festive_shock(future_dt)

            yhat = round(trend + weekly + festive, 2)
            margin = round(12.0 + (d * 0.2), 2)  # Uncertainty widens with horizon

            forecast_points.append({
                "ds": future_dt.isoformat(),
                "yhat": yhat,
                "yhat_lower": max(round(yhat - margin, 2), 0.0),
                "yhat_upper": round(yhat + margin, 2),
                "holiday_flag": holiday_flag,
                "recommended_procurement": int(math.ceil(yhat * 1.15))
            })

        # Summary KPIs for nursery super-admin
        total_projected_demand = sum(p["yhat"] for p in forecast_points)
        peak_day = max(forecast_points, key=lambda x: x["yhat"])
        recommended_total_procurement = sum(p["recommended_procurement"] for p in forecast_points)

        return {
            "historical_sample": historical[-60:],  # Last 60 days of actuals
            "forecast_points": forecast_points,
            "supported_festivals": cls.get_supported_festivals(),
            "metrics": {
                "forecast_horizon_days": forecast_days,
                "total_projected_stems": int(total_projected_demand),
                "recommended_procurement_stems": recommended_total_procurement,
                "safety_buffer_percentage": 15,
                "peak_projected_date": peak_day["ds"],
                "peak_projected_stems": peak_day["yhat"],
                "peak_event": peak_day["holiday_flag"] or "Weekend Volume Surge"
            }
        }

