/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
  },
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling native .node binaries
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        ({ request }, callback) => {
          if (request && request.endsWith('.node')) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;