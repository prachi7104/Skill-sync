/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimize for free-tier deployments
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Keep native Node modules out of server-side webpack bundles.
  // onnxruntime-node ships .node binaries that webpack cannot parse.
  experimental: {
    serverComponentsExternalPackages: [
      "onnxruntime-node",
      "@xenova/transformers",
    ],
  },
};

module.exports = nextConfig;
