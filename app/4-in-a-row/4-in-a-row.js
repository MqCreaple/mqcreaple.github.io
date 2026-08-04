function showPlayer() {
    if (currentPlayer === 1) {
        document.getElementById("player1").classList.add("current-player");
        document.getElementById("player2").classList.remove("current-player");
    } else {
        document.getElementById("player2").classList.add("current-player");
        document.getElementById("player1").classList.remove("current-player");
    }
}

function isOneWin(x, y, z) {
    function lineCells(coordFn) {
        var cells = [];
        for (var i = 0; i < 4; i++) {
            var c = coordFn(i);
            if (map[c[0]][c[1]][c[2]] !== currentPlayer) return null;
            cells.push(c);
        }
        return cells;
    }

    var lines = [
        lineCells(function (i) { return [i, y, z]; }),
        lineCells(function (i) { return [x, i, z]; }),
        lineCells(function (i) { return [x, y, i]; }),
        y === z ? lineCells(function (i) { return [x, i, i]; }) : null,
        z === x ? lineCells(function (i) { return [i, y, i]; }) : null,
        x === y ? lineCells(function (i) { return [i, i, z]; }) : null,
        y + z === 3 ? lineCells(function (i) { return [x, i, 3 - i]; }) : null,
        z + x === 3 ? lineCells(function (i) { return [3 - i, y, i]; }) : null,
        x + y === 3 ? lineCells(function (i) { return [i, 3 - i, z]; }) : null,
        y === z && x + y === 3 ? lineCells(function (i) { return [3 - i, i, i]; }) : null,
        z === x && y + z === 3 ? lineCells(function (i) { return [i, 3 - i, i]; }) : null,
        x === y && z + x === 3 ? lineCells(function (i) { return [i, i, 3 - i]; }) : null,
        x === y && y === z ? lineCells(function (i) { return [i, i, i]; }) : null,
    ];

    for (var n = 0; n < lines.length; n++) {
        if (!lines[n]) continue;
        for (var k = 0; k < 4; k++) {
            var cell = lines[n][k];
            document.getElementById("c" + cell[0] + cell[1] + cell[2]).classList.add("win");
        }
        alert("Player " + currentPlayer + " wins! Congratulations!");
        console.log(playHistory);
        return true;
    }
    return false;
}

function addPiece(x, y, z) {
    if (gameEnd) {
        var restart = confirm("Game has already ended. Start a new game?");
        if (restart) {
            location.reload();
        }
        return;
    }
    if (map[x][y][z] !== 0) return;
    var cell = document.getElementById("c" + x + y + z);
    cell.innerHTML = text[currentPlayer];
    cell.classList.add("t");
    map[x][y][z] = currentPlayer;
    playHistory.push([x, y, z]);
    gameEnd = isOneWin(x, y, z);
    currentPlayer = 3 - currentPlayer;
    showPlayer();
}

function withdraw() {
    if (playHistory.length > 0) {
        var last = playHistory.pop();
        map[last[0]][last[1]][last[2]] = 0;
        var cell = document.getElementById("c" + last[0] + last[1] + last[2]);
        cell.classList.remove("t");
        cell.innerHTML = text[0];
        currentPlayer = 3 - currentPlayer;
        showPlayer();
        if (gameEnd) gameEnd = false;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    for (var i = 0; i < 4; i++) {
        document.getElementById("chessboard").insertAdjacentHTML(
            "beforeend",
            "<div><table id=\"board" + i + "\"></table>" +
                "<p>Layer " + (i + 1) + "</p></div>"
        );
        for (var j = 0; j < 4; j++) {
            document.getElementById("board" + i).insertAdjacentHTML(
                "beforeend",
                "<tr id=\"row" + i + j + "\"></tr>"
            );
            for (var k = 0; k < 4; k++) {
                document.getElementById("row" + i + j).insertAdjacentHTML(
                    "beforeend",
                    "<td><button class=\"cell\" id=\"c" + i + j + k + "\" " +
                        "onclick=\"addPiece(" + i + "," + j + "," + k + ")\">" +
                        "&nbsp;</button></td>"
                );
            }
        }
    }
    showPlayer();
});
