import { useEffect, useState } from "react";
import {
  ArrowRight, ChevronLeft, ChevronRight
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

function Slide({ banner, side = false }) {
  const alignment = banner.textPosition || "left";

  return (
    <div
      className={
        side ? "mt-hero-slide mt-hero-side-slide"
             : "mt-hero-slide mt-hero-main-slide"
      }
      style={{
        backgroundImage:
          `linear-gradient(90deg,rgba(0,0,0,.48),rgba(0,0,0,.08)),url("${banner.image}")`
      }}
    >
      <div
        className="mt-hero-overlay-copy"
        style={{
          color: banner.textColor || "#FFFFFF",
          textAlign: alignment,
          alignItems: alignment === "right"
            ? "flex-end"
            : alignment === "center"
              ? "center"
              : "flex-start"
        }}
      >
        <h1>{banner.title}</h1>
        {banner.subtitle && <p>{banner.subtitle}</p>}
        {banner.buttonText && (
          <a href={banner.buttonLink || "/shop"}>
            {banner.buttonText}
            <ArrowRight size={16}/>
          </a>
        )}
      </div>
    </div>
  );
}

function EmptySide({ title, subtitle }) {
  return (
    <div className="mt-hero-empty-side">
      <span>NEW ARRIVALS</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <a href="/shop">Explore Collection</a>
    </div>
  );
}

export default function DynamicHero({ fallback }) {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/banners`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Banner API unavailable");
        return response.json();
      })
      .then(result => setBanners(result.data || []))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading || banners.length === 0) return fallback;

  const main = banners.filter(
    item => !item.placement || item.placement === "hero"
  );
  const top = banners.filter(
    item => item.placement === "sideTop"
  );
  const bottom = banners.filter(
    item => item.placement === "sideBottom"
  );

  const hasAnyMain = main.length > 0;

  return (
    <section id="home" className="mt-managed-hero">
      <div className="mt-managed-main">
        {hasAnyMain ? (
          <Slide banner={main[index % main.length]}/>
        ) : (
          <div className="mt-hero-empty-side mt-hero-main-slide">
            <h2>Discover Your Next Upgrade</h2>
            <p>Explore laptops, smartphones and smart gadgets.</p>
            <a href="/shop">Shop Now</a>
          </div>
        )}

        {main.length > 1 && (
          <div className="mt-managed-hero-controls">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => setIndex(i =>
                (i - 1 + main.length) % main.length
              )}
            >
              <ChevronLeft size={20}/>
            </button>
            <span>{index % main.length + 1} / {main.length}</span>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setIndex(i =>
                (i + 1) % main.length
              )}
            >
              <ChevronRight size={20}/>
            </button>
          </div>
        )}
      </div>

      <div className="mt-managed-sides">
        {top.length ? (
          <Slide side banner={top[0]}/>
        ) : (
          <EmptySide title="Smartphones"
            subtitle="Explore the latest arrivals"/>
        )}

        {bottom.length ? (
          <Slide side banner={bottom[0]}/>
        ) : (
          <EmptySide title="Smart Accessories"
            subtitle="Upgrade your everyday essentials"/>
        )}
      </div>
    </section>
  );
}
