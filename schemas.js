const BaseJoi = require("joi");
const sanitizeHtml = require('sanitize-html')

const extension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.escapeHTML': '{{#label}} must not include HTML!'
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value) return helpers.error('string.escapeHTML', { value })
        return clean;
      }
    }
  }
});
const Joi = BaseJoi.extend(extension).extend(require('@joi/date'));
//define Joi schema
//campgroundSchema =/= our mongoose schema CamgroundSchema
const campgroundSchema = Joi.object({
  campground: Joi.object({
    title: Joi.string().required().escapeHTML().max(30),
    price: Joi.number().required().min(0),
    //image: Joi.string().required(),
    location: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
    //amenities://Joi.array().items(Joi.string().required().min(1).max(4))
    
  }).required(),
  amenities:Joi.string().allow(null).allow(''),
  deleteImages: Joi.array()
});

const reviewSchema = Joi.object({
  review: Joi.object({
    body: Joi.string().required().escapeHTML(),
    rating: Joi.number().required().min(1).max(5)
  }).required(),
});

const now = Date.now()
const nowDate = new Date(now)

const reservationSchema = Joi.object({
  reservation: Joi.object({
    //user: Joi.string().required(), // Assuming user will be stored as a string
    campground: Joi.string().required(), // Assuming campground will be stored as a string

    startDate: Joi.date().greater(nowDate).iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    //status: Joi.string().valid("pending", "confirmed", "cancelled").default("pending").required()
    // Add any additional fields specific to the reservation here
  }).required(),
});

const searchSchema = Joi.object({
  //campgroundName: Joi.string().allow(null).allow('').optional(),
  startDate: Joi.date().iso().allow(null).allow(''),
  endDate: Joi.date().iso().allow(null).allow('')
})


  const searchDatesSchema = Joi.object({
    startDate: Joi.date().greater(nowDate).iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    campgroundName: Joi.string().allow(null).allow(''),
    am: Joi.string().allow(null).allow(''),
    page:Joi.number().allow(null).allow(''),
    limit:Joi.number().allow(null).allow('')
  })
  const searchDatesSchema2 = Joi.object({
    // startDate: Joi.date().iso().required(),
    // endDate: Joi.date().iso().required(),
    start:Joi.string().required(),
    end:Joi.string().required(),
  })


module.exports = { campgroundSchema, reviewSchema, reservationSchema, searchSchema,searchDatesSchema,searchDatesSchema2 };
