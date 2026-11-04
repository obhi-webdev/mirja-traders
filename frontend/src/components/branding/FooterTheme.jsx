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

const valid = (value, fallback) =>
  /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : fallback;

export default function FooterTheme({ children }) {
  const [colors, setColors] = useState(defaults);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/website-settings`, {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(response => {
        if (!response.ok) throw new Error("Settings unavailable");
        return response.json();
      })
      .then(data => {
        if (!controller.signal.aborted) {
          setColors({
            ...defaults,
            ...(data.data || {})
          });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <footer
      className="footer mirja-footer"
      lang="bn"
      style={{
        "--mt-footer-bg": valid(
          colors.footerBackgroundColor,
          defaults.footerBackgroundColor
        ),
        "--mt-footer-heading": valid(
          colors.footerHeadingColor,
          defaults.footerHeadingColor
        ),
        "--mt-footer-text": valid(
          colors.footerTextColor,
          defaults.footerTextColor
        ),
        "--mt-footer-link": valid(
          colors.footerLinkColor,
          defaults.footerLinkColor
        ),
        "--mt-footer-accent": valid(
          colors.footerAccentColor,
          defaults.footerAccentColor
        )
      }}
    >
      {children}
    </footer>
  );
}
