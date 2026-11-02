import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const initial = {
  logoIconUrl: "",
  logoFirstText: "Mirja",
  logoSecondText: "Traders",
  logoFirstColor: "#2457B5",
  logoSecondColor: "#F59E0B",
  logoIconSize: 42
};

export default function BrandLogo({ size = "normal" }) {
  const [brand, setBrand] = useState(initial);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/website-settings`, {
      signal: controller.signal
    })
      .then(r => {
        if (!r.ok) throw new Error("Brand settings unavailable");
        return r.json();
      })
      .then(d => setBrand({ ...initial, ...d.data }))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const scale = size === "small" ? 0.8 : 1;
  const iconSize = (Number(brand.logoIconSize) || 42) * scale;

  return (
    <a href="/" style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      textDecoration: "none",
      maxWidth: "100%"
    }}>
      {brand.logoIconUrl ? (
        <img
          src={brand.logoIconUrl}
          alt="Mirja Traders icon"
          style={{
            width: iconSize,
            height: iconSize,
            objectFit: "contain",
            flexShrink: 0
          }}
        />
      ) : (
        <span style={{
          width: iconSize,
          height: iconSize,
          background: "#2457B5",
          color: "#fff",
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          fontSize: Math.max(12, iconSize * .35),
          fontWeight: 800,
          flexShrink: 0
        }}>MT</span>
      )}
      <span style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: 5,
        fontSize: size === "small" ? 16 : 21,
        fontWeight: 800,
        lineHeight: 1.2
      }}>
        <span style={{ color: brand.logoFirstColor }}>
          {brand.logoFirstText}
        </span>
        <span style={{ color: brand.logoSecondColor }}>
          {brand.logoSecondText}
        </span>
      </span>
    </a>
  );
}
