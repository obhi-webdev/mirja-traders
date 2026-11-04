import BrandLogo from "./components/branding/BrandLogo.jsx";
import CategoryDrawer from "./components/navigation/CategoryDrawer.jsx";
import DynamicHero from "./features/home/components/DynamicHero.jsx";
import React, { useState, useEffect } from "react";
import {
  Search, ShoppingCart, Heart, UserRound, Menu,
  ArrowRight, Laptop, Smartphone, Watch,
  Headphones, Truck, ShieldCheck, X
} from "lucide-react";
import { categories, formatPrice } from "./features/home/data/storeData";
import "./App.css";

const icons = {
  laptop: Laptop,
  phone: Smartphone,
  watch: Watch,
  headphones: Headphones
};

function Header({ search, setSearch, setCategory }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = null;

    const handleScroll = () => {
      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        setScrollProgress(
          Math.min(window.scrollY / 160, 1)
        );
        frame = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="announcement">
        BIG SAVINGS ON YOUR FAVORITE TECH — EXPLORE OUR LATEST COLLECTION
      </div>

      <div
        className="mirja-sticky-header"
        style={{ "--menu-progress": scrollProgress }}
      >
      <header className="site-header">
        <div className="brand"><BrandLogo /></div>

        <div className="search-bar">
          <input
            aria-label="Search products"
            placeholder="Search for products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={21} />
        </div>

        <div className="header-actions">
          <span title="Account"><UserRound size={21}/></span>
          <span title="Wishlist"><Heart size={21}/></span>
          <span title="Cart"><ShoppingCart size={22}/></span>
          <button aria-label="Toggle menu" className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X/> : <Menu/>}
          </button>
        </div>
      </header>

      <nav className={menuOpen ? "navigation active" : "navigation"}>
        <button type="button" className="mirja-category-trigger" onClick={() => { setDrawerOpen(true); setMenuOpen(false); }}><Menu size={17}/> Categories</button>
        <a href="#home">Home</a>
        <a href="/shop">Shop</a>
        <a href="#features">Why Choose Us</a>
        <a className="mirja-contact-btn" href="/contact">
          <span>Contact Us</span>
          <span className="mirja-contact-arrow" aria-hidden="true">↗</span>
        </a>
      </nav>
      </div>
      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={setCategory}
      />
    </>
  );
}

function Hero() {
  return (
    <section id="home" className="hero-layout">
      <div className="hero-main">
        <div className="hero-copy">
          <span className="eyebrow">THE FUTURE OF TECHNOLOGY</span>
          <h1>Upgrade Your <span>Digital Lifestyle.</span></h1>
          <p>Explore laptops, smartphones and smart gadgets, all in one destination.</p>
          <a className="primary-btn" href="#shop">
            Shop Collection <ArrowRight size={18}/>
          </a>
        </div>
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1000&q=85"
          alt="Premium laptop"
        />
      </div>

      <div className="hero-side">
        <a className="promo-card promo-blue" href="#shop">
          <span>NEW COLLECTION</span>
          <h2>Smartphones</h2>
          <p>Explore New Arrivals</p>
          <ArrowRight size={21}/>
        </a>
        <a className="promo-card promo-orange" href="#shop">
          <span>SMART LIVING</span>
          <h2>Smart Gadgets</h2>
          <p>Discover More</p>
          <ArrowRight size={21}/>
        </a>
      </div>
    </section>
  );
}


function CategorySection({ setCategory }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const api = import.meta.env.VITE_API_URL ||
      "http://localhost:5001/api";

    fetch(`${api}/categories`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          throw new Error("Unable to load categories");
        }
        return response.json();
      })
      .then(result => {
        if (!controller.signal.aborted) {
          setItems(result.data || []);
        }
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  function getIcon(name) {
    const value = name.toLowerCase();
    if (value.includes("laptop")) return Laptop;
    if (value.includes("phone")) return Smartphone;
    if (value.includes("watch")) return Watch;
    return Headphones;
  }

  return (
    <section id="categories" className="section-wrap">
      <div className="section-heading">
        <div>
          <span className="section-kicker">DISCOVER</span>
          <h2>Shop by Category</h2>
        </div>
        <a href="/shop">View All Products <ArrowRight size={17}/></a>
      </div>

      {loading && <p>Loading categories...</p>}
      {error && <p role="alert">{error}</p>}

      <div className="category-grid">
        {items.map(item => {
          const Icon = getIcon(item.name);

          return (
            <a
              href="#shop"
              className="category-card"
              key={item._id}
              onClick={() => setCategory(item.name)}
            >
              <div className="category-icon">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
                ) : (
                  <Icon size={34} strokeWidth={1.5}/>
                )}
              </div>
              <h3>{item.name}</h3>
              <p>Explore Collection</p>
            </a>
          );
        })}
      </div>

      {!loading && !error && items.length === 0 && (
        <p>No categories yet. Add categories from the Dashboard.</p>
      )}
    </section>
  );
}

function ProductSection({ search, category, setCategory }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const api = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

    async function loadProducts() {
      try {
        const response = await fetch(
          `${api}/products?limit=48`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const result = await response.json();

        if (!controller.signal.aborted) {
          setProducts((result.data || []).map(p => ({
            id: p._id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || "",
            price: p.price,
            oldPrice: p.comparePrice || 0,
            image: p.images?.[0] || "",
            stock: p.stock
          })));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  const filtered = products.filter((product) =>
    (category === "All" || product.category === category) &&
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="shop" className="section-wrap">
      <div className="section-heading">
        <div><span className="section-kicker">TRENDING NOW</span><h2>Featured Products</h2></div>
        <button className="text-link" onClick={() => setCategory("All")}>View All Products <ArrowRight size={17}/></button>
      </div>
      <div className="filter-tabs">
        {["All", ...categories.map((c) => c.name)].map((item) => (
          <button className={category === item ? "selected" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      <div className="product-grid">
        {filtered.map((product) => (
          <a href={`/product/${encodeURIComponent(product.slug)}`}
            className="product-card" key={product.id}>
            <div className="product-image">
              {product.image ? (
                <img src={product.image} alt={product.name} loading="lazy"/>
              ) : (
                <div className="product-placeholder">No Image</div>
              )}
              <span className="sale-label">SALE</span>
            </div>
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p><strong>{formatPrice(product.price)}</strong> <del>{formatPrice(product.oldPrice)}</del></p>
              <span className="preview-note">Product preview</span>
            </div>
          </a>
        ))}
      </div>
      {loading && <p>Loading products...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && filtered.length === 0 &&
        <p>No matching products found. Add active products from the Dashboard.</p>}
    </section>
  );
}

function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  return (
    <>
      <Header search={search} setSearch={setSearch} setCategory={setCategory}/>
      <main>
        <DynamicHero fallback={<Hero/>}/>
        <section id="features" className="benefits">
          <div><Truck/><span><b>Delivery Service</b><small>Across Bangladesh</small></span></div>
          <div><ShieldCheck/><span><b>Customer Support</b><small>Shop with confidence</small></span></div>
          <div><Heart/><span><b>Quality Selection</b><small>Explore our collection</small></span></div>
        </section>
        <CategorySection setCategory={setCategory}/>
        <ProductSection search={search} category={category} setCategory={setCategory}/>
      </main>
      <footer className="footer mirja-footer">
        <div className="mirja-footer-inner">
          <div className="mirja-footer-grid">

            <div className="mirja-footer-brand">
              <BrandLogo size="small" />
              <p>
                Mirja Traders brings you quality electronics,
                smart gadgets and modern lifestyle essentials.
                Shop with confidence and convenience.
              </p>
              <div className="mirja-footer-highlight">
                <span>Trusted Shopping Experience</span>
                <span>Cash on Delivery Available</span>
              </div>
            </div>

            <div className="mirja-footer-column">
              <h3>Information</h3>
              <a href="#home">Home</a>
              <a href="/shop">Shop All Products</a>
              <a href="#categories">Categories</a>
              <a href="#features">Why Choose Us</a>
            </div>

            <div className="mirja-footer-column">
              <h3>Shop By</h3>
              <a href="#categories">Smartphones</a>
              <a href="#categories">Laptops</a>
              <a href="#categories">Smart Watches</a>
              <a href="#categories">Accessories</a>
            </div>

            <div className="mirja-footer-column">
              <h3>Support</h3>
              <span>How to Order</span>
              <span>Order Tracking</span>
              <span>Shipping Information</span>
              <span>Payment Information</span>
              <span>Customer Assistance</span>
            </div>

            <div className="mirja-footer-column">
              <h3>Consumer Policy</h3>
              <span>Return Policy</span>
              <span>Refund Policy</span>
              <span>Exchange Policy</span>
              <span>Cancellation Policy</span>
              <span>Terms & Conditions</span>
            </div>

          </div>

          <div className="mirja-footer-bottom">
            <p>
              © {new Date().getFullYear()} Mirja Traders.
              All Rights Reserved.
            </p>

            <div className="mirja-footer-payment">
              <strong>Payment Methods</strong>
              <span className="mirja-cod-badge">
                Cash on Delivery
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
