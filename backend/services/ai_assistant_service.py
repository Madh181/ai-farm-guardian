import requests
from backend.config import GROQ_API_KEY

class AIFarmAssistantService:
    def answer_farmer_query(self, 
                           query: str, 
                           farm_context: dict, 
                           custom_groq_key: str = "") -> str:
        """
        RAG-powered conversational assistant for farmers with current farm context awareness.
        """
        api_key = custom_groq_key or GROQ_API_KEY

        # Context summary
        farm_name = farm_context.get("farm_name", "My Farm")
        active_issues = farm_context.get("active_issues", [])
        weather = farm_context.get("weather", {})
        highest_priority = farm_context.get("highest_priority", None)

        context_str = f"Farm: {farm_name}. "
        if highest_priority:
            context_str += f"Highest Priority Issue: {highest_priority.get('issue_name')} (Category: {highest_priority.get('priority_category')}, Score: {highest_priority.get('priority_score')}/100). "
        if active_issues:
            issues_list = ", ".join([i.get("issue_name", "") for i in active_issues])
            context_str += f"Active Issues: {issues_list}. "
        if weather:
            context_str += f"Current Weather: {weather.get('temperature')}°C, Humidity: {weather.get('humidity')}%, Rain Probability: {weather.get('rain_probability')}%, Condition: {weather.get('condition')}. "

        # Call Groq API if key present
        if api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                system_prompt = f"""
                You are the AI Farm Guardian Assistant — an expert agricultural advisor.
                You are helping a farmer with their specific farm data context:
                {context_str}
                Be concise, practical, empathetic, and actionable. Provide bullet points where relevant.
                Always ground recommendations in safety and local agricultural guidelines.
                """
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    "temperature": 0.5
                }
                res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"Groq Chat Assistant Error: {e}")

        # Dynamic Rule-Based RAG Assistant Engine (Fallback)
        q_lower = query.lower()

        if "yellow" in q_lower or "leaf" in q_lower:
            return f"🌿 **Why leaves turn yellow in your farm context:**\n\nYellowing (chlorosis) can stem from:\n1. **Nitrogen Deficiency**: Older lower leaves turn pale green to yellow first.\n2. **Water Stress**: Over-watering or poor drainage suffocates roots.\n3. **Fungal Infection**: Disease like Late Blight or Blast causes yellow halos around lesions.\n\n*Current Farm Insight*: Humidity is **{weather.get('humidity', 70)}%**. Check your leaf surface for spot patterns or inspect the **Crop Scanner** to run an instant scan!"

        elif "spray" in q_lower or "pesticide" in q_lower or "today" in q_lower:
            rain_prob = weather.get("rain_probability", 20)
            if rain_prob >= 50:
                return f"🌧️ **Recommendation: DELAY SPRAYING TODAY.**\n\nRain probability is currently **{rain_prob}%** at your farm. Spraying chemical pesticides today risks rainwater washing away the active compound before absorption, leading to chemical waste and runoff pollution. Wait for a clear 24-hour weather window."
            else:
                return f"✅ **Weather conditions are favorable for spraying today.**\n\nRain probability is low (**{rain_prob}%**). Spray during early morning (6-9 AM) when wind speeds are minimal and foliage is dry."

        elif "first" in q_lower or "priority" in q_lower or "do" in q_lower:
            if highest_priority:
                return f"🚨 **Your Top Intervention Priority:**\n\nFocus on **{highest_priority.get('issue_name')}** (Priority Score: **{highest_priority.get('priority_score')}/100 - {highest_priority.get('priority_category')}**).\n\n**Action Steps:**\n1. Visit the **AI Rescue Planner** for your tailored organic and chemical dosage plan.\n2. Verify safety instructions before handling treatment chemicals.\n3. Log the application in **Treatment Tracker**."
            else:
                return "🌾 You currently have no critical unresolved crop issues! Continue routine weekly scouting and monitor the **Weather Intelligence** tab for humidity alerts."

        elif "health score" in q_lower or "decreasing" in q_lower or "score" in q_lower:
            return f"📊 **Understanding Your Farm Health Score:**\n\nYour score is dynamically computed from unresolved disease severity, spread risk, affected crop acreage, and weather vulnerability.\n\nTo improve your score:\n- Resolve high-priority issues in the **Priority Center**.\n- Complete scheduled treatments in **Treatment Tracker**.\n- Upload updated post-treatment leaf photos in **Crop Scanner** to verify crop recovery!"

        else:
            return f"🌾 **AI Guardian Assistant Response:**\n\nThank you for asking! Based on your active farm context (**{farm_name}**, Weather: {weather.get('temperature', 28)}°C), I recommend monitoring field conditions closely. You can ask me about pest treatments, pesticide timing, leaf color symptoms, or click any quick prompt chip below!"

ai_assistant_service = AIFarmAssistantService()
