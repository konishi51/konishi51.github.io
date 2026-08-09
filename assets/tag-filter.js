(() => {
  "use strict";

  const matchesTag = (tags, selectedTag) => !selectedTag || tags.includes(selectedTag);

  const selectedTagFor = (search, availableTags) => {
    const requestedTag = new URLSearchParams(search).get("tag") || "";
    return availableTags.includes(requestedTag) ? requestedTag : "";
  };

  const filterState = (posts, selectedTag) => {
    const visible = posts.map((post) => matchesTag(post.tags, selectedTag));
    const years = new Set(
      posts.filter((_post, index) => visible[index]).map((post) => post.year),
    );
    return { visible, years };
  };

  const urlForTag = (href, selectedTag) => {
    const url = new URL(href);
    if (selectedTag) url.searchParams.set("tag", selectedTag);
    else url.searchParams.delete("tag");
    return url;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { filterState, matchesTag, selectedTagFor, urlForTag };
  }

  if (typeof document === "undefined") return;

  const filter = document.querySelector("[data-tag-filter]");
  if (!filter) return;

  const buttons = Array.from(filter.querySelectorAll("[data-tag]"));
  const postElements = Array.from(document.querySelectorAll(".post-list > .post-item"));
  const yearHeadings = Array.from(document.querySelectorAll(".post-list > .post-year"));
  const yearLinks = Array.from(document.querySelectorAll(".year-jump [data-year]"));
  const availableTags = buttons.map((button) => button.dataset.tag).filter(Boolean);
  const posts = postElements.map((element) => {
    let tags = [];
    try {
      const parsed = JSON.parse(element.dataset.tags || "[]");
      if (Array.isArray(parsed)) tags = parsed;
    } catch (_error) {
      tags = [];
    }
    return { tags, year: element.dataset.year };
  });

  const render = (selectedTag) => {
    const state = filterState(posts, selectedTag);

    postElements.forEach((element, index) => {
      element.hidden = !state.visible[index];
    });
    yearHeadings.forEach((heading) => {
      heading.hidden = !state.years.has(heading.dataset.year);
    });
    yearLinks.forEach((link) => {
      link.hidden = !state.years.has(link.dataset.year);
    });
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tag === selectedTag));
    });
  };

  const requestedTag = new URLSearchParams(window.location.search).get("tag") || "";
  const initialTag = selectedTagFor(window.location.search, availableTags);
  render(initialTag);

  if (requestedTag && !initialTag) {
    window.history.replaceState(null, "", urlForTag(window.location.href, ""));
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTag = button.dataset.tag;
      render(selectedTag);
      window.history.pushState(null, "", urlForTag(window.location.href, selectedTag));
    });
  });

  window.addEventListener("popstate", () => {
    render(selectedTagFor(window.location.search, availableTags));
  });
})();
