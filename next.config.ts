import type { NextConfig } from "next";

// Отдельный каталог позволяет E2E-серверу работать рядом с обычным dev-превью.
const nextConfig: NextConfig = {
  devIndicators: false,
  // Dev bundles use stable paths; prevent an intermediary from replaying an old client
  // bundle against fresh server HTML after a rebuild. Production hashed assets are unchanged.
  async headers() {
    return process.env.NODE_ENV === "development" ? [{ source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] }] : [];
  },
  // Polling сохраняет обновление CSS в окружениях, где события файловой системы теряются.
  webpack(config, { dev }) {
    if (dev) config.watchOptions = { ...config.watchOptions, poll: 1000 };
    return config;
  },
  // Production по-прежнему собирается Turbopack; настройка webpack нужна только dev-серверу.
  turbopack: {},
  // Превью открывается через прокси Arena, не через localhost браузера.
  allowedDevOrigins: ["*.e2b.app", "127.0.0.1"],
  ...(process.env.ARCHON_E2E ? { distDir: ".next/e2e" } : {}),
};

export default nextConfig;
