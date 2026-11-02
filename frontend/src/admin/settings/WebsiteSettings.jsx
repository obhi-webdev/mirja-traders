import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const initial = {
  siteName: "Mirja Traders",
  siteTitle: "Mirja Traders | Electronics & Gadgets",
  description: "Discover laptops, smartphones and smart gadgets at Mirja Traders.",
  logoUrl: "",
  logoIconUrl: "",
  logoFirstText: "Mirja",
  logoSecondText: "Traders",
  logoFirstColor: "#2457B5",
  logoSecondColor: "#F59E0B",
  logoIconSize: 42,
  metaPixelId: "",
  pixelEnabled: false
};

export default function WebsiteSettings({ token }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/website-settings`, {
      signal: controller.signal
    })
      .then(r => {
        if (!r.ok) throw new Error("Settings unavailable");
        return r.json();
      })
      .then(d => setForm({ ...initial, ...d.data }))
      .catch(e => {
        if (e.name !== "AbortError") setMessage(e.message);
      });

    return () => controller.abort();
  }, []);

  function update(field, value) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  async function save(e) {
    e.preventDefault();

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/website-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Save failed");
      }

      setForm(result.data);
      setMessage("Website settings saved. Refresh the website to view changes.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-panel">
      <h2>SEO & Meta Pixel Settings</h2>

      <form onSubmit={save} style={{
        display: "grid",
        gap: 20,
        maxWidth: 650
      }}>

        {[
          ["siteName", "Website Name", "text"],
          ["siteTitle", "SEO Page Title", "text"],
          ["logoUrl", "Logo HTTPS Image URL", "url"],
          ["metaPixelId", "Meta Pixel ID", "text"]
        ].map(([key, label, type]) => (
          <label key={key} style={{ fontSize: 13 }}>
            <strong>{label}</strong>
            <input
              type={type}
              value={form[key] || ""}
              onChange={e => update(key, e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 13,
                border: "1px solid #dce4ef",
                borderRadius: 8,
                marginTop: 8
              }}
            />
          </label>
        ))}

        <label style={{ fontSize: 13 }}>
          <strong>SEO Meta Description</strong>
          <textarea
            value={form.description}
            minLength={20}
            maxLength={300}
            rows={4}
            onChange={e => update("description", e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 13,
              border: "1px solid #dce4ef",
              borderRadius: 8,
              marginTop: 8
            }}
          />
        </label>

        <label style={{
          display: "flex",
          gap: 12,
          alignItems: "center"
        }}>
          <input
            type="checkbox"
            checked={form.pixelEnabled}
            onChange={e => update("pixelEnabled", e.target.checked)}
          />
          <strong>Enable Meta Pixel PageView Tracking</strong>
        </label>

        <p style={{
          fontSize: 12,
          color: "#718096",
          lineHeight: 1.7
        }}>
          Pixel tracking runs only after visitor consent.
          Conversions API and Purchase tracking are not enabled yet.
          Page titles and descriptions are client-rendered in this version.
        </p>

        {message && <p role="status">{message}</p>}

        <button
          className="mt-primary"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving..." : "Save Website Settings"}
        </button>
      </form>
    </div>
  );
}
