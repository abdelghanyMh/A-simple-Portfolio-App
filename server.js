// server.js
// where your node app starts


// init project
var express = require('express');
var app = express();

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








// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
