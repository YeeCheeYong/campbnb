async function getCampData(){
  const camps=await fetch('/campgrounds/getAll')
  const data=await camps.json()
  const campnames=data.map(camp=>{

    return camp.title
  })
  const camplocations=data.map(camp=>{

    return camp.location
  })
  const campamenities=['yurt', 'stargazing tour', 'zipline', 'kitchen', 'hiking tour', 'foodtruck', 'breakfast', 'fishing tour', 'premium yurt', 'live music', 'yoga class']
campdata.push(...campnames,...camplocations,...campamenities)
 console.log('campdata: ',campdata)
}