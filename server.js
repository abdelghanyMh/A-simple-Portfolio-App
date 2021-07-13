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
app.get("/", (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


// rout to Timestamp Microservice
app.get("/Timestamp", (req, res) => {
  res.sendFile(__dirname + '/views/Timestamp.html');
});

// rout to  Request Header Parser Microservice
app.get("/whoami", (req, res) => {
  res.sendFile(__dirname + '/views/request_header_Parser.html');
});

// rout to URL Shortener   Api
app.get("/urlshortener", (req, res) => {
  res.sendFile(__dirname + '/views/urlshortener.html');
});

// rout to Exercise tracker  Api
app.get("/exercisetracker", (req, res) => {
  res.sendFile(__dirname + '/views/exercisetracker.html');
});

// rout to File Metadata Microservice
app.get("/filemetadata", (req, res) => {
  res.sendFile(__dirname + '/views/filemetadata.html');
});

// your first API endpoint...
app.get("/api/hello", (req, res) => {
  res.json({ greeting: 'hello API' });
});


/* begin of timestamp Api**/
/**
 * handel /api/timestamp/
 * @param  string date empty String
 * @return  string JSON
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
/**
 * handel /api/:date?
 * @param  string date
 * @return  string JSON
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
/** handel /api/whoami/
 * @return  string JSON
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
/**
 * handel /api/shorturl/full, /api/shorturl, /api/shorturl/:shortUrl?
 * @return  string JSON
 * @example        you can POST a URL to /api/shorturl and get a JSON response  { original_url : 'https://freeCodeCamp.org', short_url : 1}
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

// console.log(process.env.DB_URI);
// this user has limited privilege to the mongodb database so ...

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Parse POST Requests
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// parse application/json
app.use(express.json());

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


/* begin of Exercise tracker  Api**/
const moment = require("moment")
// Create a User schema
const userSchema = new Schema({
  username: { type: String, required: true },
  log: [{
    _id: false,
    description: { type: String, required: true },
    duration: Number,
    date: { type: Date, default: Date.now }
  }]

});

// Create User  model from the User schema.
const User = mongoose.model('User', userSchema);

/**
 * Get the full list of users
 * handel GET /api/users
 * @return  json
 * @example        GET /api/users
 *[
  {
    "_id": "5ec3c38cc530e526ad533782",
    "username": "5WfZFvsBK",
  },
  {
    "_id": "5ec4b2ea635aa80083cf6057",
    "username": "fcc_test_15899491559",
  }
]
* I m forced to  includ to display use _id .
*/
app.get('/api/users', (req, res) => {
  User.find({})
    .sort({ username: 1 })
    .select({ __v: 0, log: 0 })
    .exec((err, usersList) => {
      if (err) return console.error(err);
      res.json(usersList);
    });
});


/**
 * retrieve a full exercise log of any user
 * handel GET /api/users/:_id/logs
 * @return  json
 * @example        GET  /api/users/60ec61a21e44ad123aec52e2/logs
 *[
*{
"_id": "60ec61a21e44ad123aec52e2",
"username": "fcc_test_16261042255",
"log": []
}
]
* I m forced to  includ to display use _id .
*/

app.get('/api/users/:_id/logs', (req, res) => {
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : Number.MAX_SAFE_INTEGER;
  const fromD = new Date(req.query.from) == 'Invalid Date' ? new Date('January 1, 1970 00:00:00 ') : new Date(req.query.from);
  const to = new Date(req.query.to) == 'Invalid Date' ? new Date(Date.now()) : new Date(req.query.to);


  // console.log(req.query);
  // console.log(limit);
  // console.log(fromD);
  // console.log(to);
  User.aggregate([
    {
      '$match': {
        // cast to an ObjectId
        _id: mongoose.Types.ObjectId(req.params._id)
      }
    }, {
      '$unwind': {
        'path': '$log'
      }
    }
    , {
      '$match': {
        'log.date': {
          '$gte': fromD,
          '$lte': to
        }
      }
    }
    ,
    {
      '$limit': limit
    }
    , {
      '$group': {
        '_id': '$_id',
        'username': {
          '$last': '$username'
        },
        'count': {
          '$sum': 1
        },
        'log': {
          '$push': '$log'
        }
      }
    }
  ])
    .exec((err, result) => {
      if (err) return console.error(err);

      else if (result === null) {
        res.send('Unknown userId');
      }
      res.json(...result);
    });



});



/**
 * handel POST /api/users - Create a New User
 * @param  form data
 * @return  json
 * @example POST /api/users {"username": "test","_id": "60ec0e816eaa730565aa6549"}
 */
app.post('/api/users', (req, res) => {
  const newUserName = req.body.username;
  if (newUserName === "") {
    return console.error("please provide your username");
  }
  // check if username already exist
  User.find({ username: newUserName }, (err, result) => {
    if (err) return console.error(err);
    else if (result.length > 0) {
      res.send('Username already taken');
    }
    else {
      const newUser = new User({
        username: newUserName
      });
      newUser.save((err, doc) => {
        if (err) return console.error(err);
        // console.log("Document inserted succussfully!");
        res.json(newUser);
      })
    }
  });



});

/**
 * handel POST /api/users/:_id/exercises - Add exercises
 * @param  form data
 * @return  json
 * @example        POST /api/users/:_id/exercises
 *{
  "_id": "5ec3c38cc530e526ad533782",
  "username": "5WfZFvsBK",
  "date": "Mon Jul 12 2021",
  "duration": 5,
  "description": "description"
  }
 */
app.post('/api/users/:_id/exercises', (req, res) => {

  // Defaults do **not** run on `null`, `''`, or value other than `undefined`.so if user didn't set the date mongoose set the default\
  let recievedDate = new Date(req.body.date);

  if (typeof req.body.date === 'undefined' || req.body.date === null || req.body.date === '') {
    recievedDate = undefined;
  }

  const newExercise = {
    description: req.body.description,
    duration: req.body.duration,
    date: recievedDate
  }


  const id = { _id: req.params._id };
  const update = { $push: { log: newExercise } };
  const options = {
    // return the modified object rather than the original
    new: true,
    useFindAndModify: false,
    setDefaultsOnInsert: true
  };

  User.findByIdAndUpdate(id, update, options,
    function (error, result) {
      if (error) {
        console.log(error);
      } else if (result === null) {
        res.send('Unknown userId');
      } else {
        // because we used push new Log will be  the last  element of the log array in mongodb.
        const newLog = result.log[result.log.length - 1];

        let formatedDate = moment(newLog.date).format('ddd MMM DD YYYY');

        // console.log({
        //   _id: result.id,
        //   username: result.username,
        //   date: formatedDate,
        //   duration: newLog.duration,
        //   description: newLog.description
        // });
        res.send({
          _id: result.id,
          username: result.username,
          date: formatedDate,
          duration: newLog.duration,
          description: newLog.description
        });
      }
    });
});
/** end  of URL Shortener   Api **/


/* begin of File Metadata Microservice **/

var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

/**
 * handel POST /api/fileanalyse -  Upload file and extract metadata of that file
 * @param  form data
 * @return  Sting JSON
 * @example POST /api/fileanalyse {"name": "test_file.txt","type": "text/plain","size": 2}
 */


app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  // console.log(req.file);
  // req.file is the `upfile` file https://www.npmjs.com/package/multer
  const metaData = {
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  }
  res.json(metaData);

});

/** end of File Metadata Microservice**/


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
