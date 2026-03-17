import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
from urllib.robotparser import RobotFileParser

def analyze_robots_txt(base_url):
    """Analyzes the robots.txt file for a given base URL."""
    try:
        rp = RobotFileParser()
        rp.set_url(f"{base_url}/robots.txt")
        rp.read()
        
        print(f"\n---   robots.txt   analysis   for   {base_url}   ---")
        print(f"   Checking   for   disallowed   paths   (using   can_fetch):")
        
        if not rp.can_fetch("*", f"{base_url}/admin/"):
            print("   /admin/   is   disallowed")
        else:
            print("   /admin/   is   allowed   (or   robots.txt   doesn't   say)")
            
        if not rp.can_fetch("*", f"{base_url}/search"):
            print("   /search   is   disallowed")
        else:
            print("   /search   is   allowed   (or   robots.txt   doesn't   say)")
            
        sitemap_urls = rp.site_maps()
        if sitemap_urls:
            print(f"   Sitemap   URLs:   {sitemap_urls}")
        else:
            print("   No   Sitemap   URLs   found   in   robots.txt.")
            
    except Exception as e:
        print(f"Error   analyzing   robots.txt   for   {base_url}:   {e}")
        return []

def extract_urls_from_sitemap(sitemap_url):
    """Extracts URLs from an XML sitemap."""
    try:
        response = requests.get(sitemap_url, timeout=10)
        response.raise_for_status()  
        root = ET.fromstring(response.content)
        urls = []
        
        if 'sitemapindex' in root.tag:
            for sitemap in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}sitemap'):
                loc_element = sitemap.find('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                if loc_element is not None:
                    urls.extend(extract_urls_from_sitemap(loc_element.text))
        else:  
            for url in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url'):
                loc_element = url.find('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                if loc_element is not None:
                    urls.append(loc_element.text)
        return urls
        
    except requests.exceptions.RequestException as e:
        print(f"Error extracting URLs from sitemap: {sitemap_url}")
        return []

def main():
    base_url = "https://example.com"
    analyze_robots_txt(base_url)
    sitemap_url = "https://example.com/sitemap.xml"
    urls = extract_urls_from_sitemap(sitemap_url)
    print(f"Extracted URLs: {urls}")

if __name__ == "__main__":
    main()