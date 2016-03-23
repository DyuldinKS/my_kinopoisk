var parser = require('../lib/parser.js');
var jsdom = require("jsdom");
var dblite = require('dblite'),
    db = dblite(__dirname +'/films.sqlite');
var image = require(__dirname + '/../lib/image.js');


(function () {
  db.query('CREATE TABLE IF NOT EXISTS categories (category TEXT PRIMARY KEY)');
  db.query('CREATE TABLE IF NOT EXISTS filmsAndCategories (url TEXT, category TEXT)');
  db.query('CREATE TABLE IF NOT EXISTS films (url TEXT PRIMARY KEY, film TEXT)');

  // db.query('SELECT url FROM films', function (err, rows) {
  //   console.log(rows);
  //   db.query('SELECT url, category FROM filmsAndCategories', function (err, rows) {
  //     console.log(rows);
  //   });
  // });

}) ();


exports.getAllCategories = function () {
  return new Promise(function (resolve, reject) {
    db.query('SELECT * FROM categories', function (err, rows) {
      (err)? reject(err) : resolve( rows.map(function (row) {
        return row[0];
      }));
    })
  })
}


exports.findFilmsByCategory = function (category) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT * FROM films WHERE url IN (SELECT url FROM filmsAndCategories WHERE category = ?)', [category], {
      url: String,
      info: String
    }, function (err, films) {
      (err)? reject(err) : resolve(films);
    })
  })
}


exports.inWhichCategoriesIsFilm = function (url, allCategories) {
  return new Promise(function (resolve, reject) {
    findFilmCategories(url)
      .then(function (filmCatergories) {
        resolve( allCategories.map(function (category) {
          return {
            'name' : category,
            'isContainFilm' : !!~filmCatergories.indexOf(category)
          }
        }))
      })
  });
}


/**
* Добавление фильма в нужную категорию
* @param {Object.<string, string>} filmInfo храннит url фильма и имя категории, в которую его нужно добавить
* @returns {Promise} A promise that returns a {string} category name if resolved,
* or an Error if rejected.
*/
exports.addFilmToCategory = function (filmInfo) {
  return new Promise(function(resolve, reject) {
    if (!~filmInfo.url.indexOf('www.kinopoisk.ru/film/')) {
      console.log('invalid url');
      reject(new Error('invalid url'));
    }
    // ищем категории, которые содержат данный фильм
    findFilmCategories(filmInfo.url)
      .then(function (foundCategories) {
        // если массив найденных категорий пуст - добавляем фильм как новый
        if (!foundCategories.length) {
          console.log('adding film');
          return addNewFilm(filmInfo);
        // Ищем в найденных категориях нужную.
        // Если не находим - записываем фильм и категорию в таблицу 'filmAndCategories'
        } else if (!~foundCategories.indexOf(filmInfo.category) ) {
          console.log('adding pair');
          return addFilmCategory(filmInfo);
        }
      })
      .then(resolve)
  });
}


/**
* Поиск категории по ее имени
* @param {string} имя категории
* @returns {Promise} A promise that returns a {string} category name if resolved,
* or an Error if rejected.
*/
function findCategory(category) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT category FROM categories WHERE category = ?', [category], function (err, rows) {
      (err)? reject(err) : resolve(rows[0]);
    });
  });
}


/**
* добавление категории в таблицу 'categories'
* @param {string} имя категории
*/
function addCategory(category) {
  db.query('INSERT INTO categories VALUES(?)', [ category ]);
}

exports.addCategory = addCategory;


// поиск всех категорий данного фильма
function findFilmCategories(url) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT category FROM filmsAndCategories WHERE url = ?', [url], function (err, rows) {
      (err)? reject(err) : resolve( rows.map(function (row) {
        return row[0];
      }) );
    });
  });
}




// добавление нового фильма
function addNewFilm(filmInfo) {
  return new Promise(function(resolve, reject) {
    parser.getPage(filmInfo.url)
      // Получаем объект контента с ключевой информацией по url
      .then(function (body) {
        return parser.getContent(body);
      })
      // Парсим полученный контент в объект фильма
      .then(function (content) {
        return parser.parseContent(content, filmInfo.url);
      })
      // Загружаем постер фильма и записываем полученный фильм в базу данных
      .then(function (newFilm) {
        console.log(newFilm);
        var imageName = filmInfo.url.match(/\d{3,6}/)[0] + '.png';
        image.download(newFilm.imageURI, imageName, function () {
          console.log('Image uploaded and saved');
        });
        delete newFilm.imageURI;

        addFilm(filmInfo.url, newFilm);
        addFilmCategory(filmInfo);

        resolve();
      })
      ["catch"](reject);
  });
}


// добавление пары фильм - категория в таблицу 'filmsAndCategories'
function addFilmCategory(filmInfo) {
  db.query('INSERT INTO filmsAndCategories VALUES(?, ?)', [ filmInfo.url, filmInfo.category ]);
}


function addFilm(url, newFilm) {
  db.query('INSERT INTO films VALUES(?, ?)', [ url, newFilm ]);
}


exports.deleteCategory = function (category) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM categories WHERE category = ?', [category]);
    db.query('DELETE FROM filmsAndCategories WHERE category = ?', [category]);
    // ищем фильмы, и удаляем фильмы (вместе с постером), не принадлежащие ни одной категории
    db.query('SELECT url FROM films WHERE url NOT IN (SELECT url FROM filmsAndCategories)', function (err, rows) {
      (err)? reject('Error in database select query') : resolve( rows.forEach(function (row) {
        deleteFilm(row[0]);
      }));
    })
  })
}


exports.deleteFilmFromCategory = function (film) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM filmsAndCategories WHERE url = ? AND category = ?', [film.url, film.category]);
    db.query('SELECT COUNT(*) FROM filmsAndCategories WHERE url = ?', [film.url], function (err, rows) {
      if (err) reject(err);
      if (!+rows[0]) {
        deleteFilm(film.url);
      }
      resolve();
    })
  })
}


function deleteFilm(url) {
  db.query('DELETE FROM films WHERE url = ?', [url]);
  // удаляем постер фильма
  var imageName = url.match(/\d{3,6}/)[0] + '.png';
  image.remove(imageName, function (err) {
    console.log(imageName + ' successfully deleted');
  });
}


exports.moveFilmToCategory = function moveFilmToCategory (filmInfo) {
  db.query('UPDATE filmsAndCategories SET category = ? WHERE url = ? AND category = ?', [filmInfo.category, filmInfo.url, filmInfo.currentCategory]);
}
