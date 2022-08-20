(function () {
    var currentRound = -1, playing = false;
    var indicator, button, updates;

    document.addEventListener("DOMContentLoaded", loaded);
    if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") loaded();

    window.addEventListener("load", ()=>loadStream());
    if(document.readyState === "complete") loadStream();

    function loaded() {
        indicator = document.getElementById("display");
        button = document.getElementById("button");
        updates = document.getElementById("updates");
        button.addEventListener("click", sendRoundStart);
    }

    function loadStream() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/updateStream");

        var lastChunkIndex = 0;
        var nextChunk = "";
        xhr.addEventListener("progress", function (e) {
            var str = xhr.responseText.substring(lastChunkIndex);
            lastChunkIndex += str.length;

            nextChunk += str;

            var lastCrlnIndex = nextChunk.lastIndexOf("\r\n");
            if (lastChunkIndex == -1) return;

            var validChunkDatas = nextChunk.substring(0, lastCrlnIndex);
            nextChunk = nextChunk.substring(lastCrlnIndex + 2);

            let i = 0;
            for (const c of validChunkDatas.split("\r\n")) {
                i++;
                //skip odd-numbered chunks
                if((i & 1) == 1) continue;
                else processStreamChunk(c);
            }
        });
        xhr.addEventListener("load", function () {
            loadStream();
        })
        xhr.send();
    }

    function processStreamChunk(chunk) {
        if (chunk == "") return;

        console.log(chunk);

        var json = JSON.parse(chunk);

        if (json.type == "init") {
            currentRound = json.round;
            playing = json.playing;
        } else if (json.type == "newRound") {
            currentRound = json.round;
            playing = true;
            addUpdate("Round Start", currentRound + "");
        } else if (json.type == "roundEnd") {
            playing = false;
            addUpdate("Winner", json.winner);
        }

        resetButton();
    }

    function addUpdate(title, content) {
        var update = document.createElement("li");
        update.classList.add("buttonborder");
        updates.appendChild(update);

        var time = document.createElement("span");
        time.classList.add("time");
        time.textContent = (new Date()).toLocaleTimeString();

        var titleElem = document.createElement("h2");
        titleElem.textContent = title;

        var contentElem = document.createElement("span");
        contentElem.classList.add("content");
        contentElem.textContent = content;

        update.appendChild(time);
        update.appendChild(titleElem);
        update.appendChild(contentElem);
    }

    function resetButton() {
        if(!playing) currentRound = -1;

        if(currentRound == -1) indicator.textContent = "paused";
        else indicator.textContent = "round " + currentRound;
    }

    function sendRoundStart() {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/newRound");
        xhr.send();
    }

    function fmtMilliseconds(n) {
        var decaseconds = Math.round(n / 100) / 10;

        if (decaseconds === (decaseconds | 0)) return "" + decaseconds + ".0s";
        else return "" + decaseconds + "s";
    }
})();