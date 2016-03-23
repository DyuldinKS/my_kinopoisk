var db = require('../db');


exports.load = function(req, res, next) {
	uploadCategories(res, next);
}


exports.add = function(req, res, next) {
	db.addCategory(req.body)
	uploadCategories(res, next);
}


exports.delete = function(req, res, next) {
	db.deleteCategory(req.body)
		.then(function () {
			uploadCategories(res, next);
		})
		["catch"](next);
}

exports.loadForCurrentFilm = function(req, res, next) {
	setResponseHeader(req, res);
	loadCategoriesForCurrentFilm(res, next, req.body);
}


function uploadCategories(res, next) {
	db.getAllCategories()
		.then(function (categories) {
			res.send(categories);
		})
		["catch"](next);
}


function loadCategoriesForCurrentFilm(res, next, url) {
	db.getAllCategories()
		.then(function (allCategories) {
			return(db.inWhichCategoriesIsFilm(url, allCategories));
		})
		.then(function (definedCategories) {
			res.send( JSON.stringify(definedCategories) );
		})
		["catch"](next);
}


function setResponseHeader(req, res){
	var origin = req.headers.origin || req.headers.referer;
	if(origin !== 'http://localhost8080')
		res.setHeader('Access-Control-Allow-Origin', origin);
}