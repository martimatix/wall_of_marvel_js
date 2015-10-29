// Montage Maker
// Makes a montage from Marvel comic book covers

// dependencies
var crypto = require('crypto'),
    request = require('request'),
    gm = require('gm').subClass({imageMagick: true}),
    marvelApi = require('./marvel_api_credentials.json'),
    AWS = require('aws-sdk');

// Global constants
var NUBMER_OF_IMAGES_IN_MONTAGE = 12,
    MIN_RATIO = 549/850,
    MAX_RATIO = 580/850,
    IMAGE_FORMAT = 'JPG';

// get reference to S3 client
var s3 = new AWS.S3();

// Global variables
var results = [],
    coversForMontage = [],
    imageCounter = 0,
    handlerContext,
    // Settings for getting the latest comics
    propertiesObject = {
      format: 'comic',
      formatType: 'comic',
      noVariants: 'true',
      dateDescriptor: 'thisWeek',
      orderBy: '-onsaleDate',
      // Get twice the number of required images as some results can't be used
      // in the montage
      limit: NUBMER_OF_IMAGES_IN_MONTAGE * 2,
      apikey: marvelApi.apiKey
    };


// Functions
var initialize = function() {
  propertiesObject.ts = ts();
  propertiesObject.hash = securityHash();
};

var ts = function() {
  return Math.floor(Date.now() / 1000).toString();
};

var securityHash = function() {
  var hash = propertiesObject.ts + marvelApi.apiSecret + marvelApi.apiKey;
  return crypto.createHash('md5').update(hash).digest('hex');
};

var makeApiCall = function() {
  var url = 'http://gateway.marvel.com/v1/public/comics';
  request({url:url, qs:propertiesObject}, function(err, response, body) {
    if(err) { console.log(err); return; }
    console.log("Get response: " + response.statusCode);
    results = JSON.parse(body).data.results;
    selectImagesAndMakeMontage();
  });
};

var selectImagesAndMakeMontage = function() {
  results.forEach(function(result) {
    getImageAndValidate(result);
  });
};

var getImageAndValidate = function(result) {
  // Get image url
  var image_url = result.thumbnail.path + '.' + result.thumbnail.extension;
  gm(image_url).size(function(err, value){
    // Validate images - some images don't have the required dimensions and some images not available
    addImageToMontageIfValid(err, value, image_url);
  });
};

var addImageToMontageIfValid = function(err, value, image_url) {
  if (!err && imageCounter < NUBMER_OF_IMAGES_IN_MONTAGE && validImageRatio(value)) {
    imageCounter += 1;
    console.log('Image counter: ' + imageCounter);
    console.log('Adding to montage: ' + image_url);
    coversForMontage.push(image_url);
    // Make montage if enough images available
    if (imageCounter === NUBMER_OF_IMAGES_IN_MONTAGE) makeMontage();
  }
};

var validImageRatio = function(value) {
  var ratio = parseInt(value.width) / parseInt(value.height);
  return ratio > MIN_RATIO && ratio < MAX_RATIO;
};

var makeMontage = function() {
  console.log("\nCreating montage");
  var g = gm(coversForMontage.shift());
  coversForMontage.forEach(function(image){
      g.montage(image);
  });
  g.geometry('280x425+2+2!')
   .filter('Welsh')
   .tile('6x2')
   .quality(40)
   .interlace('line')
   .toBuffer(IMAGE_FORMAT, function(err, buffer) {
      if (err) console.log("There was a problem making the montage.");
      else upload(buffer);
  });
};

var upload = function(data) {
	s3.putObject({
		Bucket: 'comicbookwall',
		Key: 'montage.jpg',
    ACL: 'public-read',
		Body: data,
		ContentType: IMAGE_FORMAT
	}, function (err) {
    if (err) {
      console.log("There was a problem writing to S3.");
      console.log(err);
    } else console.log("Montage image created and written");
    // Let Lambda know we've finished work
    handlerContext.done();
  });
};


// Function Calls
exports.handler = function(event, context) {
  handlerContext = context;
  initialize();
  makeApiCall();
}
