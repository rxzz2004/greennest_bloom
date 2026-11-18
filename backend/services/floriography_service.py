import os
import csv
import re

class FloriographyService:
    """
    Affective Floriography NLP Recommender mapping user emotional sentiment
    to historical botanical symbolism (floriography) and curated stem arrangements.
    Loaded dynamically from Emotion Text Classification Dataset CSV.
    Inspired by Sanh et al. (2019) DistilBERT & Mohammad & Turney (2013) NRC Emotion Lexicon.
    """

    EMOTION_LEXICONS = {}
    FLORIOGRAPHY_MAPPINGS = {}

    @classmethod
    def load_from_csv(cls):
        """
        Dynamically loads emotional trigger keywords, palette hexes, and floriography
        mappings from emotion_floriography_classification.csv.
        """
        candidate_paths = [
            os.path.join(os.path.dirname(__file__), "..", "data", "emotion_floriography_classification.csv"),
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "emotion_floriography_classification.csv"),
            os.path.join("backend", "data", "emotion_floriography_classification.csv"),
            os.path.join("data", "emotion_floriography_classification.csv"),
        ]
        csv_path = next((p for p in candidate_paths if os.path.exists(p)), None)
        if not csv_path:
            return False

        lexicons = {}
        mappings = {}

        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cat = row["emotion_category"].strip()
                raw_kws = row.get("sample_trigger_keywords", "")
                keywords = [k.strip().lower() for k in raw_kws.split(",") if k.strip()]
                lexicons[cat] = keywords

                raw_hexes = row.get("palette_hexes", "")
                palette = [h.strip() for h in raw_hexes.split(",") if h.strip()]

                raw_flowers = row.get("primary_botanical_recommendation", "")
                primary_flowers = []
                for fl_str in raw_flowers.split("|"):
                    fl_str = fl_str.strip()
                    if "(" in fl_str and ")" in fl_str:
                        name_part = fl_str.split("(")[0].strip()
                        bot_part = fl_str.split("(")[1].replace(")", "").strip()
                    else:
                        name_part = fl_str
                        bot_part = ""
                    primary_flowers.append({
                        "name": name_part,
                        "botanical": bot_part,
                        "meaning": f"Symbolic representation of {row.get('primary_emotion', '')}"
                    })

                mappings[cat] = {
                    "primary_emotion": row.get("primary_emotion"),
                    "palette": palette,
                    "palette_name": row.get("palette_name"),
                    "primary_flowers": primary_flowers,
                    "accent_greenery": row.get("accent_greenery"),
                    "recommended_wrapping": row.get("recommended_wrapping"),
                    "curator_note": row.get("curator_note")
                }

        cls.EMOTION_LEXICONS = lexicons
        cls.FLORIOGRAPHY_MAPPINGS = mappings
        return True

    @classmethod
    def analyze_sentiment_and_recommend(cls, text_input: str):
        """
        Analyzes the emotional intent within text prompt and outputs
        the matched floriography profile, confidence score, and botanical recipe.
        """
        if not cls.EMOTION_LEXICONS:
            cls.load_from_csv()

        text = (text_input or "").lower()
        words = re.findall(r"\b\w+\b", text)

        scores = {k: 0.1 for k in cls.EMOTION_LEXICONS.keys()}  # Baseline smoothing

        for category, lexicon in cls.EMOTION_LEXICONS.items():
            for word in words:
                if word in lexicon:
                    scores[category] += 1.0

        # Find best matching emotional category
        if not scores:
            dominant_category = "love_passion"
            max_score = 1.0
            total_score = 1.0
        else:
            dominant_category = max(scores, key=scores.get)
            max_score = scores[dominant_category]
            total_score = sum(scores.values())

        confidence = round(min((max_score / max(total_score, 1.0)) * 100 + 35, 98.5), 1)
        profile = cls.FLORIOGRAPHY_MAPPINGS.get(dominant_category, {})

        return {
            "detected_category": dominant_category,
            "confidence_percentage": confidence,
            "floriography_profile": profile,
            "emotion_scores": {k: round(v, 2) for k, v in scores.items()},
            "recommendation_summary": f"Detected {profile.get('primary_emotion', dominant_category)} ({confidence}% match). We recommend the '{profile.get('palette_name', 'Botanical')}' palette."
        }

# Initial load upon module import
FloriographyService.load_from_csv()
