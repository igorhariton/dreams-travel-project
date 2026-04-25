import React from "react";

type AdminModuleShellProps = {
  title: string;
  description: string;
};

export default function AdminModuleShell({ title, description }: AdminModuleShellProps) {
  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #d9e3f0",
          borderRadius: 28,
          padding: 32,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            background: "rgba(37, 99, 235, 0.10)",
            color: "#2563eb",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 12px",
            marginBottom: 16,
          }}
        >
          Admin Module
        </div>
        <h1 style={{ margin: 0, color: "#14213d", fontSize: 36, lineHeight: 1.1 }}>{title}</h1>
        <p style={{ marginTop: 12, color: "#64748b", fontSize: 16, lineHeight: 1.7 }}>{description}</p>
      </div>
    </section>
  );
}
