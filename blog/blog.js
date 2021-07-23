$(document).ready(function() {
    $.get("template.html", function(template) {
        $.getJSON("blog.json", function(blogs) {
            $.each(blogs, function(i, blog) {
                var th = template.replace(/\{\%\s([\w-]+?)\s\%\}/g, function(m, key, s, txt) {
                    return blog[key];
                });
                $("#left").prepend(th);
            });
        });
    });
});