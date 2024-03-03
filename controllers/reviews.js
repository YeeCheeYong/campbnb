const Campground = require("../models/campground.js");
const Review = require("../models/review.js");


const createReview=async (req, res) => {
  //console.log(req.params,"i am in review route")
  console.log('i am in createReview',req.body.review)
  const campground = await Campground.findById(req.params.id);

  const review = new Review(req.body.review);
  review.author = req.user._id;//associate review w/ a user
  campground.reviews.push(review);
  await review.save();
  await campground.save();//save campground as well bcos we just added review in the campground reviews array
  req.flash('success', 'Created new review!')
  res.redirect(`/campgrounds/${campground._id}`);
}
const deleteReview=async (req, res, next) => {
  console.log(req.params);
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash('success', 'Successfully deleted review')
  res.redirect(`/campgrounds/${id}`);
}
module.exports={createReview,deleteReview}