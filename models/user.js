const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  favorites: [{
    type: Schema.Types.ObjectId,
    ref: "Campground" // Reference to the Campground model
  }],
  // receiptUrls: [String]
})
UserSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    //it is possible that sometime u try to delete sth that was nvr found
    await Reservation.deleteMany({ user: doc._id });
    //delete all reviews where their id field is in our document
  }
});


UserSchema.plugin(passportLocalMongoose)//this is adding a pw n username field 
module.exports = mongoose.model('User', UserSchema)