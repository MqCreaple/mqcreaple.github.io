$(document).ready(function() {
    $.get("template.html", function(template) {
        $.getJSON("app.json", function(apps) {
            $.each(apps, function(i, app) {
                var th = template.replace(/\{\%\s([\w-]+?)\s\%\}/g, function(m, key, s, txt) {
                    return app[key];
                });
                $("#left").prepend(th);
            });
        });
    });
});