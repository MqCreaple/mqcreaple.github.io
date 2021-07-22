$(document).ready(function() {

    $.getJSON("../config.json", function(config) {
        /**
         * Search for all patterns like {{key}} in the document
         * and replace it with the corresponding value in config
         * @param {Object} block 
         */
        function run(block) {
            var text = $(block).html();
            text = text.replace(/\{\{(\w+?)\}\}/gm, function(m, key, s, txt) {
                return config[key];
            });
            $(block).html(text);
        }

        $("head").load("../include/head.html", function() {
            $("title").append(
                title + " | {{author}} - {{description}}"
            );
            run(this);
        });
        $("#header").load("../include/header.html", function() {
            run(this);
        });
        $("#avatar").load("../include/avatar.html", function() {
            run(this);
        });
    });
});