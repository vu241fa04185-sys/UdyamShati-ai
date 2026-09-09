import os
import json
import requests
from typing import Dict, Any, List, Optional

class LLMProvider:
    """
    Clean LLM Provider abstraction for UdyamSaarthi Conversational Business Advisor.
    Supports Gemini API via environment variable (GEMINI_API_KEY or GOOGLE_API_KEY).
    If no key is configured, gracefully degrades to deterministic NLU/rules.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def _call_gemini_api(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        if not self.is_available():
            return None

        headers = {"Content-Type": "application/json"}
        params = {"key": self.api_key}

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            resp = requests.post(self.endpoint, headers=headers, params=params, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
        except Exception as e:
            print(f"LLMProvider API Warning: {e}")

        return None

    def understand_message(self, text: str, session_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Uses LLM to extract entities, intent, and missing information from natural/mixed language input.
        """
        if not self.is_available():
            return {}

        system_instruction = (
            "You are Saarthi, an expert rural business advisor NLU engine. "
            "Your job is to analyze entrepreneur messages in English, Hindi, Telugu, or mixed speech. "
            "Extract ALL entities in a single pass (business idea, category, location, capital in INR, land in acres, experience years, skills). "
            "Do not confuse previous known state with new information. "
            "Output strictly valid JSON with keys: language, intent, entities, missing_fields, ready_for_analysis."
        )

        prompt = f"""
Current Session State:
{json.dumps(session_state, ensure_ascii=False, indent=2)}

User Message:
"{text}"

Output strictly a JSON object conforming to:
{{
  "language": "ENGLISH|HINDI|TELUGU|MIXED",
  "intent": "PROVIDE_BUSINESS_INFORMATION|CONFIRM_ANALYSIS|CHANGE_INFORMATION|ASK_QUESTION|GREETING|OTHER",
  "entities": {{
    "business_idea": string or null,
    "category_code": string or null,
    "location": string or null,
    "capital": number or null,
    "land_acres": number or null,
    "experience_years": number or null,
    "skills": array of strings
  }},
  "missing_fields": array of strings,
  "ready_for_analysis": boolean,
  "natural_response": string or null
}}
"""
        response_text = self._call_gemini_api(prompt, system_instruction)
        if response_text:
            try:
                # Strip markdown fence if present
                clean_json = response_text.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_json)
            except Exception:
                pass

        return {}

    def generate_advisory_response(self, prompt_text: str, language: str = "ENGLISH") -> Optional[str]:
        if not self.is_available():
            return None

        sys_prompt = (
            "You are Saarthi, a warm, knowledgeable, human rural business companion across India. "
            "Speak clearly, encouragingly, and succinctly. "
            "NEVER repeat greetings if context is mid-conversation. "
            "Answer directly in the requested language (English, Hindi, or Telugu)."
        )
        return self._call_gemini_api(prompt_text, sys_prompt)
