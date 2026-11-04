import { useEffect, useState } from "react";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

export default function ShippingSettings({ token }) {
  const [config, setConfig] = useState({
    enabled: false,
    insideDhaka: 0,
    outsideDhaka: 0
  });

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/checkout/config`, {
      signal: controller.signal
    })
      .then(r => {
        if (!r.ok) throw new Error("Unable to load settings");
        return r.json();
      })
      .then(d => setConfig(d.data))
      .catch(e => {
        if (e.name !== "AbortError") setMessage(e.message);
      });

    return () => controller.abort();
  }, []);

  async function save(e) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/checkout/config`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            enabled: config.enabled,
            insideDhaka: Number(config.insideDhaka),
            outsideDhaka: Number(config.outsideDhaka)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Save failed");
      }

      setConfig(data.data);
      setMessage("Delivery settings saved successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-panel">
      <h2>Delivery & Checkout Settings</h2>

      <form onSubmit={save} style={{
        maxWidth: 520,
        display: "grid",
        gap: 20
      }}>
        <label>
          Delivery Charge - Inside Dhaka (BDT)
          <input
            type="number"
            min="0"
            max="10000"
            step="1"
            required
            value={config.insideDhaka}
            onChange={e => setConfig({
              ...config,
              insideDhaka: e.target.value
            })}
            style={{
              width: "100%",
              padding: 14,
              marginTop: 8,
              border: "1px solid #dce4f1",
              borderRadius: 8
            }}
          />
        </label>

        <label>
          Delivery Charge - Outside Dhaka (BDT)
          <input
            type="number"
            min="0"
            max="10000"
            step="1"
            required
            value={config.outsideDhaka}
            onChange={e => setConfig({
              ...config,
              outsideDhaka: e.target.value
            })}
            style={{
              width: "100%",
              padding: 14,
              marginTop: 8,
              border: "1px solid #dce4f1",
              borderRadius: 8
            }}
          />
        </label>

        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => setConfig({
              ...config,
              enabled: e.target.checked
            })}
          />
          Enable Cash on Delivery Checkout
        </label>

        <p style={{ color: "#7b879a", fontSize: 12 }}>
          Keep checkout disabled until your delivery rates
          and order processing are fully tested.
        </p>

        {message && <p role="status">{message}</p>}

        <button
          className="mt-primary"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving..." : "Save Delivery Settings"}
        </button>
      </form>
    </div>
  );
}
