(() => {
  "use strict";

  const page = document.querySelector(".search-page");
  if (!page) return;

  const form = page.querySelector("form");
  const input = page.querySelector("#search-query");
  const status = page.querySelector(".search-status");
  const results = page.querySelector(".search-results");
  const indexUrl = page.dataset.searchIndex;
  const maxResults = 100;

  const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase();

  const termsFor = (query) => {
    const seen = new Set();
    return normalize(query)
      .trim()
      .split(/\s+/u)
      .filter((term) => term && !seen.has(term) && seen.add(term));
  };

  const countOccurrences = (text, term) => {
    let count = 0;
    let start = 0;
    while ((start = text.indexOf(term, start)) !== -1) {
      count += 1;
      start += term.length;
    }
    return count;
  };

  const scorePost = (post, terms) => {
    const title = normalize(post.title);
    const tags = normalize((post.tags || []).join(" "));
    const content = normalize(post.content);
    const searchable = `${title} ${tags} ${content}`;

    if (!terms.every((term) => searchable.includes(term))) return -1;

    return terms.reduce((score, term) => {
      if (title === term) score += 100;
      if (title.includes(term)) score += 30;
      if (tags.includes(term)) score += 10;
      return score + Math.min(countOccurrences(content, term), 10);
    }, 0);
  };

  const snippetFor = (content, terms) => {
    const text = String(content || "");
    const normalized = normalize(text);
    let position = -1;

    terms.forEach((term) => {
      const found = normalized.indexOf(term);
      if (found !== -1 && (position === -1 || found < position)) position = found;
    });

    if (position === -1) position = 0;
    const start = Math.max(0, position - 55);
    const end = Math.min(text.length, position + 145);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  };

  const appendHighlighted = (element, text, terms) => {
    const normalized = normalize(text);
    let cursor = 0;

    while (cursor < text.length) {
      let matchStart = -1;
      let matchTerm = "";

      terms.forEach((term) => {
        const found = normalized.indexOf(term, cursor);
        if (found !== -1 && (matchStart === -1 || found < matchStart)) {
          matchStart = found;
          matchTerm = term;
        }
      });

      if (matchStart === -1) {
        element.append(document.createTextNode(text.slice(cursor)));
        break;
      }

      element.append(document.createTextNode(text.slice(cursor, matchStart)));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(matchStart, matchStart + matchTerm.length);
      element.append(mark);
      cursor = matchStart + matchTerm.length;
    }
  };

  const render = (posts, query) => {
    const terms = termsFor(query);
    results.replaceChildren();

    if (!terms.length) {
      status.textContent = "検索語を入力してください。";
      return;
    }

    const matches = posts
      .map((post) => ({ post, score: scorePost(post, terms) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score || String(b.post.date).localeCompare(String(a.post.date)));

    const shown = matches.slice(0, maxResults);
    status.textContent = matches.length > maxResults
      ? `${matches.length}件見つかりました。上位${maxResults}件を表示します。`
      : `${matches.length}件見つかりました。`;

    shown.forEach(({ post }) => {
      const item = document.createElement("li");
      item.className = "search-result";

      const heading = document.createElement("h2");
      const link = document.createElement("a");
      link.href = post.url;
      link.textContent = post.title;
      heading.append(link);

      const meta = document.createElement("div");
      meta.className = "search-result-meta";
      meta.textContent = post.date;

      const snippet = document.createElement("p");
      snippet.className = "search-result-snippet";
      appendHighlighted(snippet, snippetFor(post.content, terms), terms);

      item.append(heading, meta, snippet);
      results.append(item);
    });
  };

  const query = new URLSearchParams(window.location.search).get("q") || "";
  input.value = query;

  if (!query.trim()) {
    status.textContent = "検索語を入力してください。";
    return;
  }

  status.textContent = "検索データを読み込んでいます…";
  fetch(indexUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((posts) => render(posts, query))
    .catch(() => {
      status.textContent = "検索データを読み込めませんでした。時間をおいて、もう一度お試しください。";
    });

  form.addEventListener("submit", () => {
    input.value = input.value.trim();
  });
})();
