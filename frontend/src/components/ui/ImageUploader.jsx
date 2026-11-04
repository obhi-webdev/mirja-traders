import { useState } from "react";

const API = (import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"));

export default function ImageUploader({
  token,
  onUploaded
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file || busy) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessage("Select JPG, PNG or WebP under 5 MB");
      e.target.value = "";
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("image", file);

      const response = await fetch(`${API}/media/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      onUploaded(result.url);
      setMessage("Image uploaded successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div style={{ margin: "12px 0" }}>
      <label style={{
        display: "block",
        border: "1px dashed #8ea8d0",
        padding: 16,
        borderRadius: 9,
        cursor: "pointer",
        fontSize: 13
      }}>
        {busy ? "Uploading..." : "Upload Image from Computer"}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={uploadImage}
          style={{ display: "none" }}
        />
      </label>

      {message && (
        <p style={{
          fontSize: 12,
          color: "#526983"
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
