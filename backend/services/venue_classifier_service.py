import io
import re
import base64
import os
import math
from PIL import Image, ImageFilter, ImageStat

class VenueClassifierService:
    """
    Computer Vision & Spatial Heuristic Classifier for Commercial Event Venues.
    Determines whether an uploaded photo is a legitimate architectural event space
    (ballroom, banquet amphitheater, lawn, pavilion, stage, or portico)
    vs a non-venue image (portrait selfie, close-up macro object, document, or vehicle).
    """

    @classmethod
    def decode_image_data(cls, image_data: str) -> Image.Image:
        """Decodes base64 Data URL or raw base64 string into a PIL Image."""
        if not image_data:
            raise ValueError("No image data provided")

        if "," in image_data:
            # Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        return image.convert("RGB")

    @classmethod
    def classify_venue_image(cls, image_data: str) -> dict:
        """
        Classifies whether the image depicts an event venue.
        Returns a rich diagnostic payload with confidence score, category, and spatial details.
        """
        try:
            img = cls.decode_image_data(image_data)
        except Exception as e:
            return {
                "is_venue": False,
                "confidence": 0.0,
                "detected_type": "Invalid Image",
                "message": f"Unable to decode image file: {str(e)}",
                "attributes": {}
            }

        width, height = img.size
        aspect_ratio = round(width / max(1, height), 2)
        total_pixels = width * height

        # 1. Aspect Ratio Analysis
        # Venues are almost always landscape (16:9, 16:10, 4:3, or panoramic >= 1.25)
        # Extreme vertical images (aspect < 0.6) are typical smartphone vertical selfies / tall documents
        is_landscape = aspect_ratio >= 1.15
        is_portrait = aspect_ratio < 0.85

        # 2. Lighting & Luminosity Distribution (Floor vs Ceiling vs Stage)
        # Event venues have multi-zone ambient lighting (ceilings with chandeliers/lights, darker or patterned floors)
        grayscale = img.convert("L")
        
        # Divide into 3 vertical zones: Top (Ceiling/Rooftop), Middle (Stage/Wall/Backdrop), Bottom (Floor/Tables)
        top_zone = grayscale.crop((0, 0, width, int(height * 0.33)))
        mid_zone = grayscale.crop((0, int(height * 0.33), width, int(height * 0.66)))
        bot_zone = grayscale.crop((0, int(height * 0.66), width, height))

        top_stat = ImageStat.Stat(top_zone)
        mid_stat = ImageStat.Stat(mid_zone)
        bot_stat = ImageStat.Stat(bot_zone)

        top_mean = top_stat.mean[0]
        mid_mean = mid_stat.mean[0]
        bot_mean = bot_stat.mean[0]

        top_std = top_stat.stddev[0]
        bot_std = bot_stat.stddev[0]
        overall_stat = ImageStat.Stat(grayscale)
        overall_std = overall_stat.stddev[0]

        # 3. Structural Edge & Perspective Line Analysis
        # Venues feature structural lines (stage edges, pillars, ceiling trusses, wall borders)
        edges = grayscale.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        edge_density = edge_stat.mean[0]

        # 4. Color Variance & Distribution (Excluding single-color flat backgrounds)
        color_stat = ImageStat.Stat(img)
        rgb_stds = color_stat.stddev
        color_variance = sum(rgb_stds) / 3.0

        # 5. Non-Venue Detection Heuristics
        # Check A: Flat / Blank document or screenshot
        is_flat_or_blank = overall_std < 18.0 and edge_density < 6.0
        
        # Check B: High text-like density / scanned paper (very high edge density with white background)
        overall_mean = overall_stat.mean[0]
        is_document = overall_mean > 230 and edge_density > 25.0

        # Check C: Single object or close-up macro (low edge density in periphery, high in center)
        center_box = grayscale.crop((int(width * 0.25), int(height * 0.25), int(width * 0.75), int(height * 0.75)))
        center_edges = ImageStat.Stat(center_box.filter(ImageFilter.FIND_EDGES)).mean[0]
        edge_ratio = center_edges / max(1.0, edge_density)
        is_isolated_macro = edge_ratio > 2.8 and is_portrait

        # Check D: Skin tone concentration (Selfie / Portrait check)
        import numpy as np
        sample_arr = np.array(img.resize((100, 100), Image.Resampling.BILINEAR), dtype=int)
        r_ch, g_ch, b_ch = sample_arr[:, :, 0], sample_arr[:, :, 1], sample_arr[:, :, 2]
        max_ch = np.maximum(np.maximum(r_ch, g_ch), b_ch)
        min_ch = np.minimum(np.minimum(r_ch, g_ch), b_ch)
        skin_mask = (r_ch > 95) & (g_ch > 40) & (b_ch > 20) & ((max_ch - min_ch) > 15) & (np.abs(r_ch - g_ch) > 15) & (r_ch > g_ch) & (r_ch > b_ch)
        skin_ratio = float(np.sum(skin_mask)) / 10000.0
        is_portrait_person = skin_ratio > 0.45

        # Scoring Logic
        venue_score = 0.50

        # Landscape bonus (typical of event halls and stages)
        if is_landscape:
            venue_score += 0.20
        elif aspect_ratio >= 0.9:
            venue_score += 0.05
        else:
            venue_score -= 0.25

        # Structural line density bonus
        if 8.0 <= edge_density <= 40.0:
            venue_score += 0.20
        elif edge_density < 5.0:
            venue_score -= 0.30

        # Vertical lighting differentiation (ceiling vs floor depth)
        diff_top_bot = abs(top_mean - bot_mean)
        if diff_top_bot > 15.0 or (top_std > 20.0 and bot_std > 20.0):
            venue_score += 0.15

        # Color richness bonus
        if color_variance > 25.0:
            venue_score += 0.10
        elif color_variance < 10.0:
            venue_score -= 0.25

        # Penalties for non-venue signals
        if is_flat_or_blank:
            venue_score -= 0.60
        if is_document:
            venue_score -= 0.60
        if is_portrait_person:
            venue_score -= 0.55
        if is_isolated_macro:
            venue_score -= 0.35

        confidence = max(0.05, min(0.98, round(venue_score, 2)))
        is_venue = confidence >= 0.55

        # Determine Category Label
        if is_venue:
            if is_landscape and aspect_ratio >= 1.4:
                detected_type = "Banquet Ballroom & Panoramic Stage"
            elif top_mean > bot_mean and color_variance > 30:
                detected_type = "Outdoor Garden Pavilion or Lawn"
            else:
                detected_type = "Indoor Event Hall & Architectural Venue"
            message = "Verified venue architecture. Spatial perspective and lighting zones are optimal for floral inpainting."
        else:
            if is_portrait_person:
                detected_type = "Portrait / Human Photo"
                message = "Image appears to be a portrait or person rather than a venue. Please upload a ballroom, stage, or hall photo."
            elif is_document or is_flat_or_blank:
                detected_type = "Document / Flat Graphic"
                message = "Image appears to be a graphic or document with insufficient architectural depth."
            elif is_isolated_macro:
                detected_type = "Close-Up Object / Macro"
                message = "Image appears to be an isolated close-up object rather than a full venue space."
            else:
                detected_type = "Non-Venue Image"
                message = "Image lacks sufficient architectural perspective lines or spatial depth for realistic floral staging."

        return {
            "is_venue": is_venue,
            "confidence": confidence,
            "detected_type": detected_type,
            "message": message,
            "attributes": {
                "dimensions": f"{width}x{height}",
                "aspect_ratio": f"{aspect_ratio}:1",
                "is_landscape": is_landscape,
                "edge_density": round(edge_density, 1),
                "lighting_depth": "deep" if diff_top_bot > 20 else "standard"
            }
        }
