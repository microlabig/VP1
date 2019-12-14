let myMap, // Яндекс-карта
    listReviews = []; // Массив отзывов с точками на карте

// Инициализируем Яндекс-карту
ymaps.ready(init); 

// Функция инициализации Яндекс-карты
function init() {
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").
    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [55.39144640, 43.81787100], // Арзамас
        zoom: 17,

        controls: ['zoomControl'], // оставить только zoom-панель и yandex-copyright
        behaviors: ['drag'] // зададим поведение: drag - позволяет перемещать карту при нажатии ЛКМ
    });

    myMap.events.add('click', e => {
        //FIXME:if (!myMap.balloon.isOpen()) {

            const coords = e.get('coords');
            /* 
            listReviews = [
                {
                    coordinates: [
                        coords[0].toPrecision(6), coords[1].toPrecision(6)
                    ],
                    reviews: [
                        {
                            name: 'Сергей Мелюков',
                            place: 'Шоколадница',
                            date: '13.12.2015',
                            text: 'Ужасное место! Кругом зомби!!!',
                        }
                    ]
                }
            ]; */
    });
}

document.addEventListener('click', e => {
    const target = e.target;

    //if (target)
    if (target.tagName === 'YMAPS') {    
        const WIDTH = 380, HEIGHT = 435; // габариты попапа
        let [x, y] = [e.clientX, e.clientY];

        const isEmptyListReviews = listReviews.length > 0 ? true : false;

        // Сгенерируем сожержимое попапа в зависимости от listReviews и его длины
        const popupTemplate = document.querySelector('#popup-template').textContent;
        const render = Handlebars.compile(popupTemplate);
        const html = render({isEmptyListReviews, listReviews});
        
        const popup = document.querySelector('.popup');

        if ((x + WIDTH) > document.body.clientWidth) {
            x -= WIDTH;
        }
        
        if ((y + HEIGHT) > document.body.clientHeight) {
            y -= HEIGHT;
        }
        

        popup.style = `
            top: ${y}px;
            left: ${x}px;
        `;

        popup.innerHTML = html;
    }
});