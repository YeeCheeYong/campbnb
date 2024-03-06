if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
//20240302
const BASE_URL=process.env.NODE_ENV === "production"
? "https://campbnb.xyz"
: "http://localhost:3000";


//20240212
const bodyParser = require('body-parser')




// console.log(process.env.BUCKET_REGION)
// console.log(process.env.API_KEY)
// console.log(process.env.ABC)

//const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
//const router = express.Router({ mergeParams: true });
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require('express-session')
const flash = require('connect-flash')
const Joi = require("joi");
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet')
const MongoStore = require('connect-mongo');



const { campgroundSchema, reviewSchema } = require("./schemas.js");
const catchAsync = require("./utils/catchAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Campground = require("./models/campground.js");
const Review = require("./models/review.js");
const methodOverride = require("method-override");
//const Campground = new mongoose.model('Campground',CampgroundSchema)
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user.js')

const campgroundRoutes = require('./routes/campgrounds.js')
const reviewRoutes = require('./routes/reviews.js')
const userRoutes = require('./routes/users.js')
// 20240210
const reservationRoutes = require('./routes/reservations.js')
//20240214
const cartRoutes=require('./routes/carts.js')


const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
const moment = require('moment')
// const bucketName = process.env.BUCKET_NAME
// const region = process.env.BUCKET_REGION
// const accessKeyId = process.env.AWS_ACCESS_KEY_ID
// const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

// const s3Client = new S3Client({
//   region,
//   credentials: {
//     accessKeyId,
//     secretAccessKey
//   }
// })
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp"
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express()
// //20240212
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({extended: true}))

app.engine("ejs", ejsMate);
//tell express to use this engine to parse ejs bcos express has its own defaut engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));


app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')))

const secret = process.env.SECRET || 'thisshouldbeabettersecret!'

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,//nterval (total secs = hours*min*secs) between session updates.
  //if u dont want to resave all the 
  crypto: {//Enables transparent crypto in accordance with OWASP session management recommendations.
    //in layman term this means to do lazy update to the session; if data has changed, update.  else if same, dont continuously update everytime user refreshes the page but do it once/24hrs (as defined above)
    secret
  }
});


const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }

}

app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())//to initialize Passport
app.use(passport.session())//to use persistent login session (vs having to log in on every http req, which is more common with APIs)
app.use(mongoSanitize())
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://use.fontawesome.com/",
  "https://fonts.gstatic.com/",
  "https://fonts.googleapis.com"
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://cdn.jsdelivr.net",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://fonts.gstatic.com/",
  

];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
const fontSrcUrls = [
  "https://fonts.gstatic.com/",
  "https://fonts.googleapis.com"
];
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://yelpcamp-image-upload.s3.amazonaws.com/",
          "https://yelpcamp-image-upload.s3.us-east-1.amazonaws.com/",
          "https://yelpcamp-image-upload-thumbnails.s3.amazonaws.com/",
          "https://res.cloudinary.com/douqbebwk/",
          "https://images.unsplash.com/"
        ],
        fontSrc: ["'self'", ...fontSrcUrls],
      }
    }
  })
)



passport.use(new LocalStrategy(User.authenticate()));
//we want passport to use the local strategy that we hav downloaded n required n for that local strategy, the authentication method is to be located on our model n it is called authenticate()
passport.serializeUser(User.serializeUser())//serialize=how to store a user in the session
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
  //res.locals.returnTo = req.originalUrl
  console.log(req.query)
  res.locals.currentUser = req.user;
  //20240219 
  // res.locals.paginatedSearchResults=res.paginatedSearchResults;
  res.locals.cartid=res.cartid
  res.locals.moment=moment;

  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})
//routes
app.get('/fakeUser', async (req, res) => {
  const user = new User({ email: 'colt@gmail.com', username: 'colt' })
  const newUser = await User.register(user, 'chicken')//passport package's prepackaged method that registers user
  res.send(newUser);
})

app.get('/test',async(req,res)=>{
  res.render('campgrounds/test')
})
app.post('/test',async(req,res)=>{
  console.log('req.body: ',req.body)
  res.send(req.body)
})


//20240214
app.use('/cart',cartRoutes)
//20240212
app.use(express.json());
app.use('/campgrounds', campgroundRoutes)

app.use('/campgrounds/:id/reviews', reviewRoutes)
// 20240210
app.use('/campgrounds/:id/reservations', reservationRoutes)
// app.get('/a/:id/b/:idd',(req,res)=>{
// console.log('now in aidbidd', req.params.id,req.params.idd)
// })

app.use('/', userRoutes)



app.get("/", (req, res) => {
  res.render("home");
});


app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404)); //pass an error to next, which will hit the error handler below
});
//generic error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "ohno" } = err; //destructure fr error
  console.log(statusCode);
  console.log(err.message);
  if (!err.message) err.message = "Oh No, Something Went Wrong";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`serving on port ${port}`);
});
