const express = require('express')
const router = express.Router()
const catchAsync = require('../utils/catchAsync')
const User = require('../models/user')
const passport = require('passport')
const { isLoggedIn, storeReturnTo } = require('../middleware.js')
const users = require('../controllers/users')
const carts = require('../controllers/carts')




router.route('/register')
.get(users.renderRegister)
.post(catchAsync(users.register))

router.route('/login')
.get(users.renderLogin)
.post(storeReturnTo, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

router.get('/logout', users.logout)
//20240208
router.get('/user', isLoggedIn,users.getUserData)
//20240220
router.delete('/user/:reservationid',isLoggedIn,carts.deleteItemFromCart,users.redirectToUser)

//20240221 fav
router.get('/user/favourites',isLoggedIn,users.getFavs)
router.post('/user/favourites',isLoggedIn,users.postFavs)
router.delete('/user',isLoggedIn,
  catchAsync(users.deleteUser))

module.exports = router;
