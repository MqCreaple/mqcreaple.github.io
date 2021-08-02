$(document).ready(function() {

    $.getJSON("/config.json", function(config) {
        /**
         * Search for all patterns like {{key}} in the document
         * and replace it with the corresponding value in config
         * @param {Object} block 
         */
        function run(block) {
            var text = $(block).html();
            text = text.replace(/\{\{([\w\-\.]+?)\}\}/gm, function(m, key, s, txt) {
                return config[key];
            });
            $(block).html(text);
        }

        /*
        load the head of the webpage, and #header, #avatar, #footer
         */
        $.get("/include/head.html", function(head) {
            $("head").append(head);
            if($("#article").length > 0) {
                $("#article").prepend("<h1>" + $("title").text() + "</h1>");
            }
            $("title").append(" | {{author}} - {{description}}");
            run("head");
        });
        $.when(
            $.get("/include/header.html", function(header) {
                $("#container").prepend(header);
            }),
            $.get("/include/avatar.html", function(avatar) {
                $("#right").append(avatar);
            }),
            $.get("/include/footer.html", function(footer) {
                $("#container").append(footer);
            })
        ).done(function() {
            run("#container");
        });

        /*
        for articles:
         */
        if($("#article").length > 0) {
            var article = $("#article").html();
            article = article.replace(/\[\[([\w\-\.]+?)\]\]/gm, function(m, url, s, txt) {
                return "<img src=\"/img/" + url + "\" alt=\"" + url + "\">";
            });
            $("#article").html(article);
        }

        //TODO basic markdown in articles
    });
});