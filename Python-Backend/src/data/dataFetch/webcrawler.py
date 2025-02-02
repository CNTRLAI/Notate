import os
import json
import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import threading
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from queue import Queue, Empty
import threading


class WebCrawler:
    def __init__(self, base_url, user_id, user_name, collection_id, collection_name, max_workers, cancel_event=None):
        self.base_url = base_url
        self.output_dir = self._get_collection_path(
            user_id, user_name, collection_id, collection_name)
        self.visited_urls = set()
        self.failed_urls = set()
        self.delay = 0  # Reduced delay since we're rate limiting with max_workers
        self.max_workers = 35
        self.url_queue = Queue()
        self.url_lock = threading.Lock()
        self.progress_bar = None
        self.total_urls = 0
        self.current_urls = 0
        self.update_callback = None
        self.cancel_event = cancel_event

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_collection_path(self, user_id, user_name, collection_id, collection_name):
        """Generate the collection path matching the frontend structure"""
        app_data_path = os.path.abspath(os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".."
        ))
        return os.path.join(
            app_data_path,
            "..",
            "FileCollections",
            f"{user_id}_{user_name}",
            f"{collection_id}_{collection_name}"
        )

    def _print_progress(self):
        """Print progress as JSON"""
        if self.total_urls > 0:
            percent = (self.current_urls / self.total_urls) * 100
            progress_data = {
                "status": "progress",
                "data": {
                    "message": f"Part 1 of 2: Scraping page {self.current_urls} out of {self.total_urls} from {self.base_url}",
                    "chunk": self.current_urls,
                    "total_chunks": self.total_urls,
                    "percent_complete": f"{percent:.1f}%"
                }
            }
            json_str = json.dumps(progress_data)
            print(f"data: {json_str}")
            return progress_data

    def is_valid_url(self, url):
        """Check if URL belongs to the same domain and is a documentation page"""
        # Remove fragment identifier (#) and anything that follows
        url = url.split('#')[0]
        if not url:  # Skip empty URLs after fragment removal
            return False

        # First check if URL starts with base_url
        if not url.startswith(self.base_url):
            logging.debug(f"Filtered URL (not starting with base URL): {url}")
            return False

        # Remove trailing slashes for consistency
        url = url.rstrip('/')

        # Skip obviously invalid URLs
        invalid_patterns = [
            '.pdf', '.zip', '.png', '.jpg',  # File extensions
            'github.com', 'twitter.com',      # External sites
            '/api/', '/examples/',            # Common non-doc paths
            '?', 'mailto:', 'javascript:'     # Special URLs
        ]

        if any(pattern in url for pattern in invalid_patterns):
            logging.debug(f"Filtered URL (invalid pattern): {url}")
            return False

        # Ensure not a resource file
        return not url.endswith(('js', 'css', 'json'))

    def save_page(self, url, html_content):
        """Save the HTML content to a file"""
        try:
            # Create base_url_docs directory
            parsed_base_url = urlparse(self.base_url)
            base_url_dir = parsed_base_url.netloc.replace(".", "_") + "_docs"
            base_dir = os.path.join(self.output_dir, base_url_dir)
            os.makedirs(base_dir, exist_ok=True)

            # Create a file path based on the URL structure
            parsed_url = urlparse(url)
            path_parts = parsed_url.path.strip('/').split('/')

            # Create subdirectories if needed
            current_dir = base_dir
            for part in path_parts[:-1]:
                current_dir = os.path.join(current_dir, part)
                os.makedirs(current_dir, exist_ok=True)

            # Save the file
            filename = path_parts[-1] if path_parts else 'index'
            filepath = os.path.join(current_dir, f"{filename}.html")

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)

            return True

        except Exception as e:
            logging.error(f"Error saving {url}: {str(e)}")
            return False

    def get_links(self, soup, current_url):
        """Extract valid documentation links from the page"""
        links = set()
        for a in soup.find_all('a', href=True):
            # Get the full URL
            url = urljoin(current_url, a['href'])

            # Remove fragment identifier (#) and anything that follows
            url = url.split('#')[0]

            # Skip empty URLs after fragment removal
            if not url:
                continue

            # Remove trailing slashes for consistency
            url = url.rstrip('/')

            # Only add if it's valid and not already visited
            if self.is_valid_url(url) and url not in self.visited_urls:
                links.add(url)

        return links

    def scrape_page(self, url):
        """Scrape a single page and return its content and links"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            html_content = response.text

            # Create BeautifulSoup object with the response text
            soup = BeautifulSoup(html_content, 'html.parser')

            # Remove unwanted elements before getting links
            for element in soup.find_all(['header', 'footer', 'nav', 'script', 'style', 'meta']):
                if element is not None:
                    element.decompose()

            # Get links from the cleaned soup
            links = self.get_links(soup, url)

            return soup, links

        except Exception as e:
            error_data = {
                "status": "error",
                "data": {
                    "message": str(e)
                }
            }
            print(f"data: {json.dumps(error_data)}")
            logging.error(f"Error scraping {url}: {str(e)}")
            self.failed_urls.add(url)
            return None, set()

    def scrape(self):
        """Main scraping method using thread pool"""
        # Initialize with start URL
        self.url_queue.put(self.base_url)
        self.total_urls = 1  # Initialize with 1 for the base URL
        self.current_urls = 0

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            active_tasks = set()

            while True:
                try:
                    # Check for cancellation
                    if self.cancel_event and self.cancel_event.is_set():
                        break

                    # Get next URL with timeout
                    try:
                        current_url = self.url_queue.get(timeout=5)
                    except Empty:
                        # If no active tasks and queue is empty, we're done
                        if not active_tasks:
                            break
                        continue

                    if current_url in self.visited_urls:
                        continue

                    with self.url_lock:
                        if current_url in self.visited_urls:
                            continue
                        self.visited_urls.add(current_url)
                        yield self._print_progress()

                    # Submit the scraping task to thread pool
                    future = executor.submit(self._process_url, current_url)
                    active_tasks.add(future)
                    future.add_done_callback(lambda f: active_tasks.remove(f))
                    future.add_done_callback(self._update_progress)

                except Exception as e:
                    error_data = {
                        "status": "error",
                        "data": {
                            "message": str(e)
                        }
                    }
                    print(f"data: {json.dumps(error_data)}")
                    logging.error(f"Error in scrape loop: {str(e)}")
                    continue

            # Wait for remaining tasks to complete
            for future in concurrent.futures.as_completed(list(active_tasks)):
                try:
                    future.result()
                except Exception as e:
                    error_data = {
                        "status": "error",
                        "data": {
                            "message": str(e)
                        }
                    }
                    print(f"data: {json.dumps(error_data)}")
                    logging.error(f"Error in remaining tasks: {str(e)}")

    def _update_progress(self, future):
        """Callback to update progress"""
        try:
            with self.url_lock:
                self.current_urls += 1
                progress_data = self._print_progress()
                if progress_data:
                    json_str = json.dumps(progress_data)
                    print(f"data: {json_str}")
        except Exception as e:
            error_data = {
                "status": "error",
                "data": {
                    "message": str(e)
                }
            }
            print(f"data: {json.dumps(error_data)}")

    def _process_url(self, url):
        """Process a single URL - called by thread pool"""
        try:
            # Check for cancellation
            if self.cancel_event and self.cancel_event.is_set():
                return

            # Respectful delay
            time.sleep(self.delay)

            # Scrape the page
            soup, new_links = self.scrape_page(url)
            if soup is None:
                return

            # Save the page
            if self.save_page(url, str(soup)):
                # Add new links to queue
                with self.url_lock:
                    for link in new_links:
                        if link not in self.visited_urls and link not in self.url_queue.queue:
                            self.url_queue.put(link)
                            self.total_urls += 1
        except Exception as e:
            error_data = {
                "status": "error",
                "data": {
                    "message": str(e)
                }
            }
            print(f"data: {json.dumps(error_data)}")
            logging.error(f"Error processing URL {url}: {str(e)}")

    def save_progress(self):
        """Save progress information"""
        with open('scraping_progress.txt', 'w') as f:
            f.write(f"Visited URLs: {len(self.visited_urls)}\n")
            f.write(f"Failed URLs: {len(self.failed_urls)}\n")
            f.write("\nFailed URLs:\n")
            for url in self.failed_urls:
                f.write(f"{url}\n")
