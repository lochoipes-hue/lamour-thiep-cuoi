/**
 * L'Amour Atelier — Cloud Backend Configuration (v14)
 * Frontend: Vercel (Static Edge CDN) | Backend: Render Web Service (Node.js + PostgreSQL / Persistent Disk)
 *
 * Sau khi deploy Backend lên Render, nếu URL Render khác mặc định, chỉ cần sửa dòng
 * `defaultCloudApiOrigin` bên dưới hoặc mở web kèm tham số:
 *   https://ten-site.vercel.app/?api=https://ten-backend-cua-ban.onrender.com
 */

export const CLOUD_CONFIG = {
  defaultCloudApiOrigin: 'https://lamour-cloud-backend-hv4z.onrender.com',
  // Keep empty by default so a Render cold start NEVER splits live orders/webhooks to a different database!
  fallbackCloudApiOrigins: [],
  sameOriginTimeoutMs: 4000,
  fastCloudTimeoutMs: 6500,
  coldStartTimeoutMs: 50000,
  backgroundWakeRetries: 2,
};
