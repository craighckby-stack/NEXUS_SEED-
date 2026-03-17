import matplotlib.pyplot as plt
from wordcloud import WordCloud, STOPWORDS


def generate_and_plot_wordcloud(text, title="Word Cloud Generated", width=1000, height=600):
    """
    Generates and plots a high-quality word cloud from the given text.
    
    Args:
        text (str): The input text to analyze.
        title (str): The title for the plot.
        width (int): Canvas width.
        height (int): Canvas height.
    """
    
    # 1. Initialize WordCloud object with robust parameters
    stopwords = set(STOPWORDS) # Utilize default stop words
    
    wc = WordCloud(
        width=width,
        height=height,
        background_color='white',
        max_words=150,
        stopwords=stopwords,
        colormap='cividis',
        min_font_size=10,
        scale=2 # Increase resolution slightly for better appearance
    )
    
    # 2. Generate the word cloud from the input text
    wc.generate(text)
    
    # 3. Plot the result using matplotlib
    plt.figure(figsize=(width / 100, height / 100), dpi=100) # Dynamic figure size based on wc size
    plt.imshow(wc, interpolation='bilinear') 
    
    # 4. Clean up the visualization
    plt.axis("off") 
    plt.title(title, fontsize=16)
    plt.tight_layout(pad=0)
    plt.show()


# --- Usage Example ---

# Sample data based on context
hallucinated_sample_text = (
    "Sovereign AGI v94.1 evolution codebase refactoring improve architecture. "
    "The system analyzes Python code structures, prioritizing efficiency "
    "and reliability. Key objectives include modularity, clean code, "
    "and automated enhancement. Task execution involves complex algorithmic "
    "decision-making processes. We focus on continuous iteration and robust "
    "testing protocols across the development lifecycle." 
    * 5 # Repeat text for better density
)

if __name__ == "__main__":
    generate_and_plot_wordcloud(
        hallucinated_sample_text,
        title="Sovereign AGI Codebase Evolution Priorities"
    )