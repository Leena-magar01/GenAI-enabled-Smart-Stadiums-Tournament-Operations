import os
import json
import requests
from typing import Dict, List, Optional

class AIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = "gpt-4o"
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def summarize_incident_report(self, raw_text: str, language: str = "en") -> Dict[str, str]:
        """
        Takes raw, unstructured speech/text from a volunteer or spectator, 
        and extracts structural details: Title, Category, Severity, and Recommended action.
        """
        system_prompt = (
            "You are an AI assistant for a tournament operations center. "
            "Analyze the raw, potentially chaotic text reporting a stadium issue and output "
            "a clean, structured JSON response with keys: 'title', 'category', 'severity' (Low, Medium, High, Critical), "
            "and 'action_plan' (what should be dispatched). Do not include markdown code block formatting in your response; return raw JSON."
        )
        
        user_prompt = f"Raw Report: \"{raw_text}\""

        if not self.api_key:
            # High-fidelity fallback parser for offline/demo reliability
            lower_text = raw_text.lower()
            severity = "Low"
            category = "General"
            title = "Reported Incident"
            action_plan = "Dispatch general stadium safety team."

            if "medical" in lower_text or "heart" in lower_text or "injury" in lower_text or "collapsed" in lower_text:
                severity = "Critical"
                category = "Medical"
                title = "Medical Emergency"
                action_plan = "Immediate dispatch: Red Cross Medical Team and nearest volunteer to clear access route."
            elif "fight" in lower_text or "security" in lower_text or "stolen" in lower_text or "violence" in lower_text:
                severity = "High"
                category = "Security"
                title = "Security Issue"
                action_plan = "Dispatch Stadium Security Squad B to Sector."
            elif "spill" in lower_text or "water" in lower_text or "wet" in lower_text or "clean" in lower_text:
                severity = "Medium"
                category = "Maintenance"
                title = "Slippery Floor Spill"
                action_plan = "Alert Janitorial Team for rapid response."
            elif "lost" in lower_text or "where is" in lower_text or "child" in lower_text:
                severity = "Medium"
                category = "Guest Services"
                title = "Lost Visitor Assistance"
                action_plan = "Notify guest relations center and broadcast description to nearest volunteers."
            
            return {
                "title": title,
                "category": category,
                "severity": severity,
                "action_plan": action_plan
            }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=data, timeout=5)
            response.raise_for_status()
            res_json = response.json()
            content = res_json['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            # Return template fallback on API failures
            return {
                "title": "Unstructured Report",
                "category": "General Operational",
                "severity": "Medium",
                "action_plan": f"Staff review required. Raw report details: {raw_text}"
            }

    def generate_multilingual_alert(self, alert_text: str, target_langs: List[str] = ["es", "fr", "ar", "ja"]) -> Dict[str, str]:
        """
        Translates a critical safety/emergency alert into multiple languages for dynamic signage.
        """
        if not self.api_key:
            # Fallback mock dictionary for typical stadium alerts
            translations = {
                "es": "ALERTA DE SEGURIDAD: Evacue a través de la salida más cercana.",
                "fr": "ALERTE DE SÉCURITÉ: Veuillez évacuer par la sortie la plus proche.",
                "ar": "تنبيه أمني: يرجى الإخلاء عبر أقرب مخرج.",
                "ja": "安全アラート：最寄りの出口から避難してください。"
            }
            return {lang: translations.get(lang, alert_text) for lang in target_langs}

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        translations = {}
        for lang in target_langs:
            system_prompt = f"Translate the following stadium alert text into language code '{lang}'. Output ONLY the raw translation text. Keep it brief and clear."
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": alert_text}
                ],
                "temperature": 0.2
            }
            try:
                response = requests.post(self.api_url, headers=headers, json=data, timeout=3)
                response.raise_for_status()
                res_json = response.json()
                translations[lang] = res_json['choices'][0]['message']['content'].strip()
            except Exception:
                translations[lang] = f"[Translation unavailable] {alert_text}"
        
        return translations

ai_service = AIService()
