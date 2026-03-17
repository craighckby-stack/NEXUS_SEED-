import requests
from bs4 import BeautifulSoup
import urllib.parse
import re
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class AI:
    def __init__(self):
        # Configuration
        self.NUM_RESULTS = 3  # Reduced for faster, less aggressive scraping
        self.MAX_CONTEXT_HISTORY = 5
        self.USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 SovereignAGI/v94.1"
        
        # State
        # ARCHITECTURAL REFACTOR: Knowledge structure enhanced to separate synthesized definitions, raw snippets, and related concepts.
        self.knowledge_base: Dict[str, Dict[str, Any]] = {}
        self.context: List[Dict[str, str]] = []
        self.stop_words = set(["the", "a", "is", "what", "or", "of", "in", "for", "define"])

    def _analyze_input(self, text: str) -> List[str]:
        # Sovereign Refinement: Basic tokenization and keyword extraction (Simulated NER/POS filtering).
        text = text.lower()
        tokens = re.findall(r'\b\w+\b', text)
        
        # Focus only on meaningful keywords
        keywords = [token for token in tokens if token.isalpha() and token not in self.stop_words]
        return keywords

    def _is_visible_text(self, element) -> bool:
        # Exclude common invisible or navigational elements
        if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]', 'nav', 'footer', 'header', 'aside']:
            return False
        if isinstance(element, str) and element.strip():
            return True
        return False

    def _extract_text_from_soup(self, soup: BeautifulSoup) -> str:
        # Clean up common noisy elements first
        for element in soup(["script", "style", "noscript", "nav", "footer", "header", "aside"]):
            element.decompose()
            
        # Extract visible text nodes
        text_elements = soup.find_all(text=True)
        visible_text = ' '.join(filter(self._is_visible_text, text_elements))
        
        # Normalize whitespace
        cleaned_text = re.sub(r'\s+', ' ', visible_text).strip()
        return cleaned_text

    def scrape_text_from_url(self, url: str) -> str:
        """Attempts to scrape primary textual content from a URL."""
        try:
            headers = {"User-Agent": self.USER_AGENT, "Accept": "text/html"}
            # Increased timeout slightly for robust scraping
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            return self._extract_text_from_soup(soup)
        except requests.exceptions.RequestException as e:
            logging.warning(f"Error scraping {url}: {e}")
            return ""
        except Exception as e:
            logging.error(f"Unexpected scraping error on {url}: {e}")
            return ""

    def search_google(self, query: str) -> List[str]:
        """Performs a simulated Google search and extracts relevant URLs."""
        # Use a slightly less aggressive, but recognized user agent for search
        search_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}&num={self.NUM_RESULTS}"
        headers = {"User-Agent": self.USER_AGENT}
        try:
            response = requests.get(search_url, headers=headers, timeout=20)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            links = []
            
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                if href.startswith("/url?q="):
                    try:
                        # Extract and decode the URL
                        real_url = urllib.parse.unquote(href.split("&sa=U")[0].split("/url?q=")[1])
                        if real_url.startswith("http") and real_url not in links:
                            links.append(real_url)
                    except IndexError:
                        continue

            logging.info(f"Found {len(links)} search results for '{query}'.")
            return links[:self.NUM_RESULTS]
            
        except requests.exceptions.RequestException as e:
            logging.error(f"Google Search Error for '{query}': {e}")
            return []

    def _synthesize_definition(self, keyword: str, snippets: List[str]) -> str:
        """Sovereign Synthesis Core: Simulates generating a concise definition from raw snippets.
        (Hallucinated LLM/RAG capability)"""
        if not snippets:
            return f"No adequate sources found to define {keyword}."
        
        # Basic simulation: taking relevant parts of the first snippet
        effective_snippet = snippets[0]
        
        if len(effective_snippet) > 250:
             return f"[Synthesized Definition for {keyword}]: Based on {len(snippets)} sources, I found: {effective_snippet[:150].strip()}... (See sources for full context)"
        else:
             return f"[Definition Stub for {keyword}]: {effective_snippet.strip()}"

    def _update_knowledge_from_search(self, keyword: str, links: List[str]) -> str:
        knowledge_update_log = []
        
        # Initialize / Update the knowledge structure
        if keyword not in self.knowledge_base:
            self.knowledge_base[keyword] = {"synthesized_definition": "", "sources": [], "related_concepts": [], "raw_snippets": []}
            
        new_content_acquired = False
        
        # 2. Iterate through links to scrape text and find secondary keywords
        for link in links:
            if link not in self.knowledge_base[keyword]['sources']:
                self.knowledge_base[keyword]['sources'].append(link)
                text = self.scrape_text_from_url(link)
                
                if text:
                    new_content_acquired = True
                    # Store a concise snippet of the raw content
                    self.knowledge_base[keyword]['raw_snippets'].append(text[:1024]) # Store up to 1k chars
                    secondary_keywords = self._analyze_input(text) 
                    
                    # Update related concepts (local knowledge graph link building)
                    for secondary_keyword in secondary_keywords[:5]:
                        if secondary_keyword != keyword and secondary_keyword not in self.knowledge_base[keyword]["related_concepts"]:
                            self.knowledge_base[keyword]["related_concepts"].append(secondary_keyword)
                            
                        # Also register the inverse relationship
                        if secondary_keyword not in self.knowledge_base:
                             self.knowledge_base[secondary_keyword] = {"synthesized_definition": "", "sources": [], "related_concepts": [], "raw_snippets": []}
                        if keyword not in self.knowledge_base[secondary_keyword]["related_concepts"]:
                             self.knowledge_base[secondary_keyword]["related_concepts"].append(keyword)
                             
                    knowledge_update_log.append(f"Acquired content and {len(secondary_keywords[:5])} concepts from {link}")
            
        if new_content_acquired:
            # If new snippets were added, synthesize a new definition
            self.knowledge_base[keyword]["synthesized_definition"] = self._synthesize_definition(
                keyword, self.knowledge_base[keyword]["raw_snippets"]
            )
        
        return "\n".join(knowledge_update_log)

    def generate_response(self, user_input: str) -> str:
        keywords = self._analyze_input(user_input)
        response_parts = []
        new_knowledge_logs = []

        # Phase 1: Establish keyword connections and identify needs
        missing_keywords = []
        for i, keyword in enumerate(keywords):
            # Ensure primary storage structure exists (using new keys)
            if keyword not in self.knowledge_base:
                self.knowledge_base[keyword] = {"synthesized_definition": "", "sources": [], "related_concepts": [], "raw_snippets": []}
                
            if not self.knowledge_base[keyword].get("synthesized_definition"):
                missing_keywords.append(keyword)

            # Cross-reference existing keywords in the current input
            for j, other_keyword in enumerate(keywords):
                if i != j and other_keyword not in self.knowledge_base[keyword]["related_concepts"]:
                    self.knowledge_base[keyword]["related_concepts"].append(other_keyword)

        # Phase 2: Knowledge Acquisition (Expensive Operation)
        for keyword in missing_keywords:
            logging.info(f"Acquiring knowledge for new keyword: {keyword}")
            search_results = self.search_google(keyword)
            if search_results:
                new_knowledge_logs.append(f"Found search results for '{keyword}'.")
                log_updates = self._update_knowledge_from_search(keyword, search_results)
                new_knowledge_logs.extend(log_updates.split('\n'))
            else:
                new_knowledge_logs.append(f"Could not find external information for '{keyword}'.")

        # Phase 3: Response Generation
        if "define" in user_input.lower() or "what is" in user_input.lower():
            for keyword in keywords:
                knowledge_entry = self.knowledge_base.get(keyword, {})
                definition = knowledge_entry.get("synthesized_definition")
                sources_count = len(knowledge_entry.get("sources", []))

                if definition and definition.startswith("[Synthesized Definition") or definition.startswith("[Definition Stub"):
                    response_parts.append(definition)
                elif sources_count > 0:
                    response_parts.append(f"I have acquired source links but not yet synthesized a definition for {keyword}.")
                else:
                    response_parts.append(f"I am still searching for core knowledge for {keyword}.")

        elif "related to" in user_input.lower() or "similar to" in user_input.lower():
            for keyword in keywords:
                related = self.knowledge_base.get(keyword, {}).get("related_concepts", [])
                if related:
                    response_parts.append(f"Concepts linked to {keyword}: {', '.join(related[:5])}.")
                else:
                    response_parts.append(f"I currently know no linked concepts for {keyword}.")

        # Default case: summarize new acquisition or default response
        if not response_parts:
            if new_knowledge_logs:
                response_parts.append("New knowledge acquisition complete:")
                # Only show top 3 acquisition logs to keep the response clean
                response_parts.extend([log for log in new_knowledge_logs if log.startswith('Found search results') or log.startswith('Acquired content')][:3])
            else:
                response_parts.append("Analysis complete, but no new information was needed or found. Try asking for a definition or related concepts.")

        final_response = "\n".join(response_parts)
        
        # Update context
        self.context.append({"input": user_input, "response": final_response})
        if len(self.context) > self.MAX_CONTEXT_HISTORY:
            self.context.pop(0)

        return final_response

def main():
    ai = AI()
    print("Sovereign AGI initialized. Ask me about concepts or definitions.")
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            response = ai.generate_response(user_input)
            print("AI:", response)
        except EOFError:
            break
        except KeyboardInterrupt:
            print("\nSession terminated.")
            break

if __name__ == "__main__":
    main()