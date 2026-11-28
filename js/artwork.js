/**
 * DaiLo Wedding — Bộ Ảnh Nền Mờ Nghệ Thuật & Hoa Văn Chạm Khắc Ép Kim Cao Cấp
 * Thay thế hoàn toàn các họa tiết hình học thô bằng:
 *  - 8 Ảnh nền không gian mờ cuốn hút (Cover & Hero Atmospheric Photo Backdrops)
 *  - Khung hoa văn chạm khắc Baroque / Song Hỷ / Botanical / Art Deco siêu mảnh chuẩn in ép kim
 *  - Nền khắc đồng kiến trúc cung điện & Con dấu sáp vàng 3D
 */

export const EDITORIAL_SAMPLE_PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=960&q=85',
  album: [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=850&q=84',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=850&q=84',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=850&q=84',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=850&q=84',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=850&q=84',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=850&q=84',
  ],
};

/**
 * 8 Ảnh Nền Mờ Nghệ Thuật Cho Bìa Thiệp & Không Gian Đầu Thiệp
 * (Hiển thị mờ chiều sâu dưới lớp phủ màu + hoa văn ép kim -> Cuốn hút ngay từ giây đầu tiên!)
 */
export const COVER_BACKDROPS = [
  {
    id: 'burgundy-roses',
    name: 'Vườn Hồng Nhung & Ánh Nến',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'ivory-floral-arch',
    name: 'Cổng Hoa Trắng Hoàng Gia',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'champagne-silk',
    name: 'Lụa Champagne Ánh Kim',
    url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'emerald-garden',
    name: 'Vườn Lá Lục Bảo Sương Mai',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'sakura-blush',
    name: 'Hoa Anh Đào Nắng Sớm',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'midnight-bokeh',
    name: 'Dạ Tiệc Pha Lê Ánh Vàng',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'moonlight-mist',
    name: 'Sương Đêm Đại Dương',
    url: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=82',
  },
  {
    id: 'terracotta-sunset',
    name: 'Hoàng Hôn Cổ Điển Vintage',
    url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=82',
  },
];

export function resolveBackdropUrl(idOrUrl) {
  if (!idOrUrl || idOrUrl === 'none') return '';
  if (
    idOrUrl.startsWith('http')
    || idOrUrl.startsWith('data:')
    || idOrUrl.startsWith('data/')
    || idOrUrl.startsWith('/api?')
    || idOrUrl.startsWith('/')
  ) {
    return idOrUrl;
  }
  const preset = COVER_BACKDROPS.find(b => b.id === idOrUrl);
  return preset ? preset.url : COVER_BACKDROPS[0].url;
}

/**
 * Hoa văn khắc nét Botanical Copperplate tinh xảo (khắc nét mảnh sang trọng chuẩn thiệp ép kim Châu Âu,
 * không dùng các hình tròn elip thô sơ).
 */
export function getBotanicalSpraySvg(variant = 'left') {
  const flip = variant === 'right' ? 'transform: scaleX(-1);' : '';
  return `
  <svg class="art-floral-spray art-floral-${variant}" style="${flip}" viewBox="0 0 180 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Thân dây chính thanh mảnh -->
      <path d="M36 306 C42 238, 66 174, 114 96 C132 66, 148 40, 162 18" stroke-width="1.15" opacity="0.72"/>
      <path d="M54 222 C84 188, 116 164, 148 144" stroke-width="0.95" opacity="0.58"/>
      <path d="M72 162 C64 122, 60 88, 64 52" stroke-width="0.9" opacity="0.55"/>
      <!-- Lá nguyệt quế khắc mảnh kèm gân lá -->
      <path d="M84 134 C66 118, 64 96, 80 88 C92 102, 92 120, 84 134Z" fill="currentColor" fill-opacity="0.11" stroke-width="0.95"/>
      <path d="M84 134 L80 96" stroke-width="0.6" opacity="0.6"/>
      <path d="M108 104 C104 82, 116 64, 134 68 C132 86, 122 98, 108 104Z" fill="currentColor" fill-opacity="0.11" stroke-width="0.95"/>
      <path d="M108 104 L128 74" stroke-width="0.6" opacity="0.6"/>
      <path d="M126 76 C126 56, 138 42, 154 48 C150 64, 138 74, 126 76Z" fill="currentColor" fill-opacity="0.1" stroke-width="0.9"/>
      <path d="M68 188 C42 180, 30 162, 44 148 C62 156, 70 172, 68 188Z" fill="currentColor" fill-opacity="0.12" stroke-width="0.95"/>
      <path d="M68 188 L48 156" stroke-width="0.6" opacity="0.6"/>
      <path d="M98 178 C114 162, 136 162, 142 178 C124 186, 110 186, 98 178Z" fill="currentColor" fill-opacity="0.1" stroke-width="0.9"/>
      <path d="M52 252 C28 248, 20 232, 34 218 C50 226, 56 238, 52 252Z" fill="currentColor" fill-opacity="0.12" stroke-width="0.95"/>
      <path d="M74 256 C96 244, 118 250, 120 266 C100 270, 84 266, 74 256Z" fill="currentColor" fill-opacity="0.1" stroke-width="0.9"/>
      <!-- Bông hoa khắc nét đồng (Line-art Rose) -->
      <g transform="translate(86, 204)">
        <path d="M0 -24 C14 -24, 24 -12, 22 2 C20 16, 6 24, -8 21 C-20 18, -26 4, -21 -10 C-16 -20, -8 -24, 0 -24Z" fill="currentColor" fill-opacity="0.09" stroke-width="1"/>
        <path d="M-12 -14 C0 -20, 16 -12, 15 2 C14 12, 2 18, -9 13 C-17 9, -18 -5, -10 -12" stroke-width="0.9"/>
        <path d="M-5 -8 C3 -12, 10 -6, 9 2 C8 8, -1 11, -6 6 C-10 2, -7 -5, 0 -5 C4 -5, 5 0, 1 2" stroke-width="0.85"/>
      </g>
      <!-- Nụ hoa nhỏ & hạt sương -->
      <circle cx="162" cy="18" r="2.6" fill="currentColor" opacity="0.68"/>
      <circle cx="152" cy="30" r="2" fill="currentColor" opacity="0.5"/>
      <circle cx="64" cy="52" r="2.4" fill="currentColor" opacity="0.6"/>
      <circle cx="72" cy="64" r="1.8" fill="currentColor" opacity="0.45"/>
      <circle cx="148" cy="144" r="2.2" fill="currentColor" opacity="0.55"/>
    </g>
  </svg>`;
}

/**
 * Khung Hoa Văn Ép Kim Bìa Thiệp (Ornate Filigree Cover Frame — 4 góc cuộn Baroque + khung vòm + huy hiệu đỉnh)
 * Phủ trực tiếp lên bìa thiệp & poster mẫu giúp bìa sang trọng gấp nhiều lần!
 */
export function getCoverFiligreeFrameSvg(ornamentStyle = 'botanical-peony') {
  const topCrown = ornamentStyle === 'song-hy'
    ? `<circle cx="200" cy="36" r="18" stroke="currentColor" stroke-width="1.1" fill="currentColor" fill-opacity="0.08"/>
       <text x="200" y="42" text-anchor="middle" fill="currentColor" font-size="16" font-weight="700" font-family="serif">囍</text>`
    : `<path d="M174 36 C184 36, 192 28, 200 20 C208 28, 216 36, 226 36 C216 36, 208 42, 200 48 C192 42, 184 36, 174 36 Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1"/>
       <circle cx="200" cy="34" r="3" fill="currentColor"/>
       <path d="M138 36 C152 30, 162 30, 172 36 M228 36 C238 30, 248 30, 262 36" stroke="currentColor" stroke-width="0.9" opacity="0.72"/>`;

  return `
  <svg class="art-cover-filigree" viewBox="0 0 400 540" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- Khung đôi mảnh ép kim -->
    <rect x="12" y="12" width="376" height="516" rx="8" stroke="currentColor" stroke-width="1" opacity="0.52"/>
    <rect x="20" y="20" width="360" height="500" rx="5" stroke="currentColor" stroke-width="0.65" opacity="0.34"/>
    <!-- Đường vòm cổ điển bên trong (giữ khoảng trống an toàn cho nút Mở thiệp) -->
    <path d="M32 518 V128 C32 62, 106 34, 200 34 C294 34, 368 62, 368 128 V518 Z" stroke="currentColor" stroke-width="0.72" opacity="0.38"/>

    <!-- Hoa văn cuộn 4 góc tinh xảo -->
    <g stroke="currentColor" stroke-width="1.15" opacity="0.78">
      <!-- Trên trái -->
      <path d="M12 72 C12 32, 32 12, 72 12"/>
      <path d="M20 56 C22 34, 34 22, 56 20"/>
      <path d="M24 24 C36 24, 42 30, 42 42 C30 42, 24 36, 24 24 Z" fill="currentColor" fill-opacity="0.16"/>
      <circle cx="46" cy="46" r="2" fill="currentColor"/>
      <!-- Trên phải -->
      <path d="M388 72 C388 32, 368 12, 328 12"/>
      <path d="M380 56 C378 34, 366 22, 344 20"/>
      <path d="M376 24 C364 24, 358 30, 358 42 C370 42, 376 36, 376 24 Z" fill="currentColor" fill-opacity="0.16"/>
      <circle cx="354" cy="46" r="2" fill="currentColor"/>
      <!-- Dưới trái -->
      <path d="M12 468 C12 508, 32 528, 72 528"/>
      <path d="M20 484 C22 506, 34 518, 56 520"/>
      <path d="M24 516 C36 516, 42 510, 42 498 C30 498, 24 504, 24 516 Z" fill="currentColor" fill-opacity="0.16"/>
      <circle cx="46" cy="494" r="2" fill="currentColor"/>
      <!-- Dưới phải -->
      <path d="M388 468 C388 508, 368 528, 328 528"/>
      <path d="M380 484 C378 506, 366 518, 344 520"/>
      <path d="M376 516 C364 516, 358 510, 358 498 C370 498, 376 504, 376 516 Z" fill="currentColor" fill-opacity="0.16"/>
      <circle cx="354" cy="494" r="2" fill="currentColor"/>
    </g>

    <!-- Huy hiệu trung tâm đỉnh & chân khung (hạ thấp sát viền dưới để không chạm nút CTA) -->
    ${topCrown}
    <g stroke="currentColor" stroke-width="0.9" opacity="0.62">
      <line x1="132" y1="518" x2="186" y2="518"/>
      <polygon points="200,513 207,518 200,523 193,518" fill="currentColor" fill-opacity="0.38"/>
      <line x1="214" y1="518" x2="268" y2="518"/>
    </g>
  </svg>`;
}

/**
 * Nền khắc đồng kiến trúc Cung Điện Tân Cổ Điển
 */
export function getPalaceEtchingSvg() {
  return `
  <svg class="art-palace-etching" viewBox="0 0 800 520" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g stroke="currentColor" stroke-width="0.8" opacity="0.22">
      <path d="M310 155 C310 82, 490 82, 490 155"/>
      <path d="M342 155 C342 98, 458 98, 458 155"/>
      <line x1="400" y1="54" x2="400" y2="85"/>
      <circle cx="400" cy="86" r="10"/>
      <rect x="300" y="155" width="200" height="22"/>
      <polygon points="240,215 400,145 560,215"/>
      <polygon points="262,210 400,154 538,210"/>
      <rect x="220" y="215" width="360" height="16"/>
      <rect x="70" y="231" width="660" height="14"/>
      <line x1="252" y1="245" x2="252" y2="430"/><line x1="266" y1="245" x2="266" y2="430"/>
      <line x1="312" y1="245" x2="312" y2="430"/><line x1="326" y1="245" x2="326" y2="430"/>
      <line x1="474" y1="245" x2="474" y2="430"/><line x1="488" y1="245" x2="488" y2="430"/>
      <line x1="534" y1="245" x2="534" y2="430"/><line x1="548" y1="245" x2="548" y2="430"/>
      <path d="M352 430 V310 C352 272, 448 272, 448 310 V430"/>
      <path d="M364 430 V316 C364 286, 436 286, 436 316 V430"/>
      <rect x="85" y="245" width="135" height="185"/>
      <rect x="580" y="245" width="135" height="185"/>
      <path d="M115 415 V315 C115 292, 155 292, 155 315 V415"/>
      <path d="M170 415 V315 C170 292, 204 292, 204 315 V415"/>
      <path d="M596 415 V315 C596 292, 630 292, 630 315 V415"/>
      <path d="M645 415 V315 C645 292, 685 292, 685 315 V415"/>
      <line x1="40" y1="430" x2="760" y2="430"/>
      <line x1="25" y1="448" x2="775" y2="448"/>
      <line x1="10" y1="468" x2="790" y2="468"/>
      <line x1="0" y1="490" x2="800" y2="490"/>
    </g>
  </svg>`;
}

/**
 * Con dấu sáp vàng ánh kim 3D dập nổi
 */
export function getWaxSealSvg(symbol = 'heart') {
  const centerMark = symbol === 'song-hy'
    ? `<text x="50" y="61" text-anchor="middle" fill="#6b440a" font-size="30" font-weight="700" font-family="serif">囍</text>`
    : `<path d="M50 66 C48 64, 34 54, 34 44 C34 38, 39 34, 44.5 34 C47.5 34, 49.4 35.8, 50 37.6 C50.6 35.8, 52.5 34, 55.5 34 C61 34, 66 38, 66 44 C66 54, 52 64, 50 66 Z" fill="none" stroke="#6f470c" stroke-width="2.5" stroke-linejoin="round"/>
       <path d="M50 64.5 C48.4 63, 36 53.6, 36 44.5 C36 39.5, 40 36, 44.5 36 C47.3 36, 49.2 37.7, 50 39.4 C50.8 37.7, 52.7 36, 55.5 36 C60 36, 64 39.5, 64 44.5 C64 53.6, 51.6 63, 50 64.5 Z" fill="none" stroke="#fff0bf" stroke-width="0.9" opacity="0.65"/>`;

  return `
  <svg class="art-wax-seal" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="waxGoldOuter" cx="35%" cy="28%" r="72%">
        <stop offset="0%" stop-color="#f8e3a1"/>
        <stop offset="45%" stop-color="#d4a34a"/>
        <stop offset="82%" stop-color="#9e6d1f"/>
        <stop offset="100%" stop-color="#6e470c"/>
      </radialGradient>
      <radialGradient id="waxGoldInner" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#f2d584"/>
        <stop offset="62%" stop-color="#c39036"/>
        <stop offset="100%" stop-color="#8b5d16"/>
      </radialGradient>
    </defs>
    <path d="M50 5 C62 4, 75 9, 83 18 C92 27, 96 40, 95 53 C94 67, 87 80, 76 87 C65 95, 51 97, 37 94 C24 91, 13 83, 8 70 C3 57, 4 41, 11 28 C18 15, 35 6, 50 5 Z" fill="url(#waxGoldOuter)"/>
    <circle cx="50" cy="50" r="34" fill="url(#waxGoldInner)" stroke="#fceab2" stroke-width="1" stroke-opacity="0.55"/>
    <circle cx="50" cy="50" r="30.5" stroke="#7d500d" stroke-width="1.2" stroke-opacity="0.45"/>
    ${centerMark}
  </svg>`;
}

export function getFleuronDividerSvg() {
  return `
  <svg class="art-fleuron" viewBox="0 0 180 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="12" y1="10" x2="72" y2="10" stroke="currentColor" stroke-width="0.85" opacity="0.5"/>
    <path d="M90 4 C93 7, 96 9, 100 10 C96 11, 93 13, 90 16 C87 13, 84 11, 80 10 C84 9, 87 7, 90 4 Z" fill="currentColor" opacity="0.82"/>
    <line x1="108" y1="10" x2="168" y2="10" stroke="currentColor" stroke-width="0.85" opacity="0.5"/>
  </svg>`;
}
