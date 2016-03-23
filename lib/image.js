var path = require('path');
var fs = require('fs');
var request = require('request');


/**
* Функция удаления изображения
* @param {string} imageName - имя изображения
* @param {function} callback
*/
exports.remove = function (imageName, callback) {
  fs.unlink(path.join(__dirname, '../public/images/posters/', imageName), callback);
};

/**
* Загрузка изображения по uri
* @param {string} uri - адрес изображения
* @param {string} filename - имя изображения
* @param {function} callback
*/
exports.download = function (uri, imageName, callback) {
	request.head(uri, function(err, res, body){
  	request(uri).pipe(fs.createWriteStream(path.join(__dirname, '../public/images/posters/', imageName))).on('close', callback);
 	});
};
