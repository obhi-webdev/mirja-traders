import SeoSettings from "../settings/SeoSettings.jsx";
import PixelSettings from "../settings/PixelSettings.jsx";
import BrandingSettings from "../settings/BrandingSettings.jsx";
import BrandLogo from "../../components/branding/BrandLogo.jsx";
import ImageUploader from "../../components/ui/ImageUploader.jsx";
import WebsiteSettings from "../settings/WebsiteSettings.jsx";
import BannerManager from "../banners/BannerManager.jsx";
import ShippingSettings from "../settings/ShippingSettings.jsx";
import OrdersPanel from "../orders/OrdersPanel.jsx";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Package, Layers, LogOut,
  Plus, Pencil, Archive, RefreshCw, ShieldCheck,
  ShoppingBag, X, Menu
} from "lucide-react";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const emptyProduct = {
  name: "", slug: "", sku: "", price: "",
  comparePrice: "", stock: "", category: "",
  brand: "", description: "", image: "",
  status: "draft", isFeatured: false
};

const emptyCategory = {
  name: "", slug: "", description: "",
  image: "", sortOrder: "0", isActive: true
};

const slugify = (s) => s.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const money = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");

export default function AdminDashboard() {
  const [rememberMe, setRememberMe] = useState(true);

  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && token) {
        setToken("");
        setAdmin(null);
      }
      throw new Error(data.message || "Request failed");
    }
    return data;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [p, c] = await Promise.all([
        request("/admin/products"),
        request("/admin/categories")
      ]);
      setProducts(p.data || []);
      setCategories(c.data || []);
    } catch (error) {
      setMessage(error.message);
    }
  }, [token, request]);

  useEffect(() => { load(); }, [load]);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      if (rememberMe) {
        localStorage.setItem(
          "mirja-admin-remember-token",
          data.token
        );
        sessionStorage.removeItem("mirja-admin-session-token");
      } else {
        sessionStorage.setItem(
          "mirja-admin-session-token",
          data.token
        );
        localStorage.removeItem("mirja-admin-remember-token");
      }

      setToken(data.token);
      setAdmin(data.admin);
      setPassword("");
      setTab("dashboard");
      window.history.replaceState(null, "", "/admin");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const saved =
      sessionStorage.getItem("mirja-admin-session-token") ||
      localStorage.getItem("mirja-admin-remember-token");

    if (saved) {
      setToken(saved);
      setRememberMe(Boolean(
        localStorage.getItem("mirja-admin-remember-token")
      ));
    }
  }, []);

  function logout() {
    localStorage.removeItem("mirja-admin-remember-token");
    sessionStorage.removeItem("mirja-admin-session-token");
    setToken("");
    setAdmin(null);
    setProducts([]);
    setCategories([]);
    setForm(null);
    setMessage("");
    window.history.replaceState(null, "", "/admin/login");
  }

  function openProduct(item = null) {
    setEditingId(item?._id || null);
    setForm({
      type: "product",
      values: item ? {
        name: item.name || "",
        slug: item.slug || "",
        sku: item.sku || "",
        price: String(item.price ?? ""),
        comparePrice: String(item.comparePrice ?? ""),
        stock: String(item.stock ?? ""),
        category: item.category?._id || item.category || "",
        brand: item.brand || "",
        description: item.description || "",
        image: item.images?.[0] || "",
        status: item.status || "draft",
        isFeatured: Boolean(item.isFeatured)
      } : { ...emptyProduct }
    });
  }

  function openCategory(item = null) {
    setEditingId(item?._id || null);
    setForm({
      type: "category",
      values: item ? {
        name: item.name || "",
        slug: item.slug || "",
        description: item.description || "",
        image: item.image || "",
        sortOrder: String(item.sortOrder ?? 0),
        isActive: Boolean(item.isActive)
      } : { ...emptyCategory }
    });
  }

  function setField(key, value) {
    setForm(current => ({
      ...current,
      values: { ...current.values, [key]: value }
    }));
  }

  async function save(e) {
    e.preventDefault();
    if (!form || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const v = form.values;
      const product = form.type === "product";
      const body = product ? {
        name: v.name.trim(),
        slug: v.slug.trim(),
        sku: v.sku.trim(),
        price: Number(v.price),
        comparePrice: Number(v.comparePrice || 0),
        stock: Number(v.stock || 0),
        brand: v.brand.trim(),
        description: v.description,
        images: v.image.trim() ? [v.image.trim()] : [],
        status: v.status,
        isFeatured: v.isFeatured,
        ...(v.category ? { category: v.category } : {})
      } : {
        name: v.name.trim(),
        slug: v.slug.trim(),
        description: v.description,
        image: v.image.trim(),
        sortOrder: Number(v.sortOrder || 0),
        isActive: v.isActive
      };

      const endpoint = product ? "/admin/products" : "/admin/categories";
      await request(endpoint + (editingId ? "/" + editingId : ""), {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(body)
      });
      setForm(null);
      await load();
      setMessage(editingId ? "Updated successfully" : "Created successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item, type) {
    const question = type === "product"
      ? `Archive "${item.name}"?`
      : `Deactivate "${item.name}"?`;
    if (!window.confirm(question)) return;
    setBusy(true);
    setMessage("");
    try {
      await request(`/admin/${type === "product" ? "products" : "categories"}/${item._id}`, {
        method: "DELETE"
      });
      await load();
      setMessage("Updated successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="mt-login-page">
        <form className="mt-login-card" onSubmit={login}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BrandLogo />
          </div>
          <p>Admin Control Center</p>
          <h2>Welcome back</h2>
          <label>Email Address</label>
          <input type="email" required autoComplete="username"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com" />
          <label>Password</label>
          <input type="password" required autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter password" />
          {message && <div className="mt-alert">{message}</div>}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "12px 0 22px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "#465b7b"
          }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{
                width: 17,
                height: 17,
                accentColor: "#2457b4"
              }}
            />
            <span>Remember Me</span>
          </label>

          <button className="mt-primary" disabled={busy}>
            {busy ? "Signing in..." : "Sign In Securely"}
          </button>
          <div className="mt-secure"><ShieldCheck size={16}/> Authorized access only</div>
        </form>
      </main>
    );
  }

  const fields = form?.values || {};
  const productForm = form?.type === "product";

  return (
    <div className="mt-admin">
      <aside className={`mt-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="mt-sidebar-brand"
          style={{ background: "#fff", borderRadius: 10, padding: 9 }}>
          <BrandLogo size="small" />
        </div>
        <p className="mt-menu-label">MANAGEMENT</p>
        {[
          ["dashboard", LayoutDashboard, "Overview"],
          ["products", Package, "Products"],
          ["orders", ShoppingBag, "Orders"],
          ["categories", Layers, "Categories"],
          ["banners", Layers, "Banners"],
          ["shipping", ShoppingBag, "Delivery Settings"],
          ["branding", Layers, "Logo & Branding"],
          ["seo", Layers, "SEO Settings"],
          ["pixel", Layers, "Meta Pixel"]].map(([id, Icon, label]) => (
          <button key={id} className={tab === id ? "active" : ""}
            onClick={() => { setTab(id); setSidebarOpen(false); setMessage(""); }}>
            <Icon size={19}/> {label}
          </button>
        ))}
        <button className="mt-logout" onClick={logout}><LogOut size={19}/> Logout</button>
      </aside>

      <div className="mt-workspace">
        <header className="mt-topbar">
          <button className="mt-mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22}/>
          </button>
          <div><strong>Admin Dashboard</strong><small>Mirja Traders Management</small></div>
          <div className="mt-admin-name">{admin?.name || "Admin"}</div>
        </header>

        <main className="mt-content">
          <div className="mt-page-head">
            <div>
              <p>STORE MANAGEMENT</p>
              <h1>{
  ({
    dashboard: "Dashboard Overview",
    products: "Products",
    orders: "Orders",
    categories: "Categories",
    banners: "Banners",
    shipping: "Delivery Settings",
    branding: "Logo & Branding",
    seo: "SEO Settings",
    pixel: "Meta Pixel"
  })[tab] || "Admin Dashboard"
}</h1>
            </div>
            <div className="mt-head-actions">
              <button className="mt-outline" onClick={load}><RefreshCw size={16}/> Refresh</button>
              {tab === "products" && <button className="mt-primary" onClick={() => openProduct()}><Plus size={16}/> Add Product</button>}
              {tab === "categories" && <button className="mt-primary" onClick={() => openCategory()}><Plus size={16}/> Add Category</button>}
            </div>
          </div>

          {message && <div className="mt-alert">{message}</div>}

          {tab === "dashboard" && <>
            <div className="mt-stats">
              <div><Package/><p>Total Products</p><h2>{products.length}</h2></div>
              <div><ShoppingBag/><p>Active Products</p><h2>{products.filter(x => x.status === "active").length}</h2></div>
              <div><Layers/><p>Total Categories</p><h2>{categories.length}</h2></div>
            </div>
            <div className="mt-panel">
              <h2>Quick Actions</h2>
              <div className="mt-quick">
                <button onClick={() => { setTab("products"); openProduct(); }}><Plus/> Create Product</button>
                <button onClick={() => { setTab("categories"); openCategory(); }}><Layers/> Create Category</button>
              </div>
              <p className="mt-hint">Orders, banners, pixel tracking and website settings will be added in upcoming modules.</p>
            </div>
          </>}

          {tab === "orders" && <OrdersPanel token={token} />}

          {tab === "shipping" && <ShippingSettings token={token} />}

          {tab === "banners" && <BannerManager token={token} />}

          {tab === "branding" && <BrandingSettings token={token} />}
          {tab === "seo" && <SeoSettings token={token} />}
          {tab === "pixel" && <PixelSettings token={token} />}

          {tab === "products" && <div className="mt-panel">
            <div className="mt-table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{products.map(p => <tr key={p._id}>
                  <td><strong>{p.name}</strong><small>{p.sku || p.slug}</small></td>
                  <td>{money(p.price)}</td><td>{p.stock ?? 0}</td>
                  <td><span className="mt-status">{p.status}</span></td>
                  <td><div className="mt-row-actions">
                    <button title="Edit" onClick={() => openProduct(p)}><Pencil size={16}/></button>
                    <button title="Archive" disabled={busy || p.status === "archived"} onClick={() => remove(p, "product")}><Archive size={16}/></button>
                  </div></td>
                </tr>)}</tbody>
              </table>
              {!products.length && <p className="mt-empty">No products yet. Click Add Product.</p>}
            </div>
          </div>}

          {tab === "categories" && <div className="mt-panel">
            <div className="mt-table-wrap"><table>
              <thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{categories.map(c => <tr key={c._id}>
                <td><strong>{c.name}</strong></td><td>{c.slug}</td>
                <td><span className="mt-status">{c.isActive ? "Active" : "Inactive"}</span></td>
                <td><div className="mt-row-actions">
                  <button title="Edit" onClick={() => openCategory(c)}><Pencil size={16}/></button>
                  <button title="Deactivate" disabled={busy || !c.isActive} onClick={() => remove(c, "category")}><Archive size={16}/></button>
                </div></td>
              </tr>)}</tbody>
            </table>
            {!categories.length && <p className="mt-empty">No categories yet. Click Add Category.</p>}
            </div>
          </div>}
        </main>
      </div>

      {form && <div className="mt-modal-overlay">
        <form className="mt-modal" onSubmit={save}>
          <div className="mt-modal-head">
            <h2>{editingId ? "Edit" : "Add"} {productForm ? "Product" : "Category"}</h2>
            <button type="button" onClick={() => setForm(null)}><X/></button>
          </div>
          <div className="mt-fields">
            <label>Name<input required minLength={2} value={fields.name}
              onChange={e => {
                const name = e.target.value;
                setForm(current => ({
                  ...current,
                  values: {
                    ...current.values,
                    name,
                    ...(!editingId ? { slug: slugify(name) } : {})
                  }
                }));
              }}/></label>
            <label>Slug<input required value={fields.slug}
              onChange={e => setField("slug", e.target.value)}/></label>

            {productForm && <>
              <label>SKU<input value={fields.sku} onChange={e => setField("sku", e.target.value)}/></label>
              <label>Category<select value={fields.category}
                onChange={e => setField("category", e.target.value)}>
                <option value="">Select category</option>
                {categories.filter(c => c.isActive).map(c =>
                  <option value={c._id} key={c._id}>{c.name}</option>)}
              </select></label>
              <label>Price (BDT)<input type="number" min="0" step=".01" required
                value={fields.price} onChange={e => setField("price", e.target.value)}/></label>
              <label>Compare Price<input type="number" min="0" step=".01"
                value={fields.comparePrice} onChange={e => setField("comparePrice", e.target.value)}/></label>
              <label>Stock<input type="number" min="0" step="1"
                value={fields.stock} onChange={e => setField("stock", e.target.value)}/></label>
              <label>Brand<input value={fields.brand} onChange={e => setField("brand", e.target.value)}/></label>
              <label>Status<select value={fields.status}
                onChange={e => setField("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select></label>
              <label className="mt-checkbox"><input type="checkbox"
                checked={fields.isFeatured}
                onChange={e => setField("isFeatured", e.target.checked)}/> Featured Product</label>
            </>}
            {!productForm && <label>Sort Order<input type="number" min="0" step="1"
              value={fields.sortOrder} onChange={e => setField("sortOrder", e.target.value)}/></label>}
            <div className="mt-full">
              <ImageUploader
                token={token}
                onUploaded={url => setField("image", url)}
              />
            </div>
            <label className="mt-full">Image URL<input type="url"
              value={fields.image} onChange={e => setField("image", e.target.value)}
              placeholder="https://example.com/image.jpg"/></label>
            <label className="mt-full">Description<textarea rows="4"
              value={fields.description} onChange={e => setField("description", e.target.value)}/></label>
          </div>
          <div className="mt-modal-footer">
            <button type="button" className="mt-outline" onClick={() => setForm(null)}>Cancel</button>
            <button className="mt-primary" disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>
          </div>
          {message && <p className="mt-alert">{message}</p>}
        </form>
      </div>}
    </div>
  );
}
