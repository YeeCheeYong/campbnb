const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Campground = require('../models/campground.js');
const cities = require("./cities.js");
const { places, descriptors } = require('./seedHelpers.js')
//const Campground = new mongoose.model('Campground',CampgroundSchema)

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

//array[Math.floor(Math.random()*array.length)]

const sample = array => array[Math.floor(Math.random() * array.length)]


const seedDB = async () => {
  await Campground.deleteMany();
  for (let i = 0; i < 200; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      //your user id
      author: '6513520f99e0acb164819895',
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,

      description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquam, dolores delectus fugit praesentium assumenda enim autem minima recusandae numquam illum obcaecati, rem, maxime quasi vel ab iure sed doloremque dolor!',
      price,
      geometry: { type: 'Point', coordinates: 
      [cities[random1000].longitude,
      cities[random1000].latitude] 
    },
      images: [
        {
          url: 'https://yelpcamp-image-upload.s3.amazonaws.com/YelpCamp/8eea6ac1447642402ba35a864505bce5db9305782217ad2ac849c4dee6082012',
          filename: 'YelpCamp/8eea6ac1447642402ba35a864505bce5db9305782217ad2ac849c4dee6082012',
           thumbnail: 'https://yelpcamp-image-upload-thumbnails.s3.amazonaws.com/YelpCamp/8eea6ac1447642402ba35a864505bce5db9305782217ad2ac849c4dee6082012'

        },
        {
          url: 'https://yelpcamp-image-upload.s3.amazonaws.com/YelpCamp/efed902e07079b7a4fe36ee6c097027c9848a4318402dde83626282c64eebe46',
          filename: 'YelpCamp/efed902e07079b7a4fe36ee6c097027c9848a4318402dde83626282c64eebe46',
          thumbnail:'https://yelpcamp-image-upload-thumbnails.s3.amazonaws.com/YelpCamp/efed902e07079b7a4fe36ee6c097027c9848a4318402dde83626282c64eebe46'

        }]
    })
    await camp.save();
  }
}
seedDB().then(() => {
  mongoose.connection.close()
})