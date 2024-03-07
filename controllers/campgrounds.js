const User = require('../models/user')
const Campground = require('../models/campground');
const Reservation = require('../models/reservation');
const { deleteInS3 } = require('../s3');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { assert } = require('joi');
const knn = require('knear');

//geocoder is a name u give to the client to access geocoding service
const geocoder = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN })
//20240220
const { searchDatesSchema } = require('../schemas')

//20240219 modify with pagination
//const index = async (req, res) => {
//   const campgrounds = await Campground.find({});
//   //return array
//   res.render("campgrounds/index", { campgrounds });
// }
const index = async (req, res) => {
  console.log('now in campgrounds index handler, res.paginatedResults: ', res.paginatedResults)
  console.log('now in campgrounds index handler, req.query: ', res.page)
  //const campgrounds = await Campground.find({});
  //return array
  const campgrounds = res.paginatedResults.results;




  const prevPage = res.paginatedResults.previous ? res.paginatedResults.previous.page : null;
  const nextPage = res.paginatedResults.next ? res.paginatedResults.next.page : null;
  const startDate = null;
  const endDate = null;
  const campgroundName = null;
  const am=null;
  const allCamps=await Campground.find({})

  console.log('now in index handler, campgrounds: ',campgrounds)
  res.render("campgrounds/index", { campgrounds, prevPage, nextPage, startDate, endDate, am,campgroundName,allCamps });
}
const getAll = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.json(campgrounds)
}

const renderNewForm = (req, res) => {

  res.render("campgrounds/new");
}
// const createCampground=(req,res)=>{
//   console.log("now in createCampground", req.body)
//   console.log("now in createCampground", req.body.amenities)
//   const splitAmenities=req.body.amenities.split(',')
//   console.log('splitAmenities: ',splitAmenities)
//   res.send(req.body)
// }
const createCampground = async (req, res, next) => {
  //here we now hav access to req.body n req.file fr multer
  //to save image's filename n path, take fr req.body n req.file n save to Campground doc
  console.log("now in createCampground", req.body.campground)
  console.log("now in createCampground", req.body.amenities)

  const splitAmenities = req.body.amenities.split(',')

  const geoData = await geocoder.forwardGeocode({
    query: req.body.campground.location,
    limit: 1
  }).send()

  const campground = new Campground(req.body.campground);
  //console.log('now in createcampground', req.files);
  campground.geometry = geoData.body.features[0].geometry;
  campground.images = req.files.map(f => ({ url: f.url, filename: f.filename, thumbnail: f.thumbnail }))
  campground.author = req.user._id;//bcos author's type is defined as Schema.Types.ObjectId, i guess
if(req.body.amenities!='')
  campground.amenities = splitAmenities


  await campground.save();
  req.flash('success', 'successfully made a new campground')
  res.redirect(`/campgrounds/${campground._id}`);
}
const showCampround = async (req, res) => {
  //const {campground}=req.params;
  console.log('now in showCampground')
  console.log('now in showCampground, req.params:', req.params);
  const campground = await Campground.findById(req.params.id).populate({
    path: 'reviews',
    populate: {
      path: 'author'
    }
  }).populate("author");
  console.log(campground)
  if (!campground) {
    req.flash('error', 'Cannot find that campground')
    return res.redirect('/campgrounds')
  }
const rating=await campground.getRating()

const reviews = res.paginatedResults.results;
  const prevPage = res.paginatedResults.previous ? res.paginatedResults.previous.page : null;
  const nextPage = res.paginatedResults.next ? res.paginatedResults.next.page : null;

  console.log("now in showCampground, campground:", campground);
  res.render("campgrounds/show", { campground,rating,reviews, prevPage,nextPage});
}

const renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash('error', 'Cannot find that campground')
    return res.redirect('/campgrounds')
  }
  //const amenities = ['Macbeth', 'Falstaff']
  res.render("campgrounds/edit", { campground });
}
const updateCampground = async (req, res) => {

  const { id } = req.params;
  console.log('req.body inside updateCampground: ', req.body)//so we can see what's going on with the checkbox data
  const splitAmenities = req.body.amenities.split(',')

  const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground, amenities: splitAmenities });
  const imgs = req.files.map(f => ({ url: f.url, filename: f.filename, thumbnail: f.thumbnail }))
  campground.images.push(...imgs)
  await campground.save()
  if (req.body.deleteImages) {
    deleteInS3(req.body.deleteImages);
    //delete image from mongodb
    await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    //pull:{field=images:{condition=filename is = any value from the req.body.deleteImages array}}
    //ie pull from images array, any value that has filename property equal to any value from the deleteImages array
    console.log(campground)
  }

  req.flash('success', 'Successfully updated campground')
  res.redirect(`/campgrounds/${campground._id}`);
}
const deleteCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndDelete(id);
  req.flash('success', 'Successfully deleted campground')
  res.redirect("/campgrounds");
}

//20240218
const search = async (req, res, next) => {
  console.log('now in search, req.query: ', req.query)
  const { startDate, endDate, campgroundName,am } = req.query;
  console.log('here 1')
  let result
  console.log('here 2')
  //am array
  let amenities
  if(req.query.am!=='')
  amenities=am.split(',')
else amenities=null
  console.log('now in search, amenities: ',amenities)

  try {
    if (!startDate && !endDate && !campgroundName&&!am) {
      console.log('here 3')
      throw new Error("Redirected to all results")
    }
    else if (startDate && !endDate) {
      console.log('here 4')
      throw new Error("endDate must be provided if startDate is provided.");
    }
    else if (endDate && !startDate) {
      console.log('here 5')
      throw new Error("startDate must be provided if endDate is provided.");
    }
    else if (startDate && endDate) {
      console.log('here 6')
      const { error } = searchDatesSchema.validate(req.query);
      if (error) {
        console.log(error);
        const msg = error.details.map((el) => el.message).join(",");
        throw new Error(msg);
      } //else {
      //   console.log('here 7')
      //    next();
      // }
    }

    //else {
    if (!startDate && !endDate) {
      console.log('here 8')
      //result = await Reservation.find({});
      result = [];
      console.log('here 8.5')
      console.log('result: ', result)
    }
    else {
      console.log('here 9')
      result = await Reservation.find({
        startDate: { "$gte": new Date(startDate) },
        endDate: { "$lte": new Date(endDate) },
        status: { $in: ['pending', 'confirmed'] } // Use $in operator for multiple values
      }).populate('campground');

    }

    console.log('now in search, result: ', result)

    let unavailCampgrounds = [];
    result.forEach(r => {
      unavailCampgrounds.push(r.campground);
    });
    // Extract campground IDs from unavailCampgrounds array
    console.log('now in search, unavailCampgrounds: ', unavailCampgrounds)
    const unavailableCampgroundIds = unavailCampgrounds.map(c => c._id);
    // Filter available campgrounds using $nin operator & by title
    // let campgrounds = await Campground.find({
    //   $and: [
    //     { _id: { $nin: unavailableCampgroundIds } },
    //     { title: { $regex: new RegExp(campgroundName, 'i') } }, // Case-insensitive regex match for title
    //     //{amenities:{$in:amenities}}
    //   ]
    // });

    // let campgrounds = await Campground.find({
    //   $or: [
    //     {
    //       $and: [
    //         { _id: { $nin: unavailableCampgroundIds } },
    //         { title: { $regex: new RegExp(campgroundName, 'i') } } // Case-insensitive regex match for title
    //       ]
    //     },
    //     {
    //       $and: [
    //         { _id: { $nin: unavailableCampgroundIds } },
    //         { amenities: { $in: amenities } }
    //       ]
    //     }
    //   ]
    // });

    let campgrounds = await Campground.find({
      $and: [
        { _id: { $nin: unavailableCampgroundIds } },
        { title: { $regex: new RegExp(campgroundName, 'i') } } // Case-insensitive regex match for title
      ]
    });
    
    // Filter the results based on amenities
    if(amenities)
    campgrounds = campgrounds.filter(campground => {
      return amenities.every(amenity => campground.amenities.includes(amenity));
    });
    


    console.log('now in search, campgrounds: ', campgrounds)

    const prevPage = null;
    const nextPage = null;
    //res.render("campgrounds/index", { campgrounds,prevPage,nextPage });
    //res.json(campgrounds)
    res.paginatedSearchResults = campgrounds
    console.log('inside search, res.paginatedSearchResults: ', res.paginatedSearchResults)
    next()

  }
  catch (error) {
    req.flash('error', error.message)
    //res.redirect('reservations/new',{campground})
    res.redirect(`/campgrounds?page=1&limit=4`);
    //return;
  }
}
const searchAll = async (req, res, next) => {
  console.log('now in searchAll, req.query: ', req.query)
  const { keyword } = req.query;
  try {
    let results=[]
    let campgrounds=await Campground.find({$text:{$search:keyword}})
    // let keywordArray = keyword.split(" ");
    // let regex=keywordArray.map(function(val){
    //   return new RegExp('^['+val+'].*','i')
    // })
    let campgrounds2 = await Campground.find({
      $or: [
        { title: { $regex: new RegExp(keyword, 'i') } },
        { location: { $regex: new RegExp(keyword, 'i') } },
        { amenities: { $regex: new RegExp(keyword, 'i') } }
      ]
    });
    results.push(...campgrounds,...campgrounds2)
    let uniqueResultsSet=new Set(results)
    let uniqueResults=[...uniqueResultsSet]
  // let campgrounds = await Campground.find({
  //   $or: [
  //     { $text: { $search: keyword } },
  //     { title: { $regex: new RegExp(keyword, 'i') } },
  //     { location: { $regex: new RegExp(keyword, 'i') } },
  //     { amenities: { $regex: new RegExp(keyword, 'i') } }
  //   ]
  // });
  
    console.log('now in searchAll, campgrounds: ', uniqueResults)

    const prevPage = null;
    const nextPage = null;

    res.paginatedSearchResults = uniqueResults
    console.log('inside searchAll, res.paginatedSearchResults: ', res.paginatedSearchResults)
    next()

  }
  catch (error) {
    req.flash('error', error.message)
    //res.redirect('reservations/new',{campground})
    res.redirect(`/campgrounds?page=1&limit=4`);
    //return;
  }
}
// const campground=await Campground.findOne({title:'chee camp'}).populate('reviews')
// const rating =await campground.getRating()

const giveRecommendations = async (req, res) => {
  const campgrounds = await Campground.find({}).populate('reviews')
  //const ratings=await campgrounds.getRating()
  let campgroundData = []
  let sortedCampgroundData

  for (c of campgrounds) {
    const rating = await c.getRating()
    //campgroundData.push({ id: c._id, amenities: c.amenities, location: c.location, rating: rating })
    const yurk = c.amenities.includes('yurk') ? 1 : 0
    const stargazingtour = c.amenities.includes('stargazing tour') ? 1 : 0
    const zipline = c.amenities.includes('zipline') ? 1 : 0
    const kitchen = c.amenities.includes('kitchen') ? 1 : 0
    const hikingtour = c.amenities.includes('hiking tour') ? 1 : 0
    const foodtruck = c.amenities.includes('foodtruck') ? 1 : 0
    const breakfast = c.amenities.includes('breakfast') ? 1 : 0
    const fishingtour = c.amenities.includes('fishing tour') ? 1 : 0
    const premiumyurt = c.amenities.includes('premium yurt') ? 1 : 0
    const livemusic = c.amenities.includes('live music') ? 1 : 0
    const yogaclass = c.amenities.includes('yoga class') ? 1 : 0

    campgroundData.push({ id: c._id, yurk: yurk, stargazingtour: stargazingtour, zipline: zipline, kitchen: kitchen, hikingtour: hikingtour, foodtruck: foodtruck, breakfast: breakfast, fishingtour: fishingtour, premiumyurt: premiumyurt, livemusic: livemusic, yogaclass: yogaclass, rating: rating })
  }
  sortedCampgroundData = campgroundData.sort((a, b) => b.rating - a.rating)
  console.log('inside giveRecommendations, campgroundData:', campgroundData)
  console.log('inside giveRecommendations, sortedCampgroundData:', sortedCampgroundData)

  // Format campground data for KNN algorithm
  const formattedData = campgroundData.map(c => ({
    features: [c.rating, c.yurk, c.stargazingtour, c.zipline, c.kitchen, c.hikingtour, c.foodtruck, c.breakfast, c.fishingtour, c.premiumyurt, c.livemusic, c.yogaclass], // Use relevant features (e.g., ratings) as input
    label: c.id, // Convert label to string
  }));
  console.log('formattedData', formattedData)
  let recommendedCampgrounds;
  let recommendedCampgroundsBasedOnReservationHistory;
  //gen userFavorites
  let userFavorites = []
  //if req.user

  let campsBasedOnResHis=[]
  let campsBasedOnFavOrRanking=[]
  if (req.user) {
    const reservations = await Reservation.find({ user: req.user._id, status: 'confirmed' }).populate('campground');
    const campgrounds = reservations.map(r => r.campground)
    console.log('now in mapping campgrounds, campgrounds: ', campgrounds)
    if (reservations && reservations.length > 0) {
      const resData = await generateData(campgrounds)
      recommendedCampgroundsBasedOnReservationHistory = recommendCampgrounds(resData)
      console.log('now in 1', recommendedCampgroundsBasedOnReservationHistory)
      if (recommendedCampgroundsBasedOnReservationHistory.length === 0) {
        console.log('no unique recom')
        //console.log('no unique recom, sortedCampgroundData: ',sortedCampgroundData)//ok

        recommendedCampgroundsBasedOnReservationHistory = sortedCampgroundData
          .map(x => x.id)
          .slice(0, 3)
          // .filter(campgroundId =>
          //   !resData.some(res => res.label.equals(campgroundId))
          // )
      }
      if(recommendedCampgroundsBasedOnReservationHistory.length>0)
      {
        for(let r of recommendedCampgroundsBasedOnReservationHistory)
        {
          const camp=await Campground.findById(r)
          campsBasedOnResHis.push(camp)
        }
      }
    }

    const user = await User.findById(req.user._id).populate('favorites')
    if (user.favorites && user.favorites.length > 0) {
      const userFavorites = await generateData(user.favorites)
      recommendedCampgrounds = recommendCampgrounds(userFavorites)
      if (recommendedCampgrounds.length === 0) {
        console.log('no unique recom')
        //console.log('no unique recom, sortedCampgroundData: ',sortedCampgroundData)//ok

        recommendedCampgrounds = sortedCampgroundData
          .map(x => x.id)
          .slice(0, 3)
          // .filter(campgroundId =>
          //   !userFavorites.some(favorite => favorite.label.equals(campgroundId))
          // )
      }
    }

  }
  if (!req.user) {
    recommendedCampgrounds = sortedCampgroundData.map(x => x.id).slice(0, 3)

  }


  if(recommendedCampgrounds.length>0)
  {
    for(let r of recommendedCampgrounds)
    {
      const camp=await Campground.findById(r)
      campsBasedOnFavOrRanking.push(camp)
    }
  }



  res.render('campgrounds/fyp', { campsBasedOnResHis, campsBasedOnFavOrRanking })

  async function generateData(campgrounddata) {
    let data = []
    for (let c of campgrounddata) {
      //const c = res.campground;
      const yurk = c.amenities.includes('yurk') ? 1 : 0
      const stargazingtour = c.amenities.includes('stargazing tour') ? 1 : 0
      const zipline = c.amenities.includes('zipline') ? 1 : 0
      const kitchen = c.amenities.includes('kitchen') ? 1 : 0
      const hikingtour = c.amenities.includes('hiking tour') ? 1 : 0
      const foodtruck = c.amenities.includes('foodtruck') ? 1 : 0
      const breakfast = c.amenities.includes('breakfast') ? 1 : 0
      const fishingtour = c.amenities.includes('fishing tour') ? 1 : 0
      const premiumyurt = c.amenities.includes('premium yurt') ? 1 : 0
      const livemusic = c.amenities.includes('live music') ? 1 : 0
      const yogaclass = c.amenities.includes('yoga class') ? 1 : 0
      data.push({
        features: [await c.getRating(), yurk, stargazingtour, zipline, kitchen, hikingtour, foodtruck, breakfast, fishingtour, premiumyurt, livemusic, yogaclass],
        label: c._id
      })
    }
    return data
  }
  function recommendCampgrounds(campgrounddata) {
    const machine = new knn.kNear(10); // Adjust k value as needed
    for (let data of formattedData) {
      machine.learn(data.features, data.label);
    }
    const recommendations = new Set();
    for (let data of campgrounddata) {

      let prediction = machine.classify(data.features); // Use relevant feature(s) from favorites
      console.log('prediction: ', prediction)
      recommendations.add(prediction)
    }
    // Convert Set to array and remove already favorited campgrounds
    console.log('recommendations', recommendations)
    const uniqueRecommendations = [...recommendations].filter(campgroundId =>
      !campgrounddata.some(data => data.label.equals(campgroundId))
    );
    //const prediction=machine.classify([1,9])
    console.log('uniqueRecommendations', uniqueRecommendations)
    return uniqueRecommendations;
    //return prediction
  }
}

const makeResFromShowCampPage=async (req,res,next)=>{
  let unavailDates=[]
  let campId=req.params.id;
  const reservations = await Reservation.find({ campground: campId, status: {$in: ['confirmed','pending']} }).populate('campground');
  function gendays(startdate,enddate)
  {

  }


}
const getAllRes = async (req, res) => {
  try {
    const reservations = await Reservation.find({ campground: req.params.id, status: { $in: ['confirmed', 'pending'] } }).populate('campground');
    let data = [];
    reservations.forEach(r => {
      console.log('startDate & endDate: ',r.startDate,r.endDate)
      const start = formatDate(r.startDate);
      const end = formatDate(r.endDate);
      data.push({ s: start, e: end });
    });

    // Sort data by the start date (s property)
    data.sort((a, b) => {
      const dateA = new Date(a.s);
      const dateB = new Date(b.s);
      return dateA - dateB;
    });

    console.log('now in getAllRes, data: ', data);
    res.send(data);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).send('Internal Server Error');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  console.log('date: ',date)
  // const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');

  // const day = date.getDate().toString().padStart(2, '0');
const day=date.getUTCDate().toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  console.log('mm/dd/yyyy: ',`${month}/${day}/${year}`)
  return `${month}/${day}/${year}`;
}
const isHost = async (req, res, next) => {
  const campgrounds = await Campground.find({ author: req.user._id });
  if (campgrounds.length === 0) { // Check if the array is empty
    req.flash('error', 'You have no listings.');
    return res.redirect('/campgrounds');
  }
  // res.hostedCampgrounds = campgrounds; // Uncomment this line if needed
  res.send(campgrounds);

};




module.exports = { index, renderNewForm, createCampground, showCampround, renderEditForm, updateCampground, deleteCampground, search, searchAll,getAll, giveRecommendations,getAllRes,isHost };

