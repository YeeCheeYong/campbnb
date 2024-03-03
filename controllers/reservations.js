//const { response } = require("express");
const Campground = require("../models/campground.js");
const Review = require("../models/review.js");
const Reservation = require("../models/reservation.js");
const reservation = require("../models/reservation.js");
const stripe = require("stripe")('sk_test_51OjaHmBVYSFxDsBkA2j2kygEfuLaEotX9ayC7YB5KnobbRxGQ7xtYx60TWcrLSUCZkDJlLbQZMsl0A8KTyg9qMlh00Ro30kzc2')
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const DOMAIN = process.env.MY_DOMAIN || 'http://localhost:4242';

const moment = require('moment')

const renderNewReservation = async (req, res) => {
  console.log('now in renderNewReservation')
  const campground = await Campground.findById(req.params.id)

  res.render("reservations/new", { campground, start: '', end: ''});
}
const renderNewReservationFromCheckDates = async (req, res) => {
  console.log('i am in renderNewReservationFromCheckDates, req.body: ',req.body)
  const campground = await Campground.findById(req.params.id)
  let startparts = req.body.start.split("/");
  let start=new Date(startparts[2], startparts[0] - 1, startparts[1]);

  let endparts = req.body.end.split("/");
  let end=new Date(endparts[2], endparts[0] - 1, endparts[1]);
  res.render("reservations/new", { campground, start: start.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) });


}

const createnewReservation = async (req, res, next) => {

  try {
    const campground = await Campground.findById(req.params.id);
    // const campground = new Campground(req.body.campground);
    console.log('req.params.id', req.params.id)
    console.log('now in createnewReservation', req.body.reservation)
    const reservation = new Reservation(
      req.body.reservation
    )
    reservation.user = req.user._id;

    await reservation.save()
    console.log('now in createnewReservation', req.params)
    console.log('now in createnewReservation', reservation)

    //add reservation to cart



    req.flash('success', 'Successfully created reservation')
    //res.redirect(`/campgrounds/${campground._id}/reservations/${reservation._id}/payment`);

    //res.redirect(`/cart`)
    //show reservation
    res.redirect(`/campgrounds/${campground._id}/reservations/${reservation._id}`)

  }
  catch (e) {

    req.flash('error', e.message)
    //res.redirect('reservations/new',{campground})
    res.redirect(`/campgrounds/${req.params.id}/reservations/new`);
  }
  next()
}

const showReservation = async (req, res) => {
  console.log('now in showReservation', req.params)
  const reservationId = req.params.reservationid


  const reservation = await Reservation.findById(req.params.reservationid).populate('campground');
  //res.send(reservation)
  res.render("reservations/show", { reservation });
}


const populateStoreItems = async (userId) => {
  try {
    // Find reservations belonging to the user with pending status
    //campground.author = req.user._id;
    const userReservations = await Reservation.find({ user: req.user._id, status: 'pending' }).populate('campground');

    // Iterate over user's reservations
    userReservations.forEach((reservation, index) => {
      // Extract necessary information from each reservation
      const { startDate, endDate, status, campground } = reservation;

      // Get the price from the associated campground
      const pricePerDay = campground.price;

      // Calculate the total price based on reservation dates and campground price
      const totalPrice = calculatePrice(startDate, endDate, pricePerDay);

      // Create a store item object
      const storeItem = {
        priceInCents: totalPrice,
        //name: `Reservation ${index + 1}`,
        name: `Reservation ${reservation._id}`,
        status: status
      };

      // Add the store item to the storeItems map
      storeItems.set(index + 1, storeItem);
      //storeItems.set(reservation._id,)
    });
  } catch (error) {
    console.error('Error populating storeItems:', error);
  }
};

const calculatePrice = (startDate, endDate, pricePerDay) => {
  // Example logic to calculate total price based on reservation dates and campground price
  const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // Calculate duration in days
  return durationInDays * pricePerDay; // Calculate total price
};



const confirmReservation = async (req, res) => {

}

const removeReservationFromCheckout = async (req, res) => {
  const campgroundId = req.params.id;
  const reservationId = req.params.reservationid;
  console.log('inside removeReservationFromCheckout', req.body)
  //make sure req.body has storeItems array

  // const u = await Reservation.find({ user: req.user._id, status: 'pending' }).populate('campground');
  // storeItems = u.filter(element => element._id.toString() !== reservationId)
  // console.log(storeItems)

  const reservationToBeRemovedFromCheckout = await Reservation.findByIdAndUpdate(
    reservationId,
    { $set: { status: 'removeFromCheckout' } },
    { new: true } // To return the updated document
  );
  //await reservationToBeRemovedFromCheckout.save()
  req.flash('success', 'Successfully removed this reservation from this checkout session')
  res.redirect(`/campgrounds/${req.params.id}/reservations/${req.params.reservationid}/payment`);
}
const deleteConfirmedReservation = async (req, res) => {
  const reservationId = req.params.reservationid;
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    if (reservation.startDate.getTime() > Date.now()) {
      await Reservation.findByIdAndDelete(reservationId);
      req.flash('success', 'Deleted confirmed reservation');
    } else {
      req.flash('error', 'Cannot delete reservation with past start date');
    }
  } catch (error) {
    req.flash('error', error.message);
  }
  res.redirect('/user');
}


module.exports = { renderNewReservation, createnewReservation, showReservation, deleteConfirmedReservation, renderNewReservationFromCheckDates };