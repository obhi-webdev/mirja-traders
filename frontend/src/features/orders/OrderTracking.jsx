import { useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch, ArrowLeft, CheckCircle2 } from "lucide-react";
import "./tracking.css";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

const money = value =>
  "৳" + Number(value || 0).toLocaleString("en-BD");

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`${API}/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Tracking failed");
      }

      setOrder(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mtt-page">
      <nav className="mtt-nav">
        <Link to="/" className="mtt-logo">
          MIRJA <span>TRADERS</span>
        </Link>
        <Link to="/shop"><ArrowLeft size={17}/> Shop</Link>
      </nav>

      <div className="mtt-container">
        <div className="mtt-heading">
          <PackageSearch size={42}/>
          <h1>Track Your Order</h1>
          <p>
            Enter your order number and the mobile
            number used during checkout.
          </p>
        </div>

        <form onSubmit={track} className="mtt-card">
          <label>
            Order Number
            <input
              required
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="MT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </label>

          <label>
            Mobile Number
            <input
              required
              type="tel"
              pattern="01[3-9][0-9]{8}"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </label>

          {error && <p role="alert" className="mtt-error">{error}</p>}

          <button disabled={loading}>
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {order && (
          <section className="mtt-card mtt-result">
            <CheckCircle2 color="#23865c" size={30}/>
            <h2>Order Found</h2>
            <p className="mtt-order-number">{order.orderNumber}</p>

            <div className="mtt-info">
              <p>Status <strong>{order.status}</strong></p>
              <p>Payment <strong>{order.paymentStatus}</strong></p>
              <p>Placed on <strong>
                {new Date(order.createdAt).toLocaleDateString("en-BD")}
              </strong></p>
            </div>

            <h3>Order Items</h3>
            {order.items.map((item, index) => (
              <div className="mtt-item" key={index}>
                <span>{item.name} × {item.quantity}</span>
                <strong>{money(item.subtotal)}</strong>
              </div>
            ))}

            <div className="mtt-info">
              <p>Subtotal <strong>{money(order.subtotal)}</strong></p>
              <p>Delivery <strong>{money(order.deliveryCharge)}</strong></p>
              <p>Total <strong>{money(order.total)}</strong></p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
