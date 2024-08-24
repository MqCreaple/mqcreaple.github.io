---
title: blog
layout: default
no_output: true
lang: zh
---

<div class="card" style="background-color: rgba(216, 237, 29, 0.7); color: #efefef;">
    <h1>博客索引</h1>
</div>

{% for post in site.categories.blog-zh %}
<div class="card indexing" onclick="window.open('{{post.url}}')">
    <h2>{{post.title}}</h2>
    <div class="inline">
        <p style="margin: 0 5px;"><i class="fa-solid fa-calendar-alt"></i>{{post.date | date_to_string: "ordinal"}}</p>
        <p style="margin: 0 5px;"><i class="fa-solid fa-tag"></i>{{post.tags | join: ' '}}</p>
    </div>
</div>
{% endfor %}