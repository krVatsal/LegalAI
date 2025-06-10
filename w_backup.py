
import google.generativeai as genai
import requests
import json
from duckduckgo_search import DDGS
import time
from dotenv import load_dotenv
import os
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

        self.ddg = DDGS()    def find_similar_contracts(self, user_contract_text):
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
                return self.basic_contract_analysis(contract_text)        except Exception as e:
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
                print(f"   Searching: {query}")

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
                print(f"Search error for '{query}': {e}")
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
                print(f"Ranking error: {e}")
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

# Example usage


def main():
    # Initialize with free Gemini API key (optional)
    gemini_key =  os.getenv('GEMINI_API_KEY')  # Get from https://makersuite.google.com/app/apikey 
    searcher = FreeAIContractSearcher(gemini_key)

    # Example contract text
    sample_contract = """ 
   MASTER SERVICE AGREEMENT (MSA)
Between
Apex Technologies, Inc., a Delaware corporation, with its principal place of business at 123 Innovation Drive, Wilmington, DE 19801 (“Service Provider”)
And
Orion Health Systems Ltd., a company incorporated under the laws of the State of New York, with its principal place of business at 456 Wellness Avenue, Albany, NY 12207 (“Client”).

Effective Date: June 1, 2025

1. Scope of Services
1.1 Service Provider agrees to provide software development, infrastructure support, and cybersecurity consulting services (“Services”) as described in individual Statements of Work (“SOW”) executed by both parties under this MSA.

1.2 Each SOW shall reference this Agreement, be incorporated by reference herein, and detail specific deliverables, milestones, acceptance criteria, payment schedules, and term.

2. Term and Termination
2.1 This Agreement shall commence on the Effective Date and shall continue for three (3) years unless terminated earlier in accordance with this Section.

2.2 Either party may terminate this Agreement:

(a) For convenience with ninety (90) days’ written notice; or

(b) For material breach not cured within thirty (30) days of written notice.

2.3 Upon termination, all outstanding fees for completed services and accepted deliverables shall become immediately due.

2.4 Sections 4, 5, 7, 9, 11, and 13 shall survive termination.

3. Fees and Payment
3.1 Client agrees to pay Service Provider the fees set forth in the applicable SOW. Unless otherwise stated, all invoices are payable net thirty (30) days from the date of invoice.

3.2 Late payments shall bear interest at 1.5% per month or the maximum rate permitted by law, whichever is less.

3.3 Disputes over invoiced amounts must be raised in writing within fifteen (15) days of receipt.

4. Intellectual Property
4.1 Unless otherwise specified in a SOW, all intellectual property (“IP”) created by Service Provider under this Agreement shall be owned exclusively by Client.

4.2 Notwithstanding Section 4.1, Service Provider shall retain all rights, title, and interest in pre-existing works and generic tools, methods, and know-how (“Background IP”), provided that such Background IP is not specifically developed for Client.

4.3 Service Provider grants Client a non-exclusive, perpetual, royalty-free license to use any Background IP embedded in deliverables.

5. Confidentiality
5.1 Each party agrees to maintain in strict confidence any Confidential Information disclosed by the other party during the term of this Agreement.

5.2 Confidential Information does not include information that:
(a) is or becomes publicly known through no fault of the receiving party;
(b) is in the possession of the receiving party without restriction prior to disclosure;
(c) is independently developed by the receiving party; or
(d) is disclosed pursuant to a legal obligation, provided the disclosing party is notified in advance.

6. Warranties
6.1 Service Provider warrants that:

(a) the Services shall be performed in a professional and workmanlike manner;

(b) deliverables shall materially conform to the specifications in the applicable SOW for ninety (90) days after delivery.

6.2 EXCEPT AS EXPRESSLY STATED HEREIN, SERVICE PROVIDER DISCLAIMS ALL OTHER WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

7. Limitation of Liability
7.1 NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

7.2 EXCEPT FOR CLAIMS ARISING FROM SECTION 5 (CONFIDENTIALITY), SECTION 4 (IP), OR CLIENT’S PAYMENT OBLIGATIONS, EACH PARTY’S LIABILITY SHALL BE LIMITED TO THE AMOUNTS PAID BY CLIENT TO SERVICE PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

8. Independent Contractor
8.1 The relationship of the parties is that of independent contractors. Nothing in this Agreement shall create a partnership, joint venture, or agency relationship.

9. Indemnification
9.1 Service Provider agrees to indemnify, defend, and hold harmless Client from and against any third-party claims alleging that deliverables infringe upon a third party’s intellectual property rights, provided that:

(a) Client promptly notifies Service Provider;

(b) Service Provider has sole control of the defense and settlement; and

(c) Client reasonably cooperates.

9.2 If deliverables are found to infringe, Service Provider shall, at its sole option and expense:

(a) procure the right for Client to continue using them;

(b) replace or modify them so that they become non-infringing; or

(c) refund the applicable fees paid for the infringing deliverables.

10. Force Majeure
10.1 Neither party shall be liable for delays or failures in performance due to causes beyond its reasonable control, including but not limited to natural disasters, wars, terrorism, civil disturbances, government actions, labor disputes, or failures of utilities.

11. Data Security and Compliance
11.1 Service Provider shall implement and maintain administrative, physical, and technical safeguards to protect Client Data consistent with industry standards.

11.2 If Services involve handling personal data subject to GDPR, HIPAA, or CCPA, Service Provider agrees to execute a separate Data Processing Agreement (“DPA”).

12. Audit Rights
12.1 During the term and for one (1) year thereafter, Client may audit Service Provider’s records solely to verify compliance with Section 3 and Section 11, upon thirty (30) days’ prior written notice, not more than once annually.

13. Governing Law and Dispute Resolution
13.1 This Agreement shall be governed by the laws of the State of New York without regard to its conflict of laws principles.

13.2 Any dispute arising under this Agreement shall be resolved through binding arbitration in New York, NY, in accordance with the rules of the American Arbitration Association.

13.3 The prevailing party shall be entitled to recover reasonable attorneys’ fees and costs.

14. Miscellaneous
14.1 Entire Agreement: This Agreement and its Exhibits constitute the entire agreement and supersede all prior understandings.

14.2 Amendments: Any amendment must be in writing and signed by authorized representatives.

14.3 Assignment: Neither party may assign this Agreement without the other’s written consent, except to a successor in interest by way of merger or acquisition.

14.4 Notices: All notices shall be in writing and delivered via certified mail or email to the addresses listed above.

14.5 Severability: If any provision is held to be invalid, the remainder shall remain in full force and effect.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

 
    
    """

    # Find similar contracts
    results = searcher.find_similar_contracts(sample_contract)

    # Display results
    print(f"\n🎯 Found {len(results)} similar contracts:")
    for i, result in enumerate(results[:10]):
        print(f"\n{i+1}. {result['title']}")
        print(f"   📊 Similarity: {result['similarity_score']}/100")
        print(f"   🔗 Link: {result['url']}")
        print(f"   📝 Why similar: {result['explanation']}")
        print(f"   🏛️ Source: {result['source']}")


if __name__ == "__main__":
    main()