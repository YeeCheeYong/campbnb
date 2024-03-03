
console.log('about to fetch /cart/existsOrNot')
navbarCart()
async function navbarCart() {
  const resp = await fetch("/cart/existsOrNot", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  })
  //console.log(resp.json())
  let data = await resp.json()
  let storeItems = data.storeItems
  console.log(storeItems)
  let length = storeItems.length
  console.log(length)
  if (length && length > 0) {
    const cartnav = document.getElementById('cart')
    cartnav.innerHTML += "<a class='nav-link' href='/cart/'>Cart</a>";
    //cartnav.innerHTML='Cart'
    const cartlogo=document.getElementById('cartlogo')
    cartlogo.innerHTML += '<svg style="width: 30px; height: 30px;" class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <path stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.3L19 7H7.3"/> </svg>';

  }
}
