var categories = require('./categories.js'),
	films = require('./films.js');

module.exports = function (app) {

	app.get('/loadCategories', categories.load);

	app.post('/addCategory',  categories.add);

	app.post('/deleteCategory', categories.delete);

	app.post('/loadCategoriesForCurrentFilm', categories.loadForCurrentFilm);

	app.post('/getFilmsByCategory', films.getByCategory);

	app.post('/addFilmToCategory', films.addToCategory);

	app.post('/deleteFilmFromCategory', films.deleteFromCategory);

	app.post('/moveFilmToCategory', films.moveToCategory);

}
