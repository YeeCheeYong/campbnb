const searchInput = document.querySelector("[data-search]")
let results=[]

searchInput.addEventListener("input", e => {
  const value = e.target.value.toLowerCase()
  results.forEach(result => {
    const isVisible =
      result.title.toLowerCase().includes(value) 
    result.element.classList.toggle("hide", !isVisible)
  })
})

fetch('http://localhost:3000/campgrounds/search?startDate='+document.getElementById('startDate').value+'&endDate='+document.getElementById('endDate').value)
  .then(res => res.json())
  .then(data => {
    results = data.map(result => {
      // const card = userCardTemplate.content.cloneNode(true).children[0]
      // const header = card.querySelector("[data-header]")
      // const body = card.querySelector("[data-body]")
      // header.textContent = user.name
      // body.textContent = user.email
      // userCardContainer.append(card)
      // return { name: user.name, email: user.email, element: card }
    })
  })

