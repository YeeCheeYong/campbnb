const mongoose = require("mongoose");
const Reservation = require("./reservation");
const Schema = mongoose.Schema; //bcos we will reference mongoose.Schema a lot
//const opts = { toJSON: { virtuals: true } };

const CartSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  storeItems: [{
    name: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true
    },
    quantity: {
      type: Number,
      //required: true,
      default: 1
    },
    price: Number
  }],

}, {
  timestamps: true
})

// Define post middleware for removing reservation after removing item from storeItems
// CartSchema.post('findOneAndDelete', async function(doc) {
//   // Check if any items were removed
//   //if (this._update.$pull && this._update.$pull.storeItems) {
//     //const removedReservationIds = this._update.$pull.storeItems.map(item => item.name);

//     //const res = await Product.deleteMany({ _id: { $in: farm.products } });
    


//     // Delete reservations from Reservation model
//     await Reservation.deleteMany({ _id: { $in: doc.storeItems.map(item=>item.name) } });
//   //}
// });

// Define pre middleware for deleting user's reservations when cart is removed
// CartSchema.pre('remove', async function(next) {
//   try {
//     const reservations = await Reservation.find({ user: this.owner });
//     const reservationIds = reservations.map(reservation => reservation._id);
//     await Reservation.deleteMany({ _id: { $in: reservationIds } });
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Define post middleware to delete cart when storeItems array becomes empty
// CartSchema.post('findOneAndUpdate', async function(doc) {
//   if (doc.storeItems.length === 0) {
//     await this.model.deleteOne({ _id: doc._id });
//   }
// });

module.exports = mongoose.model("Cart", CartSchema);