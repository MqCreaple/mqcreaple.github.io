function showPlayer() {
    if(currentPlayer == 1) {
        $("#player1").addClass("current-player");
        $("#player2").removeClass("current-player");
    } else {
        $("#player2").addClass("current-player");
        $("#player1").removeClass("current-player");
    }
}
function isOneWin(x, y, z) {
    function alertWin() {
        alert("Player " + currentPlayer + " wins! Congratulations!");
        console.log(playHistory);
        //TODO highlight the row with four same pieces
    }
    // x constant | y cosntant | z constant
    var winX = true, winY = true, winZ = true;
    for(var i = 0; i < 4; i++) {
        if(winX && map[i][y][z] != currentPlayer) {
            winX = false;
        }
        if(winY && map[x][i][z] != currentPlayer) {
            winY = false;
        }
        if(winZ && map[x][y][i] != currentPlayer) {
            winZ = false;
        }
    }
    if(winX || winY || winZ) {
        alertWin();
        return true;
    }
    // x == y | y == z | z == x
    winX = (y==z); winY = (z==x); winZ = (x==y);
    for(var i = 0; i < 4; i++) {
        if(winX && map[x][i][i] != currentPlayer) {
            winX = false;
        }
        if(winY && map[i][y][i] != currentPlayer) {
            winY = false;
        }
        if(winZ && map[i][i][z] != currentPlayer) {
            winZ = false;
        }
    }
    if(winX || winY || winZ) {
        alertWin();
        return true;
    }
    //x == 3-y | y == 3-z | z == 3-x
    winX = (y+z==3); winY = (z+x==3); winZ = (x+y==3);
    for(var i = 0; i < 4; i++) {
        if(winX && map[x][i][3-i] != currentPlayer) {
            winX = false;
        }
        if(winY && map[3-i][y][i] != currentPlayer) {
            winY = false;
        }
        if(winZ && map[i][3-i][z] != currentPlayer) {
            winZ = false;
        }
    }
    if(winX || winY || winZ) {
        alertWin();
        return true;
    }
    // 3-x == y == z | x == 3-y == z | x == y == 3-z
    winX = (y==z&&x+y==3); winY = (z==x&&y+z==3); winZ = (x==y&&z+x==3);
    for(var i = 0; i < 4; i++) {
        if(winX && map[3-i][i][i] != currentPlayer) {
            winX = false;
        }
        if(winY && map[i][3-i][i] != currentPlayer) {
            winY = false;
        }
        if(winZ && map[i][i][3-i] != currentPlayer) {
            winZ = false;
        }
    }
    if(winX || winY || winZ) {
        alertWin();
        return true;
    }
    // x == y == z
    if(x == y && y == z) {
        var win = true;
        for(var i = 0; i < 4; i++) {
            if(map[i][i][i] != currentPlayer) {
                win = false;
                break;
            }
        }
        if(win) {
            alertWin();
        }
        return win;
    }
    return false;
}

function addPiece(x, y, z) {
    if(gameEnd) {
        var c = confirm("Game has already ended. Start a new game?");
        if(c) {
            location.reload();
        } else return;
    }
    if(map[x][y][z] != 0) {
        return;
    }
    $("#c"+x+y+z).html(text[currentPlayer]);
    $("#c"+x+y+z).addClass("t");
    map[x][y][z] = currentPlayer;
    playHistory.push([x, y, z]);
    gameEnd = isOneWin(x, y, z);
    currentPlayer = 3 - currentPlayer;
    showPlayer();
}

function withdraw() {
    if(playHistory.length > 0) {
        var t = playHistory.pop();
        map[t[0]][t[1]][t[2]] = 0;
        $("#c"+t[0]+t[1]+t[2]).removeClass("t");
        $("#c"+t[0]+t[1]+t[2]).html(text[0]);
        currentPlayer = 3-currentPlayer;
        showPlayer();
        if(gameEnd) gameEnd = false;
    }
}

$(document).ready(function() {
    // init
    for(var i = 0; i < 4; i++) {
        $("#chessboard").append(
            "<div><table id=\"board" + i + "\"></table>"+
            "<p>Layer " + (i +1) +"</p></div>"
        );
        for(var j = 0; j < 4; j++) {
            $("#board"+i).append("<tr id=\"row" + i + j + "\"></tr>");
            for(var k = 0; k < 4; k++) {
                $("#row"+i+j).append(
                    "<td><button class=\"cell\" id=\"c" + i + j + k +"\" "+
                    "onclick=\"addPiece("+i+","+ j+","+k+")\""+
                    ">&nbsp;</button></td>"
                );
            }
        }
    }
    showPlayer();
});