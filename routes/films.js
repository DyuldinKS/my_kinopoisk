var db = require('../db');


exports.getByCategory = function(req, res, next) {
	var category = req.body;

	db.findFilmsByCategory(category)
		.then(function (films) {
			res.send(films);
		})
		["catch"](next);
}


exports.addToCategory = function(req, res, next) {
	setResponseHeader(req, res);
	var filmInfo = JSON.parse(req.body);

	db.addFilmToCategory(filmInfo)
		.then(function (status) {
			res.sendStatus(200);
		})
		["catch"](next)
}


exports.moveToCategory = function(req, res, next) {
	var filmInfo = JSON.parse(req.body);
	db.moveFilmToCategory(filmInfo);
	res.sendStatus(200);
}


exports.deleteFromCategory = function(req, res, next) {
	setResponseHeader(req, res);

	var filmInfo = JSON.parse(req.body);
	db.deleteFilmFromCategory(filmInfo)
		.then(function () {
			res.sendStatus(200);
		})
		["catch"](next);
}


function setResponseHeader(req, res){
	var origin = req.headers.origin || req.headers.referer;
	if(origin !== 'http://localhost8080')
		res.setHeader('Access-Control-Allow-Origin', origin);
}