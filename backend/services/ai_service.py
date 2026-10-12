import os
import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def is_configured() -> bool:
    return bool(GROQ_API_KEY)


async def chat_completion(system_prompt: str, user_message: str, history=None):
    """Calls Groq's OpenAI-compatible chat endpoint. Returns None if no key
    is configured -- caller must show a 'Connect API' state, never a canned
    fake answer."""
    if not GROQ_API_KEY:
        return None

    messages = [{"role": "system", "content": system_prompt}]
    for h in (history or [])[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.4},
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data["choices"][0]["message"]["content"]
