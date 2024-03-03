const User = require('../models/user')
const Reservation = require('../models/reservation')
const Campground = require('../models/campground')
const { default: mongoose } = require('mongoose')
const renderRegister = (req, res) => {
  res.render('users/register')
}
const register = async (req, res) => {
  try {
    //const user = new User({ email: req.body.email, username: req.body.username })
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registedUser = await User.register(user, password)
    req.login(registedUser, err => {
      if (err) return next(err);
      req.flash('success', 'Welcome to Yelp Camp')
      res.redirect('/campgrounds')
    })

  }
  catch (e) {
    req.flash('error', e.message)
    res.redirect('register')
  }
}
const renderLogin = (req, res) => {
  res.render('users/login')
}
const login = (req, res) => {
  req.flash('success', 'Welcome back')
  //20240223 to stop redirecting to url in fetch
  // const redirectUrl = res.locals.returnTo || '/campgrounds';
  let redirectUrl
  if(res.locals.returnTo&&(res.locals.returnTo==='/cart/existsOrNot'||res.locals.returnTo==='/campgrounds/getAll'))
  {
    redirectUrl='/campgrounds'
  }
  else
  redirectUrl = res.locals.returnTo || '/campgrounds'
  //delete req.session.returnTo
  res.redirect(redirectUrl)
}
const logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.flash('success', 'Goodbye')
    res.redirect('/campgrounds')
  }
  )
}
// 20240220
const getUserData = async (req, res, next) => {
  try {
    const pendingReservations = await Reservation.find({ user: req.user._id, status: 'pending' }).populate('campground')
    const confirmedReservations = await Reservation.find({ user: req.user._id, status: 'confirmed' }).populate('campground')
    const userID = req.user._id;
    const user = await User.findById(userID).populate('favorites')
    const favCampgrounds=user.favorites
    res.render('users/user', { user, pendingReservations, confirmedReservations, favCampgrounds });
  } catch (e) {
    req.flash('error', 'Error fetching reservations in user page')
    res.redirect('/campgrounds')
  }
}
const redirectToUser = async (req, res) => {
  res.redirect('/user')
}
const getFavs = async (req, res, next) => {

  try {
    const user = await User.findById(req.user._id).populate('favorites');
    const favs = user.favorites.map(favorite => favorite._id);
    res.json(favs);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  // const campground = await Campground.findOne({ title: 'chee camp' })
  // let fakeFavs = []
  // fakeFavs.push(campground._id)
  // res.json(fakeFavs)


}

const postFavs = async (req, res, next) => {
  //console.log('req.body.toggled', req.body.toggled)
  const toggled = req.body.toggled;
  //find campground
  const toggledId = new mongoose.Types.ObjectId(toggled)
  const campground = await Campground.findById(toggledId)
  //console.log('inside postFavs, campground:',campground)

  const user = await User.findById(req.user._id).populate('favorites')
  //console.log('inside postFavs, user.favorites',user.favorites)
  //  const user = await User.findById(req.user._id);
  if (req.body.action === 'remove') {
    await User.updateOne({ _id: req.user._id }, {
      $pull: {
        favorites: campground._id
      }
    })
  }
  if (req.body.action === 'add') {
    user.favorites.push(campground)
  }

  await user.save();
  //console.log('inside postFavs, user.favorites:',user.favorites)
  // Send response or do other processing as needed
};
const deleteUser = async (req, res) => {
  //const  id } = req.params;
  const user = await User.findByIdAndDelete(req.user._id);
  req.flash('success', 'Successfully deleted user.  We are sad to see you go.  Please come back anytime.')
  res.redirect("/campgrounds");
}


module.exports = { renderRegister, register, renderLogin, login, logout, getUserData, redirectToUser, getFavs, postFavs,deleteUser }