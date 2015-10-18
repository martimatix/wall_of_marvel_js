// Marvel Wallpaper Maker

// Required libraries and credentials
var crypto = require('crypto'),
    request = require('request'),
    gm = require('gm').subClass({imageMagick: true}),
    marvelApi = require('./marvel_api_credentials.json');


// Globals
var results = [],
    coversForMontage = [],
    imageCounter = 0,
    numberOfImagesInMontage = 12,
    propertiesObject = {
      format: 'comic',
      formatType: 'comic',
      noVariants: 'true',
      dateDescriptor: 'thisWeek',
      orderBy: '-onsaleDate',
      limit: numberOfImagesInMontage * 2,
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
    // Validate images - some images aren't the right dimension and some images not available
    addImageToMontageIfValid(err, value, image_url);
  });
};

var addImageToMontageIfValid = function(err, value, image_url) {
  if (!err && imageCounter < numberOfImagesInMontage && validImageRatio(value)) {
    imageCounter += 1;
    console.log('Image counter: ' + imageCounter);
    console.log('Adding to montage: ' + image_url);
    coversForMontage.push(image_url);
    // Make montage if enough images available
    if (imageCounter === numberOfImagesInMontage) makeMontage();
  }
};

var validImageRatio = function(value) {
  var ratio = parseInt(value.width) / parseInt(value.height);
  var MIN_RATIO = 549/850;
  var MAX_RATIO = 580/850;
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
   .quality(65)
   .write('montage.jpg', function(err) {
      if(!err) console.log("Montage image created and written");
  });
};


// Function Calls
initialize();
makeApiCall();
