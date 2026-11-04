
import { useEffect, useState } from "react";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

async function getSettings() {
  const response = await fetch(
    `${API}/website-settings`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error("Unable to load website settings");
  }
  const data = await response.json();
  return data.data;
}

async function saveSettings(token, changes) {
  const latest = await getSettings();

  const response = await fetch(
    `${API}/website-settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...latest,
        ...changes
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Settings save failed");
  }

  return data.data;
}

export default function PixelSettings({ token }) {
  const [form, setForm] = useState({
    metaPixelId: "",
    pixelEnabled: false
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then(data => setForm({
        metaPixelId: data.metaPixelId || "",
        pixelEnabled: Boolean(data.pixelEnabled)
      }))
      .catch(e => setError(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const saved = await saveSettings(token, form);
      setForm({
        metaPixelId: saved.metaPixelId,
        pixelEnabled: saved.pixelEnabled
      });
      setMessage("Meta Pixel settings saved successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-panel">
      <h2>Meta Pixel Settings</h2>
      <p>Configure browser-side marketing tracking.</p>

      <form onSubmit={save} style={{
        display: "grid",
        gap: 20,
        maxWidth: 650,
        marginTop: 25
      }}>
        <label>
          Meta Pixel ID
          <input
            inputMode="numeric"
            pattern="[0-9]{10,25}"
            value={form.metaPixelId}
            onChange={e => setForm({
              ...form, metaPixelId: e.target.value.trim()
            })}
            placeholder="Enter your Meta Pixel ID"
            style={{ width: "100%", padding: 13, marginTop: 8 }}
          />
        </label>

        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <input type="checkbox"
            checked={form.pixelEnabled}
            onChange={e => setForm({
              ...form, pixelEnabled: e.target.checked
            })}
          />
          Enable Meta Pixel PageView Tracking
        </label>

        <div style={{
          padding: 16,
          background: "#f3f7fe",
          borderRadius: 10,
          fontSize: 13,
          lineHeight: 1.8
        }}>
          PageView: Existing implementation
          <p style={{ margin: 0 }}>
            Purchase Tracking and Conversions API are not configured.
            Marketing consent is required before loading the pixel.
          </p>
        </div>

        {error && <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>}
        {message && <p role="status">{message}</p>}

        <button className="mt-primary" disabled={busy}>
          {busy ? "Saving..." : "Save Meta Pixel Settings"}
        </button>
      </form>
    </section>
  );
}
