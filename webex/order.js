document.addEventListener("DOMContentLoaded", async () => {
    const apiUrl = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders";
    const apiKey = "fc8bfffb-4789-4f2f-9a32-93ccf2d808b1";
    const ordersTable = document.getElementById("orders-table").querySelector("tbody");

    // Функция для получения списка заказов
    async function fetchOrders() {
        try {
            const response = await fetch(`${apiUrl}?api_key=${apiKey}`);
            if (!response.ok) {
                throw new Error('Ошибка загрузки заказов');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка при загрузке заказов', error);
            return [];
        }
    }

    // Функция для получения информации о товаре по ID
    async function fetchDishById(dishId) {
        const apiUrl = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods/${dishId}?api_key=${apiKey}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Ошибка загрузки блюда');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка при загрузке данных о блюде', error);
            return null;
        }
    }

    // Форматирование даты
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
    }

    // Функция для отображения информации о заказе в модальном окне
    function showModal(content) {
        const modal = document.getElementById("order-details-modal");
        const detailsContainer = modal.querySelector("#order-details");
        detailsContainer.innerHTML = content;
        modal.style.display = "block";
    }
    

    function hideModal() {
        const modal = document.getElementById("order-details-modal");
        modal.style.display = "none";
    }

    document.querySelectorAll(".close-button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".modal-window").forEach(modal => {
                modal.style.display = "none";
            });
        });
    });
    
    window.addEventListener("click", (event) => {
        if (event.target.classList.contains("modal-window")) {
            event.target.style.display = "none";
        }
    });
    
    const closeButton = document.querySelector(".close-button");
    closeButton.addEventListener("click", hideModal);

    window.addEventListener("click", (event) => {
        if (event.target === document.getElementById("order-details-modal")) {
            hideModal();
        }
    });

    // Рендеринг заказов в таблицу
    async function renderOrders(orders) {
        ordersTable.innerHTML = "";

        for (const [index, order] of orders.entries()) {
            const row = document.createElement("tr");
            
            const goodsInfo = await Promise.all(order.good_ids.map(fetchDishById));

            const dishDetails = goodsInfo.map(dish => {
                if (dish) {
                    const dishName = dish.name || "Не указано";
                    const dishPrice = dish.discount_price != null ? dish.discount_price : dish.actual_price || 0; // Проверка скидки
                    return `<p>${dishName}</p>`;
                }
                return "<p>Не удалось загрузить данные о товаре</p>";
            }).join("");

            const deliveryTime = order.delivery_date 
                ? `${new Date(order.delivery_date).toLocaleDateString("ru-RU")} ${order.delivery_interval || ''}` 
                : "Не указано";

            const deliveryAddress = order.delivery_address || "Не указан";
            const fullName = order.full_name || "Не указано";
            const email = order.email || "Не указано";
            const phone = order.phone || "Не указан";
            const comment = order.comment || "Нет комментариев";

            const deliveryData = order.delivery_date 
                ? `${new Date(order.delivery_date).toLocaleDateString("ru-RU")}` 
                : "Не указано";

            const totalPrice = goodsInfo.reduce((sum, dish) => {
                const price = dish?.discount_price != null ? dish.discount_price : dish?.actual_price || 0;
                return sum + price;
            }, 0);

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>${dishDetails}</td>
                <td>${totalPrice} ₽</td>
                <td>${deliveryTime}</td>
                <td class="actionss">
                    <i class="bi bi-eye" title="Подробнее" style="cursor: pointer;"></i>
                    <i class="bi bi-pencil" title="Подробнее" style="cursor: pointer;"></i>
                    <i class="bi bi-trash" title="Удаление" style="cursor: pointer;"></i>
                </td>
            `;

            function showNotification(message, type = 'info') {
                const notificationsContainer = document.querySelector('.notifications-container');
                const notification = document.createElement('div');
                notification.classList.add('notification', type);
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
         
            row.querySelector(".bi-eye").addEventListener("click", async () => {
                // Получаем информацию о товарах из good_ids
                const goodsInfo = await Promise.all(order.good_ids.map(fetchDishById));

                // Создаем список товаров с учетом скидки
                const dishDetails = goodsInfo.map(dish => {
                    if (dish) {
                        const dishName = dish.name || "Не указано";
                        const dishPrice = dish.discount_price != null ? dish.discount_price : dish.actual_price || 0; // Проверка скидки
                        return `<p>${dishName}</p>`;
                    }
                    return "<p>Не удалось загрузить данные о товаре</p>";
                }).join("");

                const totalPrice = goodsInfo.reduce((sum, dish) => {
                    const price = dish?.discount_price != null ? dish.discount_price : dish?.actual_price || 0;
                    return sum + price;
                }, 0);

                const details = `
                    <div class="order-details">
                        <div class="detail-item">
                            <strong>Дата оформления</strong>
                            <span>${formatDate(order.created_at)}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Имя</strong>
                            <span>${fullName}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Телефон</strong>
                            <span>${phone}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Email</strong>
                            <span>${email}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Адрес доставки</strong>
                            <span>${deliveryAddress}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Дата доставки</strong>
                            <span>${deliveryData}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Время доставки</strong>
                            <span>${order.delivery_interval}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Состав заказа</strong>
                            <span>${dishDetails}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Стоимость</strong>
                            <span>${totalPrice} ₽</span>
                        </div>
                        <div class="detail-item">
                            <strong>Комментарий</strong>
                            <span>${comment}</span>
                        </div>
                    </div>
                `;
                showModal(details);
            });

            async function editOrder(order) {
                const editModal = document.getElementById("edit-order-modal");
                const editForm = editModal.querySelector("form");

                // Заполняем форму текущими данными заказа
                editForm.querySelector("#edit-full-name").value = order.full_name || "";
                editForm.querySelector("#edit-phone").value = order.phone || "";
                editForm.querySelector("#edit-email").value = order.email || "";
                editForm.querySelector("#edit-delivery-address").value = order.delivery_address || "";
                editForm.querySelector("#edit-delivery-date").value = order.delivery_date || "";
                editForm.querySelector("#edit-delivery-interval").value = order.delivery_interval || "";
                editForm.querySelector("#edit-comment").value = order.comment || "";

                // Открываем модальное окно
                editModal.style.display = "block";

                // Обработка отправки формы
                editForm.onsubmit = async (event) => {
                    event.preventDefault(); // Предотвращаем перезагрузку страницы

                    // Собираем данные из формы
                    const updatedOrder = {
                        full_name: editForm.querySelector("#edit-full-name").value,
                        phone: editForm.querySelector("#edit-phone").value,
                        email: editForm.querySelector("#edit-email").value,
                        delivery_address: editForm.querySelector("#edit-delivery-address").value,
                        delivery_date: editForm.querySelector("#edit-delivery-date").value,
                        delivery_interval: editForm.querySelector("#edit-delivery-interval").value,
                        comment: editForm.querySelector("#edit-comment").value
                    };

                    try {
                        // Отправляем запрос на обновление заказа
                        const response = await fetch(`${apiUrl}/${order.id}?api_key=${apiKey}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(updatedOrder)
                        });

                        if (response.ok) {
                            showNotification("Заказ успешно изменен", "success");
                            loadOrders(); // Перезагружаем список заказов
                            editModal.style.display = "none"; // Закрываем модальное окно
                        } else {
                            showNotification("Заказ не удалось обновить", "error");
                            throw new Error("Не удалось обновить заказ.");
                        }
                    } catch (error) {
                        alert(error.message);
                    }
                };
            }

            row.querySelector(".bi-pencil").addEventListener("click", () => {
                editOrder(order);
            });

            row.querySelector(".bi-trash").addEventListener("click", async () => {
                const deleteModal = document.getElementById("delete-confirm-modal");
                const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
                const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

                deleteModal.style.display = "block";

                cancelDeleteBtn.addEventListener("click", () => {
                    deleteModal.style.display = "none";
                });

                confirmDeleteBtn.addEventListener("click", async () => {
                    try {
                        const response = await fetch(`${apiUrl}/${order.id}?api_key=${apiKey}`, { method: "DELETE" });
                        if (response.ok) {
                            showNotification("Заказ успешно удален", "success");
                            loadOrders();
                        } else {
                            showNotification("Не удалось удалить заказ", "success");
                            throw new Error("Не удалось удалить заказ.");
                        }
                    } catch (error) {
                        alert(error.message);
                    }
                    deleteModal.style.display = "none";
                });
            });

            ordersTable.appendChild(row);
        }
    }

    async function loadOrders() {
        const orders = await fetchOrders();
        renderOrders(orders);
    }

    loadOrders();
});
