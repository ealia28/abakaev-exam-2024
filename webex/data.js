async function loadDishes() {
    try {
        const response = await fetch(
            'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=fc8bfffb-4789-4f2f-9a32-93ccf2d808b1'
        );
        if (!response.ok) {
            throw new Error('Для получения доступа к API' +
                'необходимо пройти процедуру авторизации.' + 
                ' Для этого нужно передать в запросе персональный API Key.');
        }
        const menu = await response.json();
        menu.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        console.log(menu);
        return menu;
    } catch (error) {
        console.error('Ошибка при загрузке блюд:', error);
        alert('Не удалось загрузить меню. Попробуйте обновить страницу.');
        return [];
    }
}

window.loadDishes = loadDishes;