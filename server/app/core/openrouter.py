import httpx

from server.config.settings import get_settings


settings = get_settings()

SYSTEM_PROMPT = """
You are AquaSphere AI - an advanced intelligent assistant.

Capabilities:
- Answer questions across technology, coding, science, business, education, oceans, climate, agriculture, trade, and general knowledge.
- Work as a general AI assistant first, while using AquaSphere context when it is relevant.

Priority:
1. If relevant context is provided, use it first.
2. If context is partial, combine it with strong general knowledge.
3. If context is not relevant, answer normally as a capable general assistant.

Behavior:
- Give clear, structured, useful answers.
- Think carefully before answering, but do not reveal private chain-of-thought.
- Be practical, intelligent, and direct.
- Avoid filler and vague language.
- Do not invent statistics, citations, or hard facts.
- If something is uncertain, say so briefly and continue with the best grounded answer.
- Prefer helpful reasoning, examples, and concrete steps when useful.

Style:
- Sound like a smart human collaborator.
- Stay concise unless the user clearly wants depth.
- For technical questions, include steps or code when helpful.
- For analytical questions, explain relationships, trends, and cause-to-effect logic.

Goal:
Act like a powerful general AI assistant that can also specialize in AquaSphere data when available.
"""


def _candidate_models() -> list[str]:
    configured = [
        settings.openrouter_primary_model.strip(),
        settings.openrouter_fallback_model.strip(),
    ]
    recommended = [
        "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet",
        "mistralai/mixtral-8x7b-instruct",
    ]
    free_fallbacks = [
        "google/gemma-2-9b-it:free",
        "qwen/qwen-2.5-7b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
    ]

    seen: set[str] = set()
    models: list[str] = []
    for model_name in configured + recommended + free_fallbacks:
        if model_name and model_name not in seen:
            models.append(model_name)
            seen.add(model_name)
    return models


async def generate_ollama_response(question: str, context: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"User Question:\n{question}\n\n"
                f"Context Data (if any):\n{context if context else 'No domain-specific data available.'}\n\n"
                "Instructions:\n"
                "- Answer like a capable general AI assistant.\n"
                "- Use context only when it genuinely helps.\n"
                "- If the question is about AquaSphere, connect ocean, water, soil, agriculture, plants, disease, and trade.\n"
                "- Be direct, useful, and structured.\n"
            ),
        },
    ]
    payload = {
        "model": settings.ollama_model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.2,
        },
    }
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(settings.ollama_base_url, json=payload)
        response.raise_for_status()
        body = response.json()
    content = body.get("message", {}).get("content")
    if not content:
        raise RuntimeError("Ollama returned an empty response.")
    return content.strip()


async def generate_openrouter_response(question: str, context: str) -> str:
    if not settings.openrouter_api_key:
        raise RuntimeError("Missing OpenRouter API key.")

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AquaSphere AI",
    }

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"User Question:\n{question}\n\n"
                f"Context Data (if any):\n{context if context else 'No domain-specific data available.'}\n\n"
                "Instructions:\n"
                "- Use context if it genuinely helps.\n"
                "- If the question is general, answer normally without forcing the context.\n"
                "- Prefer accurate, grounded, directly useful answers.\n"
            ),
        },
    ]

    async def call_model(model_name: str) -> dict:
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post(
                settings.openrouter_base_url,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    errors: list[str] = []
    for model_name in _candidate_models():
        try:
            body = await call_model(model_name)
            choices = body.get("choices", [])
            if choices and choices[0].get("message", {}).get("content"):
                return choices[0]["message"]["content"].strip()
            errors.append(f"{model_name}: empty response")
        except Exception as exc:
            errors.append(f"{model_name}: {exc}")
            print(f"OpenRouter model {model_name} failed: {exc}")

    raise RuntimeError("All OpenRouter models failed. " + " | ".join(errors[:4]))
