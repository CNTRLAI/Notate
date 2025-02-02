import os


def get_html_files(directory):
    """Recursively get all HTML files in a directory and its subdirectories"""
    html_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                html_files.append(file_path)
    return html_files
