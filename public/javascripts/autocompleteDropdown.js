  const campgroundListElement=document.querySelector(".autocomplete-list");
const campgroundInputElement=document.querySelector(".autocomplete-input")//correct
let campdata=[]
campgroundInputElement.addEventListener('input',onInputChange)


getCampData();

// async function getCampData(){
//   const camps=await fetch('/campgrounds/getAll')
//   const data=await camps.json()
//   campnames=data.map(camp=>{
//     return camp.title
//   })
//   //console.log(campnames)
// }


function onInputChange()
{
  removeAutocompleteDropdown()

if(campgroundInputElement.value.length===0)return;
// if(campgroundInputElement.value.length===0)
// {createAutocompleteDropdown(campnames);
// return
// }
let filteredData;
filteredData=campdata.filter(x=>x.toLowerCase().includes(campgroundInputElement.value.toLowerCase()))
createAutocompleteDropdown(filteredData)
}
function createAutocompleteDropdown(list)
{
const listEl=document.createElement('ul')
listEl.className='autocomplete-list'
listEl.id='autocomplete-list'
list.forEach(camp=>{
  const listItem=document.createElement('li')
  const campButton=document.createElement('button')
  campButton.innerHTML=camp;
  campButton.addEventListener('click',onSearchButtonClick)
  listItem.appendChild(campButton)
  listEl.appendChild(listItem)
  // listItem.addEventListener('click',function()
  // {
  //   campgroundInputElement=listItem.innerHTML;
  //   console.log('listItem.innerHTML:',listItem.innerHTML)
  //   removeAutocompleteDropdown()
  // })
  document.addEventListener('click',function(e)
  {
    if(!e.target.classList.contains('autocomplete-list'))
    {
      removeAutocompleteDropdown()
    }
  })
})
document.querySelector('#autocomplete-wrapper').appendChild(listEl)
}
function removeAutocompleteDropdown()
{
  const listEl=document.querySelector('.autocomplete-list')
  if(listEl)listEl.remove()

}
function onSearchButtonClick(e)
{e.preventDefault()
const buttonEl=e.target
campgroundInputElement.value=buttonEl.innerHTML
removeAutocompleteDropdown()
}


