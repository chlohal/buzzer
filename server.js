const PORT = 5556;
const { readFileSync } = require("fs");
var http = require("http");
const { networkInterfaces } = require("os");

var round = 0;
var streams = {};


printLocalIpAddress();


var server = http.createServer(function (req, res) {
    var url = new URL(req.url, "http://localhost");
    if (url.pathname == "/updateStream") startUpdateStream(res);
    else if (url.pathname == "/newRound") startNewRound(res);
    else if (url.pathname.startsWith("/roundEnd")) handleRoundEnd(req, res);
    else sendLocalFile(url.pathname, res);
});

function printLocalIpAddress() {
    const addrs = networkInterfaces();

    const ips = [];

    for (const iname in addrs) {
        for (const c of addrs[iname]) {
            if (c.family == "IPv4" || c.family == 4) {
                ips.push(c.address);
            }
        }
    }

    console.log("Connect on one of the below:");
    for(const i of ips) console.log("- " + i + ":" + PORT);
}

/**
 * 
 * @param {http.ServerResponse} res 
 */
function startNewRound(res) {
    round++;
    sendUpdate({ type: "newRound", round: round }, res);
}

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
function handleRoundEnd(req, res) {
    let body = "";
    req.on("data", function (dat) {
        body += dat.toString();
    });
    req.on("end", function () {
        var clientRound = +body || -1;
        if (clientRound == round) {
            sendUpdate({ type: "roundEnd", winner: req.url.substring(req.url.lastIndexOf("/") + 1) }, res)
        }

        res.writeHead("201", "No Content", {
            "Content-Length": 0
        }).end("");
    });
}

/**
 * 
 * @param {*} up 
 * @param {http.ServerResponse} res 
 */
function sendUpdate(up, res) {
    for (const id in streams) {
        streams[id](up);
    }

    res.writeHead(201, "No Content", {
        "Content-Length": "0"
    }).end("");
}

const ALLOWED_URLS = new Set(["/client.js", "/client.css", "/panel", "/panel.js", "/panel.css", "/buzz.wav"])

/**
 * @param {string} url
 * @param {http.ServerResponse} res 
 */
function sendLocalFile(url, res) {
    if (ALLOWED_URLS.has(url) == false) url = "/client.html";

    if (url.indexOf(".") == -1) url += ".html";

    const file = readFileSync(__dirname + url);

    res.writeHead("200", "OK", {
        "Content-Type": mime(url),
        "Content-Length": file.length
    }).end(file);
}

/**
 * 
 * @param {string} url 
 */
function mime(url) {
    const ext = url.substring(url.indexOf(".") + 1);

    switch (ext) {
        case "js": return "application/javascript";
        case "css": return "text/css";
        case "html":
        default: return "text/html";
    }
}

/**
 * 
 * @param {http.ServerResponse} res 
 */
function startUpdateStream(res) {

    var id = Date.now().toString(16);

    res.writeHead(200, "OK", {
        "Content-Type": "application/json"
    });

    sendChunk(res, "init");

    streams[id] = function (update) {
        sendChunk(res, update);
    }

    function eraseStream() {
        if (res.writable) {
            res.end();
        }
        delete streams[id];
    }

    res.on("close", eraseStream);
    res.on("error", eraseStream);
    setTimeout(eraseStream, 30000);
}

/**
 * 
 * @param {http.ServerResponse} res 
 * @param {*} chunk 
 */
function sendChunk(res, chunk) {
    var json = JSON.stringify(chunk);

    res.write(json.length.toString(16) + "\r\n" + json + "\r\n");
}

server.listen(PORT);