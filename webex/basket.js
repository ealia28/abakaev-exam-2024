const cartContainer = document.getElementById("cartContainer");
const productGrid = document.getElementById("productGrid");

async function fetchProductById(id) {
    try {
        const response = await fetch(
            `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods/${id}?api_key=fc8bfffb-4789-4f2f-9a32-93ccf2d808b1`
        );
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Ошибка загрузки товара:", error);
        return null;
    }
}

function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    let starsHTML = "";

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="star full">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="star empty">★</span>';
    }

    return starsHTML;
}

let lastNotificationTime = 0;  // Время последнего уведомления

function showNotification(message, type = 'info') {
    const notificationsContainer = document.querySelector('.notifications-container');

    // Проверяем, прошло ли 5 секунд с последнего уведомления
    const currentTime = new Date().getTime();
    if (currentTime - lastNotificationTime < 5000) {
        return;  // Если прошло меньше 5 секунд, уведомление не показываем
    }

    // Обновляем время последнего уведомления
    lastNotificationTime = currentTime;

    // Удаляем старые уведомления, если они есть
    const existingNotification = notificationsContainer.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.classList.add('notification', type); // Добавляем класс типа уведомления
    notification.textContent = message;

    notificationsContainer.appendChild(notification);
    notificationsContainer.classList.add('active');

    // Убираем уведомление через 5 секунд
    setTimeout(() => {
        notification.remove();
        if (notificationsContainer.children.length === 0) {
            notificationsContainer.classList.remove('active');
        }
    }, 5000);
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter((id) => id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

async function renderCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        productGrid.innerHTML = "<p>Корзина пуста. Перейдите в каталог, чтобы добавить товары.</p>";
        
        // Получаем элемент p и растягиваем его на все 4 колонки
        const messageElement = productGrid.querySelector("p");
        messageElement.style.gridColumn = "span 4"; // Растягиваем на 4 колонки
        
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const productId of cart) {
        const product = await fetchProductById(productId);
        if (!product) continue;

        const card = document.createElement("div");
        card.className = "product-card";

        const actualPrice = parseFloat(product.actual_price);
        const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;

        let discountPercentage = 0;
        if (discountPrice && actualPrice > 0) {
            discountPercentage = Math.round(((actualPrice - discountPrice) / actualPrice) * 100);
        }

        const priceHTML = discountPrice
            ? `
                <div class="priceform">
                <span class="price">${discountPrice.toFixed(2)}₽</span>
                <span class="price-discounted">${actualPrice.toFixed(2)}₽</span>
                <span class="discount-percent">-${discountPercentage}%</span>
                </div>
            `
            : `<span class="price">${actualPrice.toFixed(2)}₽</span>`;

        const ratingHTML = generateStarsHTML(product.rating);

        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="rating">${ratingHTML} ${product.rating}</div>
            <div>${priceHTML}</div>
            <button data-id="${product.id}" class="remove-from-cart">Удалить</button>
        `;
        fragment.appendChild(card);
    }

    productGrid.innerHTML = "";
    productGrid.appendChild(fragment);

    // Добавление событий на кнопки удаления
    document.querySelectorAll(".remove-from-cart").forEach((button) => {
        button.addEventListener("click", (e) => {
            const productId = e.target.dataset.id;
            removeFromCart(productId);
            showNotification("Товар успешно удален из корзины!", "success");
        });
    });
}

// Инициализация корзины
renderCart();

async function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;

    // Суммирование стоимости товаров в корзине
    for (const productId of cart) {
        const product = await fetchProductById(productId);
        if (product) {
            total += product.discount_price
                ? parseFloat(product.discount_price)
                : parseFloat(product.actual_price);
        }
    }

    // Получение пользовательских данных о доставке
    const deliveryDate = document.getElementById("delivery_date").value;
    const deliveryInterval = document.getElementById("cpec_time").value;

    // Расчёт стоимости доставки
    const deliveryCost = calculateDeliveryCost(deliveryDate, deliveryInterval);

    // Итоговая сумма
    total += deliveryCost;

    // Обновление отображения итоговой суммы и стоимости доставки
    document.getElementById("totalPrice").textContent = `${total.toFixed(2)}₽`;
    document.querySelector(".delivcost").textContent = `Стоимость доставки: ${deliveryCost}₽`;
}

function calculateDeliveryCost(deliveryDate, deliveryInterval) {
    const baseCost = 200;
    const eveningExtraCost = 200; // Доплата за вечерние часы
    const weekendExtraCost = 300; // Доплата за выходные

    if (!deliveryDate) return baseCost; // Если дата не указана, возвращаем базовую стоимость

    const selectedDate = new Date(deliveryDate);
    const isWeekend = [0, 6].includes(selectedDate.getDay()); // Проверяем, выходной ли это день
    const isEvening = deliveryInterval && deliveryInterval.split('-')[0] >= '18:00'; // Проверяем вечерний интервал

    if (isWeekend) {
        return weekendExtraCost;
    } else if (isEvening) {
        return baseCost + eveningExtraCost;
    } else {
        return baseCost;
    }
}

// События для обновления доставки и итоговой суммы
document.getElementById("delivery_date").addEventListener("change", calculateTotal);
document.getElementById("cpec_time").addEventListener("change", calculateTotal);

// Обновление при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    calculateTotal();
});

async function handleOrderSubmit(event) {
    event.preventDefault();

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        showNotification("Корзина пуста. Невозможно оформить заказ.", "error");
        return;
    }

    const formData = new FormData(document.getElementById("orderForm"));
    const deliveryAddress = formData.get("delivery_address");
    let deliveryDate = formData.get("delivery_date");
    const deliveryInterval = formData.get("delivery_interval");
    const fullName = formData.get("full_name");
    const phone = formData.get("phone");
    const email = formData.get("email");
    const comment = formData.get("comment");
    let sub = formData.get("subscribe");

    if (sub === "on") {
        sub = 1;
    } else {
        sub = 0;
    }
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = deliveryDate.match(datePattern);

    if (match) {
        const [, year, month, day] = match;
        deliveryDate = `${day}.${month}.${year}`;
    }

    const orderData = {
        delivery_address: deliveryAddress,
        delivery_date: deliveryDate,
        delivery_interval: deliveryInterval,
        full_name: fullName,
        phone: phone,
        email: email,
        good_ids: cart,
        comment: comment,
        subscribe: sub
    };
    console.log(orderData);
    try {
        // console.log("Данные для отправки:", JSON.stringify(orderData, null, 2));
        const response = await fetch("https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=fc8bfffb-4789-4f2f-9a32-93ccf2d808b1", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error(`Ошибка отправки заказа: ${response.statusText}`);
        }

        const result = await response.json();
        showNotification("Заказ успешно оформлен!", "success");
        localStorage.removeItem("cart");
        renderCart();
        calculateTotal();
        console.log("Результат оформления заказа:", result);
        window.location.replace("main.html");
    } catch (error) {
        console.error("Ошибка при оформлении заказа:", error);
        showNotification("Ошибка при оформлении заказа. Повторите попытку позже.", "error");
    }
}

// Добавляем обработчик на форму оформления заказа
document.getElementById("orderForm").addEventListener("submit", handleOrderSubmit);

// Обновляем итоговую стоимость при загрузке и изменении корзины
document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    calculateTotal();
});