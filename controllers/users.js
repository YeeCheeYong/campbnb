const User = require('../models/user')
const Reservation = require('../models/reservation')
const Campground = require('../models/campground')
const { default: mongoose } = require('mongoose')
const reservation = require('../models/reservation')
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
  if(res.locals.returnTo&&(res.locals.returnTo==='/cart/existsOrNot'||res.locals.returnTo==='/campgrounds/getAll'||res.locals.returnTo==='/campgrounds/hostExistsOrNot'))
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
const hostpgage = async (req, res) => {
  try {
    const userID = req.user._id;
    const user = await User.findById(userID);
    let campgrounds = res.hostedCampgrounds;
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let begMonth=currentMonth-2;
    let begYear;
    if(begMonth<0)
    { begMonth+=12;
      begYear=currentYear-1
    }
    else begYear=currentYear;

    let lastThreeMonthsAveOccupancy=[]
for(let c of campgrounds)
{

      let lastThreeMonthsRevenue = [];
      let lastThreeMonthsOccupancy=[];
      let occupied=0;let total;
      for (let i = 0; i < 3; i++) {
        const startDate = new Date(begYear, begMonth, 1);
        let daysInMonth = new Date(2019, begMonth, 0).getDate();
        total=daysInMonth;
        if (begMonth == 1 && begYear % 4 == 0) {
          daysInMonth = daysInMonth + 1;
        }
        const endDate = new Date(begYear, begMonth, daysInMonth);
        const revenue = await Reservation.find({
          startDate: { $gte: startDate },
          endDate: { $lte: endDate },
          campground: c._id,
          status: 'confirmed' // Assuming only confirmed reservations contribute to revenue
        })
          .then(reservations => {
            return reservations.reduce((totalRevenue, reservation) => {
              // Calculate the total revenue for the current month by summing the totalPrice of each reservation
              return totalRevenue + reservation.totalPrice;
            }, 0);
          })
          .catch(error => {
            console.error('Error calculating revenue:', error);
            return 0;
          });

          occupied=await Reservation.find({
            startDate: { $gte: startDate },
            endDate: { $lte: endDate },
            campground: c._id,
            status: 'confirmed' 
          })
          .then(reservations=>{
            return reservations.reduce
            ((totalOccupiedDays,reservation)=>{
              return totalOccupiedDays+reservation.duration;
            },0)
          })
          .catch(error => {
            console.error('Error calculating occupancy:', error);
            return 0;
          });
        lastThreeMonthsRevenue.push(revenue);
        lastThreeMonthsOccupancy.push(occupied/total*100)
        
        begMonth += 1;
          if(begMonth>=0)begYear+=1;
      }
      console.log('lastThreeMonthsRevenue: ', lastThreeMonthsRevenue);
      c.lastThreeMonthsRevenue = lastThreeMonthsRevenue; 
      c.lastThreeMonthsOccupancy=lastThreeMonthsOccupancy
    
    }
    let temp=0;
    campgrounds.map(c=>{
      temp+=c.lastThreeMonthsAveOccupancy;
    })
    lastThreeMonthsAveOccupancy.push(temp/campgrounds.length)

    res.render('users/host', { user, campgrounds,lastThreeMonthsAveOccupancy });
  } catch (error) {
    console.error('Error in host page:', error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = { renderRegister, register, renderLogin, login, logout, getUserData, redirectToUser, getFavs, postFavs,deleteUser,hostpgage }