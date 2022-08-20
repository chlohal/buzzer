(function () {
    var currentRound = -1, playing = false;
    var indicator, button, buzzer;

    document.addEventListener("DOMContentLoaded", loaded);
    if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") loaded();

    window.addEventListener("load", ()=>loadStream());
    if(document.readyState === "complete") loadStream();

    function loaded() {
        indicator = document.getElementById("display");
        buzzer = document.getElementById("buzz");
        button = document.getElementById("button");
        button.addEventListener("click", sendWin);
    }

    function loadStream() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/updateStream", true);

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

        var json = JSON.parse(chunk);

        if (json.type == "init") {
            currentRound = json.round;
            playing = json.playing;
            if(playing) startTimer();
            else resetButton();
        } else if (json.type == "newRound") {
            currentRound = json.round;
            playing = true;
            startTimer();
        } else if (json.type == "roundEnd") {
            resetButton();
        }
    }

    function resetButton() {
        button.style.filter = "grayscale(1) opacity(0.5)";
        playing = false;
        currentRound = -1;
    }

    function startTimer() {
        let r = currentRound;
        let originalTime = -1;

        button.style.filter = "";

        requestAnimationFrame(function anim() {
            let t = Date.now();

            if (originalTime === -1) originalTime = t;

            indicator.textContent = fmtMilliseconds(t - originalTime);

            if (r === currentRound) requestAnimationFrame(anim)
        })
    }

    function sendWin() {
        if (!playing) return;

        buzzer.play();

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/roundEnd" + window.location.pathname);
        xhr.send("" + currentRound);
    }

    function fmtMilliseconds(n) {
        var decaseconds = Math.round(n / 100) / 10;

        if (decaseconds === (decaseconds | 0)) return "" + decaseconds + ".0s";
        else return "" + decaseconds + "s";
    }
})();