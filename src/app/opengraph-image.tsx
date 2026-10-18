import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Hippocrates AI — Dual-Engine Clinical Intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          backgroundColor: "#0B132B",
          padding: "80px",
          fontFamily: "sans-serif",
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.35), transparent 45%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.25), transparent 45%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "36px",
              fontWeight: "bold",
            }}
          >
            H
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
              Hippocrates
            </span>
            <span style={{ fontSize: "14px", color: "#60A5FA", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600 }}>
              AI Clinical Platform
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              margin: 0,
            }}
          >
            Dual-Engine Clinical Intelligence.
          </h1>
          <p style={{ fontSize: "24px", color: "#94A3B8", lineHeight: 1.4, margin: 0 }}>
            <strong style={{ color: "#38BDF8" }}>Aegis</strong> for Patient Health & Report Understanding.{" "}
            <strong style={{ color: "#818CF8" }}>Oracle</strong> for Physician Clinical Decision Support.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: "30px",
          }}
        >
          <div style={{ display: "flex", gap: "30px", color: "#CBD5E1", fontSize: "18px", fontWeight: 500 }}>
            <span>• Multi-Model Clinical Reasoning</span>
            <span>• Doctor Registration Verification</span>
            <span>• Zero Health Data Monetization</span>
          </div>
          <span style={{ fontSize: "18px", color: "#60A5FA", fontWeight: 600 }}>
            hippocrates.in
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
