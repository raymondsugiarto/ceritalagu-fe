/* eslint-disable no-restricted-syntax -- next/og (Satori) renders inline styles only, no CSS classes. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Share card for WhatsApp, Instagram, Facebook, X and link previews in AI chat apps. Rendered once
// at build time. Copy is in Indonesian on purpose: the image is shared by URL, not by locale.
export const alt = "Cerita Lagu: lagu personal dari ceritamu untuk orang tersayang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/ceritalagu-mark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(135deg, #5b1a9e 0%, #8b2fc9 55%, #c2257f 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src={logoSrc} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
        <div style={{ fontSize: 40, fontWeight: 700 }}>Cerita Lagu</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
          Ubah ceritamu jadi lagu yang tak terlupakan
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Jawab 7 pertanyaan · Pilih genre · Preview gratis
        </div>
      </div>
    </div>,
    size,
  );
}
