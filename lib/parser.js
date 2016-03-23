var request = require('request');
var jsdom = require("jsdom");
var Buffer = require('buffer').Buffer;
var Iconv = require('iconv').Iconv;
var fs = require('fs');
var path = require('path');
/**
* Конструктор обьекта фильма из контента html-страницы
* @param {string} content - блок html-кода с ключевой информацией
* @private {HTMLTableElement} infoTable - таблица с основной информацией
* @private {number} numberOfActors - количество первых в списке актеров, чьи имена запишутся в массив
* @property {string} name - название фильма
* @property {string} originalName - оригинальное название фильма
* @property {string} year - год выпуска
* @property {string} country - страна, выпустившая фильм
* @property {string} tagline - слоган фильма
* @property {string} producer - режиссер
* @property {Array.<string>} genre - жанр
* @property {Array.<string>} actors - главные актеры
* @property {string} rating - рейтинг фильма на Кинопоиске
* @property {string} duration - продолжительность
* @property {string} imageURI - ссылка на изображение
*/
function Film( content ) {

	var infoTable = content.querySelector('#infoTable tbody');
	var contentTypes = Array.prototype.map.call( infoTable.querySelectorAll('tr > td.type'), function (elem) { return elem.textContent; });
	var requiredTypes = [
		{ name: 'год', selector: 'td:last-child a' },
		{ name: 'страна', selector: 'td:last-child a', array: true },
		{ name: 'слоган', selector: 'td:last-child' },
		{ name: 'режиссер', selector: 'td:last-child a' },
		{ name: 'продюссер', selector: 'td:last-child a', array: true },
		{ name: 'жанр', selector: 'td:last-child > span > a', array: true },
		{ name: 'время', selector: 'td:last-child' }
	];
	var self = this;
	var typeIndex;
	var numberOfActors = 5;

	this['название'] = content.querySelector('h1').textContent;
	this['оригинальное название'] = content.querySelector('#headerFilm > span').textContent;
	// парсинг таблицы infotable
	requiredTypes.forEach(function (type) {
		typeIndex = contentTypes.indexOf(type.name) + 1;
		if (typeIndex) {
			self[type.name] = type.array ?
				Array.prototype.map.call( 
					infoTable.querySelectorAll('tr:nth-child(' + typeIndex + ') > ' + type.selector), 
					function(elem) { return elem.textContent; } 
				) :
				infoTable.querySelector('tr:nth-child(' + typeIndex + ') > ' + type.selector).textContent;
		}
	})
	
	this['актеры'] = ( Array.prototype.slice.call( content.querySelectorAll('#actorList > ul a'), 0, numberOfActors ) )
		.map( function( elem ) { return elem.textContent } );

	if(content.querySelector('#block_rating')) {
		this['рейтинг'] = content.querySelector('#block_rating > div.block_2 > div > a > span').textContent;
	}
	this.imageURI = content.querySelector('#photoBlock a.popupBigImage > img').getAttribute("SRC");
}


/**
* Функция запрашивает страницу по url и парсит ее
* @param {Object.<string>} filmInfo - объект, содержащий url фильма и выбранную категорию
* @param {function} writeToJSON - callback, записывает в json-файл новый фильм
*/
exports.getPage = function(url) {
	return new Promise(function (resolve, reject) {
		request({
			'url': url,
			'encoding': 'binary',
			'headers': {
				'Accept-Language': 'en-US,en;q=0.8',
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36'
			}
		}, function (err, res, body) {
			if (err) {
				reject(err);
			}
			body = new Buffer(body, 'binary');
			translator = new Iconv('cp1251', 'utf-8');
			body = translator.convert(body).toString();

			resolve(body);
		});
	});
}


exports.getContent = function (body) {
	return new Promise(function (resolve, reject) {
		jsdom.env(
			body,
			function (error, window) {
				if (error) {
	 				reject(error);
	 			}
				resolve(window.document.querySelector('#content_block'));
			}
		);
	})
}


/**
* Функция сохраняет в объект фильма всю информацию со страницы и скачивает изображение постера
* @param {string} content - блок html-кода с ключевой информацией
* @param {Object.<string>} filmInfo - объект, содержащий url фильма и выбранную категорию
*/
exports.parseContent = function(content, url) {
	return new Film(content);
}
