const { campgroundSchema, reviewSchema, reservationSchema, searchSchema, searchDatesSchema2 } = require("./schemas.js");
const ExpressError = require('./utils/ExpressError.js')
const Campground = require("./models/campground.js");
const Review = require('./models/review.js')
const Reservation = require('./models/reservation.js')

const multer = require('multer')
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

const isLoggedIn = (req, res, next) => {
  console.log('REQ.USER...', req.user)
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl
    req.flash('error', 'You must be signed in first')
    return res.redirect('/login')
  }
  next();
}

//save returnTo value from session to res.locals
const storeReturnTo = (req, res, next) => {
  if (req.session.returnTo)
    res.locals.returnTo = req.session.returnTo;
  next()
}

const isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that')
    return res.redirect(`/campgrounds/${campground._id}`)
  }
  next();
}
//20240211
const isNotAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (campground.author.equals(req.user._id)) {
    req.flash('error', 'Since you are the author, you do not have permission to do that')
    return res.redirect(`/campgrounds/${campground._id}`)
  }
  next();
}
//20240212
const handlePreSaveError = async (err, req, res, next) => {
  const { id } = req.params;
  if (err.name === 'ValidationError') {
    req.flash('error', 'date is not available')
    return res.redirect(`/campgrounds/${campground._id}/reservations/new`)
  }
  next()
}
//20240212
const isPendingPayment = async (req, res, next) => {

}

const isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that')
    return res.redirect(`/campgrounds/${id}`)
  }
  next();
}

const validateCampground = (req, res, next) => {
  //pass our data to the schema
  const { error } = campgroundSchema.validate(req.body);
  console.log(error);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    //map over the details array of error objects n extract message element out of every details array, then join them together with ,
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    console.log(error);
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

const validateReservation = (req, res, next) => {
  try {
    console.log('now in validateReservation, req.body: ',req.body)
    const { error } = reservationSchema.validate(req.body);
    if (error) {
      console.log(error);
      const msg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(msg, 400);
    } else {
      next();
    }
  } catch (error) {
    req.flash('error', error.message)
    //res.redirect('reservations/new',{campground})
    res.redirect(`/campgrounds/${req.params.id}/reservations/new`);
  }
};
//20240219
const validateSearchFields = (req, res, next) => {
  try {
    const { error } = searchSchema.validate(req.query);
    if (error) {
      console.log(error);
      const msg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(msg, 400);
    } else {
      next();
    }
  } catch (error) {
    req.flash('error', error.message)
    //res.redirect('reservations/new',{campground})
    res.redirect(`/campgrounds?page=1&limit=4`);
  }
}
//20240220
const validateSearchDates = (req, res, next) => {
  try {
    const { error } = searchDatesSchema2.validate(req.body);
    if (error) {
      console.log(error);
      const msg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(msg, 400);
    } else {
      next();
    }
  } catch (error) {
    req.flash('error', error.message)
    //res.redirect('reservations/new',{campground})
    res.redirect(`/campgrounds?page=1&limit=4`);
  }
}


//20240219 
const paginateCampgrounds = (model) => {
  return async (req, res, next) => {
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)

    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const results = {}

    if (endIndex < await model.countDocuments().exec()) {
      results.next = {
        page: page + 1,
        limit: limit
      }
    }

    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      results.results = await model.find().limit(limit).skip(startIndex).exec()
      res.paginatedResults = results
      res.page = page;
      res.limit = limit;
      next()
    } catch (e) {
      res.status(500).json({ message: e.message })
    }
  }
}
const paginateReviews= async (req, res, next) => {
  const campground = await Campground.findById(req.params.id).populate({
    path: 'reviews',
    populate: {
      path: 'author'
    }
  }).populate("author");
    const reviews=campground.reviews
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)

    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const results = {}

    if (endIndex < reviews.length) {
      results.next = {
        page: page + 1,
        limit: limit
      }
    }

    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      if (startIndex || endIndex) {
        results.results = reviews.slice(startIndex, endIndex);
      }
      else {
        results.results = reviews
      }
      //results.results = reviews.slice(startIndex,endIndex)
      res.paginatedResults = results
      res.page = page;
      res.limit = limit;
      next()
    } catch (e) {
      res.status(500).json({ message: e.message })
    }
  }


const setPaginatedSearchResults = (req, res, next) => {

  res.locals.paginatedSearchResults = res.paginatedSearchResults;
  console.log('inside setPaginatedSearchResults, res.locals.paginatedSearchResults', res.locals.paginatedSearchResults)
  next();
};



const paginateSearchDocuments = async (req, res, next) => {
  console.log('inside paginateSearchDocuments, req.query:', req.query)//req.query is passed here
  const { startDate, endDate, campgroundName,am } = req.query
  const documents = res.paginatedSearchResults
  page = parseInt(req.query.page);
  limit = parseInt(req.query.limit);
  console.log('inside paginateSearchDocuments, page:', page)
  console.log('inside paginateSearchDocuments, limit:', limit)
  console.log('inside paginateSearchDocuments, documents:', documents)

  //if(page&limit){
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};

  if (endIndex < documents.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  //}
  console.log('inside paginateSearchDocuments, startIndex:', startIndex)
  console.log('inside paginateSearchDocuments, endIndex:', endIndex)
  try {
    if (startIndex || endIndex) {
      results.results = documents.slice(startIndex, endIndex);
    }
    else {
      results.results = documents
    }
    console.log('inside paginateSearchDocuments, results: ', results)
    console.log('inside paginateSearchDocuments, results.results: ', results.results)
    res.paginatedSearchResults = results;
    console.log('inside paginateSearchDocuments, res.paginatedSearchResults: ', res.paginatedSearchResults)
    const campgrounds = res.paginatedSearchResults.results;
    console.log('inside paginateSearchDocuments, campgrounds: ', campgrounds)
    const prevPage = res.paginatedSearchResults.previous ? res.paginatedSearchResults.previous.page : null;
    console.log('inside paginateSearchDocuments, prevPage: ', prevPage)

    const nextPage = res.paginatedSearchResults.next ? res.paginatedSearchResults.next.page : null;
    const allCamps=await Campground.find({})
    console.log('inside paginateSearchDocuments, nextPage: ', nextPage)
    res.render("campgrounds/index", { campgrounds, prevPage, nextPage, startDate, endDate, am, campgroundName,allCamps });
    //res.redirect('/campgrounds')
  } catch (e) {
    res.status(500).json({ message: e.message });
  }

};


module.exports = { isLoggedIn, storeReturnTo, isAuthor, validateCampground, validateReview, validateReservation, isReviewAuthor, isNotAuthor, handlePreSaveError, paginateCampgrounds, validateSearchFields, setPaginatedSearchResults, paginateSearchDocuments,validateSearchDates,paginateReviews };