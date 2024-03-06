//const { response } = require("express");
const Campground = require("../models/campground.js");
const Review = require("../models/review.js");
const Reservation = require("../models/reservation.js")
const Cart = require("../models/cart.js")
const User = require("../models/user.js")
const stripe = require("stripe")('sk_test_51OjaHmBVYSFxDsBkA2j2kygEfuLaEotX9ayC7YB5KnobbRxGQ7xtYx60TWcrLSUCZkDJlLbQZMsl0A8KTyg9qMlh00Ro30kzc2')
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
const BASE_URL=process.env.NODE_ENV === "production"
? "https://campbnb.xyz"
: "http://localhost:3000";
const moment = require('moment')


const getCart = async (req, res, next) => {
  console.log('now in getCart, req.query', req.query)
  const owner = req.user._id;
  try {
    console.log('now in getCart')
    // const cart = await Cart.findOne({ owner }).populate('storeItems.name')//.populate('Campground')
    const cart = await Cart.findOne({ owner }).populate({
      path: 'storeItems.name',
      populate: {
        path: 'campground',
        model: 'Campground', // Make sure to specify the model
        select: 'title' // Include the fields you want to populate
      }
    });
    console.log('now in getCart, cart: ',cart)
    if (!cart) throw new Error('Cart is empty')
    if (!cart.storeItems || cart.storeItems.length === 0) {

      await Cart.findByIdAndDelete(cart._id);
      throw new Error('Cart is empty')
    }

    if (cart && cart.storeItems.length > 0) {
      // for(storeItem of storeItems)
      // {
      //   const
      // }
      console.log('cart: ', cart)
      //res.send(cart)
      //show cart

      //check n delete pending reservations - on startdate or 3 days after creation
      const reservations = await Reservation.find({ status: "pending", user: cart.owner._id })
        .populate('campground');

      for (const reservation of reservations) {
        //if(reservation.createdAt.getTime()===(reservation.startDate.getTime()))
        if (reservation.startDate.getTime() === (moment().toDate().getTime())) {
          await Reservation.findByIdAndDelete(reservation._id)
        }
        if (reservation.createdAt.getTime() === moment().add(3, 'days').toDate().getTime()) {
          await Reservation.findByIdAndDelete(reservation._id);
        }
      }
      //console.log('now in getCart, createdAt',reservations)
      //delete cart if empty?
      res.render("carts/show", { cart })
    }
    else //res.send(null)
    {
      req.flash('error', 'Cart is empty')
      res.redirect('/campgrounds')
    }
  }
  catch (e) {
    req.flash('error', e.message)
    res.redirect('/campgrounds')
  }
}


const addItemstoCart = async (req, res, next) => {
  const owner = req.user._id;
  const storeItemData = req.body.storeItem;
  const campgroundId = req.body.campgroundId; // Assuming campgroundId is a separate field in the request body
  const reservationId = req.body.reservationId; // Assuming reservationId is a separate field in the request body

  try {
    let cart = await Cart.findOne({ owner });

    if (!cart) {
      // If cart doesn't exist, create a new one
      cart = new Cart({ owner });
    }


    //go to res model, pull all reservations w/ owner, pending,
    const reservations = await Reservation.find({ status: "pending", user: cart.owner._id })
      .populate('campground');

    //console.log('now in addItemsToCart, reservations:', reservations)

    // Iterate through the reservations
    for (const reservation of reservations) {
      //reservations.forEach((reservation, index) => {

      //if storeItemData = existing reservation, skip that reservation

      // Check if a storeItem with the same name already exists in the cart's storeItems array
      const existingStoreItem = await cart.storeItems.find(item => item.name.toString() === reservation._id.toString());

      // If an existing storeItem with the same name is found, skip this iteration
      if (existingStoreItem) {
        continue;
      }

      const { startDate, endDate, status, campground } = reservation;
      console.log('now in addItemsToCart, reservation:', reservation)
      console.log('now in addItemsToCart, campground.price:', reservation.campground.price)
      // Create a new storeItem for each reservation
      const newStoreItem = {
        name: reservation._id,
        //quantity: 1, // Default quantity to 1
        price: reservation.totalPrice,
      };

      // Push the new storeItem into the cart's storeItems array
      cart.storeItems.push(newStoreItem);
      //}
      //})
    }


    // Save the cart
    await cart.save();

    // Redirect to the cart page
    //res.redirect('/cart');
    // res.cartid = cart._id;
    // next()
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/campgrounds/${campgroundId}/reservations/${reservationId}`);
  }

};

const deleteItemFromCart = async (req, res, next) => {
  try {
    const owner = req.user._id;
    const cart = await Cart.findOne({ owner });

    if (!cart) {
      throw new Error('Cart not found');
    }
    else {
      const cartId = cart._id.toString().trim()
      if (cart.storeItems.length === 0 || !cart.storeItems) {
        const existingCart = await Cart.findById(cartId);
        if (existingCart) {
          await Cart.findByIdAndDelete(cartId);
        }
      }


      // // Filter out the storeItem with the name matching req.params.reservationid
      // cart.storeItems = cart.storeItems.filter(item => item.name.toString() !== req.params.reservationid);

      // // Save the updated cart
      // await cart.save();

      //const reservation = await Reservation.findByIdAndDelete(req.params.reservationid)
      const reservation = await Reservation.findOneAndDelete({ _id: req.params.reservationid, user: owner, status: 'pending' });

      if (!reservation)
        throw new Error('reservation is not found')

      //If cart's storeItems array is empty, remove the cart
      if (cart.storeItems && cart.storeItems.length === 0) {
        await Cart.findByIdAndDelete(cart._id);
      }
      console.log('now in deleteItemFromCart, deleted cart')
      //res.redirect("/cart");
      next()
    }
  } catch (e) {
    // Handle errors
    req.flash('error', e.message);
    res.redirect('/campgrounds');
  }
}
const redirectToCart = async (req, res) => {
  res.redirect("/cart")
}

const handleSuccess = async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  // const cart=Cart.findById(req.params.cartid)
  // if(!cart)
  const lineItems = await stripe.checkout.sessions.listLineItems(
    req.query.session_id
  );
  //const customer = await stripe.customers.retrieve(session.customer);
  console.log('now in handleSuccess, session:', session)
  console.log('now in handleSuccess, lineItems:', lineItems)

  //console.log('now in handleSuccess, customer:', customer)//return null
  const cartId = req.params.cartid;
  res.render("carts/success", { lineItems, session })

}



const createCheckoutSession = async (req, res, next) => {
  try {
    const owner = req.user._id
    const cart = await Cart.findOne({ owner }).populate({
      path: 'storeItems.name',
      populate: {
        path: 'campground',
        model: 'Campground', // Make sure to specify the model
        select: 'title' // Include the fields you want to populate
      }
    });
    if (cart && cart.storeItems.length > 0) {
      console.log("in createCheckoutSession", cart.storeItems)
      //const storeItems = new Map();

      // cart.storeItems.forEach((storeItem)=>{
      //   storeItem.name.
      // })

      const storeItemsArray = cart.storeItems.map(storeItem => ({
        //name: storeItem.name._id.toString(),
        name:`${storeItem.name._id.toString()} ${storeItem.name.checkoutName}`,
        price: storeItem.price,
      }));
      console.log('storeItemsArray', storeItemsArray)
      // Proceed with creating the checkout session using the storeItems map
      const cus = await User.findById(req.user._id)

      const session = await stripe.checkout.sessions.create({
        customer_email: cus.email,
        //customer_email: 'yongyeechee@gmail.com',
        payment_method_types: ["card"],
        mode: "payment",
        invoice_creation: { enabled: true },
        line_items: [...storeItemsArray.values()].map((item, i) => {

          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.name
                //campground: storeItem.campground
              },
              unit_amount: item.price * 100, // Use price in cents
            },
            quantity: 1,
          };
        }),

        //success_url: `http://localhost:3000/cart/${cart._id}/checkout/success`,
        success_url: `${BASE_URL}/cart/${cart._id}/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: `${BASE_URL}/cart/${cart._id}/cancel`
      });

      res.redirect(session.url);
    } else {
      // Handle case where cart is empty
      //res.status(400).json({ error: 'Cart is empty' });
      throw new Error('Cart is empty')
    }
  } catch (e) {
    // Handle errors
    res.status(500).json({ error: e.message });
  }
  // Call next() if needed
  //next();
}

const handleCancel = async (req, res) => {


  res.render('carts/cancel')
}


const signingsecret = "whsec_85a861dc28a19d88ff119575329224fd9cfc9a39b5cb04c16c5be8f11a68e845"
const handleWebhook = async (req, res, next) => {
  console.log('inside handleWebhook')
  const payload = req.body;
  const sig = req.headers['stripe-signature']
  //matching these webhook is fr stripe
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, signingsecret)
    console.log("event.type", event.type)
    console.log("event.data.object", event.data.object)
    console.log("event.data.object.id", event.data.object.id)
    //res.json({ success: true })
  } catch (e) {
    console.log(e.message)
    res.status(400).json({ success: false })
    //return
  }
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      {
        expand: ['line_items'],
      }
    );
    console.log('now in handleWebhook, sessionWithLineItems:', sessionWithLineItems)
    //const lineItems = sessionWithLineItems.line_items;


    // Fulfill the purchase...
    //fulfillOrder(lineItems);
    //change res status fr pending to confirmed
    console.log('now in handleWebhook, sessionWithLineItems.line_items.data:', sessionWithLineItems.line_items.data)

    try {
      //for (const lineItem of sessionWithLineItems.line_items.data) {
      sessionWithLineItems.line_items.data.forEach((async lineItem => {

        const descriptionParts = lineItem.description.split(' ');
        const reservationId = descriptionParts[0]; // First substring as ID

        const reservation = await Reservation.findByIdAndUpdate(
          reservationId,
          { $set: { status: 'confirmed' } },
          //{ status: 'confirmed' },
          { new: true } // Ensure that the updated reservation object is returned

        );
        //await reservation.save();

        if (!reservation) {
          // Handle the case where the reservation with the provided ID was not found
          throw new Error('Reservation not found');
        }

        // Reservation successfully updated
        console.log('Reservation updated:', reservation);
      }
      ))
      //delete cart
      const cus = await User.findOne({ email: sessionWithLineItems.customer_email })

      const cart = await Cart.findOne({ owner: cus._id })
      if (cart) {
        await Cart.findByIdAndDelete(cart._id)
      }

    } catch (e) {
      // Handle any errors that occur during the update process
      req.flash('Error updating reservation:', e.message);
    }
  }
  //let receiptUrl
  if (event.type === 'charge.succeeded') {
    const charge = await stripe.charges.retrieve(
      event.data.object.id,
    );

    console.log('inside handleWebhook, charge', charge)
    const receiptUrl = charge.receipt_url;
    console.log('inside handleWebhook, receiptUrl', receiptUrl)

    //res.receiptUrl = receiptUrl
    //next()
    //send to db
    // const user = await User.findById(req.user._id)
    // if (user) {
    //   user.receiptUrls.push(receiptUrl)
    //   await user.save()
    // }
  }

  // if(event.type==='invoice.payment_succeeded')
  // {
  //   const stripe.
  // }


  console.log('end of handleWebhook')
  next()
  res.status(200).end()
}

const existsOrNot = async (req, res) => {
  const owner = req.user._id;
  const cart = await Cart.findOne({ owner });

  res.json(cart)
}

module.exports = { getCart, addItemstoCart, deleteItemFromCart, createCheckoutSession, handleSuccess, handleWebhook, handleCancel, redirectToCart, existsOrNot };


