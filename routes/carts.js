const express = require('express')
const bodyparser = require('body-parser')
const router = express.Router({ mergeParams: true })
const catchAsync = require('../utils/catchAsync')


const reservations = require('../controllers/reservations.js')
const carts = require('../controllers/carts.js')
const { isLoggedIn, storeReturnTo, isAuthor, validateCampground, isReviewAuthor, uploadImage, isNotAuthor, validateReservation, handlePreSaveError,setReceiptUrl } = require('../middleware.js')





router.get("/", isLoggedIn, catchAsync(carts.getCart));
//router.post("/", isLoggedIn, carts.addItemstoCart);
router.delete("/:reservationid", isLoggedIn, carts.deleteItemFromCart,carts.redirectToCart)

router.get("/create-checkout-session", isLoggedIn, carts.createCheckoutSession)

router.get("/existsOrNot",isLoggedIn,carts.existsOrNot)

router.post("/webhook", express.raw({ type: "application/json" }),carts.handleWebhook)

router.get('/:cartid/success',isLoggedIn,carts.handleSuccess)
router.get('/:cartid/cancel',isLoggedIn,carts.handleCancel)
module.exports = router