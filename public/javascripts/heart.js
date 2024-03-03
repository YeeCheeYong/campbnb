// const favoriteButtons = document.querySelectorAll(".favorite-button");
// favoriteButtons.forEach(button => {
//   button.addEventListener("click", (event) => {
//     const button = event.currentTarget;
//     button.classList.toggle("is-favorite");
//   });
// });

// Get all elements with the class "favorite-button"
const favoriteButtons = document.querySelectorAll(".favorite-button");



getfavs()
async function getfavs() {
  const resp = await fetch("/user/favourites", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  })
  //console.log(resp.json())
  let favs = await resp.json()
  console.log(favs)
  let length = favs.length
  console.log(length)



  if (favs && length > 0) {

    //iterate fav array
    for (let f of favs) {
      let heartButton = document.getElementById(f)
      if (heartButton)
        heartButton.classList.toggle("is-favorite");
    }
  }

}

// Add event listener to each favorite button
favoriteButtons.forEach(function (button) {
  button.addEventListener("click", toggleFav);
});

async function toggleFav(event) {
  console.log(this.id);
  let toggled = this.id;

  // Toggle the "is-favorite" class on the clicked button
  this.classList.toggle("is-favorite");
  //fas fa-heart favorite__icon favorite--enable
  //console.log("this.classList: ",this.classList)
  let action = this.classList.contains('is-favorite') ? 'add' : 'remove';
console.log('action',action)

  // Send the appropriate action in the POST request
  const resp2 = await fetch('/user/favourites', {
    method: 'POST',
    body: JSON.stringify({
      toggled: toggled,
      action: action
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    }
  });
  console.log(resp2)
}
