---
title: Image Gallery
layout: default
jquery: true
---

<div class="card">
<h1>{{page.title}}</h1>
</div>

{% for category in site.data.img_gallery %}

<div class="card indexing" id="expand-{{category.name | replace: ' ', '-'}}">
    <h2>{{category.name}}</h2>
    <p>++ click to view ++</p>
</div>

{% for city in category.collections %}
<div class="onexpand-{{category.name | replace: ' ', '-'}} sub-container">
    <div class="sub-left">
        <div class="card">
            <h3>{{city.name}}</h3>
        </div>
    </div>
    <div class="sub-right">
        {% for image in city.images %}
        <div class="card">
            <img src="{{image.url}}" />
            {% if image.location %}
            <p class="note">{{image.location}}</p>
            {% endif %}
            {% if image.taken_by %}
            <p class="note">Taken by {{image.taken_by}}</p>
            {% endif %}
            {% if image.description %}
            <p class="note">{{image.description}}</p>
            {% endif %}
        </div>
        {% endfor %}
    </div>
</div>
{% endfor %}

{% endfor %}

<script>
$(document).ready(function() {
    {% for category in site.data.img_gallery %}
    $(".onexpand-{{category.name | replace: ' ', '-'}}").hide();
    $("#expand-{{category.name | replace: ' ', '-'}}").click(function() {
        $(".onexpand-{{category.name | replace: ' ', '-'}}").slideToggle('slow');
    });
    {% endfor %}
});
</script>

<style>
.card {
    overflow-y: hidden;
}
.card img {
    text-align: center;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
}
p.note {
    text-align: center;
    font-size: 12px;
    color: #444;
}
div.sub-container {
    display: flex;
    flex-direction: row;
}
div.sub-left {
    width: 20%;
    margin: 0;
    display: flex;
    flex-direction: column;
}
div.sub-right {
    width: 80%;
    margin: 0;
    display: flex;
    flex-direction: column;
}
</style>