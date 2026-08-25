/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the dev server be reached via 127.0.0.1 in addition to localhost
  // (some local testing setups resolve localhost inconsistently).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
