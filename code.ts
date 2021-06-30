interface Center {
	id: string,
	name: string
	url: string;
	window?: Window | undefined;
	lastUpdate?: number | undefined;
}
interface Centers {
	[key: string]: Center;
}


(function thething() {
	const debuging = false;

	let log = function log(msg: string) {
		console.log("C19: " + msg);
	};


	let tempelhof: Window;

	let onResponse = function onResponse(response: any) {
		let stats = response.stats;
		for(let i = 0; i < stats.length; i++) {
			const centerStats = stats[i];
			if(centerStats.open || (test && centerStats.id == 'tegel')) {
				let center = centers[centerStats.id];
				if(document.hasFocus() && centerStats.lastUpdate != center.lastUpdate){
					log(`last update - ${center.id} - ${centerStats.lastUpdate}`);
					center.lastUpdate = centerStats.lastUpdate;
					if(!center.window || center.window.closed){
						center.window = window.open(center.url, center.name);
						log(`Opening ${center.name}: ${center.url}`);
					}
				}
			}
		}
		scheduleBeat();
		updateStatus();
	}

	let updateStatus = function updateStatus() {
		let indicator = document.getElementById("status");
		if(!running){
			indicator.innerText = 'Stopped';
			return;
		}


		if(!indicator.innerText.startsWith('Looking')) {
			indicator.innerText = 'Looking';
		} else {
			indicator.innerText += '.';
		}
	}

	function httpGetAsync(onResponse: any) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() {
			if(xmlHttp.readyState == 4) {
				if(xmlHttp.status == 200) {
					onResponse(JSON.parse(xmlHttp.responseText));
				} else {
					console.debug(xmlHttp.status, xmlHttp.statusText, xmlHttp.responseText);
				}
			}
		}
		xmlHttp.open("GET", 'https://api.impfstoff.link/?v=0.3&robot=1&thank_you=true', true); // true for asynchronous
		
		xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*');
		//xmlHttp.setRequestHeader("Access-Control-Allow-Methods", "DELETE, POST, GET, OPTIONS");
		//xmlHttp.setRequestHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
		xmlHttp.send(null);
	}


	let beat = function beat() {
		log('bit');
		httpGetAsync(onResponse);
	};


	var centers: Centers = {
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
	}
	let scheduleBeat = function scheduleBeat() {
		if(running) {
			setTimeout(beat, 1000);
		}
	}

	let running = false;
	let onStopToggleClicked = function onStopToggleClicked() {


		let stopToggle = document.getElementById("stopToggle") as HTMLInputElement;
		if(running) {
			stopToggle.value = 'Resume looking';
			document.getElementById("status").innerText = '';
		} else {
			stopToggle.value = 'Stop looking';
			beat();
			//schedule stop
			setTimeout(stop, 1000 * 60 * 10) //10 minutes. 
		}
		running = !running;
	}

	let stop = function stop() {
		running = false;
		let stopToggle = document.getElementById("stopToggle") as HTMLInputElement;
		stopToggle.value = 'Start again';
		updateStatus();
	}

	let ensureCenters = function ensureCenters() {
		for(const key in centers) {
			if(Object.prototype.hasOwnProperty.call(centers, key)) {
				const center = centers[key];
				center.window = window.open(center.url, center.name);
				log('opening ' + center.name);
			}
		}
	}

	let test = false;
	let onTestToggleClicked = function onTestToggleClicked(){
		let testToggle = document.getElementById("testToggle") as HTMLInputElement;
		if(test){
			testToggle.value = 'Stop test';
		}else{
			testToggle.value = 'Test';
		}
		test = !test;
	}

	let init = function init() {
		let stopToggle = document.getElementById("stopToggle");
		stopToggle.addEventListener('click', onStopToggleClicked);


		let testToggle = document.getElementById("testToggle");
		testToggle && testToggle.addEventListener('click', onTestToggleClicked);
	};
	init();
})();