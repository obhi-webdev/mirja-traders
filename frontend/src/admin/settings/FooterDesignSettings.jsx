import { useEffect, useState } from "react";

const API = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL || "http://localhost:5001/api");

const defaults = {
  footerBackgroundColor: "#EA580C",
  footerHeadingColor: "#FFFFFF",
  footerTextColor: "#FFF7ED",
  footerLinkColor: "#FFEDD5",
  footerAccentColor: "#FFFFFF"
};

const controls = [
  ["footerBackgroundColor", "Footer Background"],
  ["footerHeadingColor", "Heading Color"],
  ["footerTextColor", "Description Color"],
  ["footerLinkColor", "Link Color"],
  ["footerAccentColor", "Highlight Color"]
];

const isHex = value => /^#[0-9a-fA-F]{6}$/.test(value || "");

export default function FooterDesignSettings({ token }) {
  const [form, setForm] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/website-settings`, {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(response => {
        if (!response.ok) throw new Error("Cannot load colors");
        return response.json();
      })
      .then(result => {
        setForm({ ...defaults, ...(result.data || {}) });
      })
      .catch(error => {
        if (error.name !== "AbortError") setMessage(error.message);
      });

    return () => controller.abort();
  }, []);

  function update(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  async function saveFooter(e) {
    e.preventDefault();

    if (busy) return;

    if (controls.some(([key]) => !isHex(form[key]))) {
      setMessage("Enter valid 6-digit HEX colors.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const currentResponse = await fetch(
        `${API}/website-settings`,
        { cache: "no-store" }
      );

      if (!currentResponse.ok) {
        throw new Error("Unable to load latest settings");
      }

      const latest = await currentResponse.json();

      const changes = Object.fromEntries(
        controls.map(([key]) => [key, form[key]])
      );

      const response = await fetch(
        `${API}/website-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...latest.data,
            ...changes
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to save footer colors"
        );
      }

      setForm(previous => ({ ...previous, ...changes }));
      setMessage("Footer colors saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{
      background: "#f8fafc",
      border: "1px solid #dbe3ef",
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      marginBottom: 22
    }}>
      <h3>Footer Design Settings</h3>
      <p style={{ fontSize: 13, color: "#64748b" }}>
        Customize your footer colors and preview before saving.
      </p>

      <form onSubmit={saveFooter}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 16,
          margin: "20px 0"
        }}>
          {controls.map(([key, label]) => (
            <label key={key} style={{ fontSize: 13 }}>
              <strong>{label}</strong>
              <div style={{
                display: "flex",
                gap: 9,
                marginTop: 8
              }}>
                <input
                  type="color"
                  aria-label={`${label} picker`}
                  value={isHex(form[key]) ? form[key] : defaults[key]}
                  onChange={e => update(key, e.target.value)}
                  style={{
                    width: 49,
                    height: 43,
                    cursor: "pointer"
                  }}
                />
                <input
                  value={form[key] || ""}
                  maxLength={7}
                  onChange={e => update(key, e.target.value)}
                  style={{
                    minWidth: 0,
                    width: "100%",
                    padding: 10
                  }}
                />
              </div>
            </label>
          ))}
        </div>

        <div style={{
          background: isHex(form.footerBackgroundColor)
            ? form.footerBackgroundColor
            : defaults.footerBackgroundColor,
          borderRadius: 14,
          padding: 23,
          marginBottom: 18
        }}>
          <h3 style={{
            color: form.footerHeadingColor,
            margin: "0 0 12px"
          }}>
            MIRJA TRADERS
          </h3>
          <p style={{
            color: form.footerTextColor,
            lineHeight: 1.8
          }}>
            মানসম্মত ইলেকট্রনিকস ও আধুনিক প্রযুক্তিপণ্যের বিশ্বস্ত ঠিকানা।
          </p>
          <p style={{ color: form.footerLinkColor }}>
            সকল পণ্য · গ্রাহক সহায়তা · যোগাযোগ
          </p>
          <strong style={{ color: form.footerAccentColor }}>
            ✓ ক্যাশ অন ডেলিভারি
          </strong>
        </div>

        <div style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save Footer Colors"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setForm(previous => ({
              ...previous,
              ...defaults
            }))}
          >
            Reset to Orange
          </button>
        </div>

        {message && (
          <p role="status" style={{
            fontSize: 13,
            marginTop: 12
          }}>
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
