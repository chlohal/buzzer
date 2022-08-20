(function () {
    var count;
    var indicator, button;
    var KV_URL = function () {
        var d = new Date();
        return "https://kvdb.io/idEoxdoHhJZkDtnQqVqu4/marksuscount" + "-" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    };

    document.addEventListener("DOMContentLoaded", function () {
        indicator = document.getElementById("display");
        button = document.getElementById("button");
        button.addEventListener("click", add);
    });

    loadMarkCount();

    setInterval(loadMarkCount, 30000);

    function loadMarkCount() {
        if (indicator) indicator.textContent = "\u2026";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", KV_URL());
        xhr.onload = function () {
            if (xhr.status == 200) count = parseInt(xhr.responseText);
            else count = 0;
            if (indicator) indicator.textContent = format(count);
        }
        xhr.send();
    }

    function add() {
        if (indicator) indicator.textContent = "\u2026";
        var xhr = new XMLHttpRequest();
        xhr.open("PATCH", KV_URL());
        xhr.onload = function () {
            if (xhr.status == 200) count = parseInt(xhr.responseText);
            if (indicator) indicator.textContent = format(count);
        }
        xhr.send("+1");
    }

    function format(n) {
        var numstr = Math.floor(n || 0).toString();
        var r = "";
        var i = numstr.length - 3
        for (; i >= 0; i -= 3) {
            r = (i > 0 ? "," : "") + numstr.substring(i, i + 3) + r;
        }
        r = numstr.substring(0, i + 3) + r;
        return r;
    }
})();