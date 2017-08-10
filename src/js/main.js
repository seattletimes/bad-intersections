// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");
require("leaflet.markercluster");
require("leaflet.heat");

var $ = require("./lib/qsa");
var dot = require("./lib/dot");
var popupTemplate = dot.compile(require("./_popupTemplate.html"));

var mapElement = $.one("leaflet-map");
var map = window.map = mapElement.map;
var leaflet = mapElement.leaflet;
map.scrollWheelZoom.disable();
map.options.maxZoom = 14;

var heatPointsBike = [];
var heatPointsPed = [];

var bikeLayer = L.featureGroup();
var pedLayer = L.featureGroup();

window.injuriesData.forEach(function(r) {
  if (!r.lat) return
  var injuryMarker = L.marker([r.lat, r.long], {
    icon: L.divIcon({
    })
  });
    injuryMarker.data = r;
    var html = popupTemplate({ name: r.location, r });
    var key = $.one(".key");
    var pedkey = $.one(".ped");
    injuryMarker.on("click", e => key.innerHTML = html);
    injuryMarker.on("click", e => pedkey.innerHTML = html);
    injuryMarker.on("click", e => console.log(e.target.data));
    if (r.bike == 1) injuryMarker.addTo(bikeLayer);
    if (r.bike == 0) injuryMarker.addTo(pedLayer);
    // injuryMarker.bindPopup(popupTemplate({ name: r.location, r }, { className: "intersection-detail" }));
});
bikeLayer.addTo(map);

window.collisionsData.forEach(function(r) {
  if (!r.lat) return;
  var marker = leaflet.marker([r.lat, r.lng], {
    icon: leaflet.divIcon({
      className: `intersection-marker leaflet-marker`
    })
  });
  marker.data = r;
  if (r.bike == 1) heatPointsBike.push([r.lat, r.lng, 1]);
  if (r.bike == 0) heatPointsPed.push([r.lat, r.lng, 1]);
});

var heatmapBike = new L.heatLayer(heatPointsBike, {
  gradient: {0.4: '#f7a26b', 0.65: '#eb7100', 1: '#800026'},
  blur: 7,
  radius: 9,
  maxZoom: 16,
  max: 1
});

var heatmapPed = new L.heatLayer(heatPointsPed, {
  gradient: {.25:'#c7e9b4', .5:'#8cc29a', .75:'#7fcdbb', 1:'#03685C'},
  blur: 8,
  radius: 10,
  maxZoom: 17,
  max: 1
});

heatmapBike.addTo(map);
map.fitBounds(bikeLayer.getBounds());

var geocode = function(e) {
  e.stopPropagation();
  var coords = [this.getAttribute("data-lat"), this.getAttribute("data-lng")];
  map.flyTo(coords, 15);
  console.log(coords);
};

var toggleKey = function() {
  var visible = $.one(".tab.show-key");
  if (visible) visible.classList.remove("show-key");
  this.classList.toggle("show-key");
};

var toggleLayer = function() {
  var checked = $.one(".buttonRow input:checked").id;
  var visible = $.one(".tab.show-key");
  if (visible) visible.classList.remove("show-key");
  $.one(`.tab.${checked}`).classList.toggle("show-key");
  if (checked == "bicycles") {
    heatmapBike.addTo(map);
    map.removeLayer(heatmapPed);
    bikeLayer.addTo(map);
    map.removeLayer(pedLayer);
  } else {
    heatmapPed.addTo(map);
    map.removeLayer(heatmapBike);
    map.removeLayer(bikeLayer);
    pedLayer.addTo(map);
  }
};

toggleLayer();

$.one(".buttonRow").addEventListener("change", toggleLayer);
$(".intersection").forEach(el => el.addEventListener("click", geocode));
