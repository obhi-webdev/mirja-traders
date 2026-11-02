import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowLeft, Package, ShoppingBag } from "lucide-react";
import "./shop.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/categories`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Categories unavailable")))
      .then(d => setCategories(d.data || []))
      .catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "12"
        });
        if (category) params.set("category", category);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`${API}/products?${params}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error("Unable to load products");

        const data = await res.json();
        setProducts(data.data || []);
        setPages(data.pages || 0);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, search, page]);

  return (
    <main className="mt-shop-page">
      <header className="mt-shop-header">
        <Link to="/" className="mt-shop-logo">MIRJA <span>TRADERS</span></Link>
        <Link to="/" className="mt-back"><ArrowLeft size={17}/> Home</Link>
      </header>

      <section className="mt-shop-hero">
        <span>PREMIUM TECHNOLOGY COLLECTION</span>
        <h1>Explore Our Products</h1>
        <p>Laptops, smartphones, smart watches and modern gadgets.</p>
      </section>

      <section className="mt-shop-container">
        <div className="mt-shop-toolbar">
          <h2>Shop All Products</h2>
          <label className="mt-shop-search">
            <Search size={19}/>
            <input value={search} placeholder="Search products..."
              onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </label>
        </div>

        <div className="mt-shop-filters">
          <button className={!category ? "active" : ""}
            onClick={() => { setCategory(""); setPage(1); }}>
            All Products
          </button>
          {categories.map(c => (
            <button key={c._id}
              className={category === c.slug ? "active" : ""}
              onClick={() => { setCategory(c.slug); setPage(1); }}>
              {c.name}
            </button>
          ))}
        </div>

        {error && <p className="mt-shop-error">{error}</p>}

        {loading ? (
          <p className="mt-shop-empty">Loading products...</p>
        ) : products.length ? (
          <div className="mt-shop-grid">
            {products.map(product => (
              <Link to={`/product/${encodeURIComponent(product.slug)}`}
                className="mt-shop-product" key={product._id}>
                <div className="mt-shop-image">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} loading="lazy"/>
                  ) : (
                    <Package size={55}/>
                  )}
                  {product.comparePrice > product.price &&
                    <span className="mt-shop-sale">SALE</span>}
                </div>
                <div className="mt-shop-info">
                  <small>{product.category?.name || product.brand || "Electronics"}</small>
                  <h3>{product.name}</h3>
                  <div className="mt-shop-price">
                    <strong>{money(product.price)}</strong>
                    {product.comparePrice > product.price &&
                      <del>{money(product.comparePrice)}</del>}
                  </div>
                  <p>{product.stock > 0 ? "In Stock" : "Out of Stock"}</p>
                  <span className="mt-shop-view">View Details <ShoppingBag size={16}/></span>
                </div>
              </Link>
            ))}
          </div>
        ) : !error && (
          <p className="mt-shop-empty">No products found. Add active products from your Admin Dashboard.</p>
        )}

        {pages > 1 && <div className="mt-shop-pagination">
          <button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>}
      </section>
    </main>
  );
}
