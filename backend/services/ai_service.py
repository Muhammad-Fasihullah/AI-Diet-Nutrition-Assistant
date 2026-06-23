"""
AI Service — handles all LLM calls.
Supports Groq (free) and OpenAI providers via prompt engineering.
"""
import json
from groq import Groq
from openai import OpenAI
from core.config import get_settings


def get_ai_client():
    """Returns the configured AI client based on AI_PROVIDER setting."""
    settings = get_settings()
    if settings.ai_provider == "groq":
        return Groq(api_key=settings.groq_api_key), settings.groq_model, settings.groq_vision_model
    else:
        return OpenAI(api_key=settings.openai_api_key), settings.openai_model, settings.openai_vision_model


def chat_completion(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> str:
    """Send messages to LLM and return text response."""
    client, model, _ = get_ai_client()

    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as e:
        raise Exception(f"AI request failed: {str(e)}")


def vision_completion(
    prompt: str,
    image_base64_list: list[str],
    temperature: float = 0.4,
    max_tokens: int = 1500,
    json_mode: bool = False,
) -> str:
    """
    Send text + images to vision-capable LLM.
    image_base64_list: list of base64-encoded image strings (without data: prefix)
    """
    client, _, vision_model = get_ai_client()

    content = [{"type": "text", "text": prompt}]
    for img_b64 in image_base64_list:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"},
        })

    kwargs = {
        "model": vision_model,
        "messages": [{"role": "user", "content": content}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as e:
        raise Exception(f"Vision AI request failed: {str(e)}")


def extract_json(text: str) -> dict:
    """Extracts JSON from LLM response (handles markdown code blocks)."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end + 1])
        raise ValueError(f"Could not extract JSON from response: {text[:200]}")