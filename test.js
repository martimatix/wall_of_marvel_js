var gm = require('gm').subClass({imageMagick: true});

gm('http://i.annihil.us/u/prod/marvel/i/mg/3/20/54d256c208d42.jpg').size(function(err, value){
  if (!err) {
    console.log(value.width);
    console.log(value.height);
  }
})
