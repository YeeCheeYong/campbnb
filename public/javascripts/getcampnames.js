async function getCampData(){
  const camps=await fetch('/campgrounds/getAll')
  const data=await camps.json()
  campdata=data.map(camp=>{
    return camp.title
  })
  //console.log(campnames)
}