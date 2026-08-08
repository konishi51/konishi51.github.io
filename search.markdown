---
layout: default
title: 検索
permalink: /search/
---

<div class="search-page" data-search-index="{{ "/search.json" | relative_url }}">
  <h1 class="page-heading">記事本文を検索</h1>

  <form class="site-search-form" action="{{ "/search/" | relative_url }}" method="get" role="search">
    <label for="search-query">検索語</label>
    <div class="site-search-controls">
      <input id="search-query" name="q" type="search" autocomplete="off" autofocus>
      <button type="submit">検索</button>
    </div>
  </form>

  <p class="search-help">タイトル、タグ、本文を検索します。空白で区切った語は、すべてを含む記事に絞り込みます。</p>
  <p class="search-status" role="status" aria-live="polite"></p>
  <ol class="search-results"></ol>
</div>

<script src="{{ "/assets/search.js" | relative_url }}" defer></script>
