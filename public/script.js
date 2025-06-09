const url = "https://senzadev.net/streams/cars/cars.mpd";

let player;

window.addEventListener("load", async () => {
  try {
    await senza.init();
    player = new senza.ShakaPlayer();
    player.attach(video);
    await player.load(url);
    await video.play();

    video.addEventListener("ended", () => {
      video.currentTime = 0;
      video.play();
    });

    senza.uiReady();
  } catch (error) {
    console.error(error);
  }
});

document.addEventListener("keydown", async function(event) {
  switch (event.key) {
    case "Enter": await findProduct(); break;
    case "Escape": await playPause(); break;
    case "ArrowLeft": skip(-3); break;
    case "ArrowRight": skip(3); break;
    default: return;
  }
  event.preventDefault();
});

async function playPause() {
  if (video.paused) {
    await video.play();
  } else {
    await video.pause();
  }
}

function skip(seconds) {
  video.currentTime = video.currentTime + seconds;
}

async function findProduct() {
  const mapBox = document.getElementById("map");
  const preview = document.getElementById("preview");

  if (mapBox.classList.contains("loaded")) {
    mapBox.classList.remove("loaded");
  }
      
  const frameData = getCurrentVideoFrame();
  preview.src = frameData;
  preview.style.display = "block";
  mapBox.classList.add("searching");

  const product = await identifyProduct(frameData);
  const city = await getCurrentCity();
  const store = await findStoreNearby(product, city);

  mapBox.classList.remove("searching");
  mapBox.classList.add("loaded");
  preview.style.display = "none";

  showOnMap(store);
}

function getCurrentVideoFrame() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

async function identifyProduct(imageData) {
  const response = await fetch("/api/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData })
  });
  const result = await response.json();
  console.log("Product:", result.product);
  return result.product;
}

async function getCurrentCity() {
  const res = await fetch('/api/ipdata-key');
  const { key } = await res.json();
  const realKey = decode(key);

  let ipAddress = senza.deviceManager.deviceInfo.clientIp;
  if (ipAddress == "0.0.0.0") ipAddress = "";
  const response = await fetch(`https://api.ipdata.co/${ipAddress}?api-key=${realKey}`);
  if (!response.ok) { throw new Error(`Failed to fetch location info: ${response.status}`); }
  const ipdata = await response.json();
  const cityStateCountry = `${ipdata.city}, ${ipdata.region}, ${ipdata.country_name}`;
  console.log(`Location: ${cityStateCountry}`);
  return cityStateCountry;
}

async function findStoreNearby(product, city) {
  const query = `${product}, ${city}`;
  const res = await fetch(`/api/find-place?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Could not find nearby store.");
  const data = await res.json();
  console.log("Store:", data.name);
  return data;
}

async function loadGoogleMaps() {
  const res = await fetch('/api/maps-key');
  const { key, mapId } = await res.json();

  const realKey = decode(key);
  const realMapId = decode(mapId);

  const injectScript = document.createElement('script');
  injectScript.src = `https://maps.googleapis.com/maps/api/js?key=${realKey}&libraries=marker`;
  injectScript.setAttribute("async", "");
  injectScript.setAttribute("defer", "");

  return new Promise((resolve, reject) => {
    injectScript.onload = () => resolve(realMapId);
    injectScript.onerror = reject;
    document.head.appendChild(injectScript);
  });
}

let mapInstance = null;
let markerInstance = null;

async function showOnMap(store) {
  const mapId = await loadGoogleMaps();
  const mapDiv = document.getElementById("map-canvas");

  if (!mapInstance) {
    mapInstance = new google.maps.Map(mapDiv, {
      zoom: 17,
      center: { lat: store.lat, lng: store.lng },
      mapId: mapId
    });
  } else {
    mapInstance.setCenter({ lat: store.lat, lng: store.lng });
  }

  const { AdvancedMarkerElement } = google.maps.marker;

  if (markerInstance) {
    markerInstance.map = null;
    markerInstance = null;
  }

  const markerElements = mapDiv.querySelectorAll('.gm-adv-marker');
  markerElements.forEach(el => el.remove());

  markerInstance = new AdvancedMarkerElement({
    position: { lat: store.lat, lng: store.lng },
    title: `${store.name}\n${store.address}`
  });

  markerInstance.setMap(mapInstance);
}

function decode(str) {
  return atob(str.split("").reverse().join(""));
}
