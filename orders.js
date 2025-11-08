// ============================
// orders.js
// Shared Real-Time Order System for Pam_Lee's Kitchen
// Frontend-only sync (localStorage + BroadcastChannel)
// ============================

// 🔢 Generate a unique tracker ID
export function generateTrackerId() {
  return (
    "PL-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

// 💬 Setup BroadcastChannel (with localStorage fallback)
const orderChannel = (() => {
  if (window.BroadcastChannel) {
    const ch = new BroadcastChannel("pamlee_orders");
    return {
      post: (data) => ch.postMessage(data),
      listen: (cb) => ch.addEventListener("message", (e) => cb(e.data)),
    };
  } else {
    return {
      post: (data) =>
        localStorage.setItem(
          "pamlee_orders_event",
          JSON.stringify({ data, t: Date.now() })
        ),
      listen: (cb) =>
        window.addEventListener("storage", (e) => {
          if (e.key === "pamlee_orders_event" && e.newValue) {
            cb(JSON.parse(e.newValue).data);
          }
        }),
    };
  }
})();

// ============================
// 💾 Create a new order
// ============================
export function createOrder(order) {
  const all = JSON.parse(localStorage.getItem("pamlee_orders") || "[]");

  // add default timeline
  order.timeline = [
    {
      date: new Date().toLocaleString(),
      message: "Order placed successfully.",
    },
  ];

  all.unshift(order);
  localStorage.setItem("pamlee_orders", JSON.stringify(all));

  // notify other tabs
  orderChannel.post({ type: "new_order", order });
  notify(`🛍️ New order placed! Tracker ID: ${order.trackerId}`);
}

// ============================
// 🔄 Update order status (Admin only)
// ============================
export function updateOrder(trackerId, newStatus, note = "") {
  const all = JSON.parse(localStorage.getItem("pamlee_orders") || "[]");
  const idx = all.findIndex((o) => o.trackerId === trackerId);
  if (idx === -1) return;

  all[idx].status = newStatus;
  all[idx].updatedAt = Date.now();

  // add timeline entry
  all[idx].timeline = all[idx].timeline || [];
  all[idx].timeline.push({
    date: new Date().toLocaleString(),
    message: note || `Order status updated to "${newStatus}"`,
  });

  localStorage.setItem("pamlee_orders", JSON.stringify(all));

  orderChannel.post({ type: "update_order", trackerId, status: newStatus });
  notify(`📦 Order ${trackerId} → ${newStatus}`);
}

// ============================
// 🧭 Listen to real-time order events
// ============================
export function listenOrders(callback) {
  orderChannel.listen(callback);
}

// ============================
// 🔍 Get all orders
// ============================
export function getAllOrders() {
  return JSON.parse(localStorage.getItem("pamlee_orders") || "[]");
}

// ============================
// 🔍 Get single order by tracker ID
// ============================
export function getOrder(trackerId) {
  const all = getAllOrders();
  return all.find((o) => o.trackerId === trackerId) || null;
}

// ============================
// 🔔 Toast Notification
// ============================
export function notify(msg, time = 3000) {
  const div = document.createElement("div");
  div.textContent = msg;
  Object.assign(div.style, {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    background: "var(--secondary)",
    color: "var(--primary)",
    padding: "1rem 1.2rem",
    borderRadius: "8px",
    fontWeight: "600",
    zIndex: 9999,
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    transition: "opacity 0.3s ease",
  });
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, time);
}
