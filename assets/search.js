(() => {
  "use strict";

  const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase();

  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

  const segmentsFor = (text) => {
    if (segmenter) return Array.from(segmenter.segment(text));

    const segments = [];
    let index = 0;
    for (const segment of text) {
      segments.push({ segment, index });
      index += segment.length;
    }
    return segments;
  };

  const normalizedWithMap = (value) => {
    const text = String(value || "");
    const sourceStarts = [];
    const sourceEnds = [];
    let normalized = "";

    segmentsFor(text).forEach(({ segment, index }) => {
      const normalizedSegment = normalize(segment);
      normalized += normalizedSegment;
      for (let offset = 0; offset < normalizedSegment.length; offset += 1) {
        sourceStarts.push(index);
        sourceEnds.push(index + segment.length);
      }
    });

    return { text, normalized, sourceStarts, sourceEnds };
  };

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

  const rankedMatches = (posts, terms) => posts
    .map((post) => ({ post, score: scorePost(post, terms) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || String(b.post.date).localeCompare(String(a.post.date)));

  const snippetFor = (content, terms) => {
    const text = String(content || "");
    const mapped = normalizedWithMap(text);
    let position = -1;

    terms.forEach((term) => {
      const found = mapped.normalized.indexOf(term);
      if (found !== -1 && (position === -1 || found < position)) position = found;
    });

    const sourcePosition = position === -1 ? 0 : mapped.sourceStarts[position];
    const start = Math.max(0, sourcePosition - 55);
    const end = Math.min(text.length, sourcePosition + 145);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  };

  const highlightRanges = (text, terms) => {
    const mapped = normalizedWithMap(text);
    const ranges = [];
    let normalizedCursor = 0;
    let sourceCursor = 0;

    while (normalizedCursor < mapped.normalized.length) {
      let matchStart = -1;
      let matchTerm = "";

      terms.forEach((term) => {
        const found = mapped.normalized.indexOf(term, normalizedCursor);
        if (found !== -1 && (matchStart === -1 || found < matchStart)) {
          matchStart = found;
          matchTerm = term;
        }
      });

      if (matchStart === -1) break;

      const normalizedEnd = matchStart + matchTerm.length;
      const sourceStart = mapped.sourceStarts[matchStart];
      const sourceEnd = Math.max(...mapped.sourceEnds.slice(matchStart, normalizedEnd));

      normalizedCursor = normalizedEnd;
      while (
        normalizedCursor < mapped.sourceStarts.length
        && mapped.sourceStarts[normalizedCursor] < sourceEnd
      ) normalizedCursor += 1;

      if (sourceStart < sourceCursor) continue;
      ranges.push({ start: sourceStart, end: sourceEnd });
      sourceCursor = sourceEnd;
    }

    return ranges;
  };

  const appendHighlighted = (element, text, terms) => {
    let cursor = 0;

    highlightRanges(text, terms).forEach(({ start, end }) => {
      element.append(document.createTextNode(text.slice(cursor, start)));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, end);
      element.append(mark);
      cursor = end;
    });

    element.append(document.createTextNode(text.slice(cursor)));
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { highlightRanges, normalize, normalizedWithMap, rankedMatches, snippetFor, termsFor };
  }

  if (typeof document === "undefined") return;

  const page = document.querySelector(".search-page");
  if (!page) return;

  const form = page.querySelector("form");
  const input = page.querySelector("#search-query");
  const status = page.querySelector(".search-status");
  const results = page.querySelector(".search-results");
  const indexUrl = page.dataset.searchIndex;
  const maxResults = 100;

  const render = (posts, query) => {
    const terms = termsFor(query);
    results.replaceChildren();

    if (!terms.length) {
      status.textContent = "検索語を入力してください。";
      return;
    }

    const matches = rankedMatches(posts, terms);

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
