import { useCallback, useEffect, useState } from "react";
import {
  Plus, Pencil, EyeOff, Trash2, RefreshCw
} from "lucide-react";
import ImageUploader from "../../components/ui/ImageUploader.jsx";
import "./banner.css";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const blank = {
  title: "",
  subtitle: "",
  image: "",
  buttonText: "Shop Now",
  buttonLink: "/shop",
  placement: "hero",
  showTextOverlay: false,
  textColor: "#FFFFFF",
  textPosition: "left",
  sortOrder: 0,
  isActive: true
};

const placements = {
  hero: "Main Hero",
  sideTop: "Right Top Banner",
  sideBottom: "Right Bottom Banner"
};

export default function BannerManager({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }, [token]);

  const load = useCallback(async () => {
    try {
      const result = await request("/banners/admin");
      setItems(result.data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  function edit(item) {
    setEditing(item._id);
    setForm({
      ...blank,
      ...item,
      placement: item.placement || "hero",
      showTextOverlay:
        typeof item.showTextOverlay === "boolean"
          ? item.showTextOverlay
          : (item.placement || "hero") !== "hero",
      textColor: item.textColor || "#FFFFFF",
      textPosition: item.textPosition || "left"
    });
    setError("");
  }

  async function save(e) {
    e.preventDefault();
    if (busy || !form) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const body = {
        title: form.title.trim() || (
          form.placement === "hero"
            ? "Main Hero Banner"
            : form.placement === "sideTop"
              ? "Top Promotional Banner"
              : "Bottom Promotional Banner"
        ),
        subtitle: form.subtitle,
        image: form.image,
        buttonText: form.buttonText,
        buttonLink: form.buttonLink,
        placement: form.placement,
        showTextOverlay: Boolean(form.showTextOverlay),
        textColor: form.textColor,
        textPosition: form.textPosition,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive
      };

      await request(
        "/banners/admin" + (editing ? "/" + editing : ""),
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(body)
        }
      );

      setForm(null);
      setEditing(null);
      setMessage("Banner saved successfully.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item) {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await request(`/banners/admin/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !item.isActive
        })
      });
      await load();
      setMessage(
        item.isActive ? "Banner disabled." : "Banner activated."
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeForever(item) {
    if (busy) return;
    if (!window.confirm(
      `Permanently delete "${item.title}"? This cannot be undone.`
    )) return;

    setBusy(true);
    setError("");

    try {
      await request(
        `/banners/admin/${item._id}/permanent`,
        { method: "DELETE" }
      );
      await load();
      setMessage("Banner permanently deleted.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-banner-manager">
      <div className="mt-banner-heading">
        <div>
          <h2>Hero & Banner Manager</h2>
          <p>
            Control images, text and buttons for your homepage.
          </p>
        </div>
        <div className="mt-banner-actions">
          <button type="button" onClick={load}>
            <RefreshCw size={16}/> Refresh
          </button>
          <button type="button" className="primary"
            onClick={() => {
              setEditing(null);
              setForm({ ...blank });
              setError("");
            }}>
            <Plus size={16}/> Add Banner
          </button>
        </div>
      </div>

      {message && <p className="mt-banner-notice">{message}</p>}
      {error && <p className="mt-banner-error">{error}</p>}

      <div className="mt-banner-grid">
        {items.map(item => (
          <article className="mt-banner-card" key={item._id}>
            <div className="mt-banner-image">
              <img src={item.image} alt={item.title}/>
            </div>
            <div className="mt-banner-card-content">
              <strong>{item.title}</strong>
              <p>{item.subtitle}</p>
              <small>
                {placements[item.placement || "hero"]}
                {" · "}
                {item.isActive ? "Active" : "Inactive"}
                {" · "}Order {item.sortOrder}
              </small>
              <div className="mt-banner-actions">
                <button type="button" onClick={() => edit(item)}>
                  <Pencil size={15}/> Edit
                </button>
                <button type="button" disabled={busy}
                  onClick={() => toggle(item)}>
                  <EyeOff size={15}/>
                  {item.isActive ? "Disable" : "Activate"}
                </button>
                <button type="button" disabled={busy}
                  onClick={() => removeForever(item)}>
                  <Trash2 size={15}/> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!items.length && (
        <p>No banners yet. Add your first homepage banner.</p>
      )}

      {form && (
        <div className="mt-banner-modal-backdrop">
          <form className="mt-banner-modal" onSubmit={save}>
            <h2>{editing ? "Edit Banner" : "New Banner"}</h2>

            <label>
              Banner Location
              <select
                value={form.placement}
                onChange={e => setForm({
                  ...form,
                  placement: e.target.value,
                  showTextOverlay: editing
                    ? form.showTextOverlay
                    : e.target.value !== "hero"
                })}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 12,
                  marginTop: 8
                }}
              >
                {Object.entries(placements).map(([id, label]) => (
                  <option value={id} key={id}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Banner Image Preview
              {form.image ? (
                <img src={form.image} alt="Banner preview"
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: 170,
                    objectFit: "cover",
                    marginTop: 8,
                    borderRadius: 8
                  }}/>
              ) : (
                <p>No image selected.</p>
              )}
            </label>

            <ImageUploader
              token={token}
              onUploaded={url => setForm(current => ({
                ...current,
                image: url
              }))}
            />

            {form.image && (
              <button type="button" onClick={() =>
                setForm({ ...form, image: "" })
              }>
                Clear Image Selection
              </button>
            )}

            <label>
              Image URL
              <input
                required
                type="url"
                value={form.image}
                onChange={e => setForm({
                  ...form, image: e.target.value
                })}
              />
            </label>

            {[
              ["title", "Banner Heading"],
              ["subtitle", "Subtitle / Description"],
              ["buttonText", "Button Text"],
              ["buttonLink", "Button Link"]
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required={key === "title" && Boolean(form.showTextOverlay)}
                  value={form[key]}
                  onChange={e => setForm({
                    ...form, [key]: e.target.value
                  })}
                />
              </label>
            ))}


            <label
              className="mt-banner-checkbox"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: 14,
                border: "1px solid #dce4f1",
                borderRadius: 10
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(form.showTextOverlay)}
                onChange={e => setForm(current => ({
                  ...current,
                  showTextOverlay: e.target.checked
                }))}
              />
              <span>
                <strong>Show Banner Text & Button</strong>
                <small style={{
                  display: "block",
                  color: "#64748b",
                  marginTop: 4
                }}>
                  OFF = Image Only.
                  ON = Heading, Subtitle and Button.
                  No colored layer.
                </small>
              </span>
            </label>

            <label>
              Text Color
              <input
                type="color"
                value={form.textColor}
                onChange={e => setForm({
                  ...form, textColor: e.target.value
                })}
              />
              <input
                value={form.textColor}
                maxLength={7}
                onChange={e => setForm({
                  ...form, textColor: e.target.value
                })}
              />
            </label>

            <label>
              Text Alignment
              <select
                value={form.textPosition}
                onChange={e => setForm({
                  ...form,
                  textPosition: e.target.value
                })}
                style={{ display: "block", padding: 12 }}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>

            <label>
              Display Order
              <input
                type="number"
                min="0"
                max="9999"
                value={form.sortOrder}
                onChange={e => setForm({
                  ...form, sortOrder: e.target.value
                })}
              />
            </label>

            <label className="mt-banner-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({
                  ...form, isActive: e.target.checked
                })}
              />
              Active Banner
            </label>

            <div className="mt-banner-actions">
              <button type="button" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Saving..." : "Save Banner"}
              </button>
            </div>

            {error && <p className="mt-banner-error">{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
