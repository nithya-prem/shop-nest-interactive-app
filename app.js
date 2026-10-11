// Global Application State
let products = [];
let cart = JSON.parse(localStorage.getItem('shopnest_cart')) || [];
let currentCategory = 'All';
let searchQuery = '';

// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryContainer = document.getElementById('categoryContainer');
const loader = document.getElementById('loader');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeModal = document.getElementById('closeModal');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

// 1. Load Products via Fetch API with async/await
async function fetchProducts() {
    try {
        loader.style.display = 'block';
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to load products');
        products = await response.json();
        
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        productGrid.innerHTML = `<p class="no-products">Failed to load products. Please check your local server setup.</p>`;
    } finally {
        loader.style.display = 'none';
    }
}

// 2. Render Products Dynamically using DOM Methods
function renderProducts(items) {
    productGrid.innerHTML = '';

    if (items.length === 0) {
        productGrid.innerHTML = `<div class="no-products">No products found</div>`;
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <h4>${product.name}</h4>
            <div class="rating">⭐ ${product.rating}</div>
            <div class="pricing">
                <span class="price">$${product.price.toFixed(2)}</span>                 <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
            </div>
            <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
        `;

        productGrid.appendChild(card);
    });
}

// 3. Combined Filtering (Live Search + Category Buttons)
function filterAndRenderProducts() {
    const filtered = products.filter(product => {
        const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    renderProducts(filtered);
}

// Event Listener for Live Search (using 'input' event)
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    filterAndRenderProducts();
});

// Event Listener for Category Filter Buttons
categoryContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-btn')) {
        // Update active class
        document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        currentCategory = e.target.dataset.category;
        filterAndRenderProducts();
    }
});

// 4. Fully Functional Cart & LocalStorage Integration
productGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const productId = parseInt(e.target.dataset.id);
        addToCart(productId);
    }
});

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartState();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }

    updateCartState();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    updateCartState();
}

function updateCartState() {
    // Save to localStorage
    localStorage.setItem('shopnest_cart', JSON.stringify(cart));

    // Update live header count
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalCount;

    renderCartModal();
}

// Render Cart Modal Items & Running Total
function renderCartModal() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
        cartTotal.textContent = '0.00';
        return;
    }

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';

        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>                 <div>$${item.price.toFixed(2)} each</div>
                <div class="qty-controls">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>                 </div>             </div>             <div>                 <div style="font-weight: bold; margin-bottom: 5px;">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;

        cartItemsContainer.appendChild(row);
    });

    // Reactive Running Total calculation
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

// Make cart helper functions globally accessible for inline onclick handlers
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;

// Modal Toggles
cartBtn.addEventListener('click', () => {
    renderCartModal();
    cartModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    cartModal.classList.add('hidden');
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    alert('Order placed successfully! Thank you for shopping with ShopNest.');
    cart = [];
    updateCartState();
    cartModal.classList.add('hidden');
});

// Initial App Startup
fetchProducts();
updateCartState();