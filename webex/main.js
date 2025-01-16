const productGrid = document.getElementById("productGrid");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const sortSelect = document.getElementById("sortSelect");
const categoryCheckboxes = document.getElementById("categoryCheckboxes");

let products = [];
let sortedProducts = [];
let displayedProducts = 0;
const productsPerPage = 10;

// Функция загрузки данных
async function fetchProducts() {
    try {
        const response = await fetch(
            'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=fc8bfffb-4789-4f2f-9a32-93ccf2d808b1'
        );
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.statusText}`);
        }

        const data = await response.json();
        return data.map((item) => ({
            id: item.id,
            name: item.name,
            image: item.image_url,
            rating: item.rating,
            price: item.actual_price,
            discountPrice: item.discount_price || null,
            mainCategory: item.main_category,
            subCategory: item.sub_category,
        }));
    } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
        alert('Не удалось загрузить товары. Попробуйте позже.');
        return [];
    }
}

// Генерация списка чекбоксов категорий
function populateCategoryCheckboxes() {
    const categories = new Set(products.map(product => product.mainCategory));

    categories.forEach(category => {
        const checkboxWrapper = document.createElement("div");
        checkboxWrapper.className = "checkbox-wrapper";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `category-${category}`;
        checkbox.value = category;
        checkbox.className = "category-checkbox";

        const label = document.createElement("label");
        label.htmlFor = `category-${category}`;
        label.textContent = category;

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        categoryCheckboxes.appendChild(checkboxWrapper);
    });
}

// Функция фильтрации товаров
function filterProducts() {
    const formData = new FormData(document.querySelector("aside form"));

    const selectedCategories = Array.from(
        categoryCheckboxes.querySelectorAll(".category-checkbox:checked")
    ).map((checkbox) => checkbox.value);

    const priceFrom = parseFloat(formData.get("price-from")) || 0;
    const priceTo = parseFloat(formData.get("price-to")) || Infinity;

    const onlyDiscounted = formData.has("discount");

    sortedProducts = products.filter((product) => {
        const price = product.discountPrice || product.price;
        const inCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(product.mainCategory);
        const inPriceRange = price >= priceFrom && price <= priceTo;
        const hasDiscount = !onlyDiscounted || product.discountPrice;

        return inCategory && inPriceRange && hasDiscount;
    });

    applySort();
    productGrid.innerHTML = "";
    displayedProducts = 0;
    renderProducts();
}

// Генерация звезд для рейтинга
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

// Показ уведомлений
function showNotification(message, type = 'info') {
    const notificationsContainer = document.querySelector('.notifications-container');
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;

    notificationsContainer.appendChild(notification);
    notificationsContainer.classList.add('active');

    setTimeout(() => {
        notification.remove();
        if (notificationsContainer.children.length === 0) {
            notificationsContainer.classList.remove('active');
        }
    }, 5000);
}

// Добавление товара в корзину
function addToCart(productId) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (!cart.includes(productId)) {
        cart.push(productId);
        localStorage.setItem("cart", JSON.stringify(cart));
        showNotification("Товар добавлен в корзину!", "success");
    } else {
        showNotification("Этот товар уже в корзине!", "info");
    }
}

// Применение сортировки
function applySort() {
    const sortValue = sortSelect.value;

    if (sortValue === "price-asc") {
        sortedProducts.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortValue === "price-desc") {
        sortedProducts.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortValue === "rating") {
        sortedProducts.sort((a, b) => b.rating - a.rating);
    }
}

// Отображение товаров
function renderProducts() {
    const fragment = document.createDocumentFragment();

    const toRender = sortedProducts.slice(displayedProducts, displayedProducts + productsPerPage);
    toRender.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";

        const actualPrice = parseFloat(product.price);
        const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;

        let discountPercentage = 0;
        if (discountPrice && actualPrice > 0) {
            discountPercentage = Math.round(((actualPrice - discountPrice) / actualPrice) * 100);
        }

        const priceHTML = product.discountPrice
            ? `
                <div class="priceform">
                    <span class="price">${product.discountPrice.toFixed(2)}₽</span>
                    <span class="price-discounted">${product.price.toFixed(2)}₽</span>
                    <span class="discount-percent">-${discountPercentage}%</span>
                </div>`
            : `<span class="price">${product.price.toFixed(2)}₽</span>`;

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="rating">${generateStarsHTML(product.rating)} ${product.rating}</div>
            <div>${priceHTML}</div>
            <button data-id="${product.id}" class="add-to-cart">Добавить в корзину</button>
        `;
        fragment.appendChild(card);
    });

    productGrid.appendChild(fragment);
    displayedProducts += toRender.length;

    if (displayedProducts >= sortedProducts.length) {
        loadMoreBtn.style.display = "none";
    }

    document.querySelectorAll(".add-to-cart").forEach((button) => {
        button.addEventListener("click", (e) => {
            const productId = e.target.dataset.id;
            addToCart(productId);
        });
    });
}

// Инициализация каталога
async function initCatalog() {
    products = await fetchProducts();
    sortedProducts = [...products];
    populateCategoryCheckboxes();
    applySort();
    renderProducts();
}

// Обработчики событий
document.querySelector("aside form").addEventListener("submit", (e) => {
    e.preventDefault();
    filterProducts();
});

loadMoreBtn.addEventListener("click", () => {
    renderProducts();
});

sortSelect.addEventListener("change", () => {
    applySort();
    productGrid.innerHTML = "";
    displayedProducts = 0;
    renderProducts();
});

// Запуск приложения
initCatalog();
