import { addToCart } from "../../cart/cart";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, ShieldCheck, Truck } from "lucide-react";
import "../../shop/pages/shop.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const money = value => "৳" + Number(value || 0).toLocaleString("en-BD");

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(`${API}/products/${encodeURIComponent(slug)}`, {
      signal: controller.signal
    })
      .then(async r => {
        if (!r.ok) throw new Error(r.status === 404 ? "Product not found" : "Unable to load product");
        return r.json();
      })
      .then(d => {
        setProduct(d.data);
        setImage(d.data.images?.[0] || "");
      })
      .catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [slug]);

  return <main className="mt-shop-page">
    <header className="mt-shop-header">
      <Link to="/" className="mt-shop-logo">MIRJA <span>TRADERS</span></Link>
      <Link to="/shop" className="mt-back"><ArrowLeft size={17}/> Back to Shop</Link>
    </header>

    {loading ? <p className="mt-shop-empty">Loading product...</p> :
      error ? <p className="mt-shop-empty">{error}</p> :
      product && <section className="mt-detail-layout">
        <div className="mt-detail-gallery">
          <div className="mt-detail-main-image">
            {image ? <img src={image} alt={product.name}/> : <Package size={85}/>}
          </div>
          <div className="mt-detail-thumbnails">
            {(product.images || []).map((src, i) => (
              <button key={i} onClick={() => setImage(src)}>
                <img src={src} alt={`${product.name} image ${i + 1}`}/>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-detail-info">
          <span className="mt-detail-category">{product.category?.name || "Electronics"}</span>
          <h1>{product.name}</h1>
          <p className="mt-detail-brand">{product.brand || "Mirja Traders"}</p>
          <div className="mt-shop-price">
            <strong>{money(product.price)}</strong>
            {product.comparePrice > product.price &&
              <del>{money(product.comparePrice)}</del>}
          </div>
          <p className="mt-detail-stock">{product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}</p>
          <p className="mt-detail-description">{product.shortDescription || product.description || "Product details will be updated soon."}</p>

          <div className="mt-detail-unavailable">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => {
                if (addToCart(product)) {
                  window.location.assign("/checkout");
                } else {
                  window.alert("Unable to add product. Check available stock.");
                }
              }}
              style={{
                background: "#2056b8", color: "white",
                border: 0, padding: "15px 28px",
                borderRadius: 8, fontWeight: 700,
                cursor: "pointer", width: "100%"
              }}
            >
              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>
          <div className="mt-detail-benefits">
            <p><Truck size={20}/> Delivery options will be confirmed at checkout.</p>
            <p><ShieldCheck size={20}/> Contact us to confirm warranty details.</p>
          </div>
        </div>
      </section>}
  </main>;
}
