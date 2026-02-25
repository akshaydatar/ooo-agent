/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    env: {
        INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY || 'local',
        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY || 'local'
    }
};

export default nextConfig;
