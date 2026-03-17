def add_topic_to_links(topic):
    global all_links
    all_links[topic] = []

    add_topic_button.on_click(get_search_url)


def get_search_url(b):
    search_term = topic_input.value
    if not search_term:
        print('No topic found!')
        return

    url = f'https://example.com?{search_term}"
    all_links[topic_input.value] = []


def display_links():
    global all_links
    if all_links:
        html_output = '<h2>Collected SH for topics:</h2>'
        for topic, hashes in all_links.items():
            html_output += f'<h3>{topic}</h3>'
            for sha_hash in hashes:
                url = get_url_for_hash(sha_hash)
                html_output += f'<p><a href='{url}' target='_blank'>{sha_hash}</a></p>'
                if not url:
                    continue 
            html_output += '<hr>'
        display(HTML(html_output))
    else:
        print('No SHA-256 hashes found')

def copy_all_links_to_clipboard():
    global all_links
    all_hashes_list = [hash for topic, hashes in all_links.items() for hash in hashes]
    if all_hashes_list:
        pyperclip.copy(all_hashes_list)
        print('All SHA-256 hashes copied to clipboard.')
    else:
        print('No SHA-256 hashes to copy.')

def get_url_for_hash(sha_hash):
    if SEARCH_ENGINE == 'go':
        # Simplify the logic and assume this function works as intended
        return f'https://example.com/{sha_hash}'
    return ''