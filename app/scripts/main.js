let myMap, // Яндекс-карта
    listReviews = [], // Массив отзывов с точками на карте
    geoObjects = [], // массив с placeMarks
    glob = {
        address: "",
        coordinates: [], // глобальные текущие координаты на карте
        review: "",
        name: "",
        place: "",
        date: ""
    }

new Promise(resolve => ymaps.ready(resolve) // Инициализируем Яндекс-карту
    .then(() => {
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

        // загрузим данные из localStorage в глобальный массив отзывов
        listReviews = getFromLocalStorage();
        // если он не пустой - отрендерить метки
        if (listReviews.length > 0) {
            renderMarks(listReviews, myMap);
        }

        // обработчик клика на карте и получение координат
        myMap.events.add('click', event => {
            const position = event.get('position'); // текущие координаты на карте [широта, долгота]
            const coordinates = event.get('coords'); // текущие координаты курсора на окне [x, y]

            // запишем в текущий объект координаты клика
            glob.coordinates = [coordinates[0], coordinates[1]];            

            // выполним обратное геокодирование (для взятия адреса по координатам)
            geocodeBack(coordinates)
                .then((str) => {
                    // запишем адрес в текущий объект
                    glob.address = str;

                    // отрендерим попап
                    renderPopup(position);

                    // ----------------------------------------------------------------------------------------------
                    // Обработчик скрытия попапа по отпусканию клавиши <ESC>
                    // ----------------------------------------------------------------------------------------------
                    document.addEventListener('keyup', event => {
                        const popup = document.querySelector('.popup__container');

                        if (popup && event.keyCode === 27) { // <ESC>
                            event.preventDefault();
                            popup.innerHTML = '';
                        }
                    });
                });
        });
    })
);

// ----------------------------------------------------------------------------------------------
// Функция загрузки данных из localStorage
// ----------------------------------------------------------------------------------------------
function getFromLocalStorage() {
    let arr = JSON.parse(localStorage.getItem('listReviews'));
    
    if (!arr) { // если получили не массив
        return []; // вернуть пустой массив
    }

    return arr;
}

// ----------------------------------------------------------------------------------------------
// Функция сохранения данных в localStorage
// ----------------------------------------------------------------------------------------------
function saveToLocalStorage(arr) {
    localStorage.setItem('listReviews', JSON.stringify(arr));
}

// ----------------------------------------------------------------------------------------------
// функция рендера попапа
// ----------------------------------------------------------------------------------------------
function renderPopup(position, str) {
    const WIDTH = 380, HEIGHT = 555; // габариты попапа

    let [x, y] = position; // координаты Х и У клика

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

    // отрендерить текущие отзывы в попапе
    renderCurrentReviewsInPopup(popup);
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

    // найдем кнопку "закрытия" попапа
    const popupCloseButton = popup.querySelector('.popup__close');

    // и навешиваем обработчик "закрытия" попапа
    popupCloseButton.addEventListener('click', event => {
        event.preventDefault();
        popup.innerHTML = '';
    });
}

// ----------------------------------------------------------------------------------------------
// Функция генерации шаблона попапа по координатам
// ----------------------------------------------------------------------------------------------
function generateTemplate() {
    let isFound = false; // признак наличия в основном массиве отзывов (по координатам)
    const currentReviews = { // объект с массивом отзывов по текущим координатам
        items: []
    };
    const address = glob.address;

    // проверим, есть в основном массиве текущие координаты    
    for (const item of listReviews) {
        if (item.coordinates[0] === glob.coordinates[0] && item.coordinates[1] === glob.coordinates[1]) {
            isFound = true;
            currentReviews.items.push(item);
        }
    }

    // Сгенерируем содержимое попапа в зависимости от listReviews и его длины
    const popupTemplate = document.querySelector('#popup-template').textContent;
    const render = Handlebars.compile(popupTemplate);
    
    return render({ address, isFound, ...currentReviews });
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
        // добавим введенную информацию в глобальный объект и массив
        addInformation({ reviewName, reviewPlace, reviewImpressions });
        // отрендерим метку на карте
        ymaps.ready(renderMarks(listReviews, myMap));
        // отрендерим текущий введеный отзыв в попап
        renderCurrentReviewsInPopup(popup);

        saveToLocalStorage(listReviews);
    } else {
        return;
    }
}

// ----------------------------------------------------------------------------------------------
// Функция добавления информации в основной массив
// ----------------------------------------------------------------------------------------------
function addInformation({ reviewName, reviewPlace, reviewImpressions }) {
    glob = {
        ...glob,
        name: reviewName.value,
        place: reviewPlace.value,
        date: getCurrentDateTime(),
        review: reviewImpressions.value,
    };

    listReviews.push({...glob});
}

// ----------------------------------------------------------------------------------------------
// Функция рендеринга меток на карте
// ----------------------------------------------------------------------------------------------
function renderMarks(array, map) {
    // Создаем собственный макет с информацией о выбранном геообъекте.
    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        `
        <div class="balloon">
            <h2 class="balloon__header">{{ properties.balloonContentHeader|raw }}</h2>
            <a href="#" class="balloon__link">{{ properties.balloonContentBody|raw }}</a>
            <div class="balloon__review">{{ properties.myBaloonReview|raw }}</div>
            <div class="balloon__footer">{{ properties.balloonContentFooter|raw }}</div>
        </div>
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
            clusterBalloonContentLayoutWidth: 270,
            clusterBalloonContentLayoutHeight: 200,
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

    // переведем все объекты изз глобального массива в метки
    for (let i = 0; i < array.length; i++) {
        geoObjects.push(new ymaps.Placemark(
            [
                array[i].coordinates[0], // latitude
                array[i].coordinates[1]  // longitude
            ],
            {
                // Устаналиваем данные, которые будут отображаться в балуне.
                balloonContentHeader: array[i].place,
                balloonContentBody: array[i].address,
                balloonContentFooter: array[i].date,
                myBaloonReview: array[i].review // собственное св-во
            },
            {
                iconLayout: 'default#image',
                iconImageHref: 'images/sprite.png',
                iconImageSize: [44, 66],
                iconImageOffset: [-22, -66], // т. === середина нижней границы иконки
                iconImageClipRect: [[10, 10], [54, 76]],
                hasBalloon: false // не показывать балун
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
                event.get('target').options.set(
                    {
                        iconImageClipRect: [[10, 10], [54, 76]]
                    }
                );
            })
            .add('click', event => {
                let geoObject = event.get('target');

                glob.coordinates = geoObject.geometry.getCoordinates();

                geocodeBack(glob.coordinates).then((str) => {
                    glob.address = str;

                    renderPopup(
                        [
                            event.originalEvent.domEvent.originalEvent.clientX,
                            event.originalEvent.domEvent.originalEvent.clientY
                        ]
                    );
                });
            });
    });

    // добавим метки в кластер
    clusterer.add(geoObjects);
    // добавим кластер на карту
    map.geoObjects.add(clusterer);

    // обработчик открытия балуна на кластере
    clusterer.events.add('balloonopen', event => {
        //console.log(event.get('target').getData()); // данные текущего кластера
        //console.log(event.get('target').getData().geometry.getCoordinates()); // координаты текущего кластера

        let geoBojectsInCluster = event.get('target').getData().cluster.getGeoObjects(); // текущие гео-объекты в кластере
        glob.coordinates = geoBojectsInCluster[0].geometry.getCoordinates(); // взять текущие координаты одного из гео-объектов кластера
        
        // найдем адрес и выведем в попап при клике на ссылку <a></a>
        geocodeBack(glob.coordinates).then((str) => {
            const link = document.querySelector('.balloon__link');

            link.addEventListener('click', event => {
                clusterer.balloon.close(); // закроем балун
                event.preventDefault();
                glob.address = str;
                renderPopup(
                    [
                        event.clientX,
                        event.clientY
                    ]
                );
            })
        });
    });  

    /* 
    // маштабирование карты для вмещения в нее всех меток
    myMap.setBounds(clusterer.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 15
    }); 
    */
}



// ----------------------------------------------------------------------------------------------
// Функция обратного геокодирования (координаты -> адрес)
// ----------------------------------------------------------------------------------------------
async function geocodeBack(coords) {
    let result = await ymaps.geocode(coords);
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

    // переберем все инпуты и проверим не пустые ли они
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

// ----------------------------------------------------------------------------------------------
// Функция возвращает текущую дату в формате стр.
// ----------------------------------------------------------------------------------------------
function getCurrentDateTime() {
    let currDate = new Date(), // текущая дата

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

    // сформируем текущую дату в формат по макету
    return `${currDate.getFullYear()}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}