const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema; 
//bcos we will reference mongoose.Schema a lot
const opts = {
  toJSON: { virtuals: true }
};

const CampgroundSchema = new Schema({
  title: String,
  images: [{
    url: String,
    filename: String,
    thumbnail: String
  }],
  geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  amenities: {
    type: [String],
    enum: ['yurt', 'stargazing tour', 'zipline', 'kitchen', 'hiking tour', 'foodtruck', 'breakfast', 'fishing tour', 'premium yurt', 'live music', 'yoga class'],
    default: []
  }
},
  {
    methods: {
      async getRating() {
        await this.populate('reviews');
        //mongoose.model('Review').find({})
        //console.log('in virtual, reviews: ',this.reviews) //got reviews
        if (!this.reviews || this.reviews.length === 0) {
          return 0;
        }
        let totalRating = 0;
        //console.log(totalRating)
        this.reviews.forEach(review => {
          totalRating += review.rating;
          //console.log('in loop',totalRating)
        });
        //console.log('after loop total rating: ',totalRating)
        const averageRating = totalRating / this.reviews.length;
        //console.log('averageRating',averageRating)
        return averageRating;
        //return this.reviews.length
      },
    }
  },


  {
    timestamps: true
  }, opts);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
<p>${this.description.substring(0, 20)}...</p>`

})



CampgroundSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    //it is possible that sometime u try to delete sth that was nvr found
    await Review.deleteMany({ _id: { $in: doc.reviews } });
    //delete all reviews where their id field is in our document
  }
});

//for keyword search
CampgroundSchema.index({'$**':'text'})

module.exports = mongoose.model("Campground", CampgroundSchema);
