import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow access from localhost on Windows when running in WSL
  // This binds to 0.0.0.0 to allow external access
  experimental: {
    // Enable server actions
  },
  
  headers() {
    // Required by FHEVM 
    return Promise.resolve([
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  },

  // Webpack configuration for FHEVM compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
