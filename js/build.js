$(document).ready(function() {

    $.getJSON("../config.json", function(config) {
        /**
         * Search for all patterns like {{key}} in the document
         * and replace it with the corresponding value in config
         * @param {Object} block 
         */
        function run(block) {
            var text = $(block).html();
            text = text.replace(/\{\{([\w\-]+?)\}\}/gm, function(m, key, s, txt) {
                return config[key];
            });
            $(block).html(text);
        }

        /*
        load the head of the webpage, and #header, #avatar, #footer
         */
        $("head").load("../include/head.html", function() {
            $("title").append(
                title + " | {{author}} - {{description}}"
            );
            run(this);
        });
        $.when(
            $.get("../include/header.html", function(header) {
                $("#container").prepend(header);
            }),
            $.get("../include/avatar.html", function(avatar) {
                $("#right").append(avatar);
            }),
            $.get("../include/footer.html", function(footer) {
                $("#container").append(footer);
            })
        ).done(function() {
            run("#container");
        });
    });
});