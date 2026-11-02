
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

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

export default function SeoSettings({ token }) {
  const [form, setForm] = useState({
    siteName: "",
    siteTitle: "",
    description: ""
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then(data => setForm({
        siteName: data.siteName || "",
        siteTitle: data.siteTitle || "",
        description: data.description || ""
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
        siteName: saved.siteName,
        siteTitle: saved.siteTitle,
        description: saved.description
      });
      setMessage("SEO settings saved successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-panel">
      <h2>SEO Settings</h2>
      <p>Manage your store name and basic search metadata.</p>

      <form onSubmit={save} style={{
        display: "grid",
        gap: 18,
        maxWidth: 650,
        marginTop: 25
      }}>
        <label>
          Website Name
          <input required minLength={2} maxLength={100}
            value={form.siteName}
            onChange={e => setForm({
              ...form, siteName: e.target.value
            })}
            style={{ width: "100%", padding: 13, marginTop: 8 }}
          />
        </label>

        <label>
          SEO Page Title
          <input required minLength={5} maxLength={160}
            value={form.siteTitle}
            onChange={e => setForm({
              ...form, siteTitle: e.target.value
            })}
            style={{ width: "100%", padding: 13, marginTop: 8 }}
          />
        </label>

        <label>
          Meta Description
          <textarea required minLength={20} maxLength={300}
            rows={5}
            value={form.description}
            onChange={e => setForm({
              ...form, description: e.target.value
            })}
            style={{ width: "100%", padding: 13, marginTop: 8 }}
          />
        </label>

        {error && <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>}
        {message && <p role="status">{message}</p>}

        <button className="mt-primary" disabled={busy}>
          {busy ? "Saving..." : "Save SEO Settings"}
        </button>
      </form>
      <p style={{ fontSize: 12, color: "#64748b", marginTop: 18 }}>
        Current metadata is client-rendered. Server-rendered SEO,
        canonical URLs and sitemap configuration are still pending.
      </p>
    </section>
  );
}
