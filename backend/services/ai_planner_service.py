import os
import json
from typing import Optional
import requests
from backend.config import GROQ_API_KEY, GEMINI_API_KEY

class AIRescuePlannerService:
    def __init__(self):
        self.default_gemini_key = GEMINI_API_KEY
        self.default_groq_key = GROQ_API_KEY

    def _call_gemini_api(self, prompt: str, api_key: str) -> Optional[str]:
        """Calls Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)."""
        if not api_key:
            return None
        models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
        for model in models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json"
                    }
                }
                headers = {"Content-Type": "application/json"}
                res = requests.post(url, json=payload, headers=headers, timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return text
            except Exception as e:
                print(f"Gemini API ({model}) call error: {e}")
        return None

    def _call_groq_api(self, prompt: str, api_key: str) -> Optional[str]:
        """Calls Groq API (llama-3.3-70b-versatile)."""
        if not api_key:
            return None
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "response_format": {"type": "json_object"}
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=8)
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Groq API call error: {e}")
        return None

    def enhance_intervention_plan(self,
                                  crop_type: str,
                                  growth_stage: str,
                                  weather: dict,
                                  ranked_interventions: list,
                                  custom_gemini_key: str = "",
                                  custom_groq_key: str = "") -> dict:
        """
        Uses Gemini or Groq to generate refined, grounded contextual agricultural recommendations.
        The AI NEVER changes priority scores or ranks; it only explains the calculated priority.
        """
        gemini_key = custom_gemini_key or self.default_gemini_key
        groq_key = custom_groq_key or self.default_groq_key

        if not gemini_key and not groq_key:
            return {}

        prompt = f"""
        You are a Senior Agronomist for AI Farm Guardian.
        The dynamic priority engine has ALREADY calculated the priority scores and ranks using XGBoost based on empirical evidence:
        Crop: {crop_type} (Growth Stage: {growth_stage})
        Weather: Temp {weather.get('temperature')}°C, Humidity {weather.get('humidity')}%, Rain Probability {weather.get('rain_probability')}%

        Interventions to explain:
        {json.dumps([{
            'rank': item.get('priority_rank'),
            'problem': item.get('problem_name'),
            'score': item.get('priority_score'),
            'category': item.get('priority_category'),
            'evidence': item.get('supporting_evidence')
        } for item in ranked_interventions], indent=2)}

        For each problem, return a JSON object keyed by the exact problem_name containing:
        - "action": precise, verified crop-specific organic/chemical/cultural action
        - "why_important": clear explanation of why this action holds this specific priority rank
        Format: JSON mapping problem_name -> {{"action": "...", "why_important": "..."}}
        """

        raw_json = None
        if gemini_key:
            raw_json = self._call_gemini_api(prompt, gemini_key)
        if not raw_json and groq_key:
            raw_json = self._call_groq_api(prompt, groq_key)

        if raw_json:
            try:
                data = json.loads(raw_json)
                return data
            except Exception:
                pass
        return {}

    def generate_rescue_plan(self,
                             issue_name: str,
                             crop_type: str,
                             severity: str,
                             affected_area_pct: float,
                             growth_stage: str,
                             weather_data: dict,
                             priority_score: float = 75.0,
                             priority_category: str = "HIGH",
                             custom_gemini_key: str = "",
                             custom_groq_key: str = "") -> dict:
        """
        Generates full detailed AI Rescue Plan using Gemini / Groq or Agricultural Knowledge Base fallback.
        """
        gemini_key = custom_gemini_key or self.default_gemini_key
        groq_key = custom_groq_key or self.default_groq_key

        temp = weather_data.get("temperature", 28.0)
        humidity = weather_data.get("humidity", 70.0)
        rain_prob = weather_data.get("rain_probability", 20.0)

        prompt = f"""
        You are an expert AI Agronomist for AI Farm Guardian. Generate an exact agricultural rescue plan for:
        Crop: {crop_type}
        Growth Stage: {growth_stage}
        Problem/Threat: {issue_name}
        Severity: {severity}
        XGBoost Priority Score: {priority_score}/100 ({priority_category})
        Affected Area: {affected_area_pct}%
        Live Weather: Temp {temp}°C, Humidity {humidity}%, Rain Probability {rain_prob}%

        Return JSON format with keys:
        "immediate_action", "organic_treatment", "chemical_treatment", "safety_warning",
        "application_guidance", "recovery_time_days", "prevention_steps", "weather_advisory"
        """

        raw_json = None
        if gemini_key:
            raw_json = self._call_gemini_api(prompt, gemini_key)
        if not raw_json and groq_key:
            raw_json = self._call_groq_api(prompt, groq_key)

        if raw_json:
            try:
                data = json.loads(raw_json)
                if "immediate_action" in data:
                    return data
            except Exception:
                pass

        # Agronomic Expert Knowledge Base (100% Grounded Localized Fallback)
        weather_advisory = "Current microclimate conditions are stable for field treatment application."
        if rain_prob >= 50.0:
            weather_advisory = f"🌧️ High rain probability ({rain_prob}%). Delay chemical spraying until rainfall subsides to avoid wash-off and chemical runoff."
        elif humidity > 75.0:
            weather_advisory = f"🍃 High relative humidity ({humidity}%) detected. Apply treatment early in the morning after foliage dew dries for optimal absorption."
        elif temp > 34.0:
            weather_advisory = f"☀️ Extreme heat ({temp}°C). Avoid spraying during peak afternoon hours to prevent foliar chemical burn."

        safety_warning = "⚠️ Safety Advisory: Wear protective gear (nitrile gloves, face mask, eye protection). Follow agricultural extension label instructions strictly. Maintain 24-hour field re-entry interval."

        c_low = crop_type.lower()
        i_low = issue_name.lower()

        if "blast" in i_low or "blight" in i_low or "fungal" in i_low or "rust" in i_low:
            return {
                "immediate_action": f"Inspect affected {growth_stage.lower()} canopy immediately. Apply targeted systemic fungicide (Tricyclazole 75% WP @ 0.6g/L or Azoxystrobin 23% SC @ 1 ml/L).",
                "organic_treatment": "Foliar spray of Neem seed kernel extract (NSKE 5%) or Pseudomonas fluorescens bio-fungicide @ 10g/L every 7 days.",
                "chemical_treatment": f"Apply Tricyclazole or Propiconazole 25% EC @ 1 ml/L. Ensure uniform spray coverage across affected {affected_area_pct}% canopy area.",
                "safety_warning": safety_warning,
                "application_guidance": "Spray during calm morning hours (6:00 AM – 9:00 AM) using a hollow-cone nozzle. Avoid spraying if rain is expected within 4 hours.",
                "recovery_time_days": 10 if severity.upper() in ["HIGH", "CRITICAL"] else 7,
                "prevention_steps": f"Use certified disease-resistant seed, maintain balanced N-P-K (avoid excess nitrogen), and practice crop rotation for {crop_type}.",
                "weather_advisory": weather_advisory
            }
        elif "water" in i_low or "moisture" in i_low or "drought" in i_low or "heat" in i_low:
            return {
                "immediate_action": f"Inspect soil moisture at 10–15 cm root depth. Regulate irrigation schedule to protect {growth_stage.lower()} flowers and panicles from heat wilt.",
                "organic_treatment": "Apply organic mulch (straw or dried leaves, 5 cm layer) around crop base to conserve soil moisture and suppress soil temperature.",
                "chemical_treatment": "Apply anti-transpirant spray (Kaolin clay 3% suspension or Potassium chloride 1%) to reduce leaf water loss during extreme heat.",
                "safety_warning": "Ensure irrigation water is tested for salinity and electrical conductivity (EC < 1.5 dS/m).",
                "application_guidance": "Schedule light, frequent irrigation during early morning or evening. Avoid ponding or standing water in poorly drained zones.",
                "recovery_time_days": 4,
                "prevention_steps": "Install tensiometers or soil moisture probes, adopt drip or furrow irrigation, and maintain organic matter in soil.",
                "weather_advisory": weather_advisory
            }
        elif "nutrient" in i_low or "chlorosis" in i_low or "deficiency" in i_low:
            return {
                "immediate_action": f"Conduct foliar symptom confirmation and soil pH check. Differentiate nutritional chlorosis from disease lesions before fertilizer application.",
                "organic_treatment": "Foliar application of fermented Panchagavya or Vermicompost tea (1:10 dilution with water) to boost bio-available micronutrients.",
                "chemical_treatment": "Foliar spray of water-soluble N-P-K (19:19:19) @ 10g/L + Chelated Zinc EDTA 12% @ 1g/L for rapid foliar recovery.",
                "safety_warning": "Do NOT apply heavy nitrogen fertilizer while fungal pathogens are active. Over-fertilization softens cell walls and aggravates blight.",
                "application_guidance": "Spray on both upper and lower leaf surfaces during overcast or early morning hours for optimal stomatal uptake.",
                "recovery_time_days": 6,
                "prevention_steps": "Conduct seasonal pre-planting soil testing and incorporate well-decomposed farmyard manure (FYM @ 5 tons/acre).",
                "weather_advisory": weather_advisory
            }
        elif "spread" in i_low or "transmission" in i_low:
            return {
                "immediate_action": "Establish 2-meter sanitation buffer rows around diseased sections. Remove and safely dispose of heavily infected leaves showing active sporulation.",
                "organic_treatment": "Apply bio-control agent Bacillus subtilis or Trichoderma viride @ 5g/L on border crop rows.",
                "chemical_treatment": "Apply protective contact fungicide (Mancozeb 75% WP @ 2g/L or Copper Oxychloride @ 2.5g/L) to prevent spore establishment on healthy leaves.",
                "safety_warning": safety_warning,
                "application_guidance": "Spray buffer zone first, then work inwards toward infected core. Disinfect equipment thoroughly after use.",
                "recovery_time_days": 5,
                "prevention_steps": "Avoid dense plant spacing, prune lower foliage to increase air circulation, and eliminate weed hosts along field borders.",
                "weather_advisory": weather_advisory
            }
        else:
            return {
                "immediate_action": f"Scout field zone in {crop_type} plot. Record symptom distribution and verify pest/pathogen thresholds.",
                "organic_treatment": "Apply broad-spectrum organic bio-protectant (Neem oil 3000 ppm @ 5 ml/L with soap emulsifier).",
                "chemical_treatment": "Targeted crop-protection spray matching verified symptoms according to local agricultural extension dosage.",
                "safety_warning": safety_warning,
                "application_guidance": "Follow integrated pest management (IPM) thresholds before chemical intervention.",
                "recovery_time_days": 7,
                "prevention_steps": f"Regular weekly crop scouting, clean cultivation, and adherence to regional crop calendar for {crop_type}.",
                "weather_advisory": weather_advisory
            }

ai_planner_service = AIRescuePlannerService()
