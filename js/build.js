$(document).ready(function() {
    $.getJSON("../config.json", function(config) {
        $(".fromconig").append(config[$(this).name])
    })
})