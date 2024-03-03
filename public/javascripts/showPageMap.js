console.log('at top of showpagemap, campground: ',campground)
// console.log('at top of showpagemap, campground.abc: ',campground.abc)//undefined is normal


mapboxgl.accessToken = mapToken;
//add a map
const map = new mapboxgl.Map({
container: 'map', // container ID
style: 'mapbox://styles/mapbox/streets-v12', // style URL
center: campground.geometry.coordinates, // starting position [lng, lat]
zoom: 9, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());
 

// create the popup
const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
`<h3>${campground.title}</h3><p>${campground.location}</p>`)
  ;
  //innerHTML = '<h3>...' does not work here
  //if want to use innerHTML, need to create element first

// Create a default Marker and add it to the map.
new mapboxgl.Marker()
.setLngLat(campground.geometry.coordinates)
.setPopup(popup)
.addTo(map);
 //marker1()



