console.log('about to fetch /campgrounds/hostExistsOrNot')
navbarHost()
async function navbarHost() {
  const resp = await fetch("/campgrounds/hostExistsOrNot", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  })
  //console.log(resp.json())
  let data = await resp.json()
  console.log('host data: ',data)
  let hostedCampgrounds =data
  let length = hostedCampgrounds.length
  console.log(length)
  if (length > 0) {
    const hostnav = document.getElementById('host')
    hostnav.innerHTML += "<a class='nav-link' href='/host/'>Host</a>";
    
  }
}