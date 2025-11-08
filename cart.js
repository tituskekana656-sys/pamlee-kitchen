// ============================
// Shopping Cart with localStorage
// ============================

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Add item to cart
function addToCart(id, name, price, image) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    saveCart(cart);
    showNotification('Added to cart!');
}

// Remove item from cart
function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
}

// Update item quantity
function updateQuantity(id, change) {
    const cart = getCart();
    const item = cart.find(item => item.id === id);

    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart(cart);
        }
    }
}

// Calculate cart total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Update cart UI
function updateCartUI() {
    const cart = getCart();
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    // Update cart count badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Update cart items display
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">R ${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                            <button class="btn btn-sm" onclick="removeFromCart('${item.id}')" style="margin-left:auto;background:#ef4444;color:white;">Remove</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // Update cart total
    if (cartTotal) {
        cartTotal.textContent = `R ${getCartTotal().toFixed(2)}`;
    }
}

// ============================
// CHECKOUT WITH REAL-TIME ORDER SYSTEM
// ============================

// Generate unique tracker ID
function generateTrackerId() {
    return 'PL-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// BroadcastChannel (with fallback)
const orderChannel = (() => {
    if (window.BroadcastChannel) {
        const ch = new BroadcastChannel('pamlee_orders');
        return {
            post: (data) => ch.postMessage(data),
            listen: (cb) => ch.addEventListener('message', e => cb(e.data))
        };
    } else {
        return {
            post: (data) => localStorage.setItem('pamlee_orders_event', JSON.stringify({ data, t: Date.now() })),
            listen: (cb) => window.addEventListener('storage', e => {
                if (e.key === 'pamlee_orders_event' && e.newValue) {
                    cb(JSON.parse(e.newValue).data);
                }
            })
        };
    }
})();

// Create order and notify admin
function createOrder(order) {
    const all = JSON.parse(localStorage.getItem('pamlee_orders') || '[]');
    all.unshift(order);
    localStorage.setItem('pamlee_orders', JSON.stringify(all));
    orderChannel.post({ type: 'new_order', order });
}

// Checkout function (shows modal)
function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    // Build checkout modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#0008;display:flex;justify-content:center;align-items:center;z-index:9999;">
          <div style="background:#fff;padding:2rem;border-radius:1rem;max-width:400px;width:90%;">
            <h3>Complete Your Order</h3>
            <p>Select your payment and delivery options:</p>

            <label>Payment Method:</label>
            <select id="payMethod" style="width:100%;padding:0.5rem;margin-bottom:1rem;">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="eft">EFT</option>
            </select>

            <label>Order Type:</label>
            <select id="fulfil" style="width:100%;padding:0.5rem;margin-bottom:1rem;">
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery (+R40)</option>
            </select>

            <div style="text-align:right;">
              <button id="cancelCheckout" class="btn btn-outline" style="margin-right:0.5rem;">Cancel</button>
              <button id="confirmCheckout" class="btn btn-gold">Confirm</button>
            </div>
          </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Handle actions
    modal.querySelector('#cancelCheckout').onclick = () => modal.remove();
    modal.querySelector('#confirmCheckout').onclick = () => {
        const payMethod = modal.querySelector('#payMethod').value;
        const fulfil = modal.querySelector('#fulfil').value;
        modal.remove();
        processCheckout(payMethod, fulfil);
    };
}

// Process checkout and save order
function processCheckout(paymentMethod, fulfilment) {
    const cart = getCart();
    const subtotal = getCartTotal();
    const deliveryFee = fulfilment === 'delivery' ? 40 : 0;
    const total = subtotal + deliveryFee;

    const user = JSON.parse(localStorage.getItem('pamlee_user'));
    const email = user ? user.email : 'guest@pamlee.co.za';

    const order = {
        trackerId: generateTrackerId(),
        userEmail: email,
        items: cart,
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        fulfilment,
        status: 'placed',
        placedAt: Date.now()
    };

    // Save and broadcast
    createOrder(order);

    // Clear cart
    localStorage.removeItem('cart');
    updateCartUI();
    closeCartModal();

    // Notify user
    alert(`✅ Order placed successfully!\n\nTracker ID: ${order.trackerId}\nTotal: R ${order.total.toFixed(2)}\n\nKeep this tracker ID to track your order.`);
}

// ============================
// Notifications
// ============================
function showNotification(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--secondary);
        color: var(--primary);
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ============================
// Cart modal controls
// ============================
function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.add('active');
        updateCartUI();
    }
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================
// Initialize cart on page load
// ============================
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.addEventListener('click', openCartModal);

    const closeCart = document.getElementById('closeCart');
    if (closeCart) closeCart.addEventListener('click', closeCartModal);

    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) closeCartModal();
        });
    }
});

// ============================
// Toast Animations
// ============================
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
}`;
document.head.appendChild(style);
