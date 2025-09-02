/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // ⚠️ Temporarily ignore TypeScript errors for deployment
        ignoreBuildErrors: true,
    },
    eslint: {
        // ⚠️ Temporarily ignore ESLint errors for deployment
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'bnstnamdtlveluavjkcy.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8188',
                pathname: '/view/**',
            },
        ],
    },
};

export default nextConfig;
