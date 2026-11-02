const KEY = "mirja-traders-cart";

export function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("mirja-cart-updated"));
}

export function addToCart(product) {
  if (!product?._id || product.stock <= 0) return false;

  const cart = getCart();
  const existing = cart.find(i => i._id === product._id);

  if (existing) {
    if (existing.quantity >= Math.min(20, product.stock)) return false;
    existing.quantity += 1;
  } else {
    cart.push({
      _id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      quantity: 1
    });
  }

  saveCart(cart);
  return true;
}

export function updateQuantity(id, quantity) {
  const next = getCart()
    .map(i => i._id === id ? {
      ...i, quantity: Math.min(20, Math.max(0, quantity))
    } : i)
    .filter(i => i.quantity > 0);

  saveCart(next);
}

export function clearCart() {
  saveCart([]);
}
