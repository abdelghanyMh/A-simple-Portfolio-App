// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
require('dotenv').config();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// rout to Timestamp Microservice
app.get("/Timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/Timestamp.html');
});

// rout to  Request Header Parser Microservice
app.get("/whoami", function (req, res) {
  res.sendFile(__dirname + '/views/request_header_Parser.html');
});

// rout to URL Shortener   Api
app.get("/urlshortener", function (req, res) {
  res.sendFile(__dirname + '/views/urlshortener.html');
});



// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});


/* begin of timestamp Api**/
/*
 * handel /api/timestamp/
 * @param  string date empty String
 * @return  json
 * @example        /api/timestamp/ return  the current time in a JSON object with a unix key and  a utc key
 */
app.get('/api/timestamp/', (req, res) => {
  // return the current time in a JSON
  date = new Date();
  res.json({
    unix: Date.parse(date),
    utc: date.toUTCString()
  });
});
/*
 * handel /api/:date?
 * @param  string date
 * @return  json
 * @example        /api/2015-12-25 return {"unix": 1451001600000,"utc": "Fri, 25 Dec 2015 00:00:00 GMT"}
 */
app.get('/api/timestamp/:date?', (req, res) => {

  let onlyNumbersRegex = /^[0-9]*$/;
  let newDate = req.params.date;
  let date;
  console.log(req.params.date);

  // handel user sending date in this format 1451001600000
  if (onlyNumbersRegex.test(newDate)) {
    date = new Date(parseInt(newDate));
  }
  // handel user sending date in this format 2015-12-25
  else {
    date = new Date(newDate);

    //  handel If the input date string is invalid
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#return_value
    if (date == 'Invalid Date')
      res.json({
        error: "Invalid Date"
      });
  }

  res.json({
    unix: Date.parse(date),
    utc: date.toUTCString()
  });

});

/** end of timestamp Api**/


/* begin of Request Header Parser Microservice  Api**/
/*
 * handel /api/whoami/
 * @return  json
 * @example        /api/whoami/ return  JSON object with user's IP address in the ipaddress key ,user's preferred language in the language key and user's software in the software key
 */
app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress: req.headers["x-forwarded-for"],
    language: req.headers["accept-language"],
    software: req.headers["user-agent"]
  });
  // console.log(req.headers);

});

/** end  of Request Header Parser Microservice **/



/* begin of URL Shortener   Api**/
/*
 * handel /api/shorturl/full, /api/shorturl, /api/shorturl/:shortUrl?
 * @return  json
 * @example        you can POST a URL to /api/shorturl and get a JSON response  { original_url : 'https://freeCodeCamp.org', short_url : 1}
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

// console.log(process.env.DB_URI);
// this user has limited privilege to the mongodb database so ...

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const bodyParser = require("body-parser");
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Create a URL schema
// https://mongoosejs.com/docs/guide.html#definition
let urlSchema = new Schema({
  original_url: { type: String, required: true },//preferred
  short_url: Number
});

// Create URL model from the schema.
let Url = mongoose.model('Url', urlSchema);

// get the full list of urls
app.get('/api/shorturl/full', (req, res) => {
  Url.find({})
    .sort({ "short_url": 1 })
    .select({ __v: 0, _id: 0 })
    .exec((err, list) => {
      if (err) return console.error(err);
      res.json(list);
      // console.log(list);
    });


});

// handel  POST: /api/shorturl
app.post("/api/shorturl", (req, res) => {

  //  verify a submitted URL.
  let receivedUrl = req.body.url;
  var urlExists = require('url-exists');


  urlExists(receivedUrl, function (err, exists) {
    console.log(exists); // true
    // If you pass an invalid URL
    if (!exists) {
      res.json({ error: 'invalid url' });
    }
  });

  // will use auto increment approach to set the short url  for the original_url

  // get the latest short_url number used
  Url.find({})
    .sort({ "short_url": -1 })
    .limit(1)
    .exec(
      (err, docs) => {

        let nextShortUrl = docs[0].short_url + 1;

        // create Url
        let newUrl = {
          original_url: req.body.url,
          short_url: nextShortUrl
        };

        // save url in mongoDB
        const url = new Url(newUrl);

        url.save((err, doc) => {
          if (err) return console.error(err);
          console.log("Document inserted succussfully!");
          res.json(newUrl);
        });
      });
});

// handel GET: /api/shorturl/number
app.get('/api/shorturl/:shortUrl?', (req, res) => {
  //console.log(typeof req.params.shortUrl);
  let shortUrl = parseInt(req.params.shortUrl);

  Url.find({ "short_url": shortUrl }, (err, docs) => {
    if (err) return console.log(err);
    else if (typeof docs !== 'undefined' && docs.length === 0) //short url does not exist in the database
      res.json({ error: 'invalid short_url' });
    else {//redirect to the original_url;
      // console.log(docs[0].original_url);
      res.redirect(docs[0].original_url);
    }
  });


});

/** end  of URL Shortener   Api **/





// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
