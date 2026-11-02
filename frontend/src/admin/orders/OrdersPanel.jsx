import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Package, X } from "lucide-react";
import "./orders.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

const money = amount =>
  "৳" + Number(amount || 0).toLocaleString("en-BD");

export default function OrdersPanel({ token }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/orders/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to load orders");
      }

      setOrders(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(order, status) {
    if (busy || status === order.status) return;

    if (status === "cancelled") {
      if (!window.confirm(
        `Cancel order ${order.orderNumber} and restore stock?`
      )) return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch(
        `${API}/orders/admin/${order._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Status update failed");
      }

      setNotice("Order status updated successfully");
      setSelected(null);
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mto-orders">
      <div className="mto-heading">
        <div>
          <p>ORDER MANAGEMENT</p>
          <h1>Customer Orders</h1>
        </div>
        <button onClick={loadOrders} disabled={loading}>
          <RefreshCw size={16}/> Refresh Orders
        </button>
      </div>

      {error && <p className="mto-error">{error}</p>}
      {notice && <p className="mto-success">{notice}</p>}

      <div className="mto-stats">
        <div><span>Total Orders (latest 100)</span><strong>{orders.length}</strong></div>
        <div><span>Pending</span><strong>{orders.filter(o => o.status === "pending").length}</strong></div>
        <div><span>Delivered</span><strong>{orders.filter(o => o.status === "delivered").length}</strong></div>
      </div>

      <div className="mto-table-wrapper">
        {loading ? <p className="mto-empty">Loading orders...</p> :
          !orders.length ? <p className="mto-empty">No orders found.</p> :
          <table className="mto-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    <small>{new Date(order.createdAt).toLocaleString("en-BD")}</small>
                  </td>
                  <td>
                    <strong>{order.customer?.name}</strong>
                    <small>{order.customer?.phone}</small>
                  </td>
                  <td>{money(order.total)}</td>
                  <td><span className="mto-status">{order.status}</span></td>
                  <td>
                    <button onClick={() => setSelected(order)}>
                      View / Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>

      {selected && (
        <div className="mto-backdrop">
          <div className="mto-modal">
            <div className="mto-modal-header">
              <h2>Order Details</h2>
              <button type="button"
                className="mto-invoice-print"
                onClick={() => window.print()}>
                Print Invoice
              </button>
              <button onClick={() => setSelected(null)}
                aria-label="Close"><X/></button>
            </div>

            <p><strong>Order:</strong> {selected.orderNumber}</p>
            <p><strong>Customer:</strong> {selected.customer?.name}</p>
            <p><strong>Phone:</strong> {selected.customer?.phone}</p>
            <p><strong>City:</strong> {selected.customer?.city}</p>
            <p><strong>Address:</strong> {selected.customer?.address}</p>
            <p><strong>Notes:</strong> {selected.customer?.notes || "None"}</p>
            <p><strong>Payment:</strong> Cash on Delivery</p>

            <h3>Ordered Products</h3>
            {selected.items?.map((item, index) => (
              <div className="mto-item" key={index}>
                <Package size={18}/>
                <span>{item.name} × {item.quantity}</span>
                <strong>{money(item.subtotal)}</strong>
              </div>
            ))}

            <h3>Total: {money(selected.total)}</h3>

            <label className="mto-status-label">
              Update Order Status
              <select
                disabled={busy ||
                  ["cancelled", "delivered"].includes(selected.status)}
                value={selected.status}
                onChange={e => updateStatus(selected, e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <p className="mto-warning">
              Cancelling an order restores reserved stock.
              Delivered and cancelled orders are final.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
