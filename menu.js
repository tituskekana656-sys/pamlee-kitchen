// Menu page - Products data and filtering

const products = [
    {
        id: '1',
        name: 'Chocolate Cake',
        description: 'Rich chocolate layers with creamy frosting',
        category: 'cakes',
        price: 250,
        image: '../src/assets/product-cake.jpg',
        isPopular: true
    },
    {
        id: '2',
        name: 'Assorted Cupcakes',
        description: '6 piece variety pack with different flavors',
        category: 'cupcakes',
        price: 120,
        image: '../src/assets/product-cupcakes.jpg',
        isPopular: true
    },
    {
        id: '3',
        name: 'French Pastries',
        description: 'Buttery, flaky pastries fresh from the oven',
        category: 'pastries',
        price: 45,
        image: '../src/assets/product-pastries.jpg',
        isPopular: false
    },
    {
        id: '4',
        name: 'Artisan Bread',
        description: 'Freshly baked sourdough with crispy crust',
        category: 'bread',
        price: 35,
        image: '../src/assets/product-bread.jpg',
        isPopular: false
    },
    {
        id: '5',
        name: 'Vanilla Cake',
        description: 'Classic vanilla sponge with buttercream',
        category: 'cakes',
        price: 220,
        image: '../src/assets/product-cake.jpg',
        isPopular: false
    },
    {
        id: '6',
        name: 'Blueberry Muffins',
        description: 'Moist muffins packed with fresh blueberries',
        category: 'muffins',
        price: 60,
        image: '../src/assets/product-cupcakes.jpg',
        isPopular: true
    },
    {
        id: '7',
        name: 'Croissants',
        description: 'Light and buttery French croissants',
        category: 'pastries',
        price: 25,
        image: '../src/assets/product-pastries.jpg',
        isPopular: false
    },
    {
        id: '8',
        name: 'Whole Wheat Bread',
        description: 'Healthy whole wheat loaf',
        category: 'bread',
        price: 30,
        image: '../src/assets/product-bread.jpg',
        isPopular: false
    }
];

let currentCategory = 'all';

function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div class="cart-empty" style="grid-column: 1/-1; padding: 3rem;">No products found in this category</div>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card fade-in">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${product.isPopular ? '<span class="badge">Popular</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-footer">
                    <span class="price">R ${product.price.toFixed(2)}</span>
                    <button class="btn btn-gold btn-sm" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${product.image}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Re-apply fade-in animations
    document.querySelectorAll('.fade-in').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease-out ${index * 0.05}s, transform 0.6s ease-out ${index * 0.05}s`;
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 50);
    });
}

function filterCategory(category) {
    currentCategory = category;
    renderProducts(category);
    
    // Update active button
    document.querySelectorAll('.category-filters .btn').forEach(btn => {
        btn.classList.remove('btn-gold', 'active');
        btn.classList.add('btn-outline');
    });
    
    event.target.classList.remove('btn-outline');
    event.target.classList.add('btn-gold', 'active');
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
});
