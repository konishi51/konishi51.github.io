#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const {
  highlightRanges,
  rankedMatches,
  snippetFor,
  termsFor,
} = require(path.join(root, "assets", "search.js"));

const markedText = (text, terms) => highlightRanges(text, terms)
  .map(({ start, end }) => text.slice(start, end));

const torteTerms = termsFor("トルテ");
const torteContent = `${"前置き".repeat(30)}キルシュトルテが一番それに近い。`;
const torteSnippet = snippetFor(torteContent, torteTerms);

assert.ok(torteSnippet.startsWith("…"), "The regression fixture must produce a leading ellipsis.");
assert.deepEqual(markedText(torteSnippet, torteTerms), ["トルテ"]);

const compatibilityPrefixSnippet = snippetFor(
  `${"…".repeat(30)}キルシュトルテが一番それに近い。`,
  torteTerms,
);
assert.ok(compatibilityPrefixSnippet.includes("キルシュトルテ"));
assert.deepEqual(markedText(compatibilityPrefixSnippet, torteTerms), ["トルテ"]);

assert.deepEqual(markedText("番号１２３です。", termsFor("123")), ["１２３"]);
assert.deepEqual(markedText("Cafe\u0301です。", termsFor("é")), ["e\u0301"]);
assert.deepEqual(
  markedText("…番号１２３とキルシュトルテ。", termsFor("123 トルテ")),
  ["１２３", "トルテ"],
);

const posts = JSON.parse(fs.readFileSync(path.join(root, "_site", "search.json"), "utf8"));
const stableSearches = [
  ["トルテ", 1, ["マラガのケーキ屋"]],
  ["フェノール", 1, ["アンストッパブル"]],
  ["青い池", 1, ["美瑛・富良野3泊4日の旅"]],
  ["ロビン ウィリアムズ", 2, ["MIB3にロビン・ウィリアムズ？", "映画記事一覧"]],
];

stableSearches.forEach(([query, expectedCount, expectedTitles]) => {
  const matches = rankedMatches(posts, termsFor(query));
  assert.equal(matches.length, expectedCount, `Unexpected result count for ${query}`);
  assert.deepEqual(
    matches.map(({ post }) => post.title),
    expectedTitles,
    `Unexpected result order for ${query}`,
  );
});

console.log("PASS  Search highlight positions across NFKC normalization");
console.log("PASS  Search result counts and order unchanged");
