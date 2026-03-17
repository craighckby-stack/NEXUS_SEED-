import ipywidgets as widgets
from IPython.display import display, HTML
import requests
from bs4 import BeautifulSoup
import urllib.parse
import json
import pyperclip
import time
import random
import concurrent.futures # Changed from multiprocessing
import logging
import hashlib
from typing import List, Dict, Set

# Configure logging
logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration
SEARCH_ENGINE = "google"
NUM_RESULTS = 5 # Number of initial SERP links to follow
MAX_PROCESSES = 5 # Max workers for concurrent scraping
TIMEOUT = 10
MAX_DEEP_DIVE_DEPTH = 2 # Maximum depth for following internal links

class ResourceScraper:
    def __init__(self):
        self.topic_input = widgets.Text(value='', placeholder="Enter a topic")
        self.add_topic_button = widgets.Button(description='Add Topic & Search', icon='search')
        self.scrape_button = widgets.Button(description='Scrape Learning Resources (Parallel)', icon='rocket')
        self.clear_all_button = widgets.Button(description='Clear All Topics and Hashes', icon='trash')
        self.copy_all_button = widgets.Button(description='Copy All URLs', icon='copy')
        self.output = widgets.Output()

        self.add_topic_button.on_click(self.add_topic_clicked)
        self.scrape_button.on_click(self.scrape_all_clicked)
        self.clear_all_button.on_click(self.clear_all_clicked)
        self.copy_all_button.on_click(self.copy_all_clicked)

        display(self.topic_input)
        display(self.add_topic_button)
        display(self.scrape_button)
        display(self.clear_all_button)
        display(self.copy_all_button)
        display(self.output)

        self.initial_topics = []
        self.results: List[Dict] = []

    def add_topic_clicked(self, b):
        """Add a topic and search for resources"""
        topic = self.topic_input.value.strip()
        if topic:
            with self.output:
                print(f"[Queue] Adding topic: {topic}")
            self.initial_topics.append(topic)
            self.topic_input.value = ''
        else:
            with self.output:
                print("Please enter a topic.")

    def scrape_all_clicked(self, b):
        """Scrape learning resources for all topics"""
        if self.initial_topics:
            self.scrape_learning_resources(self.initial_topics)
        else:
            with self.output:
                print("No topics to scrape.")

    def clear_all_clicked(self, b):
        """Clear all topics and results"""
        self.topic_input.value = ''
        self.output.clear_output(wait=True)
        self.initial_topics = []
        self.results = []
        with self.output:
            print("All topics and results cleared")

    def copy_all_clicked(self, b):
        """Copy all URLs to clipboard"""
        if self.results:
            urls = [result['url'] for result in self.results]
            # Attempt to use pyperclip, handle potential ClipboardNotDefined errors
            try:
                pyperclip.copy('\n'.join(urls))
                with self.output:
                    print(f"Successfully copied {len(urls)} URLs to clipboard")
            except pyperclip.PyperclipException:
                 with self.output:
                    print("Warning: Could not access system clipboard. URLs printed below:")
                    print('\n'.join(urls))
        else:
            with self.output:
                print("No URLs to copy.")

    def _get_google_serp_links(self, topic: str) -> List[str]:
        """Simulates extracting primary organic search result links from a Google SERP."""
        search_term = urllib.parse.quote_plus(f'{topic} learning resource tutorial')
        search_url = f"https://www.google.com/search?q={search_term}"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        try:
            response = requests.get(search_url, headers=headers, timeout=TIMEOUT)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            extracted_urls = []
            
            # Look for standard Google result link patterns
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                if href.startswith('/url?q='):
                    parsed_q = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get('q', [])
                    if parsed_q:
                        clean_url = parsed_q[0]
                        if clean_url.startswith('http'):
                            extracted_urls.append(clean_url)
            
            return extracted_urls[:NUM_RESULTS]

        except requests.exceptions.RequestException as e:
            logging.warning(f"SERP fetch failed for {topic}: {e}")
            return []
        except Exception as e:
            logging.error(f"Unexpected error fetching SERP for {topic}: {e}")
            return []

    def _deep_dive_scrape(self, url: str, topic: str, current_depth: int, seen_hashes: Set[str]) -> List[Dict]:
        """Recursively fetches links from a given URL up to MAX_DEEP_DIVE_DEPTH, ensuring deduplication."""
        results = []
        
        url_hash = hashlib.sha256(url.encode()).hexdigest()
        
        # Strict check for cycles/duplication
        if url_hash in seen_hashes:
            return results
            
        seen_hashes.add(url_hash)
        
        # Throttle to be polite and avoid rate limits
        time.sleep(random.uniform(0.5, 1.0))

        try:
            response = requests.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            
            # Add the current URL as a primary result
            results.append({
                'topic': topic,
                'url': url,
                'hash': url_hash,
                'depth': current_depth
            })
            
            # Stop recursion if depth limit hit
            if current_depth >= MAX_DEEP_DIVE_DEPTH:
                return results

            soup = BeautifulSoup(response.content, 'html.parser')
            base_url = urllib.parse.urlparse(url)
                
            for link in soup.find_all('a', href=True):
                href = link['href']
                next_url = urllib.parse.urljoin(url, href)
                    
                if next_url.startswith('http') and next_url != url:
                    next_url_hash = hashlib.sha256(next_url.encode()).hexdigest()
                        
                    if next_url_hash not in seen_hashes:
                        # Recursive call (must manage thread safety if this were parallelized; currently sequential per topic link)
                        results.extend(
                            self._deep_dive_scrape(next_url, topic, current_depth + 1, seen_hashes)
                        )
                        # Early exit for resource control
                        if len(results) > NUM_RESULTS * 10:
                            break
                            
        except requests.exceptions.RequestException as e:
            logging.debug(f"[D{current_depth}] Skipping URL {url[:60]}: {e}")

        return results


    def _process_topic(self, topic: str, global_seen_hashes: Set[str]) -> List[Dict]:
        """Worker function to process a single topic using parallel deep diving."""
        
        with self.output:
            self.output.append_display(HTML(f'<p style="color: #007bff;">Searching initial results for: <b>{topic}</b></p>'))

        initial_urls = self._get_google_serp_links(topic)
        topic_results = []

        if not initial_urls:
            with self.output:
                self.output.append_display(HTML(f'<p style="color: orange;">No initial SERP links found for {topic}.</p>'))
            return []

        # Use ThreadPoolExecutor to handle concurrent deep dives for the initial links found
        # Note: We pass the global_seen_hashes set, relying on Python's Set thread safety for simple existence checks
        # If strict consistency across threads were paramount, a Manager or lock would be required.
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_PROCESSES) as executor_dive:
            
            future_to_url = {
                executor_dive.submit(self._deep_dive_scrape, url, topic, 1, global_seen_hashes): url 
                for url in initial_urls
            }
            
            for future in concurrent.futures.as_completed(future_to_url):
                try:
                    results = future.result()
                    topic_results.extend(results)
                except Exception as exc:
                    logging.error(f"Deep dive failed for a URL in topic {topic}: {exc}")
        
        return topic_results

    def scrape_learning_resources(self, topics):
        """Scrape learning resources for given topics using parallel execution and deep dive."""
        
        self.output.clear_output(wait=True)
        self.results = []
        global_seen_hashes: Set[str] = set()
        
        with self.output:
            print("\n" + "*"*60)
            print(f"Starting Parallel AGI Scrape (Topics: {len(topics)}, Depth: {MAX_DEEP_DIVE_DEPTH}, Workers: {MAX_PROCESSES})...")
            print("*"*60 + "\n")

            # Execute topic processing in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_PROCESSES) as executor_topic:
                
                future_to_topic = {
                    executor_topic.submit(self._process_topic, topic, global_seen_hashes): topic
                    for topic in topics
                }

                for future in concurrent.futures.as_completed(future_to_topic):
                    topic = future_to_topic[future]
                    try:
                        topic_results = future.result()
                        self.results.extend(topic_results)
                        with self.output:
                            print(f"[Completed] {topic}: Found {len(topic_results)} candidate links.")
                    except Exception as exc:
                        with self.output:
                            print(f"[Error] Topic {topic} failed execution: {exc}")

            # Final Deduplication and Display
            final_results_dict = {}
            for result in self.results:
                # Prioritize lower depth results if hashes collide, though hash collisions should be impossible here.
                final_results_dict[result['hash']] = result
                
            self.results = sorted(list(final_results_dict.values()), key=lambda x: (x['topic'], x['depth']))
            
            print("\n" + "="*60)
            print(f"Scraping completed. Total unique resources identified: {len(self.results)}")
            print("="*60)

            # Display results formatted nicely
            html_output = ["<h3>AGI Scrape Results (Unique Resources):</h3>"]
            html_output.append("<ul>")
            
            current_topic = ""
            for result in self.results:
                if result['topic'] != current_topic:
                    if current_topic != "":
                        html_output.append("<hr>")
                    html_output.append(f"<h4>Topic: {result['topic']}</h4>")
                    current_topic = result['topic']
                    
                html_output.append(f"<li>[D{result.get('depth', '?')}] <a href='{result['url']}' target='_blank'>{result['url']}</a></li>")
            html_output.append("</ul>")
            
            self.output.append_display(HTML("".join(html_output)))

# Removed unnecessary main() loop as widgets are event driven
