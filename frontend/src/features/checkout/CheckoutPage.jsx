import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Trash2, ArrowLeft,
  Plus, Minus, CheckCircle2
} from "lucide-react";
import {
  getCart, updateQuantity, clearCart
} from "../cart/cart";
import "./checkout.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const money = n => "৳" + Number(n || 0).toLocaleString("en-BD");

export default function CheckoutPage() {
  const [cart, setCart] = useState(getCart);
  const [customer, setCustomer] = useState({
    name: "", phone: "", address: "", city: "", notes: ""
  });

  const [deliveryZone, setDeliveryZone] =
    useState("outsideDhaka");

  const [shippingConfig, setShippingConfig] =
    useState(null);

  useEffect(() => {
    fetch(API + "/checkout/config")
      .then(r => {
        if (!r.ok) throw new Error("Checkout unavailable");
        return r.json();
      })
      .then(d => setShippingConfig(d.data))
      .catch(() => setShippingConfig(null));
  }, []);

  const deliveryCharge = shippingConfig?.enabled
    ? Number(shippingConfig[deliveryZone] || 0)
    : 0;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(null);

  const subtotal = cart.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  );

  function changeQuantity(id, quantity) {
    updateQuantity(id, quantity);
    setCart(getCart());
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (busy || !cart.length || !shippingConfig?.enabled) return;

    setBusy(true);
    setError("");

    try {
      const requestKey = "mirja-checkout-request-id";
      const signatureKey = "mirja-checkout-signature";

      const signature = JSON.stringify({
        customer,
        deliveryZone,
        items: cart.map(i => ({
          productId: i._id,
          quantity: i.quantity
        }))
      });

      if (sessionStorage.getItem(signatureKey) !== signature) {
        sessionStorage.removeItem(requestKey);
        sessionStorage.setItem(signatureKey, signature);
      }

      let requestId = sessionStorage.getItem(requestKey);

      if (!requestId) {
        requestId = crypto.randomUUID();
        sessionStorage.setItem(requestKey, requestId);
      }

      const response = await fetch(API + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          customer,
          deliveryZone,
          items: cart.map(i => ({
            productId: i._id,
            quantity: i.quantity
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order failed");
      }

      setCompleted(data);
      sessionStorage.removeItem(requestKey);
      sessionStorage.removeItem(signatureKey);
      clearCart();
      setCart([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (completed) {
    return <main className="mt-checkout-success">
      <CheckCircle2 size={65} color="#16875c"/>
      <h1>Order Placed Successfully!</h1>
      <p>Thank you for shopping with Mirja Traders.</p>
      <div className="mt-checkout-confirmation">
        <p>Order Number: <strong>{completed.orderNumber}</strong></p>
        <p>Total: <strong>{money(completed.total)}</strong></p>
        <p>Payment: Cash on Delivery</p>
      </div>
      <Link to="/shop">Continue Shopping</Link>
    </main>;
  }

  return <main className="mt-checkout">
    <header className="mt-checkout-header">
      <Link to="/shop"><ArrowLeft size={18}/> Back to Shop</Link>
      <h2>MIRJA TRADERS</h2>
    </header>

    <section className="mt-checkout-container">
      <h1><ShoppingCart/> Shopping Cart & Checkout</h1>

      {!cart.length ? (
        <div className="mt-checkout-empty">
          <ShoppingCart size={54}/>
          <h2>Your cart is empty</h2>
          <Link to="/shop">Browse Products</Link>
        </div>
      ) : (
        <div className="mt-checkout-grid">
          <form onSubmit={placeOrder} className="mt-checkout-card">
            <h2>Delivery Information</h2>

            <label>Full Name
              <input required minLength={2} maxLength={100}
                value={customer.name}
                onChange={e => setCustomer({...customer, name:e.target.value})}/>
            </label>

            <label>Mobile Number
              <input required type="tel"
                pattern="01[3-9][0-9]{8}"
                placeholder="01XXXXXXXXX"
                value={customer.phone}
                onChange={e => setCustomer({...customer, phone:e.target.value})}/>
            </label>

            <label>City / District
              <input required minLength={2} maxLength={100}
                value={customer.city}
                onChange={e => setCustomer({...customer, city:e.target.value})}/>
            </label>

            <label>Full Delivery Address
              <textarea required minLength={10} maxLength={500}
                rows={3} value={customer.address}
                onChange={e => setCustomer({...customer, address:e.target.value})}/>
            </label>

            <label>Order Notes (Optional)
              <textarea maxLength={1000} rows={2}
                value={customer.notes}
                onChange={e => setCustomer({...customer, notes:e.target.value})}/>
            </label>

            <label>Delivery Area
              <select
                value={deliveryZone}
                onChange={e => setDeliveryZone(e.target.value)}
                style={{
                  width: "100%",
                  padding: 13,
                  marginTop: 8
                }}
              >
                <option value="insideDhaka">Inside Dhaka</option>
                <option value="outsideDhaka">Outside Dhaka</option>
              </select>
            </label>

            <div className="mt-cod-label">Payment Method: Cash on Delivery</div>

            {error && <p className="mt-checkout-error">{error}</p>}

            <button className="mt-place-order" disabled={busy || !shippingConfig?.enabled}>
              {!shippingConfig?.enabled
                ? "Checkout Unavailable"
                : busy ? "Processing Order..." : "Place Order"}
            </button>
          </form>

          <aside className="mt-checkout-card">
            <h2>Order Summary</h2>

            {cart.map(item => (
              <div className="mt-cart-item" key={item._id}>
                <div className="mt-cart-image">
                  {item.image && <img src={item.image} alt={item.name}/>}
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <p>{money(item.price)}</p>
                  <div className="mt-qty-controls">
                    <button type="button" onClick={() =>
                      changeQuantity(item._id, item.quantity - 1)
                    }><Minus size={14}/></button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() =>
                      changeQuantity(item._id, item.quantity + 1)
                    }><Plus size={14}/></button>
                    <button type="button" onClick={() =>
                      changeQuantity(item._id, 0)
                    }><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-total">
              <p>Estimated Subtotal <strong>{money(subtotal)}</strong></p>
              <p>Delivery Charge <strong>{money(deliveryCharge)}</strong></p>
              <hr/>
              <h3>Estimated Total <span>{money(subtotal + deliveryCharge)}</span></h3>
            </div>
            <p className="mt-checkout-note">
              Final product prices and stock are verified by the server.
              Delivery pricing must be configured before accepting real orders.
            </p>
          </aside>
        </div>
      )}
    </section>
  </main>;
}
