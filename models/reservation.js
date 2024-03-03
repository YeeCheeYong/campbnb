const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Campground = require("./campground");
const Cart = require("./cart");
const ReservationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    //required: true
  },
  campground: {
    type: Schema.Types.ObjectId,
    ref: "Campground",
    //required: true
  },
  startDate: {
    type: Date,
    //default: ()=>Date.now(),
    //required: true,
    validate: {
      validator: function (v) {
        return (
          v && // check that there is a date object
          v.getTime() > Date.now() + 24 * 60 * 60 * 1000 //&&
          //v.getTime() < Date.now() + 90 * 24 * 60 * 60 * 1000
        );
      }
    },
  },
  endDate: {
    type: Date,
    //default: ()=>Date.now(),
    //required: true,
    // validate: {
    //   validator: function (v) {
    //     return (
    //       v && v > this.startDate
    //     );
    //   }
    // },
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
    //required: true
  },
  // receipt_url: {
  //   type: String
  // }
  // Add any additional reservation-related fields here
},

  // {
  //   methods: {
  //     async getCheckoutName() {
  //       await this.populate('campground');
  //       const durationInDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  //       let day=(durationInDays<=1)?'day':'days'
  //       return `${this.campground.title} ${durationInDays} ${day}`
  //     },

  //   }
  // },

  {
    timestamps: true
  });

ReservationSchema.pre('validate', function (next) {
  try {
    if (this.startDate > this.endDate) {
      this.invalidate('startDate', 'Start date must be earlier than end date.', this.startDate);
      //throw new Error('end Date must be greater than start date')
    }

    next();
  }
  catch (error) {
    next(error)
  }
});

// Pre-save hook to check for overlapping reservations
ReservationSchema.pre('save', async function (next) {
  try {
    const existingReservation = await this.constructor.findOne({
      campground: this.campground,
      startDate: { $lt: this.endDate },
      endDate: { $gt: this.startDate },
    });

    if (existingReservation) {
      throw new Error('Reservation dates overlap with existing reservation for the same campground.');
    }

    next();
  } catch (error) {
    next(error);
  }
});


ReservationSchema.pre('findOneAndUpdate', function (next) {
  this.options.runValidators = true
  next()
})

// Post-remove hook to delete cart's referenced reservations from storeItems
ReservationSchema.post('findOneAndDelete', async function (doc, next) {
  try {
    if (doc) {
      // Find carts containing the deleted reservation and update them
      await Cart.updateMany(
        { 'storeItems.name': doc._id },
        { $pull: { storeItems: { name: doc._id } } }
      );



    }
    next();
  } catch (error) {
    next(error);
  }
});


// Define a virtual property for total price calculation
ReservationSchema.virtual('totalPrice').get(function () {
  // Calculate the duration of the reservation in days
  const durationInDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));

  // Get the price per day from the associated campground
  const campgroundPricePerDay = this.campground.price;

  // Calculate the total price by multiplying the duration with the price per day
  return durationInDays * campgroundPricePerDay;
});
ReservationSchema.virtual('duration').get(function () {
  // Calculate the duration of the reservation in days
  const durationInDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  return durationInDays;
});
ReservationSchema.virtual('checkoutName').get(function(){
  const durationInDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  let day = (durationInDays <= 1) ? 'day' : 'days';
  let title = this.campground.title.length > 20 ? this.campground.title.substring(0, 20) + '...' : this.campground.title;
  return `${title} ${durationInDays} ${day}`;
});


module.exports = mongoose.model("Reservation", ReservationSchema);
