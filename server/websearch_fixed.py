import google.generativeai as genai
import requests
import json
from duckduckgo_search import DDGS
import time
from dotenv import load_dotenv
import os
import sys

load_dotenv()  # Load environment variables from .env file

class FreeAIContractSearcher:
    def __init__(self, gemini_api_key=None):
        # Configure Gemini (free tier)
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
        else:
            # Fallback to local models
            self.model = None

        self.ddg = DDGS()

    def find_similar_contracts(self, user_contract_text):
        """Complete free AI-powered contract search"""
        contract_analysis = self.analyze_contract_free(user_contract_text)
        search_results = self.free_web_search(contract_analysis)
        ranked_results = self.rank_results_free(user_contract_text, search_results)
        return ranked_results

    def analyze_contract_free(self, contract_text):
        """Free AI analysis using Gemini Flash"""

        prompt = f"""
        Analyze this contract and create a search strategy to find similar legal documents:

        CONTRACT (first 2000 characters):
        {contract_text[:2000]}

        Extract:
        1. Contract type (e.g., NDA, employment, service agreement)
        2. Industry/sector
        3. Key parties (types of organizations)
        4. Main purpose/subject
        5. Important clauses mentioned
        6. Generate 8 specific search queries to find similar contracts

        Return ONLY a JSON object with these fields:
        {{
            "contract_type": "",
            "industry": "",
            "key_parties": [],
            "main_purpose": "",
            "important_clauses": [],
            "search_queries": []
        }}
        """

        try:
            if self.model:
                # Use Gemini Flash (free)
                response = self.model.generate_content(prompt)
                result = response.text
            else:
                # Fallback to pattern matching if no API
                result = self.basic_contract_analysis(contract_text)

            # Clean and parse JSON
            json_start = result.find('{')
            json_end = result.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = result[json_start:json_end]
                return json.loads(json_str)
            else:
                return self.basic_contract_analysis(contract_text)

        except Exception as e:
            return self.basic_contract_analysis(contract_text)

    def basic_contract_analysis(self, contract_text):
        """Fallback analysis without AI"""
        text_lower = contract_text.lower()

        # Basic contract type detection
        contract_type = "unknown"
        if "non-disclosure" in text_lower or "nda" in text_lower:
            contract_type = "NDA"
        elif "employment" in text_lower or "employee" in text_lower:
            contract_type = "employment"
        elif "service" in text_lower and "agreement" in text_lower:
            contract_type = "service agreement"
        elif "lease" in text_lower or "rent" in text_lower:
            contract_type = "lease agreement"

        # Generate basic search queries
        queries = [
            f"{contract_type} contract example",
            f"{contract_type} agreement template",
            f"legal {contract_type} document",
            f"{contract_type} contract SEC filing",
            f"court case {contract_type} dispute"
        ]

        return {
            "contract_type": contract_type,
            "industry": "general",
            "key_parties": ["company", "individual"],
            "main_purpose": "business agreement",
            "important_clauses": ["terms", "conditions"],
            "search_queries": queries
        }

    def free_web_search(self, contract_analysis):
        """Free web search using DuckDuckGo"""
        all_results = []

        search_queries = contract_analysis.get('search_queries', [])

        for query in search_queries[:5]:  # Limit to 5 queries
            try:
                # Search with DuckDuckGo (completely free)
                results = list(self.ddg.text(
                    query + " legal document contract",
                    max_results=5,
                    region='us-en'
                ))

                for result in results:
                    all_results.append({
                        'title': result['title'],
                        'url': result['href'],
                        'snippet': result['body'],
                        'source': self.identify_source(result['href']),
                        'query_used': query
                    })

                # Rate limiting (be nice to free services)
                time.sleep(2)

            except Exception as e:
                continue

        return all_results

    def identify_source(self, url):
        """Identify the source of the document"""
        url_lower = url.lower()

        if 'sec.gov' in url_lower:
            return 'SEC EDGAR'
        elif 'courtlistener' in url_lower or 'justia' in url_lower:
            return 'Court Records'
        elif 'gov' in url_lower:
            return 'Government'
        elif 'law' in url_lower:
            return 'Legal Database'
        else:
            return 'Legal Resource'

    def rank_results_free(self, original_contract, search_results):
        """Free AI ranking using Gemini Flash"""

        if not search_results:
            return []

        # Process in smaller batches for free tier limits
        batch_size = 5
        ranked_results = []

        for i in range(0, len(search_results), batch_size):
            batch = search_results[i:i+batch_size]

            ranking_prompt = f"""
            Original contract type and key info:
            {original_contract[:500]}...

            Rank these search results by similarity to the original contract:
            {json.dumps(batch, indent=2)}

            For each result, assign a similarity score (0-100) and brief explanation.
            Focus on: contract type match, subject matter relevance, source credibility.

            Return ONLY a JSON array:
            [
                {{
                    "title": "result title",
                    "url": "result url", 
                    "similarity_score": 85,
                    "explanation": "why it's similar",
                    "source": "source type"
                }},
                ...
            ]
            """

            try:
                if self.model:
                    response = self.model.generate_content(ranking_prompt)
                    result_text = response.text

                    # Extract JSON
                    json_start = result_text.find('[')
                    json_end = result_text.rfind(']') + 1

                    if json_start != -1 and json_end != -1:
                        json_str = result_text[json_start:json_end]
                        batch_ranked = json.loads(json_str)
                        ranked_results.extend(batch_ranked)
                    else:
                        # Fallback: assign default scores
                        for result in batch:
                            result['similarity_score'] = 50
                            result['explanation'] = "Basic relevance match"
                        ranked_results.extend(batch)
                else:
                    # No AI available - basic scoring
                    for result in batch:
                        score = self.calculate_basic_similarity(original_contract, result)
                        result['similarity_score'] = score
                        result['explanation'] = f"Keyword match score: {score}"
                    ranked_results.extend(batch)

                time.sleep(1)  # Rate limiting for free tier

            except Exception as e:
                # Fallback scoring
                for result in batch:
                    result['similarity_score'] = 50
                    result['explanation'] = "Could not analyze similarity"
                ranked_results.extend(batch)

        # Sort by similarity score
        ranked_results.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)

        return ranked_results[:15]  # Return top 15

    def calculate_basic_similarity(self, original_contract, search_result):
        """Basic similarity calculation without AI"""
        original_words = set(original_contract.lower().split())
        result_words = set((search_result['title'] + ' ' + search_result['snippet']).lower().split())

        # Calculate word overlap
        common_words = original_words.intersection(result_words)
        similarity = len(common_words) / max(len(original_words), len(result_words), 1) * 100

        # Boost score for legal sources
        if search_result['source'] in ['SEC EDGAR', 'Court Records', 'Government']:
            similarity += 20

        return min(similarity, 100)


def main():
    # Initialize with free Gemini API key (optional)
    gemini_key = os.getenv('GEMINI_API_KEY')
    searcher = FreeAIContractSearcher(gemini_key)

    # Read contract text from stdin
    contract_text = sys.stdin.read().strip()
    
    if not contract_text:
        print(json.dumps({"error": "No contract text provided"}))
        return

    try:
        # Find similar contracts
        results = searcher.find_similar_contracts(contract_text)
        
        # Output only JSON
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
