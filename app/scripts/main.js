let myMap, // Яндекс-карта
    listReviews = [], // Массив отзывов с точками на карте
    coordinates = [], // глобальные текущие координаты на карте
    geoObjects = [], // массив с placeMarks
    isClicked = false; // показывать попап только при клике (не перемещении карты)

// Инициализируем Яндекс-карту
ymaps.ready(init).then( () => {
    /* listReviews = renderPlaceMarksFromLocalStorage(myMap);
    renderMarks(listReviews, myMap);
    console.log(listReviews); */
    // ----------------------------------------------------------------------------------------------
    // Обработчик кликов на карте с показом попапа и записей информации
    // ----------------------------------------------------------------------------------------------
    document.addEventListener('click',  event => {
        const target = event.target;

        // если кликнули на карте
        if (target.tagName === 'YMAPS' && isClicked) {
            // отрисуем попап и сохраним его в переменную
            renderPopup(event);
        }
    });

    // ----------------------------------------------------------------------------------------------
    // Обработчик скрытия попапа по отпусканию клавиши <ESC>
    // ----------------------------------------------------------------------------------------------
    document.addEventListener('keyup', event => {
        const popup = document.querySelector('.popup__container');

        if (popup && event.keyCode === 27) {
            event.preventDefault();
            popup.innerHTML = '';
        }
    });
});


function renderPlaceMarksFromLocalStorage(map) {
    let arr = JSON.parse(localStorage.getItem('listReviews'));

    if (!arr) {
        return [];
    }

    return arr;
}

// ----------------------------------------------------------------------------------------------
// Функция инициализации Яндекс-карты
// ----------------------------------------------------------------------------------------------
function init() {
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").
    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [55.39144640, 43.81787100], // Арзамас
        zoom: 17,

        controls: ['zoomControl', 'searchControl'], // оставить только zoom-панель и yandex-copyright
        behaviors: ['drag'] // зададим поведение: drag - позволяет перемещать карту при нажатии ЛКМ
    });

    // обработчик клика на карте и получение координат
    myMap.events.add('click', event => {
        coordinates = [
            event.get('coords')[0].toPrecision(6),
            event.get('coords')[1].toPrecision(6)//.toPrecision(6)
        ];
        isClicked = true;
    });

    // Масштабируем карту на область видимости коллекции.
    //TODO:myMap.setBounds(res.geoObjects.getBounds());
}

// ----------------------------------------------------------------------------------------------
// Функция рендеринга меток на карте
// ----------------------------------------------------------------------------------------------
function renderMarks(array, map) {
    // Создаем собственный макет с информацией о выбранном геообъекте.
    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        `
        <h2 class="ballon_header">{{ properties.balloonContentHeader|raw }}</h2>
        <a href="#" class="ballon_body">{{ properties.balloonContentBody|raw }}</a>
        <div class="ballon_footer">{{ properties.balloonContentFooter|raw }}</div>
        `
    );

    let clusterer = new ymaps.Clusterer(
        {
            clusterIcons: [
                {
                    href: 'images/group.png',
                    size: [107, 79],
                    offset: [-81, -79]
                }
            ],
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            // Устанавливаем стандартный макет балуна кластера "Карусель".
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            // Устанавливаем собственный макет.
            clusterBalloonItemContentLayout: customItemContentLayout,
            // Устанавливаем режим открытия балуна. 
            // В данном примере балун никогда не будет открываться в режиме панели.
            clusterBalloonPanelMaxMapArea: 0,
            // Устанавливаем размеры макета контента балуна (в пикселях).
            clusterBalloonContentLayoutWidth: 250,
            clusterBalloonContentLayoutHeight: 170,
            // Устанавливаем максимальное количество элементов в нижней панели на одной странице
            clusterBalloonPagerSize: 5,
            // cделаем макет содержимого иконки кластера, в котором цифры будут раскрашены по стилю класса .cluster__text
            clusterIconContentLayout: ymaps.templateLayoutFactory.createClass(
                '<div class="cluster__text">{{ properties.geoObjects.length }}</div>'
            )
        }
    );
    if (geoObjects.length > 0)
        map.geoObjects.removeAll(); // сотрем все метки на карте
    geoObjects = []; // обнулим массив меток на карте
    

    for (let i = 0; i < array.length; i++) {
        geoObjects.push(new ymaps.Placemark(
            [
                array[i].coordinates[0], // latitude
                array[i].coordinates[1]  // longitude
            ],
            {
                // Устаналиваем данные, которые будут отображаться в балуне.
                balloonContentHeader: array[i].reviews[0].place,
                balloonContentBody: array[i].reviews[0].text,
                balloonContentFooter: array[i].reviews[0].date,
            },
            {
                iconLayout: 'default#image',
                iconImageHref: 'images/sprite.png',
                iconImageSize: [44, 66],
                iconImageOffset: [-22, -66],
                iconImageClipRect: [[10, 10], [54, 76]],
                hasBalloon : false
            }));
    }

    // обработчики событий для placeMarks
    geoObjects.forEach(obj => {
        obj.events.add('mouseenter', event => {
            // Ссылку на объект, вызвавший событие, можно получить из поля 'target'
            // Метод set задает значения опций для данного менеджера (https://tech.yandex.ru/maps/archive/doc/jsapi/2.0/ref/reference/option.Manager-docpage/)
            let geoObject = event.get('target');

            geoObject.options.set(
                {
                    iconImageClipRect: [[74, 10], [118, 76]]
                }
            );
            //map.hint.open(geoObject.geometry.getCoordinates(), geoObject.getPremise());
        })
            .add('mouseleave', event => {
                map.hint.close(true);
                event.get('target').options.set(
                    {
                        iconImageClipRect: [[10, 10], [54, 76]]
                    }
                );
            })
            .add('click', event => {
                let geoObject = event.get('target');

                coordinates = geoObject.geometry.getCoordinates();
                geoObject.options.set(
                    {
                        iconImageClipRect: [[10, 10], [54, 76]]
                    }
                );
                renderPopup(event.originalEvent.domEvent.originalEvent);
            });
    });

    clusterer.add(geoObjects);
    map.geoObjects.add(clusterer);
    return 0;
}

// ----------------------------------------------------------------------------------------------
// Функция добавления информации в основной массив
// ----------------------------------------------------------------------------------------------
function addInformation({ reviewName, reviewPlace, reviewImpressions }) {
    const obj = {
        name: reviewName.value,
        place: reviewPlace.value,
        date: getCurrentDateTime(), 
        text: reviewImpressions.value,
    };
    let reviews = listReviews.reviews;

    // проверим, есть ли в основном массиве текущие координаты
    for (const item of listReviews) {
        // если есть
        if (item.coordinates[0] === coordinates[0] && item.coordinates[1] === coordinates[1]) {
            // то добавить информацию только в массив с отзывами
            item.reviews.push(obj);
            return;
        }
    }

    // если не нашли placemark c этимиже координатами, то добавим всю информацию в основной массив как новый элемент
    if (!reviews) {
        reviews = [];
    }

    reviews.push(obj);

    listReviews.push({
        coordinates,
        reviews
    });
}

// ----------------------------------------------------------------------------------------------
// функция рендера попапа
// ----------------------------------------------------------------------------------------------
function renderPopup(event) {
    const WIDTH = 380, HEIGHT = 555; // габариты попапа

    let [x, y] = [event.clientX, event.clientY]; // координаты Х и У клика

    const html = generateTemplate(); // генерируем шаблон попапа 

    // ищем элемент, в который будем ложить попап
    const popup = document.querySelector('.popup');
    
    // позиционируем попап полностью относительно координат клика в окне
    if ((x + WIDTH) > document.body.clientWidth) {
        x -= WIDTH;
        if (x < 0) {
            x = 0;
        }
    }
    if ((y + HEIGHT) > document.body.clientHeight) {
        y -= HEIGHT;
        if (y < 0) {
            y = 0;
        }
    }
    popup.style = `
        top: ${y}px;
        left: ${x}px;
    `;

    // добавляем сгенерированный html в контейнер для попапа
    popup.innerHTML = html;

    renderCurrentReviewsInPopup(popup);

    // найдем кнопку "закрытия" попапа
    const popupCloseButton = popup.querySelector('.popup__close');
            
    // и навешиваем обработчик "закрытия" попапа
    popupCloseButton.addEventListener('click', event => {
        event.preventDefault();
        popup.innerHTML = '';
    });

    isClicked = false;
}

// ----------------------------------------------------------------------------------------------
// Обработчик кликов на кнопке "Добавить"
// ----------------------------------------------------------------------------------------------
function clickHandlerPopupButton(popup) {
    // найдем форму для отзывов
    const formReview = document.forms.formreview;

    // найдем необходимые поля (имя, место, впечатления)
    const reviewName = formReview.reviewName;
    const reviewPlace = formReview.reviewPlace;
    const reviewImpressions = formReview.reviewImpressions;

    // проверим введенные данные (валидация)
    if (validateInputs([reviewName, reviewPlace, reviewImpressions])) {
        addInformation({ reviewName, reviewPlace, reviewImpressions });
        ymaps.ready(renderMarks(listReviews, myMap));
        renderCurrentReviewsInPopup(popup);
        //localStorage.setItem('listReviews', JSON.stringify(listReviews))
    } else {
        return;
    }
}

// ----------------------------------------------------------------------------------------------
// Функция рендеринга попапа с добавлением обработчика на кнопку "Добавить"
// ----------------------------------------------------------------------------------------------
function renderCurrentReviewsInPopup(popup) {
    const html = generateTemplate(); // генерируем шаблон попапа 
    popup.innerHTML = html;
    // найдем кнопку "Добавить" отзыв в попапе
    const popupButton = popup.querySelector('.form__button');

    // и навешиваем обработчик кликов для добавления информации в основной массив
    popupButton.addEventListener('click', () => {
        clickHandlerPopupButton(popup);
    });
}

// ----------------------------------------------------------------------------------------------
// Функция генерации шаблона попапа по координатам
// ----------------------------------------------------------------------------------------------
function generateTemplate() {
    let isFound = false; // признак наличия в основном массиве отзывов (по координатам)
    const currentReviews = { // объект с массивом отзывов по текущим координатам
        count: 0,
        items: []
    };
    let address = null;
    
    address = geocodeBack(coordinates);
    
    // проверим, есть в основном массиве текущие координаты
    for (const item of listReviews) {
        if (item.coordinates[0] === coordinates[0] && item.coordinates[1] === coordinates[1]) {
            isFound = true;
            currentReviews.count = item.reviews.length;
            currentReviews.items = [...item.reviews];
            break;
        }
    }
    // Сгенерируем содержимое попапа в зависимости от listReviews и его длины
    const popupTemplate = document.querySelector('#popup-template').textContent;
    const render = Handlebars.compile(popupTemplate);

    return render({ address, isFound, ...currentReviews });
}

// ----------------------------------------------------------------------------------------------
// Функция обратного геокодирования (координаты -> адрес)
// ----------------------------------------------------------------------------------------------
async function geocodeBack(coords) {
    let result = await ymaps.geocode(coordinates);
    let addr = result.geoObjects.get(0).getAddressLine().split(', ').reverse();
    
    // добавляем префикс 'д.' к номеру дома
    if (/^[\d]/g.test(addr[0])) {
        addr.splice(0, 1, 'д. ' + addr[0]);
    }

    addr.length--; // убираем название страны (см. макет)

    return addr.join(', ');
}

// ----------------------------------------------------------------------------------------------
// функция валидации введенных данных
// ----------------------------------------------------------------------------------------------
function validateInputs(inputArray) {
    let isEmpty = false;

    for (const input of inputArray) {
        if (!input.value) {
            if (!input.classList.contains('fail')) {
                input.classList.add('fail');
            }
            isEmpty = false;
        } else {
            if (input.classList.contains('fail')) {
                input.classList.remove('fail');
            }
            isEmpty = true;
        }
    }
    return isEmpty;
}

function getCurrentDateTime() {
    let currDate = new Date(), // текущая дата
        //monthStr = "", dayStr = "", hoursStr = "", minutesStr = "", secondsStr = "",
        //month = 0, day = 0, hours = 0, minutes = 0, seconds = 0;

        month = currDate.getMonth() + 1, // т.к. январь - 1, не 0!
        day = currDate.getDate(),
        hours = currDate.getHours(),
        minutes = currDate.getMinutes(),
        seconds = currDate.getSeconds();

    // сформируем двузначные значения
    month = (month < 10) ? ("0" + month) : ("" + month);
    day = (day < 10) ? ("0" + day) : ("" + day);
    hours = (hours < 10) ? ("0" + hours) : ("" + hours);
    minutes = (minutes < 10) ? ("0" + minutes) : ("" + minutes);
    seconds = (seconds < 10) ? ("0" + seconds) : ("" + seconds);

    // сформируем текущую дату в наш общий формат для истории звонков
    return `${currDate.getFullYear()}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}