import os
import sys
from searchmind import SearchMindClient

def main():
    api_key = os.environ.get("SEARCHMIND_API_KEY")
    if not api_key:
        print("Error: Please set the SEARCHMIND_API_KEY environment variable.")
        sys.exit(1)

    print("Initializing SearchMindClient...")
    client = SearchMindClient(api_key=api_key)

    # 1. Search (Basic)
    query = "FastAPI async operations"
    print(f"\n--- Searching (Basic Depth): '{query}' ---")
    res = client.search(query, num_results=3, search_depth="basic")
    print(f"Synthesized Answer: {res.answer}")
    print("Top results:")
    for r in res.results:
        print(f"- {r.title} | Score: {r.score} | Url: {r.url}")

    # 2. Extract
    urls = ["https://fastapi.tiangolo.com/"]
    print(f"\n--- Extracting Content from: {urls} ---")
    ext = client.extract(urls, max_content_length=1000)
    print(f"Extracted pages: {ext.extracted_count} success, {ext.failed_count} failed")
    for page in ext.results:
        if page.success:
            print(f"- Title: {page.title}")
            print(f"  Content snippet: {page.content[:200]}...")
        else:
            print(f"- Error crawling {page.url}: {page.error}")

    # 3. Usage Stats
    print("\n--- Usage Stats ---")
    usage = client.get_usage()
    print(f"Period: {usage.period}")
    print(f"Requests: {usage.total_requests} / {usage.monthly_limit} ({usage.percentage_used}% used)")
    print(f"Remaining quota: {usage.remaining_requests} requests")

if __name__ == "__main__":
    main()
