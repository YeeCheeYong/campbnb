const express = require('express')
const router = express.Router()
const catchAsync = require("../utils/catchAsync.js");

const multer = require('multer')
//const upload = multer({ dest: 'uploads/' })
const storage = multer.memoryStorage();
const { s3Client, params } = require('../s3/index.js')
//actually dont need to write index.js bcos node automatically look for index.js in a folder
const upload = multer({ storage: storage })
const crypto = require('crypto')
const sharp = require('sharp')


const { isLoggedIn, storeReturnTo, isAuthor, validateCampground, isReviewAuthor, uploadImage,paginateCampgrounds,setPaginatedSearchResults,paginateSearchDocuments,validateSearchFields, paginateReviews } = require('../middleware.js')

const Campground = require("../models/campground.js");

const campgrounds = require('../controllers/campgrounds.js')

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { sendtos3,genThumbnail } = require('../s3/index.js')

const dotenv = require('dotenv')
dotenv.config()
//20240219 modify with pagination (ori:.get(catchAsync(campgrounds.index)))
router.route('/')
  .get(paginateCampgrounds(Campground),catchAsync(campgrounds.index))
  .post(isLoggedIn, upload.array('image'), sendtos3,genThumbnail,validateCampground, catchAsync(campgrounds.createCampground))

//20240218
router.get("/search",campgrounds.search,setPaginatedSearchResults,paginateSearchDocuments)
router.get("/searchAll",campgrounds.searchAll,setPaginatedSearchResults,paginateSearchDocuments)



router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router.get("/getAll",campgrounds.getAll)

router.get('/recommendations',campgrounds.giveRecommendations)
router.get('/:id/getAllRes',campgrounds.getAllRes)

router.route('/:id')
  .get(paginateReviews,catchAsync(campgrounds.showCampround))
  .put(isLoggedIn, isAuthor, upload.array('image'), sendtos3,genThumbnail,
    validateCampground,
    catchAsync(campgrounds.updateCampground))
  .delete(isLoggedIn, isAuthor,
    catchAsync(campgrounds.deleteCampground))

router.get(
  "/:id/edit", isLoggedIn, isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router