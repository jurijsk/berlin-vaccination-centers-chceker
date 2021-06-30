(function thething() {
    var debuging = false;
    var log = function log(msg) {
        console.log("C19: " + msg);
    };
    var tempelhof;
    var onResponse = function onResponse(response) {
        var stats = response.stats;
        for (var i = 0; i < stats.length; i++) {
            var centerStats = stats[i];
            if (centerStats.open || (test && centerStats.id == 'tegel')) {
                var center = centers[centerStats.id];
                if (document.hasFocus() && centerStats.lastUpdate != center.lastUpdate) {
                    log("last update - " + center.id + " - " + centerStats.lastUpdate);
                    center.lastUpdate = centerStats.lastUpdate;
                    if (!center.window || center.window.closed) {
                        center.window = window.open(center.url, center.name);
                        log("Opening " + center.name + ": " + center.url);
                    }
                }
            }
        }
        scheduleBeat();
        updateStatus();
    };
    var updateStatus = function updateStatus() {
        var indicator = document.getElementById("status");
        if (!running) {
            indicator.innerText = 'Stopped';
            return;
        }
        if (!indicator.innerText.startsWith('Looking')) {
            indicator.innerText = 'Looking';
        }
        else {
            indicator.innerText += '.';
        }
    };
    function httpGetAsync(onResponse) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    onResponse(JSON.parse(xmlHttp.responseText));
                }
                else {
                    console.debug(xmlHttp.status, xmlHttp.statusText, xmlHttp.responseText);
                }
            }
        };
        xmlHttp.open("GET", 'https://api.impfstoff.link/?v=0.3&robot=1&thank_you=true', true); // true for asynchronous
        xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*');
        //xmlHttp.setRequestHeader("Access-Control-Allow-Methods", "DELETE, POST, GET, OPTIONS");
        //xmlHttp.setRequestHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
        xmlHttp.send(null);
    }
    var beat = function beat() {
        log('bit');
        httpGetAsync(onResponse);
    };
    var centers = {
        'arena': {
            id: 'arena',
            name: 'Arena Berlin',
            url: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158431'
        },
        'tempelhof': {
            id: 'tempelhof',
            name: 'Flughafen Tempelhof',
            url: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158433',
        },
        'messe': {
            id: 'messe',
            name: 'Messe Berlin',
            url: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158434',
        },
        'velodrom': {
            id: 'velodrom',
            name: 'Velodrom Berlin',
            url: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435',
        },
        'tegel': {
            id: 'tegel',
            name: 'Tegel',
            url: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158436',
        },
        'erika': {
            id: 'arena',
            name: 'Erika-Heß-Eisstadion',
            url: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158437',
        },
    };
    var scheduleBeat = function scheduleBeat() {
        if (running) {
            setTimeout(beat, 1000);
        }
    };
    var running = false;
    var onStopToggleClicked = function onStopToggleClicked() {
        var stopToggle = document.getElementById("stopToggle");
        if (running) {
            stopToggle.value = 'Resume looking';
            document.getElementById("status").innerText = '';
        }
        else {
            stopToggle.value = 'Stop looking';
            beat();
            //schedule stop
            setTimeout(stop, 1000 * 60 * 10); //10 minutes. 
        }
        running = !running;
    };
    var stop = function stop() {
        running = false;
        var stopToggle = document.getElementById("stopToggle");
        stopToggle.value = 'Start again';
        updateStatus();
    };
    var ensureCenters = function ensureCenters() {
        for (var key in centers) {
            if (Object.prototype.hasOwnProperty.call(centers, key)) {
                var center = centers[key];
                center.window = window.open(center.url, center.name);
                log('opening ' + center.name);
            }
        }
    };
    var test = false;
    var onTestToggleClicked = function onTestToggleClicked() {
        var testToggle = document.getElementById("testToggle");
        if (test) {
            testToggle.value = 'Stop test';
        }
        else {
            testToggle.value = 'Test';
        }
        test = !test;
    };
    var init = function init() {
        var stopToggle = document.getElementById("stopToggle");
        stopToggle.addEventListener('click', onStopToggleClicked);
        var testToggle = document.getElementById("testToggle");
        testToggle && testToggle.addEventListener('click', onTestToggleClicked);
    };
    init();
})();
