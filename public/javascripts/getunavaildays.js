async function getlatestdata() {

  const dates = await fetch(`/campgrounds/${campground._id}/getAllRes`);

  const data = await dates.json();
  console.log(data);
  unavaildays=data.map(d=>{return {s:d.s,e:d.e}})
  console.log('unavaildays: ',unavaildays)

}
