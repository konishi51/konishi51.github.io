#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const {
  filterState,
  matchesTag,
  selectedTagFor,
  urlForTag,
} = require(path.join(root, "assets", "tag-filter.js"));

const decodeAttribute = (value) => value
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&");

const fixture = [
  { tags: ["本", "PC"], year: "2026" },
  { tags: ["本"], year: "2025" },
  { tags: ["映画"], year: "2024" },
  { tags: [], year: "2023" },
];

assert.equal(matchesTag(["本", "PC"], "PC"), true);
assert.equal(matchesTag(["本", "PC"], "映画"), false);
assert.equal(matchesTag([], ""), true);
assert.equal(selectedTagFor("?tag=%E6%9C%AC", ["本", "PC"]), "本");
assert.equal(selectedTagFor("?tag=%E6%9C%AA%E7%9F%A5", ["本", "PC"]), "");

assert.deepEqual(filterState(fixture, "本").visible, [true, true, false, false]);
assert.deepEqual(Array.from(filterState(fixture, "本").years), ["2026", "2025"]);
assert.deepEqual(filterState(fixture, "").visible, [true, true, true, true]);

const taggedUrl = urlForTag("https://example.com/?q=検索#top", "世界街歩き");
assert.equal(taggedUrl.searchParams.get("tag"), "世界街歩き");
assert.equal(taggedUrl.searchParams.get("q"), "検索");
assert.equal(taggedUrl.hash, "#top");
assert.equal(urlForTag(taggedUrl.href, "").searchParams.has("tag"), false);

const home = fs.readFileSync(path.join(root, "_site", "index.html"), "utf8");
const searchPosition = home.indexOf("home-search-form");
const tagPosition = home.indexOf("data-tag-filter");
const yearPosition = home.indexOf("year-jump");
assert.ok(searchPosition !== -1 && searchPosition < tagPosition && tagPosition < yearPosition);
assert.ok(home.includes('/assets/tag-filter.js'));

const buttonTags = Array.from(home.matchAll(/<button[^>]+data-tag="([^"]*)"/gu))
  .map((match) => decodeAttribute(match[1]));
assert.equal(buttonTags[0], "");

const generatedPosts = Array.from(
  home.matchAll(/<li class="post-item" data-year="([^"]+)" data-tags="([^"]*)">/gu),
).map((match) => ({
  tags: JSON.parse(decodeAttribute(match[2]) || "null") || [],
  year: match[1],
}));

const generatedTags = Array.from(new Set(generatedPosts.flatMap((post) => post.tags))).sort();
assert.deepEqual(buttonTags.slice(1).sort(), generatedTags);
assert.ok(generatedPosts.some((post) => post.tags.length > 1));
assert.ok(generatedPosts.some((post) => post.tags.length === 0));

const tagWithFewestPosts = generatedTags
  .map((tag) => ({ tag, count: generatedPosts.filter((post) => post.tags.includes(tag)).length }))
  .sort((a, b) => a.count - b.count)[0].tag;
const allYears = filterState(generatedPosts, "").years;
const filteredYears = filterState(generatedPosts, tagWithFewestPosts).years;
assert.ok(filteredYears.size > 0 && filteredYears.size < allYears.size);

const yearHeadings = Array.from(home.matchAll(/class="post-year"[^>]+data-year="([^"]+)"/gu));
const yearLinks = Array.from(home.matchAll(/class="year-jump"[\s\S]*?<\/nav>/gu))[0][0]
  .matchAll(/data-year="([^"]+)"/gu);
assert.equal(yearHeadings.length, allYears.size);
assert.equal(Array.from(yearLinks).length, allYears.size);

const css = fs.readFileSync(path.join(root, "assets", "main.scss"), "utf8");
assert.match(css, /\.tag-filter-options\s*\{[^}]*flex-wrap:\s*wrap;/su);
assert.match(css, /@media screen and \(max-width:\s*480px\)/u);
assert.match(css, /\.year-jump a\[hidden\][\s\S]*display:\s*none;/u);
assert.match(css, /\.post-list > \.post-year\[hidden\][\s\S]*display:\s*none;/u);

console.log(`PASS  Tag controls: all + ${generatedTags.length} tags from site data`);
console.log("PASS  Single-tag, multiple-tag, reset, unknown-tag, and URL behavior");
console.log("PASS  Filtered year headings and year links");
console.log("PASS  Wrapping tag controls and mobile-width styles");
