
const express = require('express')
const router = express.Router({ mergeParams: true })
const Campground = require("../models/campground.js");
const Review = require("../models/review.js");

const ExpressError = require("../utils/ExpressError.js");
const catchAsync = require("../utils/catchAsync.js");
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware.js')
const reviews = require('../controllers/reviews.js')

router.post(
  "/", isLoggedIn,
  validateReview,
  catchAsync(reviews.createReview),

);
//the route does not necessarily have a page.  the res.render/redirect etc is the page u will eventually see
router.delete(
  "/:reviewId", isLoggedIn, isReviewAuthor,
  catchAsync(reviews.deleteReview))

module.exports = router
