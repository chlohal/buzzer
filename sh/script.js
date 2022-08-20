var count;
var indicators, button, buttonsContainer;
var rotationSpeed = 0, rotation = 0;

var mouseDown = false, mouseOriginal = 0, lastMouseEventTime = Date.now();

var FRICTION_COEF = 0.99;

var KV_URL = function() {
    var d = new Date();
    return "https://kvdb.io/idEoxdoHhJZkDtnQqVqu4/marksuscount" + "-" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
};

document.addEventListener("DOMContentLoaded", function() {
    indicators = Array.from(document.getElementsByClassName("display"));
    document.getElementById("add").addEventListener("click", add);
    document.getElementById("subtract").addEventListener("click", subtract);
    document.getElementById("reset").addEventListener("click", reset);
    document.getElementById("lots").addEventListener("click", lots);

    buttonsContainer = document.getElementById("buttons");
    

    var sideCount = buttonsContainer.childElementCount;
    var width = buttonsContainer.children[0].clientWidth;
    var apothem = width / (2 * Math.tan(Math.PI / sideCount));
    var sideDegrees = 360 / sideCount;
    for(var i = 0; i < sideCount; i++) {
        console.log(`hsl(${3*i}, 73%, 42%)`);
        buttonsContainer.children[i].style.transform = `rotate3d(0, 1, 0, ${sideDegrees*i}deg) translate3d(0, 0, ${round(apothem,4)}px)`;
        buttonsContainer.children[i].querySelector("button").style.background = `hsl(${sideDegrees*i}, 73%, 42%)`;
        buttonsContainer.children[i].addEventListener("click", function(event) {
            event.stopPropagation();
            rotation = Math.round(rotation / sideCount) * sideCount;
        })
    }

    history.replaceState(null, "", "/");


    document.body.addEventListener("mousedown", function(event) {
        mouseDown = true;
        mouseOriginal = event.clientX;
        rotationSpeed = 0;
    });

    document.body.addEventListener("mousemove", function(event) {
        if(mouseDown) rotationSpeed = (event.clientX - mouseOriginal) / (Date.now() - lastMouseEventTime);
        if(mouseDown) event.preventDefault();
        if(rotationSpeed == Infinity || rotation == -Infinity) rotationSpeed = 0;
        mouseOriginal = event.clientX;
        lastMouseEventTime = Date.now();
    });
    document.body.addEventListener("mouseup", function(event) {
        mouseDown = false;
    });

    document.body.addEventListener("touchstart", function(event) {
        mouseDown = true;
        mouseOriginal = event.touches[0].clientX;
        rotationSpeed = 0;
    });

    document.body.addEventListener("touchmove", function(event) {
        if(mouseDown) rotationSpeed = (event.touches[0].clientX - mouseOriginal) / (Date.now() - lastMouseEventTime);
        if(rotationSpeed == Infinity || rotation == -Infinity) rotationSpeed = 0;
        mouseOriginal = event.touches[0].clientX;
        lastMouseEventTime = Date.now();
    })
    document.body.addEventListener("touchcancel", function(event) {
        mouseDown = false;
    });

    document.body.addEventListener("touchend", function(event) {
        mouseDown = false;
    });

    requestAnimationFrame(function anim() {
        rotation += rotationSpeed;
        buttonsContainer.style.transform = `rotate3d(0, 1, 0, ${(rotation / window.innerWidth) * 360 * 2}deg)`;
        rotationSpeed *= FRICTION_COEF;
        requestAnimationFrame(anim);
    })
});

loadMarkCount();

setInterval(loadMarkCount, 10000);

function setIndicators(text) {
    indicators = indicators || [];
    for(var i = 0; i < indicators.length; i++) {
        if(indicators[i]) indicators[i].textContent = text;
    }
} 

function loadMarkCount(e) {
    if(e && e.stopPropagation) e.stopPropagation();
    setIndicators("\u2026");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", KV_URL());
    xhr.onload = function() {
        if(xhr.status == 200) count = parseInt(xhr.responseText);
        else count = 0;
        setIndicators(format(count));
    }
    xhr.send();
}

function add(e) {
    if(e && e.stopPropagation) e.stopPropagation();
    setIndicators("\u2026");
    var xhr = new XMLHttpRequest();
    xhr.open("PATCH", KV_URL());
    xhr.onload = function() {
        if(xhr.status == 200) count = parseInt(xhr.responseText);
        setIndicators(format(count));
    }
    xhr.send("+1");
}

function lots(e) {
    if(e && e.stopPropagation) e.stopPropagation();
    setIndicators("\u2026");
    var xhr = new XMLHttpRequest();
    xhr.open("PATCH", KV_URL());
    xhr.onload = function() {
        if(xhr.status == 200) count = parseInt(xhr.responseText);
        setIndicators(format(count));
    }
    xhr.send("+10");
}

function subtract(e) {
    if(e && e.stopPropagation) e.stopPropagation();
    setIndicators("\u2026");
    var xhr = new XMLHttpRequest();
    xhr.open("PATCH", KV_URL());
    xhr.onload = function() {
        if(xhr.status == 200) count = parseInt(xhr.responseText);
        setIndicators(format(count));
    }
    xhr.send("-1");
}

function reset(e) {
    if(e && e.stopPropagation) e.stopPropagation();
    setIndicators("\u2026");
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", KV_URL());
    xhr.onload = function() {
        if(xhr.status == 200) count = parseInt(xhr.responseText);
        setIndicators(format(count));
    }
    xhr.send("0");
}

function format(n) {
    var numstr = Math.floor(n || 0).toString();
    var r = "";
    var i = numstr.length - 3
    for(; i >= 0; i-=3) {
        r = (i > 0 ? "," : "") + numstr.substring(i, i + 3) + r;
    }
    r = numstr.substring(0, i + 3) + r;
    return r;
}

function round(n, p) {
    var pow = Math.pow(10, p);
    return Math.round(n * pow) / pow;
}