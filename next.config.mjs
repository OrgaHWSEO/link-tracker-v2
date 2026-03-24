/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Empêche Next.js de bundler Playwright (modules natifs Node.js uniquement)
  serverExternalPackages: [
    "playwright",
    "playwright-core",
    "playwright-extra",
    "puppeteer-extra",
    "puppeteer-extra-plugin",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin-user-data-dir",
    "puppeteer-extra-plugin-user-preferences",
    "clone-deep",
    "merge-deep",
  ],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Marque explicitement tous les packages playwright/puppeteer-extra
      // comme externes pour webpack — couvre aussi les sous-dépendances ESM
      // qui échappent à serverExternalPackages (ex: puppeteer-extra-plugin/dist/index.esm.js)
      const prev = config.externals ?? [];
      const externalsArray = Array.isArray(prev) ? prev : [prev];

      externalsArray.push(({ request }, callback) => {
        if (
          typeof request === "string" &&
          (request.startsWith("playwright") ||
            request.startsWith("puppeteer-extra"))
        ) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });

      config.externals = externalsArray;
    }
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
