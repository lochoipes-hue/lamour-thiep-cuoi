# L'Amour Atelier — Frontend (Vercel Edge CDN)

Frontend tĩnh sạch (v14) cho nền tảng **L'Amour Atelier**, tối ưu triển khai lên **Vercel** và kết nối xuyên nguồn (CORS HTTPS) tới **Render Cloud Backend**.

## Cấu trúc sạch (không chứa mã nguồn backend hay PHP)
- `index.html`, `css/`, `js/` (bao gồm `js/config.js` cấu hình địa chỉ Render Backend)
- `vercel.json` (header cache chuẩn + bảo mật `nosniff`, `Referrer-Policy`)

## Triển khai lên Vercel
1. Đẩy thư mục này lên GitHub repo `https://github.com/lochoipes-hue/lamour-thiep-cuoi` (hoặc import trực tiếp trên [vercel.com/new](https://vercel.com/new) với Framework Preset = **Other**, Build Command = để trống, Output Directory = `.`).
2. Sau khi có URL Render Backend (VD: `https://lamour-cloud-backend.onrender.com`), kiểm tra dòng `defaultCloudApiOrigin` trong `js/config.js` trùng khớp đúng URL Render của bạn.
3. Bạn cũng có thể thử ngay bất kỳ backend nào mà không cần sửa code bằng cách mở:
   `https://<ten-site>.vercel.app/?api=https://<ten-backend>.onrender.com`
