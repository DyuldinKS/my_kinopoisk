var express = require('express');
var path = require('path');

var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.text());

require(__dirname + '/routes')(app);

app.use(function (err, req, res, next) {
  console.log(err);
  res.sendStatus(500);
})

app.use(express.static(__dirname + '/public'));

app.listen(8080);
