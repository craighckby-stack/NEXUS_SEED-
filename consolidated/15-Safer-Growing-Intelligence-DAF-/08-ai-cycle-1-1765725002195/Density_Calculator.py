"""
Information Density Calculator - Calculates information density for emergence triggering
"""

import math
from datetime import datetime

class InformationDensityCalculator:
    """Calculates information density for emergence triggering"""
    
    def __init__(self):
        self.history = []
        self.current_density = 0
        
    def calculate_shannon_entropy(self, text):
        """Calculate Shannon entropy of text"""
        if not text or len(text) == 0:
            return 0
            
        freq = {}
        for char in text:
            freq[char] = freq.get(char, 0) + 1
            
        entropy = 0
        length = len(text)
        
        for count in freq.values():
            p = count / length
            entropy -= p * math.log2(p)
            
        return entropy / 8  # Normalize to 0-1 range
    
    def update_density(self, response_text):
        """Update density based on new information"""
        entropy = self.calculate_shannon_entropy(response_text)
        
        # Factors influencing density
        length_factor = min(1.0, len(response_text) / 1000)
        uniqueness_factor = self._calculate_uniqueness(response_text)
        
        # Weighted density increase
        density_increase = (entropy * 0.4 + 
                          length_factor * 0.3 + 
                          uniqueness_factor * 0.3) * 10
        
        self.current_density = min(100, self.current_density + density_increase)
        
        # Natural decay over time
        self.current_density = max(0, self.current_density - 0.1)
        
        self.history.append({
            'density': self.current_density,
            'entropy': entropy,
            'timestamp': datetime.now().isoformat()
        })
        
        return self.current_density
    
    def _calculate_uniqueness(self, text):
        """Calculate how unique this text is compared to history"""
        if len(self.history) < 5:
            return 0.5
            
        # Simple uniqueness check
        recent_texts = [h.get('sample', '') for h in self.history[-5:]]
        word_set = set(text.lower().split())
        
        uniqueness = 1.0
        for recent in recent_texts:
            recent_words = set(recent.lower().split())
            overlap = len(word_set & recent_words) / max(len(word_set), 1)
            uniqueness *= (1 - overlap * 0.2)
            
        return uniqueness
