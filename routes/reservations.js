const express = require('express')
const router = express.Router({ mergeParams: true })
const catchAsync = require('../utils/catchAsync')
const Reservation = require('../models/reservation.js')
//const passport = require('passport')

const reservations = require('../controllers/reservations.js')
const carts = require('../controllers/carts.js')
const { isLoggedIn, storeReturnTo, isAuthor, validateCampground, isReviewAuthor, uploadImage, isNotAuthor, validateReservation, handlePreSaveError, setCartAsVisible, validateSearchDates } = require('../middleware.js')
// const { createCheckoutSession } = require('../stripe/index.js')


router.post("/", isLoggedIn, validateReservation, catchAsync(reservations.createnewReservation), carts.addItemstoCart)
// router.post("/search",reservations.search)
router.get("/new", isLoggedIn, isNotAuthor, reservations.renderNewReservation);
router.post("/new", isLoggedIn, isNotAuthor,reservations.renderNewReservationFromCheckDates);


router.route('/:reservationid')
  .get(catchAsync(reservations.showReservation))
router.delete('/:reservationid', isLoggedIn, reservations.deleteConfirmedReservation)


module.exports = router