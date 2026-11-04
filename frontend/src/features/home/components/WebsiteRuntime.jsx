import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

function startPixel(pixelId) {
  if (window.fbq) return;

  const fbq = function () {
    fbq.callMethod
      ? fbq.callMethod.apply(fbq, arguments)
      : fbq.queue.push(arguments);
  };

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";

  window.fbq = fbq;
  window._fbq = fbq;

  fbq("init", pixelId);

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

export default function WebsiteRuntime() {
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [consent, setConsent] = useState(
    () => localStorage.getItem("mirja-marketing-consent") || ""
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/website-settings`, {
      signal: controller.signal
    })
      .then(r => {
        if (!r.ok) throw new Error("Settings unavailable");
        return r.json();
      })
      .then(d => setSettings(d.data))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!settings) return;

    document.title = settings.siteTitle;

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content = settings.description;
  }, [settings]);

  useEffect(() => {
    if (
      !settings?.pixelEnabled ||
      !settings.metaPixelId ||
      consent !== "accepted" ||
      location.pathname.startsWith("/admin")
    ) return;

    startPixel(settings.metaPixelId);

    const key = location.pathname + location.search;

    if (window.__mirjaLastPageView !== key) {
      window.fbq("track", "PageView");
      window.__mirjaLastPageView = key;
    }
  }, [settings, consent, location.pathname, location.search]);

  if (
    !settings?.pixelEnabled ||
    consent ||
    location.pathname.startsWith("/admin")
  ) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: 20,
      right: 20,
      maxWidth: 620,
      margin: "auto",
      zIndex: 9999,
      padding: 20,
      background: "#10254c",
      color: "white",
      borderRadius: 12,
      boxShadow: "0 12px 35px #0003"
    }}>
      <p style={{ fontSize: 13, lineHeight: 1.7 }}>
        Mirja Traders uses optional marketing tracking
        to understand website visits. Choose whether
        to allow Meta Pixel tracking.
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        {[
          ["Decline", "declined"],
          ["Accept", "accepted"]
        ].map(([label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              localStorage.setItem(
                "mirja-marketing-consent",
                value
              );
              setConsent(value);
            }}
            style={{
              border: 0,
              padding: "11px 18px",
              borderRadius: 7,
              cursor: "pointer",
              background: value === "accepted"
                ? "#ff8b2a"
                : "#dce5f5",
              color: "#10254c",
              fontWeight: 700
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
