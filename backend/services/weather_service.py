import requests
from backend.config import OPENWEATHER_API_KEY

class WeatherIntelligenceService:
    def get_weather_data(self, lat: float = 12.9716, lon: float = 77.5946, custom_api_key: str = "") -> dict:
        """
        Fetches real-time weather from OpenWeatherMap API or Open-Meteo API fallback.
        """
        api_key = custom_api_key or OPENWEATHER_API_KEY

        # Try OpenWeatherMap API if key is present
        if api_key:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
                res = requests.get(url, timeout=5)
                if res.status_code == 200:
                    data = res.json()
                    temp = data["main"]["temp"]
                    humidity = data["main"]["humidity"]
                    wind_speed = round(data["wind"]["speed"] * 3.6, 1) # m/s to km/h
                    rain_prob = data.get("pop", 0) * 100 if "pop" in data else (80.0 if "rain" in data else 20.0)
                    condition = data["weather"][0]["description"].title() if data.get("weather") else "Clear"

                    advisories = self.generate_agri_advisories(temp, humidity, rain_prob, wind_speed)
                    return {
                        "temperature": round(temp, 1),
                        "humidity": humidity,
                        "wind_speed_kmh": wind_speed,
                        "rain_probability": round(rain_prob, 0),
                        "condition": condition,
                        "location_name": data.get("name", "Farm Location"),
                        "advisories": advisories,
                        "source": "OpenWeatherMap"
                    }
            except Exception as e:
                print(f"OpenWeather API fetch error: {e}")

        # Live Fallback: Open-Meteo Free Public API (No API key needed!)
        try:
            meteo_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto"
            res = requests.get(meteo_url, timeout=5)
            if res.status_code == 200:
                mdata = res.json()
                current = mdata.get("current", {})
                daily = mdata.get("daily", {})

                temp = current.get("temperature_2m", 28.5)
                humidity = current.get("relative_humidity_2m", 72)
                wind_speed = current.get("wind_speed_10m", 12.0)
                rain_prob = daily.get("precipitation_probability_max", [25.0])[0] if daily.get("precipitation_probability_max") else 20.0

                condition = "Cloudy" if humidity > 75 else ("Rainy" if rain_prob > 60 else "Partly Cloudy")
                advisories = self.generate_agri_advisories(temp, humidity, rain_prob, wind_speed)

                return {
                    "temperature": round(temp, 1),
                    "humidity": humidity,
                    "wind_speed_kmh": wind_speed,
                    "rain_probability": round(rain_prob, 0),
                    "condition": condition,
                    "location_name": "Farm Coordinates",
                    "advisories": advisories,
                    "source": "Open-Meteo (Live API)"
                }
        except Exception as e:
            print(f"Open-Meteo API fallback error: {e}")

        # Standard baseline if offline
        temp, humidity, rain_prob, wind_speed = 29.0, 78.0, 35.0, 14.0
        return {
            "temperature": temp,
            "humidity": humidity,
            "wind_speed_kmh": wind_speed,
            "rain_probability": rain_prob,
            "condition": "Partly Cloudy",
            "location_name": "Farm Location",
            "advisories": self.generate_agri_advisories(temp, humidity, rain_prob, wind_speed),
            "source": "Agronomic Simulator"
        }

    def generate_agri_advisories(self, temp: float, humidity: float, rain_prob: float, wind_speed: float) -> list:
        advisories = []
        if rain_prob >= 50.0:
            advisories.append("🌧️ High rain probability expected within 24 hours — delay pesticide and fertilizer spraying.")
        if humidity > 75.0:
            advisories.append("🍃 High atmospheric humidity detected — fungal disease transmission risk is elevated.")
        if temp > 34.0:
            advisories.append("💧 High temperature detected — increase field irrigation monitoring to prevent heat wilt.")
        if wind_speed > 25.0:
            advisories.append("💨 Strong winds (>25 km/h) — spray drift risk is high; avoid aerial spraying.")
        
        if not advisories:
            advisories.append("☀️ Favorable weather conditions for field work and routine monitoring.")

        return advisories

weather_service = WeatherIntelligenceService()
