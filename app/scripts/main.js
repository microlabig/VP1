console.log(1);

ymaps.ready(init);

let myMap;

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
}