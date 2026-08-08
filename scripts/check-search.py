#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "_site" / "search.json"


def normalize(value):
    return str(value or "").casefold()


def matches(post, query):
    terms = normalize(query).split()
    searchable = " ".join(
        [normalize(post["title"]), normalize(" ".join(post["tags"])), normalize(post["content"])]
    )
    return all(term in searchable for term in terms)


def main():
    posts = json.loads(INDEX.read_text(encoding="utf-8"))
    source_count = len(list((ROOT / "_posts").glob("*.md")))

    if len(posts) != source_count:
        raise SystemExit(f"ERROR Search index has {len(posts)} records; expected {source_count}.")

    required = {"title", "date", "url", "tags", "content"}
    for number, post in enumerate(posts, start=1):
        missing = required - post.keys()
        if missing:
            raise SystemExit(f"ERROR Search record {number} lacks: {', '.join(sorted(missing))}")

    cases = {
        "フェノール": "アンストッパブル",
        "青い池": "美瑛・富良野3泊4日の旅",
        "ロビン ウィリアムズ": "MIB3にロビン・ウィリアムズ？",
    }
    for query, expected_title in cases.items():
        titles = [post["title"] for post in posts if matches(post, query)]
        if not any(expected_title in title for title in titles):
            raise SystemExit(f"ERROR Search for {query!r} did not find {expected_title!r}.")

    search_page = (ROOT / "_site" / "search" / "index.html").read_text(encoding="utf-8")
    home_page = (ROOT / "_site" / "index.html").read_text(encoding="utf-8")
    if 'data-search-index="/search.json"' not in search_page or '/assets/search.js' not in search_page:
        raise SystemExit("ERROR Generated search page lacks its index or script reference.")
    if 'action="/search/"' not in home_page or 'name="q"' not in home_page:
        raise SystemExit("ERROR Generated home page lacks the search form.")

    print(f"PASS  Search index: {len(posts)} records")
    print("PASS  Known Japanese and multiword searches")
    print("PASS  Generated search page and home form")


if __name__ == "__main__":
    main()
