function random() {
    setTimeout(function() {
        if(Math.random() >= 0.5) {
            $("#head").css("color", "#ffd71d");
            $("#head").css("border-color", "#ffd71d");
            // document.getElementById("head").style.color = "#ffd71d";
            // document.getElementById("head").style.borderColor = "#ffd71d";
        } else {
            $("#tail").css("color", "#ffd71d");
            $("#tail").css("border-color", "#ffd71d");
        }
    }, 400);
}