let myMap, // Яндекс-карта
    listReviews = [], // Массив отзывов с точками на карте
    coordinates = [],
    geoObjects = [],
    isClicked = false; // показывать попап только при клике (не перемещении карты)

// Инициализируем Яндекс-карту
ymaps.ready(init);

// ----------------------------------
// Функция инициализации Яндекс-карты
// ----------------------------------
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

    /* let clusterer = new ymaps.Clusterer({
        clustererIcons: [
            {
                href: 'images/sprite.png',
                size: [107, 79],
                offset: [-81, -79]
            }
        ]
    }); */

    // обработчик клика на карте и получение координат
    myMap.events.add('click', event => {
        coordinates = [
            event.get('coords')[0].toPrecision(6),
            event.get('coords')[1].toPrecision(6)//.toPrecision(6)
        ];
        //isClicked = true;

        geoObjects.push(new ymaps.Placemark(
            [
                coordinates[0], // latitude
                coordinates[1]  // longitude
            ],
            {
                hintContent: '1234567'
            },
            {
                iconLayout: 'default#image',
                iconImageHref: 'images/sprite.png',
                iconImageSize: [44, 66],
                iconImageOffset: [-22, -66],
                iconImageClipRect: [[10, 10], [54, 76]]
            }));

        geoObjects.forEach(obj => {
            obj.events.add('mouseenter', event => {
                // Ссылку на объект, вызвавший событие, можно получить из поля 'target'
                // Метод set задает значения опций для данного менеджера (https://tech.yandex.ru/maps/archive/doc/jsapi/2.0/ref/reference/option.Manager-docpage/)
                event.get('target').options.set(
                    {
                        iconImageClipRect: [[74, 10], [118, 76]]
                    }
                );
            })
            .add('mouseleave', event => {
                event.get('target').options.set(
                    {
                        iconImageClipRect: [[10, 10], [54, 76]]
                    }
                );
            });
        });

        let clusterer = new ymaps.Clusterer({
            clustererIcons: [
                {
                    href: 'images/sprite.png',
                    size: [107, 79],
                    //offset: [-81, -79]
                    offset: [0, 0]
                }
            ]
        });
        clusterer.add(geoObjects);
        myMap.geoObjects.add(clusterer);

    });
}

// ----------------------------------------------------------------
// Обработчик кликов на карте с показом попапа и записей информации
// ----------------------------------------------------------------
document.addEventListener('click', event => {
    const target = event.target;

    // если кликнули на карте
    if (target.tagName === 'YMAPS' && isClicked) {
        // отрисуем попап и сохраним его в переменную
        const popup = renderPopup(event);

        // найдем кнопку "Добавить" отзыв в попапе
        const popupButton = popup.querySelector('.form__button');

        // и навешиваем обработчик кликов для добавления информации в основной массив
        popupButton.addEventListener('click', event => {
            // найдем форму для отзывов
            const formReview = document.forms.formreview;

            // найдем необходимые поля (имя, место, впечатления)
            const reviewName = formReview.reviewName;
            const reviewPlace = formReview.reviewPlace;
            const reviewImpressions = formReview.reviewImpressions;

            // проверим введенные данные (валидация)
            if (validateInputs([reviewName, reviewPlace, reviewImpressions])) {
                // проверим, есть в основном массиве текущие координаты
                for (const item of listReviews) {
                    if (item.coordinates[0] === coordinates[0] && item.coordinates[1] === coordinates[1]) {
                        item.reviews.push({
                            name: reviewName.value,
                            place: reviewPlace.value,
                            date: '13.12.2015', // FIXME: исправить считывание даты
                            text: reviewImpressions.value,
                        });
                        console.log(listReviews);
                        ymaps.ready(renderMarks(listReviews, myMap));
                        return;
                    }
                }

                addInformation({ reviewName, reviewPlace, reviewImpressions });

                console.log(listReviews);
                ymaps.ready(renderMarks(listReviews, myMap));
            } else {
                return;
            }
        });

        isClicked = false;
    }
});

function renderMarks(array, map) {
    for (let i = 0; i < array.length; i++) {
        geoObjects[i] = new ymaps.Placemark(
            [
                parseFloat(array[i].coordinates[0]), // latitude
                parseFloat(array[i].coordinates[1])  // longitude
            ],
            {
                hintContent: array[i].reviews.place
            },
            {
                iconLayout: 'default#image',
                iconImageHref: 'images/sprite.png',
                iconImageSize: [44, 66],
                iconImageOffset: [-22, -66],
                iconImageClipRect: [[10, 10], [54, 76]]
            });
    }
    let clusterer = new ymaps.Clusterer({
        clustererIcons: [
            {
                href: 'images/group.png',
                size: [107, 79],
                offset: [-81, -79]
                //offset: [138, 10]
            }
        ]
    });
    console.log('geoObjects=', geoObjects);

    clusterer.add(geoObjects);
    map.geoObjects.add(clusterer);


    /* for (const geoObj in geoObjects) {
        geoObj.events.add('mouseenter', event => {
            // Ссылку на объект, вызвавший событие,
            // можно получить из поля 'target'.
            //e.get('target').options.set('preset', 'islands#greenIcon');
        })
        .add('mouseleave', event => {
            //e.get('target').options.unset('preset');
        });
    } */
}

// -----------------------------------------------
// Функция добавления информации в основной массив
// -----------------------------------------------
function addInformation({ reviewName, reviewPlace, reviewImpressions }) {
    let reviews = listReviews.reviews;

    if (!reviews) {
        reviews = [];
    }

    reviews.push({
        name: reviewName.value,
        place: reviewPlace.value,
        date: '13.12.2015', // FIXME: исправить считывание даты
        text: reviewImpressions.value,
    });

    listReviews.push({
        coordinates,
        reviews
    });
}

// ----------------------
// функция рендера попапа
// ----------------------
function renderPopup(event) {
    const WIDTH = 380, HEIGHT = 555; // габариты попапа

    let [x, y] = [event.clientX, event.clientY]; // координаты Х и У клика

    // проверим, пустой ли наш основной массив с отзывами
    const isEmptyListReviews = listReviews.length > 0 ? true : false;

    let isFound = false; // признак наличия в основном массиве отзывов (по координатам)
    // проверим, есть в основном массиве текущие координаты
    for (const item of listReviews) {
        if (item.coordinates[0] === coordinates[0] && item.coordinates[1] === coordinates[1]) {
            isFound = true;
            break;
        }
    }

    // Сгенерируем сожержимое попапа в зависимости от listReviews и его длины
    const popupTemplate = document.querySelector('#popup-template').textContent;
    const render = Handlebars.compile(popupTemplate);
    const html = render({ isFound, listReviews });

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

    // найдем кнопку "закрытия" попапа
    const popupCloseButton = popup.querySelector('.popup__close');

    // и навешиваем обработчик "закрытия" попапа
    popupCloseButton.addEventListener('click', event => {
        event.preventDefault();
        popup.innerHTML = '';
    });

    return popup;
}

// ----------------------------------
// функция валидации введенных данных
// ----------------------------------
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