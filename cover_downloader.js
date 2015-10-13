var crypto = require('crypto');
var request = require('request');
var gm = require('gm').subClass({imageMagick: true});
var fs = require('fs');
var marvelApi = require('./marvel_api_credentials.json')

var url = 'http://gateway.marvel.com/v1/public/comics'

var propertiesObject = {
  // format: 'comic',
  // formatType: 'comic',
  // noVariants: 'true',
  apikey: marvelApi.apiKey
};

var ts = function() {
  return Math.floor(Date.now() / 1000).toString();
}

var securityHash = function() {
  // TODO: Store away api info
  var hash = propertiesObject.ts + marvelApi.apiSecret + marvelApi.apiKey
  return crypto.createHash('md5').update(hash).digest('hex')
}

propertiesObject.ts = ts();
propertiesObject.hash = securityHash();

request({url:url, qs:propertiesObject}, function(err, response, body) {
  if(err) { console.log(err); return; }
  console.log("Get response: " + response.statusCode);
  var results = JSON.parse(body).data.results;
  // console.log(results);
  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    console.log(result.thumbnail.path)
    gm(result.thumbnail.path + '.' + result.thumbnail.extension)
    .resize(280, 425)
    .filter('Welsh')
    .noProfile()
    .write('scaled_covers/' + i + '.png', function (err) {
      if (!err) console.log('done');
    });
  }
});
