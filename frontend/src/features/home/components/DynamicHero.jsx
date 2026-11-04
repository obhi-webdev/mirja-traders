import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

const positionMap = {
  left: "flex-start",
  center: "center",
  right: "flex-end"
};

function BannerContent({ banner, compact = false }) {
  const position = banner.textPosition || "left";
  const color = banner.textColor || "#FFFFFF";

  return (
    <div
      className={
        compact
          ? "mirja-hero-content mirja-hero-compact"
          : "mirja-hero-content"
      }
      style={{
        color,
        textAlign: position,
        alignItems: positionMap[position] || "flex-start"
      }}
    >
      <span className="mirja-hero-eyebrow">
        {compact ? "DISCOVER MORE" : "MIRJA TRADERS"}
      </span>

      <h1>{banner.title}</h1>

      {banner.subtitle && (
        <p>{banner.subtitle}</p>
      )}

      {banner.buttonText && (
        <a
          className="mirja-hero-button"
          href={banner.buttonLink || "/shop"}
        >
          <span>{banner.buttonText}</span>
          <ArrowRight size={17} />
        </a>
      )}
    </div>
  );
}

function BannerCard({ banner, compact = false, className = "" }) {
  return (
    <article
      className={[
        "mirja-hero-card",
        compact ? "mirja-hero-card-small" : "mirja-hero-card-main",
        className
      ].filter(Boolean).join(" ")}
    >
      <img
        className="mirja-hero-image"
        src={banner.image}
        alt={banner.title || "Mirja Traders Collection"}
        loading={compact ? "lazy" : "eager"}
        fetchPriority={compact ? "auto" : "high"}
      />

      {(
        typeof banner.showTextOverlay === "boolean"
          ? banner.showTextOverlay
          : (banner.placement || "hero") !== "hero"
      ) ? (
        <BannerContent
          banner={banner}
          compact={compact}
        />
      ) : (
        <a
          className="mirja-hero-image-link"
          href={banner.buttonLink || "/shop"}
          aria-label={
            banner.title || "Explore Mirja Traders"
          }
        />
      )}
    </article>
  );
}

function PromoPlaceholder({ title, description, tone }) {
  return (
    <div className={`mirja-promo-placeholder ${tone}`}>
      <span>EXPLORE OUR COLLECTION</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <a href="/shop">
        Shop Collection <ArrowRight size={16} />
      </a>
    </div>
  );
}

export default function DynamicHero({ fallback }) {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/banners`, {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Banner API unavailable");
        }
        return response.json();
      })
      .then(result => {
        if (!controller.signal.aborted) {
          setBanners(
            Array.isArray(result.data) ? result.data : []
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading || banners.length === 0) {
    return fallback;
  }

  const main = banners.filter(
    item => !item.placement || item.placement === "hero"
  );

  const rightTop = banners.find(
    item => item.placement === "sideTop"
  );

  const rightBottom = banners.find(
    item => item.placement === "sideBottom"
  );

  const activeIndex = main.length ? index % main.length : 0;

  function next() {
    setIndex(current => (current + 1) % main.length);
  }

  function previous() {
    setIndex(current =>
      (current - 1 + main.length) % main.length
    );
  }

  return (
    <section
      id="home"
      className="mirja-premium-hero"
      aria-label="Mirja Traders featured collections"
    >
      <div className="mirja-premium-hero-grid">
        <div className="mirja-premium-main">
          {main.length ? (
            <BannerCard
              key={main[activeIndex]._id || activeIndex}
              banner={main[activeIndex]}
            />
          ) : (
            <PromoPlaceholder
              title="Discover Your Next Upgrade"
              description="Premium laptops, smartphones and gadgets."
              tone="mirja-promo-blue"
            />
          )}

          {main.length > 1 && (
            <nav
              className="mirja-premium-slider-nav"
              aria-label="Hero carousel"
            >
              <button
                type="button"
                onClick={previous}
                aria-label="Previous hero banner"
              >
                <ChevronLeft size={19} />
              </button>

              <div className="mirja-slider-dots">
                {main.map((banner, i) => (
                  <button
                    type="button"
                    key={banner._id || i}
                    className={i === activeIndex ? "active" : ""}
                    aria-label={`Show banner ${i + 1}`}
                    aria-current={i === activeIndex ? "true" : undefined}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                aria-label="Next hero banner"
              >
                <ChevronRight size={19} />
              </button>
            </nav>
          )}
        </div>

        <div className="mirja-premium-side">
          {rightTop ? (
            <BannerCard
              banner={rightTop}
              compact
              className="mirja-side-top"
            />
          ) : (
            <PromoPlaceholder
              title="New Arrivals"
              description="Discover the latest smartphones."
              tone="mirja-promo-blue"
            />
          )}

          {rightBottom ? (
            <BannerCard
              banner={rightBottom}
              compact
              className="mirja-side-bottom"
            />
          ) : (
            <PromoPlaceholder
              title="Smart Accessories"
              description="Everyday essentials, upgraded."
              tone="mirja-promo-gold"
            />
          )}
        </div>
      </div>
    </section>
  );
}
