
import { useEffect, useState } from "react";
import ImageUploader from "../../components/ui/ImageUploader.jsx";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

const defaults = {
  siteName: "Mirja Traders",
  siteTitle: "Mirja Traders | Electronics & Gadgets",
  description: "Discover laptops, smartphones and smart gadgets at Mirja Traders.",
  logoUrl: "",
  metaPixelId: "",
  pixelEnabled: false,
  logoIconUrl: "",
  logoFirstText: "Mirja",
  logoSecondText: "Traders",
  logoFirstColor: "#2457B5",
  logoSecondColor: "#F59E0B",
  logoIconSize: 42
};

export default function BrandingSettings({ token }) {
  const [form, setForm] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/website-settings`, {
      signal: controller.signal
    })
      .then(r => {
        if (!r.ok) throw new Error("Unable to load branding");
        return r.json();
      })
      .then(d => setForm({ ...defaults, ...d.data }))
      .catch(e => {
        if (e.name !== "AbortError") setMessage(e.message);
      });

    return () => controller.abort();
  }, []);

  function update(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      // Read the latest settings first to preserve SEO and Pixel values.
      const current = await fetch(`${API}/website-settings`);
      if (!current.ok) throw new Error("Unable to read settings");

      const latest = await current.json();

      const payload = {
        ...defaults,
        ...latest.data,
        logoIconUrl: form.logoIconUrl,
        logoFirstText: form.logoFirstText,
        logoSecondText: form.logoSecondText,
        logoFirstColor: form.logoFirstColor,
        logoSecondColor: form.logoSecondColor,
        logoIconSize: Number(form.logoIconSize)
      };

      const response = await fetch(`${API}/website-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save branding");
      }

      setForm({ ...defaults, ...result.data });
      setMessage("Logo branding saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-panel">
      <h2>Logo & Branding</h2>
      <p>Manage your store logo icon, texts and colors.</p>
      <form onSubmit={save} style={{
        maxWidth: 700,
        display: "grid",
        gap: 18,
        marginTop: 20
      }}>
        <section style={{
          background: "#f8faff",
          border: "1px solid #dce5f1",
          borderRadius: 16,
          padding: 20
        }}>
          <h3>Logo Branding Manager</h3>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Upload an icon and customize both brand name colors.
          </p>

          <div style={{
            background: "#fff", borderRadius: 12,
            padding: 22, margin: "18px 0",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "center",
              justifyContent: "center", flexWrap: "wrap"
            }}>
              {form.logoIconUrl ? (
                <img
                  src={form.logoIconUrl}
                  alt="Logo icon"
                  style={{
                    width: Number(form.logoIconSize),
                    height: Number(form.logoIconSize),
                    objectFit: "contain"
                  }}
                />
              ) : (
                <span style={{
                  width: Number(form.logoIconSize),
                  height: Number(form.logoIconSize),
                  background: "#2457b5", color: "#fff",
                  borderRadius: 8, display: "grid",
                  placeItems: "center", fontWeight: 800
                }}>MT</span>
              )}
              <strong style={{
                fontSize: 25, color: form.logoFirstColor
              }}>{form.logoFirstText}</strong>
              <strong style={{
                fontSize: 25, color: form.logoSecondColor
              }}>{form.logoSecondText}</strong>
            </div>
          </div>

          <strong>Upload Logo Icon</strong>
          <ImageUploader
            token={token}
            onUploaded={url => update("logoIconUrl", url)}
          />

          <label style={{ display: "block", marginBottom: 16 }}>
            Logo Icon URL
            <input
              value={form.logoIconUrl || ""}
              onChange={e => update("logoIconUrl", e.target.value)}
              placeholder="Upload an image or enter HTTPS URL"
              style={{ width: "100%", padding: 12 }}
            />
          </label>

          {form.logoIconUrl && (
            <button type="button"
              onClick={() => update("logoIconUrl", "")}
              style={{ padding: 10, marginBottom: 18 }}>
              Remove Icon
            </button>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 15
          }}>
            {[
              ["logoFirstText", "Mirja Text"],
              ["logoSecondText", "Traders Text"]
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  maxLength={35}
                  value={form[key]}
                  onChange={e => update(key, e.target.value)}
                  style={{ width: "100%", padding: 12, marginTop: 7 }}
                />
              </label>
            ))}

            {[
              ["logoFirstColor", "Mirja Color"],
              ["logoSecondColor", "Traders Color"]
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <div style={{
                  display: "flex", gap: 8, marginTop: 7
                }}>
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form[key])
                      ? form[key] : "#2457B5"}
                    onChange={e => update(key, e.target.value)}
                    style={{ width: 55, height: 43 }}
                  />
                  <input
                    value={form[key]}
                    maxLength={7}
                    onChange={e => update(key, e.target.value)}
                    style={{ flex: 1, width: "60%", padding: 10 }}
                  />
                </div>
              </label>
            ))}
          </div>

          <label style={{ display: "block", marginTop: 20 }}>
            Icon Size: {form.logoIconSize}px
            <input
              type="range" min="24" max="100"
              value={form.logoIconSize}
              onChange={e => update("logoIconSize",
                Number(e.target.value))}
              style={{ display: "block", width: "100%" }}
            />
          </label>
        </section>


        {message && <p role="status">{message}</p>}
        <button
          className="mt-primary"
          type="submit"
          disabled={busy}
        >
          {busy ? "Saving..." : "Save Logo Branding"}
        </button>
      </form>
    </div>
  );
}
