import { useEffect, useState } from "react";
import { X, ChevronRight, Grid2X2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export default function CategoryDrawer({
  open,
  onClose,
  onSelect
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    setLoading(true);
    setError("");

    fetch(`${API}/categories`, {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) throw new Error("Unable to load categories");
        return response.json();
      })
      .then(result => {
        if (!controller.signal.aborted) {
          setItems(Array.isArray(result.data) ? result.data : []);
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
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function selectCategory(name) {
    onSelect(name);
    onClose();

    requestAnimationFrame(() => {
      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  return (
    <div className="mirja-drawer-layer">
      <button
        type="button"
        className="mirja-drawer-backdrop"
        onClick={onClose}
        aria-label="Close categories"
      />

      <aside
        className="mirja-category-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shop by category"
      >
        <div className="mirja-drawer-header">
          <div>
            <span>EXPLORE COLLECTION</span>
            <h2>Shop by Category</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mirja-drawer-list">
          <button
            type="button"
            className="mirja-drawer-category"
            onClick={() => selectCategory("All")}
          >
            <span className="mirja-drawer-category-icon">
              <Grid2X2 size={20} />
            </span>
            <span>All Products</span>
            <ChevronRight size={17} />
          </button>

          {loading && <p>Loading categories...</p>}
          {error && <p role="alert">{error}</p>}

          {items.map(item => (
            <button
              key={item._id}
              type="button"
              className="mirja-drawer-category"
              onClick={() => selectCategory(item.name)}
            >
              <span className="mirja-drawer-category-icon">
                {item.image ? (
                  <img src={item.image} alt="" loading="lazy" />
                ) : (
                  <Grid2X2 size={19} />
                )}
              </span>
              <span>{item.name}</span>
              <ChevronRight size={17} />
            </button>
          ))}

          {!loading && !error && items.length === 0 && (
            <p>No categories available.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
