const multer = require('multer')
//const upload = multer({ dest: 'uploads/' })
const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const crypto = require('crypto')
const sharp = require('sharp')



const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

//const dotenv = require('dotenv');
const { promises } = require('dns');
const review = require('../models/review');
//dotenv.config()
const bucketName = process.env.BUCKET_NAME
const region = process.env.BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})

const sendtos3 = async (req, res, next) => {
  const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
  //default to 32 bytes



  const promises = [];

  //resize image
  for (let file of req.files) {
    //const buffer = await sharp(file.buffer).resize({ height: 1920, width: 1080, fit: "contain" }).toBuffer()
    //toBuffer() means convert to buffer again so we can get the image data back
    const fileName = `YelpCamp/${randomImageName()}`;
    const params = {
      //Region:region,
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      //ACL: "public-read"
    }
    const uploadtos3 = async (params) => {
      const command = new PutObjectCommand(params)
      const res = await s3Client.send(command)
      // console.log('req.files',req.files)
      console.log('uploadResult.Location', res.Location)
      console.log('req.files', req.files)

    }
    promises.push(uploadtos3(params));
    file.filename = fileName;
    file.url = `https://yelpcamp-image-upload.s3.${region}.amazonaws.com/${file.filename}`

  }
  Promise.all(promises).then(data => {
    console.log('uploaded')
    console.log('data', data)
  })
    .catch(e => console.log(e))



  next()
}


const genThumbnail = async (req, res, next) => {
  console.log('inside genThumbnail', req.files);

  const promises2 = []
  for (let file of req.files) {
    const params = {
      Bucket: 'yelpcamp-image-upload-thumbnails',
      Key: file.filename
    }
    const retrieveThumbnail=async(params)=>{
      const command = new GetObjectCommand(params)
      await s3Client.send(command)
    }


    promises2.push(retrieveThumbnail(params));

    file.thumbnail = `https://yelpcamp-image-upload-thumbnails.s3.amazonaws.com/${file.filename}`

  }
  Promise.all(promises2).then(data => {
    console.log('generated thumbnails')
    console.log('data', data)
  })
    .catch(e => console.log(e))


  next()
}
const deleteInS3 = async (arr) => {
  //if (req.body.deleteImages) {
  for (let a of arr) {
    const deleteParams = {
      Bucket: bucketName,
      Key: a
    }
    await s3Client.send(new DeleteObjectCommand(deleteParams))

  }
  //}
  //next()
}
module.exports = { sendtos3, deleteInS3,genThumbnail }


