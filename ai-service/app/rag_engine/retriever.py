import json
import re
from typing import List, Dict, Any
from app.config import SCHEME_DOCS_PATH

class RAGRetriever:
    def __init__(self):
        self._load_docs()

    def _load_docs(self):
        try:
            with open(SCHEME_DOCS_PATH, 'r', encoding='utf-8') as f:
                self.docs = json.load(f)
        except Exception:
            self.docs = []

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves most relevant verified government scheme text chunks for a query.
        Uses token overlap, keyword matching, and frequency scoring.
        """
        if not query or not self.docs:
            return []

        # Tokenize query
        cleaned_query = re.sub(r'[^\w\s]', ' ', query.lower())
        tokens = set(cleaned_query.split())

        scored_docs = []
        for doc in self.docs:
            doc_text = f"{doc.get('title', '')} {doc.get('section', '')} {doc.get('text', '')}".lower()
            
            score = 0.0
            for token in tokens:
                if len(token) < 3:
                    continue
                # Exact word occurrence
                count = doc_text.count(token)
                if count > 0:
                    score += 1.0 + (0.5 * count)

            # Boost if scheme code matches
            scheme_code = doc.get("scheme_code", "").lower()
            if any(term in scheme_code for term in tokens):
                score += 3.0

            if score > 0:
                scored_docs.append({
                    "score": round(score, 2),
                    "document": doc
                })

        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return [item["document"] for item in scored_docs[:top_k]]
