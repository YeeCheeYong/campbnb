document.getElementById('searchBtn').addEventListener('click', function(event) {
  event.preventDefault(); // Prevent default anchor behavior
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const campgroundName = document.getElementById('campgroundName').value;
  const am=document.getElementById('final-amenities').value;
  const searchUrl = `/campgrounds/search?startDate=${startDate}&endDate=${endDate}&campgroundName=${campgroundName}&am=${am}&page=1&limit=4`;
  window.location.href = searchUrl; // Redirect to search URL
});