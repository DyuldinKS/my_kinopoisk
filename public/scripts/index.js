
( function() {

  var categories;

  HTMLElement.prototype.setClass = function(name) {
    this.setAttribute('class', name);
    return this;
  }

  init();

  /**
	 * Инициализация
	 */
  function init() {

    getAllCategories();

    var content = document.querySelector('body > ul');
    content.addEventListener('click', contentClickHandler, false);

    document.querySelector('#addCategory > button').addEventListener('click', addCategory, false);

    document.getElementById('actionWindow').addEventListener('click', closeActionWindow, false);

  }


  function categoryClickHandler(categoryElement) {
    var filmsList = categoryElement.querySelector('ul'),
        displayStatus = filmsList.getAttribute('class');

    categoryElement.removeChild(filmsList);
    categoryElement.appendChild(document.createElement("UL")).setClass('hidden');

    if (displayStatus === 'hidden') {
      getFilmsByCategory(categoryElement);
    }
  }


  function contentClickHandler(event) {
    if (event.target.tagName === "H2") {
      categoryClickHandler(event.target.parentElement);
    }
    else if (event.target.tagName === "BUTTON") {
      var action = event.target.getAttribute('class');
      switch (action) {
        case 'add':
        case 'move':
          var filmElement = getListElement(event.target);

          loadCategoriesForCurrentFilm(getFilmUrl(filmElement), function (xhr) {
            var categories = JSON.parse(xhr.responseText);
            fillActionPage(action, categories);
            var categoryList = document.querySelector('#actionWindow > ul');
            categoryList.addEventListener('click', function (event) {
              actionCategoryClickHandler(event, action, filmElement);
            }, false);
          })

          break;

        case 'delete':
          var li = getListElement(event.target);
          console.log(li);
          deleteFilmFromCategory( getListElement(event.target) );

          break;

        default:
          if (confirm("Вы действительно хотите удалить данную категорию?")) {
            deleteCategory(event.target.parentElement);
        }
      }
    }
  }


  function fillActionPage(action, categories) {
    var actionWindow = document.getElementById('actionWindow'),
        categoryList = actionWindow.appendChild(document.createElement("UL")),
        listHeader = categoryList.appendChild(document.createElement("LH")),
        listElement;

    listHeader.innerHTML = 'В какую категорию<br> Вы хотите ' + ((action === 'add') ? 'добавить' : 'переместить') + ' фильм?';

    categories.forEach(function (category) {
      createCategoryForCurrentFilm(categoryList, category);
    })

    actionWindow.setClass('shown');
  }

  function createCategoryForCurrentFilm(categoryList, category) {
    listElement = categoryList.appendChild(document.createElement("LI"));
    listElement.textContent = category.name;
    if (category.isContainFilm) {
      listElement.setClass('containFilm');
    }
  }


  function loadCategoriesForCurrentFilm(filmUrl, responseHandler) {
    sendRequest('POST', '/loadCategoriesForCurrentFilm', filmUrl, responseHandler);
  }

  function actionCategoryClickHandler(event, action, filmElement) {
    if (event.target.tagName === "LI" && event.target.getAttribute('class') !== 'containFilm') {
      film = {
        url : getFilmUrl(filmElement),
        category : event.target.textContent,
        currentCategory : getCategoryName( getListElement(filmElement) )
      }

      addOrMoveFilmToCategory(event.target, action, film, filmElement);
    }
  }


  function addOrMoveFilmToCategory(targetCategory, action, film, filmElement) {
    sendRequest('POST', '/' + action + 'FilmToCategory', JSON.stringify(film), function () {

      var categoryIndex = categories.indexOf(film.category) + 1;
      var categoryElement = document.querySelector('#categoryList > li:nth-child(' + categoryIndex + ') > ul');

      if (action === 'add') {
        categoryElement.appendChild(filmElement.cloneNode(true));
      } else {
        var currentCategoryIndex = categories.indexOf(film.currentCategory) + 1;
        filmElement = categoryElement.appendChild(filmElement);
        document.querySelector('#actionWindow > ul > li:nth-of-type(' + currentCategoryIndex + ')').removeAttribute('class');
      }

      document.querySelector('#actionWindow > ul > li:nth-of-type(' + categoryIndex + ')').setClass('containFilm');
    })
  }


  /**
   * Отправка запроса на сервер
   * @param {string} method
   * @param {string} url
   * @param {string} sentData
   * @param {function} responseHandler
   */
  function sendRequest(method, url, sentData, responseHandler) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true) ;

    xhr.onload = function () {
      if (xhr.status != 200) {
        alert(xhr.status + ': ' + xhr.statusText);
      } else {
        responseHandler(xhr);
      }
    }

    xhr.send(sentData);
  }

  /**
   * Загрузка информации о всех задачах с сервера
   */
  function getAllCategories() {
    sendRequest('GET', '/loadCategories', null, function (xhr) {
      categories = JSON.parse(xhr.responseText);
      createCategories();
    })
  }


  function addCategory() {
    var inputField = document.querySelector('#addCategory > input'),
        newCategory = inputField.value.toLowerCase();
    inputField.value = '';
    if (!newCategory || ~categories.indexOf(newCategory)) return;
    sendRequest('POST', '/addCategory', newCategory, function (xhr) {
      categories = JSON.parse(xhr.responseText);
      createOneCategory(document.querySelector('body > ul'), newCategory);
    })
  }


  function deleteCategory(category) {
    var categoryList = category.parentElement,
        name = category.querySelector('H2').textContent;
    sendRequest('POST', '/deleteCategory', name, function (xhr) {
      categories = JSON.parse(xhr.responseText);
      categoryList.removeChild(category);
    })
  }


  function deleteFilmFromCategory(filmElement) {
    var film = {
      'url' : getFilmUrl(filmElement),
      'category' : getCategoryName(getListElement(filmElement))
    }
    console.log(film);
    sendRequest('POST', '/deleteFilmFromCategory', JSON.stringify(film), function () {
      filmElement.parentElement.removeChild(filmElement);
    })
  }


  function createCategories() {
    var categoryList = document.getElementById('categoryList');
    categories.forEach(function (categoryName) {
      createOneCategory(categoryList, categoryName);
    })
  }

  function createOneCategory(categoryList, name) {
    var category = categoryList.appendChild(document.createElement("LI"));
    category.appendChild(document.createElement("H2")).textContent = name;
    category.appendChild(document.createElement("BUTTON"));
    category.appendChild(document.createElement("UL")).setClass('hidden');
  }


  function getFilmsByCategory(category) {
    sendRequest('POST', '/getFilmsByCategory', category.textContent, function (xhr) {
      try {
        films = JSON.parse(xhr.responseText);
        console.log(films);
      } catch (e) {
        alert( "Некорректный ответ " + e.message );
      }
      var filmsList = category.querySelector("UL");
      createFilmsInCategory(filmsList, films);
      filmsList.setClass('shown');
    } )
  }

  function createFilmsInCategory(filmsList, films) {

    films.forEach(function (film) {
      var filmElement = filmsList.appendChild(document.createElement("LI"));

      var filmImage = filmElement.appendChild(document.createElement("IMG"));
      filmImage.src = '/images/posters/' + film.url.match(/\d{3,6}/)[0] + '.png';

      createActionsBlock(filmElement);

      createInfoBlock(filmElement, JSON.parse(film.info));

      // var infoBlock = filmElement.appendChild(document.createElement("DIV"));
      // infoBlock.setClass('info');

      // var name = infoBlock.appendChild(document.createElement("H3"));
      // name.textContent = film.info['название'];
      // name.appendChild(document.createElement("SPAN")).textContent = film.info.year;

      // var p = infoBlock.appendChild(document.createElement("P"));
      // p.textContent = film.info.originalName + ', ' + film.info.duration;

      // p = infoBlock.appendChild(document.createElement("P"));
      // p.innerHTML = film.info.country + ', реж. ' + film.info.producer + '<br>(' + film.info.genre.join(', ') + ')';

      // var a = infoBlock.appendChild(document.createElement("A"));
      // a.href = film.url;
      // a.textContent = 'перейти к Кинопоиску';
    })
    filmsList.setClass('shown');
  }


  function createInfoBlock(filmElement, info) {
    var infoBlock = filmElement.appendChild(document.createElement("DIV"));
      infoBlock.setClass('info');

    var name = infoBlock.appendChild(document.createElement("H3"));
      name.textContent = info['название'];

    var p = infoBlock.appendChild(document.createElement("P"));
      p.textContent = info['оригинальное название'];

    var actors = infoBlock.appendChild(document.createElement("DIV"));
    actors.setClass('actors');

    actors.appendChild(document.createElement("H4")).textContent = 'В главных ролях:';
    actors.appendChild(document.createElement("P")).textContent = info['актеры'].join(', ');

    // info['актеры'].forEach(function (actor) {
    //   actors.appendChild(document.createElement("LI")).textContent = actor;
    // })

    // var infoTable = infoBlock.appendChild(document.createElement("TABLE"));

    // var key, row;
    // for (key in info) {
    //   if(key !== 'название' && key !== 'оригинальное название') {
    //     row = infoTable.appendChild(document.createElement("TR"));
    //     row.appendChild(document.createElement("TD")).textContent = key;
    //     console.log( typeof(info[key]) );
    //     row.appendChild(document.createElement("TD")).textContent = ( typeof(info[key]) === "object") ? 
    //       info[key].join(', ') :
    //       info[key];
    //   } 
    // }
  }


  function createActionsBlock(filmElement) {
    var actionsBlock = filmElement.appendChild(document.createElement("DIV"));
    actionsBlock.setClass('actions');
    ['add', 'move', 'delete'].forEach(function (name) {
      actionsBlock.appendChild(document.createElement("BUTTON")).setClass(name);
    })
  }


  function getListElement(innerElem) {
    while(innerElem.tagName !== 'BODY') {
      innerElem = innerElem.parentElement;
      if(innerElem.tagName === 'LI') return innerElem;
    }
    return null;
  }


  function getCategoryName(categoryElement) {
    return categoryElement.querySelector("H2").textContent;
  }


  function getFilmUrl(filmElement) {
    return filmElement.querySelector('.info > a').href;
  }


  function closeActionWindow(event) {
    console.log(event.target);
    var actionWindow = document.getElementById('actionWindow');
    if (event.target === actionWindow) {
      actionWindow.removeChild(actionWindow.firstChild);
      actionWindow.setClass('hidden');
    }
  }

}) ();
