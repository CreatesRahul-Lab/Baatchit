/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'mongodb', 'socket.io', 'bad-words']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
      
      // Fix for MongoDB in serverless functions
      config.resolve.alias = {
        ...config.resolve.alias,
        'mongodb': require.resolve('mongodb'),
      };
    }
    return config;
  },
}

module.exports = nextConfig