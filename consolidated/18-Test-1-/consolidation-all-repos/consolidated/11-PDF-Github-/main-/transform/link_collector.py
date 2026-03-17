import logging
from typing import Dict, List, Set


def collect_links(topic: str, search_results: List[str], all_links: Dict[str, List[str]], logger: logging.Logger) -> None:
	"""Collects and deduplicates relevant link identifiers (SHA hashes) for a given topic, 
	updating the shared 'all_links' dictionary efficiently using set arithmetic.

	Args:
		topic (str): The topic to collect links for.
		search_results (List[str]): A list of incoming link identifiers (SHA hashes).
		all_links (Dict[str, List[str]]): A dictionary mapping topics to their collected links.
		logger (logging.Logger): A logger to log events.
	"""
	
	# 1. Retrieve existing links and calculate the set difference efficiently.
	existing_links = all_links.get(topic, [])
	
	existing_set: Set[str] = set(existing_links)
	incoming_set: Set[str] = set(search_results)
	
	# Calculate links present in incoming_set but NOT in existing_set
	# This automatically handles deduplication within search_results too.
	new_links_set = incoming_set - existing_set 
	
	unique_links: List[str] = list(new_links_set)

	
	if unique_links:
		# 2. Update the storage, ensuring the list is initialized if new topic
		current_list = all_links.setdefault(topic, [])
		current_list.extend(unique_links)
		
		logger.info(
			f"Collected {len(unique_links)} new link(s) for '{topic}'. "
			f"Total collected: {len(current_list)}"
		)
	else:
		logger.warning(
			f"No new links found for '{topic}' in the batch of {len(search_results)}. "
			f"Existing total: {len(existing_links)}"
		)