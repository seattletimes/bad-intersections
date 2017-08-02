// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");
require("leaflet.markercluster");
require("leaflet.heat");

var $ = require("./lib/qsa");
var mapElement = $.one("leaflet-map");
var map = window.map = mapElement.map;
var leaflet = mapElement.leaflet;

var pedestrianLayer = L.markerClusterGroup({
    maxClusterRadius: 0,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction(cluster) {
      var count = cluster.getChildCount();
      var size = count < 10 ? "20" : count < 25 ? "25" : count < 50 ? "30" : count < 100 ? "35" : count < 400 ? "40" : "60";
      var injuryCount = cluster.getAllChildMarkers().reduce(function(sum, marker) {
        return sum + ((marker.data.injuries)/count);
      }, 0);
      var injuryClass = injuryCount < .75 ? "ped-low" :
      injuryCount < 1? "ped-medium" :
      injuryCount < 1.2 ? "ped-high" :
      "ped-highest";
      return leaflet.divIcon({
        html: count,
        className: `intersection-marker cluster ${injuryClass}`,
        iconSize: [size, size]
      });
    }
});

var bikeLayer = L.markerClusterGroup({
    maxClusterRadius: 0,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction(cluster) {
      var count = cluster.getChildCount();
      var size = count < 10 ? "20" : count < 25 ? "25" : count < 50 ? "40" : count < 100 ? "35" : count < 400 ? "40" : "60";
      var injuryCount = cluster.getAllChildMarkers().reduce(function(sum, marker) {
        return sum + ((marker.data.injuries)/count);
      }, 0);
      var injuryClass = injuryCount < .75 ? "low" :
      injuryCount < 1 ? "medium" :
      injuryCount < 1.5 ? "high" :
      "highest";
      return leaflet.divIcon({
        html: count,
        className: `intersection-marker cluster ${injuryClass}`,
        iconSize: [size, size]
      });
    }
});

var heatPointsBike = [];
var heatPointsPed = [];

window.collisionsData.forEach(function(r) {
  if (!r.lat) return;
  var marker = leaflet.marker([r.lat, r.lng], {
    icon: leaflet.divIcon({
      className: `intersection-marker leaflet-marker`
    })
  });
  marker.data = r;
  marker.addTo(r.bike == 0 ? pedestrianLayer : bikeLayer);
  marker.on("click", e => console.log(e.target.data));

  if (r.bike == 1) heatPointsBike.push([r.lat, r.lng, 1]);
  if (r.bike == 0) heatPointsPed.push([r.lat, r.lng, 1]);
});

var heatmapBike = new L.heatLayer(heatPointsBike, {
  gradient: {0.4: '#f7a26b', 0.65: '#d87759', 1: '#800026'},
  blur: 7,
  radius: 10,
  maxZoom: 16
});

var heatmapPed = new L.heatLayer(heatPointsPed, {
  gradient: {.25:'#c7e9b4', .5:'#8cc29a', .75:'#7fcdbb', 1:'#03685C'},
  blur: 8,
  radius: 10,
  maxZoom: 17
});

heatmapBike.addTo(map);
// heatmapPed.addTo(map);

// pedestrianLayer.addTo(map);
// bikeLayer.addTo(map);
map.fitBounds(pedestrianLayer.getBounds());

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
  } else {
    heatmapPed.addTo(map);
    map.removeLayer(heatmapBike);
  }
};

toggleLayer();
// map.on("zoom", function(e) {
//   console.log(e, map.getZoom());
//   if (map.getZoom() > 16) {
//     pedestrianLayer.addTo(map);
//   } else if (pedestrianLayer._map){
//     map.removeLayer(pedestrianLayer);
//   }
// })

$.one(".buttonRow").addEventListener("change", toggleLayer);
$(".intersection").forEach(el => el.addEventListener("click", geocode));
