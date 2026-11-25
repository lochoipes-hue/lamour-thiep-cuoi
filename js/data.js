/**
 * L'Amour Atelier — Kho Mẫu Thiết Kế Biên Tập, Phong Thủy Ngũ Hành, 12 Cung Hoàng Đạo,
 * Hoa Văn SVG & Bộ Dữ Liệu Gợi Ý (Chuẩn Thẩm Mỹ Chuyên Nghiệp — Không Emoji)
 */

import { EDITORIAL_SAMPLE_PHOTOS } from './artwork.js?v=14';
import { DEFAULT_CHATBOT_CONFIG } from './chatbot.js?v=14';

export const FONT_OPTIONS = [
  { id: 'Cormorant Garamond', label: 'Cormorant Garamond (Biên tập hoàng gia)', stack: "'Cormorant Garamond', Georgia, serif", kind: 'heading' },
  { id: 'Philosopher', label: 'Philosopher (Cổ điển thanh tao chuẩn Việt)', stack: "'Philosopher', Georgia, serif", kind: 'heading' },
  { id: 'Viaoda Libre', label: 'Viaoda Libre (Nghệ thuật sắc nét Việt Nam)', stack: "'Viaoda Libre', 'Cormorant Garamond', serif", kind: 'heading' },
  { id: 'Playfair Display', label: 'Playfair Display (Tạp chí sang trọng)', stack: "'Playfair Display', Georgia, serif", kind: 'heading' },
  { id: 'Lora', label: 'Lora (Văn học thanh lịch)', stack: "'Lora', Georgia, serif", kind: 'body' },
  { id: 'Dancing Script', label: 'Dancing Script (Thư pháp mềm tự nhiên)', stack: "'Dancing Script', cursive", kind: 'script' },
  { id: 'Great Vibes', label: 'Great Vibes (Chữ ký bay bổng)', stack: "'Great Vibes', cursive", kind: 'script' },
  { id: 'Alex Brush', label: 'Alex Brush (Cọ mảnh lãng mạn)', stack: "'Alex Brush', cursive", kind: 'script' },
  { id: 'Pattaya', label: 'Pattaya (Nét bút mềm cổ điển)', stack: "'Pattaya', cursive", kind: 'script' },
  { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro (Hiện đại rõ dấu Việt)', stack: "'Be Vietnam Pro', sans-serif", kind: 'body' },
  { id: 'Montserrat', label: 'Montserrat (Tối giản tinh gọn)', stack: "'Montserrat', sans-serif", kind: 'body' },
];

export const TEXTURE_OPTIONS = [
  { id: 'parchment', label: 'Giấy mỹ thuật & Khắc đồng cung điện' },
  { id: 'paper', label: 'Giấy cotton ép vân nhẹ' },
  { id: 'silk', label: 'Lụa satin ánh ngọc trai' },
  { id: 'marble', label: 'Vân đá cẩm thạch thanh khiết' },
  { id: 'gold-dust', label: 'Ánh nhũ kim tuyến sang trọng' },
  { id: 'linen', label: 'Vải lanh mộc cổ điển' },
  { id: 'none', label: 'Nền trơn tối giản' },
];

export const INTRO_MODES = [
  { id: 'chungdoi-floral', label: 'Thiệp Hoa Phủ Nhung (Signature)', desc: 'Nền nhung sâu tim vàng bay, thiệp kem kèm 2 chùm hoa nở tản ra khi chạm mở' },
  { id: 'envelope-3d', label: 'Phong Bì Nhung Dấu Sáp 3D', desc: 'Chạm dấu sáp vàng nổi, nắp phong bì bật mở 3D và thiệp trượt lên kèm mưa cánh hoa' },
  { id: 'gatefold-3d', label: 'Thiệp Gấp Đôi Cánh Bướm 3D', desc: 'Hai cánh bìa cứng ép kim mở sang hai bên như cầm tấm thiệp in cao cấp thật' },
  { id: 'palace-doors', label: 'Cánh Cổng Hoàng Cung Mở Đôi', desc: 'Hai cánh cửa chạm khắc trượt mở kèm tia sáng vàng ấm lan tỏa' },
  { id: 'silk-curtain', label: 'Màn Lụa Chuyển Cảnh Điện Ảnh', desc: 'Màn lụa mềm kéo lên nhẹ nhàng kết hợp đốm sáng bokeh lãng mạn' },
];

export const READING_MODES = [
  { id: 'scroll-parallax', label: 'Cuộn dọc Parallax & Hiện khối nghệ thuật', desc: 'Kéo xuống mượt mà, nền cung điện trượt sâu, hoa lay nhẹ và từng khối xuất hiện tinh tế' },
  { id: 'book-flip-3d', label: 'Lật trang sách 3D có gáy sách', desc: 'Vuốt ngang hoặc bấm chuyển trang với hiệu ứng lật giấy 3D & bóng đổ gáy sách' },
  { id: 'stacked-cards', label: 'Xấp thiệp mỹ thuật xếp chồng', desc: 'Các tờ thiệp trượt xếp lớp lên nhau khi cuộn xuống như cầm bộ thiệp thật' },
  { id: 'cinematic-slides', label: 'Trình chiếu điện ảnh từng trang', desc: 'Chuyển cảnh mượt mà từng phần kèm thanh điều hướng tinh gọn' },
];

export const SCROLL_FX_MODES = [
  { id: 'cinematic-rise', label: 'Nổi mượt + Lấy nét (Cinematic)' },
  { id: 'unfold-3d', label: 'Gấp mở giấy 3D theo cuộn' },
  { id: 'curtain-bloom', label: 'Mở màn ảnh & Bung hoa hai bên' },
  { id: 'gentle-fade', label: 'Chuyển mờ tối giản (Tạp chí)' },
];

export const PARTICLE_EFFECTS = [
  { id: 'burgundy-petals', label: 'Cánh hoa hồng nhung & kem xoay 3D' },
  { id: 'sakura', label: 'Cánh hoa anh đào hồng phấn theo gió' },
  { id: 'hearts', label: 'Trái tim vàng kim & đỏ rượu bay nhẹ' },
  { id: 'gold-bokeh', label: 'Bụi vàng ánh kim & Bokeh điện ảnh' },
  { id: 'olive-leaves', label: 'Lá nguyệt quế & lá vàng mùa thu' },
  { id: 'white-feathers', label: 'Lông vũ trắng bồng bềnh nhẹ nhàng' },
  { id: 'champagne-confetti', label: 'Ruy-băng & kim tuyến vàng Champagne' },
  { id: 'snow', label: 'Tuyết rơi mịn đa lớp chiều sâu' },
  { id: 'fireflies', label: 'Đom đóm & ánh sáng đêm lãng mạn' },
  { id: 'none', label: 'Tắt hiệu ứng rơi' },
];

export const MUSIC_TRACKS = [
  { id: 'canon-d', label: 'Canon in D — Piano & Dây cổ điển', style: 'Lãng mạn', builtin: true },
  { id: 'wedding-box', label: 'Hộp Nhạc Lễ Cưới — Music Box', style: 'Êm dịu', builtin: true },
  { id: 'romantic-waltz', label: 'Vũ Điệu Tình Yêu — Waltz & Harp', style: 'Sang trọng', builtin: true },
  { id: 'moonlight', label: 'Ánh Trăng Hẹn Ước — Ambient Piano', style: 'Sâu lắng', builtin: true },
  { id: 'xuan-hy', label: 'Xuân Hỷ Đôi Lứa — Ngũ Cung Đàn Tranh', style: 'Á Đông', builtin: true },
  { id: 'custom', label: 'Tự tải file MP3 / Dán link nhạc riêng', style: 'Tùy chỉnh', builtin: false },
];

export const ORNAMENT_STYLES = [
  { id: 'botanical-peony', label: 'Hoa Mẫu Đơn Màu Nước & Khung Mảnh', category: 'Biên tập' },
  { id: 'song-hy', label: 'Song Hỷ Á Đông & Viền Cổ Điển', category: 'Truyền thống' },
  { id: 'royal-baroque', label: 'Hoàng Gia Baroque Ép Kim', category: 'Hoàng gia' },
  { id: 'floral-wreath', label: 'Vòng Hoa Lá Mềm Mại', category: 'Lãng mạn' },
  { id: 'art-deco', label: 'Hình Học Art Deco Gatsby', category: 'Sang trọng' },
  { id: 'cathedral-arch', label: 'Khung Cổng Vòm Châu Âu', category: 'Hiện đại' },
  { id: 'minimal-fine', label: 'Viền Đôi Tối Giản Tinh Tế', category: 'Tối giản' },
];

export const VIET_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank (Quân Đội)' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'TIMO', name: 'Timo Digital Bank' },
];

export const SECTION_CATALOG = [
  { type: 'hero', label: 'Phong Bì & Bìa Chính', iconName: 'mailOpen', desc: 'Phong bì nhung mở, ảnh bìa nghiêng tinh tế & lời mời đích danh' },
  { type: 'quote', label: 'Gia Đình Hai Họ & Lễ Cưới', iconName: 'heart', desc: 'Khối đối lập kiến trúc gồm thông tin phụ huynh, tên cặp đôi & giờ lễ' },
  { type: 'gallery', label: 'Album Ảnh Coverflow 3D', iconName: 'image', desc: 'Trình chiếu ảnh cưới 3D nghiêng chiều sâu kèm phóng to Lightbox' },
  { type: 'countdown', label: 'Tiệc Cưới, Đếm Ngược & Lịch', iconName: 'calendar', desc: 'Khối tiệc cưới nổi bật, đồng hồ đếm ngược & tờ lịch khoanh trái tim' },
  { type: 'events', label: 'Lịch Trình & Bản Đồ Chỉ Đường', iconName: 'mapPin', desc: 'Địa điểm tổ chức Lễ Gia Tiên, Tiệc Cưới & nút chỉ đường Google Maps' },
  { type: 'story', label: 'Câu Chuyện Tình Yêu', iconName: 'bookOpen', desc: 'Dòng thời gian những cột mốc đáng nhớ của hai người' },
  { type: 'gift', label: 'Hộp Mừng Cưới VietQR', iconName: 'gift', desc: 'Mã QR ngân hàng tự động cho Cô Dâu & Chú Rể kèm sao chép STK' },
  { type: 'rsvp', label: 'Xác Nhận Tham Dự & Câu Hỏi', iconName: 'clipboard', desc: 'Thẻ kính mờ sang trọng cho khách xác nhận & điền thông tin yêu cầu' },
  { type: 'guestbook', label: 'Sổ Lưu Bút Lời Chúc', iconName: 'message', desc: 'Thẻ giấy mỹ thuật gửi lời chúc kèm nút gợi ý & danh sách lời chúc' },
  { type: 'footer', label: 'Lời Cảm Ơn Kết Thiệp', iconName: 'sparkles', desc: 'Lời cảm ơn trang trọng khép lại tấm thiệp cưới' },
];

/**
 * SVG Hairline Corner & Divider Ornaments (tinh gọn, không rườm rà)
 */
export function getOrnamentCornerSvg(style) {
  switch (style) {
    case 'song-hy':
      return `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H42V10H10V42H4V4Z" fill="currentColor" opacity="0.82"/>
        <path d="M14 14H32V19H19V32H14V14Z" fill="currentColor" opacity="0.52"/>
        <path d="M4 48C14 48 19 41 19 32M48 4C48 14 41 19 32 19" stroke="currentColor" stroke-width="1.4"/>
      </svg>`;
    case 'art-deco':
      return `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H60M4 4V60M11 11H44M11 11V44" stroke="currentColor" stroke-width="1.25"/>
        <rect x="14" y="14" width="10" height="10" transform="rotate(45 19 19)" stroke="currentColor" stroke-width="1.15"/>
      </svg>`;
    case 'cathedral-arch':
      return `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 66V32C5 16 16 5 32 5H66" stroke="currentColor" stroke-width="1.3"/>
        <path d="M12 66V36C12 22 22 12 36 12H66" stroke="currentColor" stroke-width="0.85" opacity="0.55"/>
      </svg>`;
    case 'minimal-fine':
    case 'botanical-peony':
      return `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 34V6H34" stroke="currentColor" stroke-width="1.1" opacity="0.65"/>
      </svg>`;
    case 'floral-wreath':
      return `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 62C8 36 18 16 62 6" stroke="currentColor" stroke-width="1.2" opacity="0.72"/>
        <path d="M18 40C10 35 10 25 20 24C24 31 23 37 18 40Z" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="1"/>
        <path d="M40 18C35 10 25 10 24 20C31 24 37 23 40 18Z" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="1"/>
      </svg>`;
    case 'royal-baroque':
    default:
      return `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 60V16C5 9 9 5 16 5H60" stroke="currentColor" stroke-width="1.25"/>
        <path d="M12 48C12 28 18 12 48 12" stroke="currentColor" stroke-width="0.9" opacity="0.65"/>
        <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.75"/>
      </svg>`;
  }
}

export function getOrnamentDividerSvg(style) {
  if (style === 'song-hy') {
    return `<svg class="inv-divider-svg" viewBox="0 0 220 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="15" x2="84" y2="15" stroke="currentColor" stroke-width="0.9" opacity="0.55"/>
      <rect x="96" y="3" width="28" height="24" rx="4" stroke="currentColor" stroke-width="1.15"/>
      <text x="110" y="20" text-anchor="middle" fill="currentColor" font-size="15" font-weight="700">囍</text>
      <line x1="136" y1="15" x2="210" y2="15" stroke="currentColor" stroke-width="0.9" opacity="0.55"/>
    </svg>`;
  }
  return `<svg class="inv-divider-svg" viewBox="0 0 220 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="10" x2="94" y2="10" stroke="currentColor" stroke-width="0.85" opacity="0.48"/>
    <path d="M110 4C112.5 7 115 9 118 10C115 11 112.5 13 110 16C107.5 13 105 11 102 10C105 9 107.5 7 110 4Z" fill="currentColor" opacity="0.82"/>
    <line x1="126" y1="10" x2="204" y2="10" stroke="currentColor" stroke-width="0.85" opacity="0.48"/>
  </svg>`;
}

export function getCrestBadgeSvg(style, initials = 'M & N') {
  if (style === 'song-hy') {
    return `<svg class="inv-crest-svg" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="44" cy="44" r="38" stroke="currentColor" stroke-width="1.2" opacity="0.85"/>
      <circle cx="44" cy="44" r="32" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2.5 3" opacity="0.55"/>
      <text x="44" y="56" text-anchor="middle" fill="currentColor" font-size="34" font-weight="700">囍</text>
    </svg>`;
  }
  return `<svg class="inv-crest-svg" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="1.05" opacity="0.72"/>
    <circle cx="48" cy="48" r="34" stroke="currentColor" stroke-width="0.7" opacity="0.4"/>
    <text x="48" y="54" text-anchor="middle" fill="currentColor" font-size="18" font-family="'Viaoda Libre', serif" letter-spacing="2">${initials}</text>
  </svg>`;
}

/**
 * 10 MẪU THIỆP BIÊN TẬP CAO CẤP (Chuẩn thẩm mỹ Studio thật — mỗi mẫu có posterStyle riêng cho Showroom)
 */
export const TEMPLATES = [
  {
    id: 'nhung-do-co-dien',
    name: 'Nhung Đỏ Cung Điện',
    category: 'Cổ điển',
    tag: 'Hot',
    posterStyle: 'envelope',
    elements: ['Hỏa', 'Thổ'],
    desc: 'Giấy kem mỹ thuật khắc đồng cung điện đối lập khối đỏ rượu vang sâu & hoa mẫu đơn màu nước.',
    design: {
      bgMode: 'solid',
      bgColor: '#FFF7EB',
      bgGradient1: '#FFF9F0',
      bgGradient2: '#FAF0E1',
      bgGradient3: '#F2E4CE',
      bgAngle: 165,
      surfaceColor: '#FDF7F0',
      contrastBg: '#511419',
      contrastText: '#FDF7F0',
      textColor: '#3B181B',
      mutedColor: '#7E575A',
      primaryColor: '#511419',
      secondaryColor: '#C59A57',
      ornamentColor: '#8B5A3C',
      buttonColor: '#511419',
      buttonTextColor: '#FFF8F0',
      headingFont: 'Viaoda Libre',
      scriptFont: 'Pattaya',
      bodyFont: 'Lora',
      ornamentStyle: 'botanical-peony',
      texture: 'parchment',
      borderRadius: 10,
      introMode: 'chungdoi-floral',
      readingMode: 'scroll-parallax',
      scrollFx: 'cinematic-rise',
      coverBackdrop: 'burgundy-roses',
      coverBlur: 5,
      coverOverlay: 0.56,
      coverPattern: true,
      particleEffect: 'burgundy-petals',
      particleDensity: 'medium',
      interactiveTrail: true,
      musicTrack: 'canon-d',
    },
  },
  {
    id: 'hy-su-son-vang',
    name: 'Hỷ Sự Son Vàng',
    category: 'Truyền thống',
    tag: 'Hot',
    posterStyle: 'crest',
    elements: ['Hỏa', 'Thổ'],
    desc: 'Đỏ son hoàng cung phối ánh kim vàng & huy hiệu Song Hỷ chuẩn lễ gia tiên Việt Nam.',
    design: {
      bgMode: 'gradient',
      bgColor: '#FFF6EE',
      bgGradient1: '#FFF9F2',
      bgGradient2: '#FBECE2',
      bgGradient3: '#F5DFD1',
      bgAngle: 150,
      surfaceColor: '#FFFDF9',
      contrastBg: '#8A151B',
      contrastText: '#FFF8EC',
      textColor: '#451517',
      mutedColor: '#834A4D',
      primaryColor: '#8F161D',
      secondaryColor: '#C9963B',
      ornamentColor: '#B8842E',
      buttonColor: '#8A151B',
      buttonTextColor: '#FFF8EC',
      headingFont: 'Viaoda Libre',
      scriptFont: 'Great Vibes',
      bodyFont: 'Lora',
      ornamentStyle: 'song-hy',
      texture: 'parchment',
      borderRadius: 10,
      introMode: 'palace-doors',
      readingMode: 'scroll-parallax',
      scrollFx: 'unfold-3d',
      coverBackdrop: 'burgundy-roses',
      coverBlur: 6,
      coverOverlay: 0.62,
      coverPattern: true,
      particleEffect: 'burgundy-petals',
      particleDensity: 'medium',
      interactiveTrail: true,
      musicTrack: 'xuan-hy',
    },
  },
  {
    id: 'bach-ngoc-hoang-gia',
    name: 'Bạch Ngọc Hoàng Gia',
    category: 'Hoàng gia',
    tag: 'Mới',
    posterStyle: 'polaroid',
    elements: ['Kim', 'Thủy'],
    desc: 'Trắng kem ngọc trai phối vàng champagne, khung ảnh Polaroid dán băng keo vàng & dấu sáp.',
    design: {
      bgMode: 'gradient',
      bgColor: '#FCFBF8',
      bgGradient1: '#FFFFFF',
      bgGradient2: '#F7F2E7',
      bgGradient3: '#EFE6D2',
      bgAngle: 160,
      surfaceColor: '#FFFFFF',
      contrastBg: '#3D3122',
      contrastText: '#FDF9F1',
      textColor: '#2E261E',
      mutedColor: '#766856',
      primaryColor: '#8F6B2E',
      secondaryColor: '#C9AE74',
      ornamentColor: '#A98542',
      buttonColor: '#7D5C25',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Cormorant Garamond',
      scriptFont: 'Alex Brush',
      bodyFont: 'Lora',
      ornamentStyle: 'royal-baroque',
      texture: 'paper',
      borderRadius: 12,
      introMode: 'envelope-3d',
      readingMode: 'book-flip-3d',
      scrollFx: 'cinematic-rise',
      coverBackdrop: 'champagne-silk',
      coverBlur: 5,
      coverOverlay: 0.45,
      coverPattern: true,
      particleEffect: 'gold-bokeh',
      particleDensity: 'medium',
      interactiveTrail: true,
      musicTrack: 'canon-d',
    },
  },
  {
    id: 'ngoc-luc-bao',
    name: 'Song Hỷ Lục Bảo',
    category: 'Thiên nhiên',
    tag: 'Hot',
    posterStyle: 'arch',
    elements: ['Mộc', 'Hỏa'],
    desc: 'Xanh rừng sâu thanh quý phối vòm ảnh cưới & chữ Song Hỷ ánh vàng đồng cổ điển.',
    design: {
      bgMode: 'gradient',
      bgColor: '#F5F7F2',
      bgGradient1: '#FAFBF7',
      bgGradient2: '#ECEFE6',
      bgGradient3: '#DFE5D8',
      bgAngle: 155,
      surfaceColor: '#FFFFFF',
      contrastBg: '#163626',
      contrastText: '#F4F1E8',
      textColor: '#1B3025',
      mutedColor: '#566C60',
      primaryColor: '#18422E',
      secondaryColor: '#BFA05E',
      ornamentColor: '#8C7444',
      buttonColor: '#163626',
      buttonTextColor: '#F8F4EA',
      headingFont: 'Viaoda Libre',
      scriptFont: 'Great Vibes',
      bodyFont: 'Lora',
      ornamentStyle: 'cathedral-arch',
      texture: 'parchment',
      borderRadius: 12,
      introMode: 'gatefold-3d',
      readingMode: 'scroll-parallax',
      scrollFx: 'curtain-bloom',
      coverBackdrop: 'emerald-garden',
      coverBlur: 5,
      coverOverlay: 0.54,
      coverPattern: true,
      particleEffect: 'olive-leaves',
      particleDensity: 'medium',
      interactiveTrail: true,
      musicTrack: 'romantic-waltz',
    },
  },
  {
    id: 'vuon-hoa-anh-dao',
    name: 'Hồng Phấn Sakura',
    category: 'Lãng mạn',
    tag: 'Mới',
    posterStyle: 'dual-frame',
    elements: ['Hỏa', 'Thổ'],
    desc: 'Hồng phấn sương mai chuyển sắc mềm mại, hai khung ảnh cưới đối xứng & cánh hoa đào bay.',
    design: {
      bgMode: 'gradient',
      bgColor: '#FFF7F9',
      bgGradient1: '#FFFBFC',
      bgGradient2: '#FCEBF0',
      bgGradient3: '#F6DCE4',
      bgAngle: 140,
      surfaceColor: '#FFFFFF',
      contrastBg: '#7A2844',
      contrastText: '#FFF8FA',
      textColor: '#43212D',
      mutedColor: '#845968',
      primaryColor: '#9E385A',
      secondaryColor: '#D697AB',
      ornamentColor: '#B5637E',
      buttonColor: '#8F3150',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Playfair Display',
      scriptFont: 'Dancing Script',
      bodyFont: 'Lora',
      ornamentStyle: 'floral-wreath',
      texture: 'silk',
      borderRadius: 14,
      introMode: 'chungdoi-floral',
      readingMode: 'scroll-parallax',
      scrollFx: 'cinematic-rise',
      coverBackdrop: 'sakura-blush',
      coverBlur: 4,
      coverOverlay: 0.48,
      coverPattern: true,
      particleEffect: 'sakura',
      particleDensity: 'high',
      interactiveTrail: true,
      musicTrack: 'wedding-box',
    },
  },
  {
    id: 'dai-duong-hoang-hon',
    name: 'Đại Dương Ánh Trăng',
    category: 'Hiện đại',
    tag: 'Hợp Thủy',
    posterStyle: 'arch',
    elements: ['Thủy', 'Mộc'],
    desc: 'Xanh navy quyền quý phối bạc ánh trăng trên nền vân đá thanh khiết & viền Art Deco.',
    design: {
      bgMode: 'gradient',
      bgColor: '#F3F6FA',
      bgGradient1: '#FAFCFF',
      bgGradient2: '#E9F0F8',
      bgGradient3: '#DAE5F2',
      bgAngle: 155,
      surfaceColor: '#FFFFFF',
      contrastBg: '#152B49',
      contrastText: '#F4F8FC',
      textColor: '#162840',
      mutedColor: '#526885',
      primaryColor: '#193C6B',
      secondaryColor: '#88A5C7',
      ornamentColor: '#486C96',
      buttonColor: '#152B49',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      bodyFont: 'Lora',
      ornamentStyle: 'art-deco',
      texture: 'marble',
      borderRadius: 10,
      introMode: 'silk-curtain',
      readingMode: 'scroll-parallax',
      scrollFx: 'unfold-3d',
      coverBackdrop: 'moonlight-mist',
      coverBlur: 5,
      coverOverlay: 0.56,
      coverPattern: true,
      particleEffect: 'snow',
      particleDensity: 'medium',
      interactiveTrail: true,
      musicTrack: 'moonlight',
    },
  },
  {
    id: 'co-dien-giay-kraft',
    name: 'Cổ Điển Terracotta',
    category: 'Vintage',
    tag: 'Hợp Thổ',
    posterStyle: 'polaroid',
    elements: ['Thổ', 'Kim'],
    desc: 'Nâu cam đất trầm ấm trên nền giấy lanh mộc vintage đậm chất điện ảnh hoài niệm.',
    design: {
      bgMode: 'gradient',
      bgColor: '#F9F3EC',
      bgGradient1: '#FCF8F2',
      bgGradient2: '#F2E5D6',
      bgGradient3: '#E7D4BF',
      bgAngle: 145,
      surfaceColor: '#FFFDF9',
      contrastBg: '#5C2E1E',
      contrastText: '#FDF7F0',
      textColor: '#3E261B',
      mutedColor: '#7B5E4D',
      primaryColor: '#8C4328',
      secondaryColor: '#C2925A',
      ornamentColor: '#9E6142',
      buttonColor: '#74351E',
      buttonTextColor: '#FFF9F2',
      headingFont: 'Viaoda Libre',
      scriptFont: 'Pattaya',
      bodyFont: 'Lora',
      ornamentStyle: 'botanical-peony',
      texture: 'linen',
      borderRadius: 10,
      introMode: 'envelope-3d',
      readingMode: 'book-flip-3d',
      scrollFx: 'unfold-3d',
      coverBackdrop: 'terracotta-sunset',
      coverBlur: 5,
      coverOverlay: 0.52,
      coverPattern: true,
      particleEffect: 'olive-leaves',
      particleDensity: 'low',
      interactiveTrail: true,
      musicTrack: 'romantic-waltz',
    },
  },
  {
    id: 'tim-lavender',
    name: 'Oải Hương Hoàng Hôn',
    category: 'Lãng mạn',
    tag: 'Tinh tế',
    posterStyle: 'envelope',
    elements: ['Hỏa', 'Thổ'],
    desc: 'Sắc tím mận & lavender sương mờ thanh nhã, kết hợp hiệu ứng trái tim bay dịu nhẹ.',
    design: {
      bgMode: 'gradient',
      bgColor: '#F8F5FA',
      bgGradient1: '#FCF9FF',
      bgGradient2: '#F0E7F7',
      bgGradient3: '#E5D8F0',
      bgAngle: 145,
      surfaceColor: '#FFFFFF',
      contrastBg: '#46265E',
      contrastText: '#FBF7FF',
      textColor: '#331E45',
      mutedColor: '#705A85',
      primaryColor: '#5D347D',
      secondaryColor: '#B893D6',
      ornamentColor: '#7A529B',
      buttonColor: '#4E2A6B',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Playfair Display',
      scriptFont: 'Alex Brush',
      bodyFont: 'Lora',
      ornamentStyle: 'floral-wreath',
      texture: 'silk',
      borderRadius: 14,
      introMode: 'chungdoi-floral',
      readingMode: 'scroll-parallax',
      scrollFx: 'cinematic-rise',
      coverBackdrop: 'ivory-floral-arch',
      coverBlur: 5,
      coverOverlay: 0.54,
      coverPattern: true,
      particleEffect: 'hearts',
      particleDensity: 'medium',
      interactiveTrail: true,
      musicTrack: 'wedding-box',
    },
  },
  {
    id: 'toi-gian-han-quoc',
    name: 'Tạp Chí Seoul Tối Giản',
    category: 'Tối giản',
    tag: 'Trend',
    posterStyle: 'dual-frame',
    elements: ['Kim', 'Thủy'],
    desc: 'Bố cục tạp chí Vogue/Seoul siêu thoáng, sắc trắng ngà – than chì sang trọng vượt thời gian.',
    design: {
      bgMode: 'solid',
      bgColor: '#F7F6F3',
      bgGradient1: '#FFFFFF',
      bgGradient2: '#F6F5F1',
      bgGradient3: '#ECEAE3',
      bgAngle: 180,
      surfaceColor: '#FFFFFF',
      contrastBg: '#1C1B19',
      contrastText: '#FAF9F6',
      textColor: '#1E1D1B',
      mutedColor: '#6D6A64',
      primaryColor: '#242320',
      secondaryColor: '#A89B88',
      ornamentColor: '#8B7F6E',
      buttonColor: '#1C1B19',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Cormorant Garamond',
      scriptFont: 'Alex Brush',
      bodyFont: 'Montserrat',
      ornamentStyle: 'minimal-fine',
      texture: 'paper',
      borderRadius: 6,
      introMode: 'silk-curtain',
      readingMode: 'cinematic-slides',
      scrollFx: 'gentle-fade',
      coverBackdrop: 'ivory-floral-arch',
      coverBlur: 6,
      coverOverlay: 0.44,
      coverPattern: true,
      particleEffect: 'white-feathers',
      particleDensity: 'low',
      interactiveTrail: false,
      musicTrack: 'canon-d',
    },
  },
  {
    id: 'anh-kim-pha-le',
    name: 'Dạ Tiệc Ánh Kim Đêm',
    category: 'Sang trọng',
    tag: 'VIP',
    posterStyle: 'crest',
    elements: ['Thủy', 'Kim'],
    desc: 'Nền nhung đen huyền bí phối vàng champagne ép kim & kim tuyến bokeh chuẩn tiệc cưới 5 sao.',
    design: {
      bgMode: 'gradient',
      bgColor: '#141218',
      bgGradient1: '#1C1922',
      bgGradient2: '#131117',
      bgGradient3: '#201A25',
      bgAngle: 150,
      surfaceColor: '#1E1A24',
      contrastBg: '#0E0C12',
      contrastText: '#F8EFE3',
      textColor: '#F4EBE0',
      mutedColor: '#B5A597',
      primaryColor: '#DFB374',
      secondaryColor: '#C8858E',
      ornamentColor: '#D6A969',
      buttonColor: '#CFA05C',
      buttonTextColor: '#16121A',
      headingFont: 'Viaoda Libre',
      scriptFont: 'Great Vibes',
      bodyFont: 'Lora',
      ornamentStyle: 'art-deco',
      texture: 'gold-dust',
      borderRadius: 10,
      introMode: 'palace-doors',
      readingMode: 'book-flip-3d',
      scrollFx: 'unfold-3d',
      coverBackdrop: 'midnight-bokeh',
      coverBlur: 4,
      coverOverlay: 0.58,
      coverPattern: true,
      particleEffect: 'gold-bokeh',
      particleDensity: 'high',
      interactiveTrail: true,
      musicTrack: 'moonlight',
    },
  },
  {
    id: 'trial-1d-lua-trang',
    name: 'Lụa Trắng Tối Giản (Dùng Thử 1 Ngày)',
    category: 'Dùng thử',
    tag: 'Dùng thử 1 ngày',
    isTrialTemplate: true,
    trialDays: 1,
    posterStyle: 'polaroid',
    elements: ['Kim', 'Thủy'],
    desc: 'Mẫu trải nghiệm miễn phí 24 giờ: tối đa 3 ảnh Album, có dải bản thử, khóa QR mừng cưới & nhạc MP3 riêng.',
    design: {
      bgMode: 'gradient',
      bgColor: '#FAF9F6',
      bgGradient1: '#FFFFFF',
      bgGradient2: '#F7F5F0',
      bgGradient3: '#EFECE5',
      bgAngle: 170,
      surfaceColor: '#FFFFFF',
      contrastBg: '#3D3532',
      contrastText: '#FDFBF7',
      textColor: '#2E2826',
      mutedColor: '#756C68',
      primaryColor: '#4A3F3B',
      secondaryColor: '#B89E72',
      ornamentColor: '#9E855E',
      buttonColor: '#4A3F3B',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Cormorant Garamond',
      scriptFont: 'Dancing Script',
      bodyFont: 'Be Vietnam Pro',
      ornamentStyle: 'minimal-fine',
      texture: 'silk',
      borderRadius: 10,
      introMode: 'silk-curtain',
      readingMode: 'scroll-parallax',
      scrollFx: 'gentle-fade',
      coverBackdrop: 'ivory-floral-arch',
      coverBlur: 6,
      coverOverlay: 0.45,
      coverPattern: true,
      particleEffect: 'white-feathers',
      particleDensity: 'low',
      interactiveTrail: false,
      musicTrack: 'canon-d',
    },
  },
  {
    id: 'trial-2d-hong-dao',
    name: 'Hồng Đào Nhẹ Nhàng (Dùng Thử 2 Ngày)',
    category: 'Dùng thử',
    tag: 'Dùng thử 2 ngày',
    isTrialTemplate: true,
    trialDays: 2,
    posterStyle: 'envelope',
    elements: ['Hỏa', 'Thổ'],
    desc: 'Mẫu trải nghiệm miễn phí 48 giờ: tối đa 5 ảnh Album, mở phong bì 3D, khóa Bao Lì Xì QR & link tên riêng.',
    design: {
      bgMode: 'gradient',
      bgColor: '#FFF9FB',
      bgGradient1: '#FFFCFD',
      bgGradient2: '#FCECF2',
      bgGradient3: '#F7DCE6',
      bgAngle: 155,
      surfaceColor: '#FFFFFF',
      contrastBg: '#7A2C46',
      contrastText: '#FFF8FA',
      textColor: '#47212E',
      mutedColor: '#875C6B',
      primaryColor: '#8C3351',
      secondaryColor: '#D49BA8',
      ornamentColor: '#B5637D',
      buttonColor: '#7A2C46',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Philosopher',
      scriptFont: 'Dancing Script',
      bodyFont: 'Lora',
      ornamentStyle: 'botanical-peony',
      texture: 'paper',
      borderRadius: 12,
      introMode: 'envelope-3d',
      readingMode: 'scroll-parallax',
      scrollFx: 'cinematic-rise',
      coverBackdrop: 'sakura-blush',
      coverBlur: 5,
      coverOverlay: 0.46,
      coverPattern: true,
      particleEffect: 'sakura-petals',
      particleDensity: 'low',
      interactiveTrail: false,
      musicTrack: 'wedding-box',
    },
  },
  {
    id: 'trial-3d-xanh-olive',
    name: 'Xanh Ô-Liu Sân Vườn (Dùng Thử 3 Ngày)',
    category: 'Dùng thử',
    tag: 'Dùng thử 3 ngày',
    isTrialTemplate: true,
    trialDays: 3,
    posterStyle: 'arch',
    elements: ['Mộc', 'Thủy'],
    desc: 'Mẫu trải nghiệm miễn phí 72 giờ: tối đa 6 ảnh Album, thiệp hoa 3D, khóa QR mừng cưới, câu hỏi riêng & nhạc MP3.',
    design: {
      bgMode: 'gradient',
      bgColor: '#F7F9F4',
      bgGradient1: '#FCFDFB',
      bgGradient2: '#EEF3E9',
      bgGradient3: '#E1EAD8',
      bgAngle: 160,
      surfaceColor: '#FFFFFF',
      contrastBg: '#2C422B',
      contrastText: '#F6F9F4',
      textColor: '#243323',
      mutedColor: '#5D705C',
      primaryColor: '#375436',
      secondaryColor: '#B89B67',
      ornamentColor: '#567554',
      buttonColor: '#2C422B',
      buttonTextColor: '#FFFFFF',
      headingFont: 'Philosopher',
      scriptFont: 'Great Vibes',
      bodyFont: 'Lora',
      ornamentStyle: 'botanical-peony',
      texture: 'linen',
      borderRadius: 12,
      introMode: 'chungdoi-floral',
      readingMode: 'scroll-parallax',
      scrollFx: 'cinematic-rise',
      coverBackdrop: 'emerald-garden',
      coverBlur: 5,
      coverOverlay: 0.52,
      coverPattern: true,
      particleEffect: 'green-leaves',
      particleDensity: 'low',
      interactiveTrail: false,
      musicTrack: 'river-flows',
    },
  },
];

export function buildTrialConfig(days = 1) {
  const d = Math.max(1, Math.min(7, Number(days) || 1));
  const now = Date.now();
  const maxPhotos = d <= 1 ? 3 : d === 2 ? 5 : 6;
  const maxGuests = d <= 1 ? 5 : d === 2 ? 10 : 15;
  return {
    enabled: true,
    days: d,
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + d * 86400000).toISOString(),
    limits: {
      maxPhotos,
      maxGuests,
      allowMusicChange: false,
      allowCustomRsvpFields: false,
      allowGiftQr: false,
      allowGuestPersonalLinks: false,
      allowSectionToggle: false,
    },
  };
}

export function getTrialState(inv) {
  if (!inv || inv.order?.status === 'paid' || !inv.trial?.enabled) {
    return { active: false, expired: false, days: 0, remainingMs: Infinity, remainingText: '', limits: null };
  }
  const expiresMs = new Date(inv.trial.expiresAt || 0).getTime();
  const remainingMs = Number.isFinite(expiresMs) ? expiresMs - Date.now() : 0;
  const expired = remainingMs <= 0;
  let remainingText = 'Đã hết hạn dùng thử';
  if (!expired) {
    const totalMins = Math.max(1, Math.ceil(remainingMs / 60000));
    const days = Math.floor(totalMins / 1440);
    const hours = Math.floor((totalMins % 1440) / 60);
    const mins = totalMins % 60;
    if (days > 0) remainingText = `Còn ${days} ngày ${hours} giờ`;
    else if (hours > 0) remainingText = `Còn ${hours} giờ ${mins} phút`;
    else remainingText = `Còn ${mins} phút`;
  }
  const d = Number(inv.trial.days || 1);
  const limits = {
    maxPhotos: d <= 1 ? 3 : d === 2 ? 5 : 6,
    maxGuests: d <= 1 ? 5 : d === 2 ? 10 : 15,
    allowMusicChange: false,
    allowCustomRsvpFields: false,
    allowGiftQr: false,
    allowGuestPersonalLinks: false,
    allowSectionToggle: false,
    ...(inv.trial.limits || {}),
  };
  return { active: true, expired, days: d, remainingMs, remainingText, expiresAt: inv.trial.expiresAt, limits };
}

/**
 * PHONG THỦY NGŨ HÀNH (Lục Thập Hoa Giáp chuẩn Can-Chi & Nạp Âm)
 */
const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];

export function calculateNguHanhByYear(year) {
  const y = parseInt(year, 10);
  if (!y || y < 1940 || y > 2030) return null;
  const canName = CAN[y % 10];
  const chiName = CHI[y % 12];
  const canValMap = { Giáp: 1, Ất: 1, Bính: 2, Đinh: 2, Mậu: 3, Kỷ: 3, Canh: 4, Tân: 4, Nhâm: 5, Quý: 5 };
  const chiValMap = { Tý: 0, Sửu: 0, Ngọ: 0, Mùi: 0, Dần: 1, Mão: 1, Thân: 1, Dậu: 1, Thìn: 2, Tỵ: 2, Tuất: 2, Hợi: 2 };
  let sum = canValMap[canName] + chiValMap[chiName];
  if (sum > 5) sum -= 5;
  const elementMap = { 1: 'Kim', 2: 'Thủy', 3: 'Hỏa', 4: 'Thổ', 5: 'Mộc' };
  return { year: y, canChi: `${canName} ${chiName}`, element: elementMap[sum] };
}

export const NGU_HANH_DATA = {
  Kim: {
    name: 'Mệnh Kim',
    swatch: '#C5A25A',
    tuongSinh: 'Thổ sinh Kim (Vàng champagne, Nâu kem, Trắng ngọc trai, Bạc ánh kim)',
    avoid: 'Đỏ rực, Hồng đậm, Cam chói (Hỏa khắc Kim)',
    meaning: 'Tượng trưng cho sự tinh khiết, bền vững và phú quý viên mãn.',
    palettes: [
      {
        name: 'Bạch Ngọc & Vàng Champagne',
        desc: 'Trắng ngà bản mệnh phối vàng ánh kim Thổ sinh Kim thanh lịch.',
        colors: { bgGradient1: '#FFFFFF', bgGradient2: '#F7F1E3', bgGradient3: '#EAE0C8', surfaceColor: '#FFFFFF', contrastBg: '#3D3122', contrastText: '#FDF9F1', textColor: '#2E261C', mutedColor: '#766957', primaryColor: '#96712E', secondaryColor: '#D4B97E', ornamentColor: '#B28C43', buttonColor: '#876427', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Bạc Ngọc Trai & Xám Sương',
        desc: 'Tối giản hiện đại với sắc bạc ánh kim và nền trắng mịn.',
        colors: { bgGradient1: '#FAFBFC', bgGradient2: '#EDF0F4', bgGradient3: '#DEE4EC', surfaceColor: '#FFFFFF', contrastBg: '#27313D', contrastText: '#F5F7FA', textColor: '#222831', mutedColor: '#616C7A', primaryColor: '#455466', secondaryColor: '#B1BCC8', ornamentColor: '#738294', buttonColor: '#364354', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Vàng Mật Ong & Kem Sữa (Thổ sinh Kim)',
        desc: 'Tông vàng nâu ấm áp mang lại vượng khí tài lộc bền lâu.',
        colors: { bgGradient1: '#FFFDF8', bgGradient2: '#F8EDD9', bgGradient3: '#EBD9B7', surfaceColor: '#FFFFFF', contrastBg: '#4E391B', contrastText: '#FFF8EB', textColor: '#3D2E1B', mutedColor: '#7D674B', primaryColor: '#9E6E22', secondaryColor: '#D4A85B', ornamentColor: '#B38232', buttonColor: '#8B5F1B', buttonTextColor: '#FFFFFF' },
      },
    ],
  },
  Mộc: {
    name: 'Mệnh Mộc',
    swatch: '#1F6346',
    tuongSinh: 'Thủy sinh Mộc (Xanh lục bảo, Xanh olive, Xanh navy, Xanh ngọc)',
    avoid: 'Trắng ánh bạc thuần, Xám kim loại (Kim khắc Mộc)',
    meaning: 'Biểu trưng cho sức sống căng tràn, sinh sôi nảy nở và gia đạo sum vầy.',
    palettes: [
      {
        name: 'Lục Bảo Hoàng Gia & Lá Vàng',
        desc: 'Xanh rừng sâu phối vàng đồng chuẩn tiệc cưới sân vườn.',
        colors: { bgGradient1: '#F8FBF8', bgGradient2: '#E6F1E9', bgGradient3: '#D5E5DA', surfaceColor: '#FFFFFF', contrastBg: '#163827', contrastText: '#F5F2E9', textColor: '#193527', mutedColor: '#4D6E5D', primaryColor: '#1A593E', secondaryColor: '#BFA059', ornamentColor: '#2B6E50', buttonColor: '#163827', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Xanh Biển Thủy Sinh Mộc',
        desc: 'Xanh dương dịu kết hợp xanh ngọc giúp gia đạo êm ấm.',
        colors: { bgGradient1: '#F4FAF9', bgGradient2: '#E0F1EE', bgGradient3: '#CEE3ED', surfaceColor: '#FFFFFF', contrastBg: '#123A45', contrastText: '#F3FAFB', textColor: '#15343C', mutedColor: '#4C707A', primaryColor: '#176273', secondaryColor: '#4EA293', ornamentColor: '#247585', buttonColor: '#123A45', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Xanh Olive & Kem Thảo Mộc',
        desc: 'Sắc xanh olive thời thượng chuẩn phong cách Kinfolk Châu Âu.',
        colors: { bgGradient1: '#FAFBF6', bgGradient2: '#ECF0E0', bgGradient3: '#DCE3C9', surfaceColor: '#FFFFFF', contrastBg: '#323D1F', contrastText: '#F7F8F0', textColor: '#2D351E', mutedColor: '#667150', primaryColor: '#4F612B', secondaryColor: '#A6B27A', ornamentColor: '#63783A', buttonColor: '#3E4D21', buttonTextColor: '#FFFFFF' },
      },
    ],
  },
  Thủy: {
    name: 'Mệnh Thủy',
    swatch: '#1E4C85',
    tuongSinh: 'Kim sinh Thủy (Xanh đại dương, Xanh sương mai, Trắng tinh khôi, Ánh bạc)',
    avoid: 'Vàng đất, Nâu đất đậm (Thổ khắc Thủy)',
    meaning: 'Biểu tượng cho sự uyển chuyển, hòa hợp sâu sắc và hạnh phúc tuôn chảy.',
    palettes: [
      {
        name: 'Đại Dương Navy & Ánh Bạc',
        desc: 'Xanh navy quyền quý kết hợp sắc trắng bạc Kim sinh Thủy.',
        colors: { bgGradient1: '#F8FBFF', bgGradient2: '#E6EFF8', bgGradient3: '#D5E3F2', surfaceColor: '#FFFFFF', contrastBg: '#142A47', contrastText: '#F3F7FC', textColor: '#152840', mutedColor: '#4F6785', primaryColor: '#1A457A', secondaryColor: '#88A6C9', ornamentColor: '#356299', buttonColor: '#142A47', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Thiên Thanh & Sương Mai',
        desc: 'Xanh da trời nhẹ nhàng, tươi sáng và tinh khiết.',
        colors: { bgGradient1: '#FAFDFF', bgGradient2: '#E7F3FA', bgGradient3: '#D5E9F6', surfaceColor: '#FFFFFF', contrastBg: '#184261', contrastText: '#F5FBFF', textColor: '#18344A', mutedColor: '#567891', primaryColor: '#256EA1', secondaryColor: '#8CC0E3', ornamentColor: '#3980B3', buttonColor: '#1C5B87', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Đêm Sao Pha Lê & Bạc Trắng',
        desc: 'Nền xanh đêm 5 sao nổi bật chữ trắng ánh bạc sang trọng.',
        colors: { bgGradient1: '#111B2B', bgGradient2: '#18273F', bgGradient3: '#0E1726', surfaceColor: '#18253A', contrastBg: '#0B1320', contrastText: '#F0F6FC', textColor: '#F0F6FC', mutedColor: '#A3B8D1', primaryColor: '#8CC4F5', secondaryColor: '#DCE8F5', ornamentColor: '#9DCBF2', buttonColor: '#75B4EC', buttonTextColor: '#0F1B2C' },
      },
    ],
  },
  Hỏa: {
    name: 'Mệnh Hỏa',
    swatch: '#7A1C24',
    tuongSinh: 'Mộc sinh Hỏa (Đỏ rượu vang, Đỏ son, Hồng phấn, Tím oải hương phối Lá xanh)',
    avoid: 'Đen tuyền, Xanh dương đậm (Thủy khắc Hỏa)',
    meaning: 'Tượng trưng cho tình yêu nồng nàn, đam mê và mái ấm luôn rực rỡ.',
    palettes: [
      {
        name: 'Đỏ Rượu Nhung & Kem Cổ Điển',
        desc: 'Sắc đỏ oxblood sang trọng trên giấy kem ấm áp tinh tế.',
        colors: { bgGradient1: '#FFF9F0', bgGradient2: '#FAF0E1', bgGradient3: '#F2E3CD', surfaceColor: '#FDF7F0', contrastBg: '#511419', contrastText: '#FDF7F0', textColor: '#3B181B', mutedColor: '#7E575A', primaryColor: '#511419', secondaryColor: '#C59A57', ornamentColor: '#8B5A3C', buttonColor: '#511419', buttonTextColor: '#FFF8F0' },
      },
      {
        name: 'Hồng Anh Đào & Lá Xanh (Mộc sinh Hỏa)',
        desc: 'Hồng phấn dịu mắt điểm sắc xanh lá tương sinh nhẹ nhàng.',
        colors: { bgGradient1: '#FFFBFC', bgGradient2: '#FCEAF0', bgGradient3: '#F5D8E2', surfaceColor: '#FFFFFF', contrastBg: '#782642', contrastText: '#FFF8FA', textColor: '#45212E', mutedColor: '#855969', primaryColor: '#9E385B', secondaryColor: '#6B997B', ornamentColor: '#B56380', buttonColor: '#8B2F4F', buttonTextColor: '#FFFFFF' },
      },
      {
        name: 'Đỏ Son Hoàng Cung & Vàng Kim',
        desc: 'Đỏ hỷ sự truyền thống rực rỡ may mắn cho lễ gia tiên.',
        colors: { bgGradient1: '#FFF8F3', bgGradient2: '#FBE8DF', bgGradient3: '#F4D5C7', surfaceColor: '#FFFFFF', contrastBg: '#8A151B', contrastText: '#FFF8EC', textColor: '#471718', mutedColor: '#874B4C', primaryColor: '#961920', secondaryColor: '#CFA049', ornamentColor: '#BD8B38', buttonColor: '#8A151B', buttonTextColor: '#FFF9F0' },
      },
    ],
  },
  Thổ: {
    name: 'Mệnh Thổ',
    swatch: '#9E5434',
    tuongSinh: 'Hỏa sinh Thổ (Nâu đất, Vàng kem, Cam terracotta, Đỏ rượu vang, Hồng đất)',
    avoid: 'Xanh lá cây đậm (Mộc khắc Thổ)',
    meaning: 'Biểu trưng cho nền tảng vững chắc, thủy chung son sắt và gia đình an yên.',
    palettes: [
      {
        name: 'Terracotta & Kem Giấy Lanh',
        desc: 'Cam đất phối nâu cafe ấm áp chuẩn phong cách cưới mộc.',
        colors: { bgGradient1: '#FCF8F2', bgGradient2: '#F2E4D4', bgGradient3: '#E5D0B8', surfaceColor: '#FFFDF9', contrastBg: '#5C2E1E', contrastText: '#FDF7F0', textColor: '#3E261B', mutedColor: '#7C5D4A', primaryColor: '#8F462A', secondaryColor: '#C5935A', ornamentColor: '#A36342', buttonColor: '#75371F', buttonTextColor: '#FFF9F2' },
      },
      {
        name: 'Đỏ Rượu Vang & Vàng Cát (Hỏa sinh Thổ)',
        desc: 'Đỏ burgundy quý phái kết hợp vàng cát sung túc viên mãn.',
        colors: { bgGradient1: '#FDF8F5', bgGradient2: '#F5E6E0', bgGradient3: '#EBD6CC', surfaceColor: '#FFFFFF', contrastBg: '#5A1B25', contrastText: '#FDF7F5', textColor: '#3D1C20', mutedColor: '#7B5156', primaryColor: '#75202E', secondaryColor: '#C29756', ornamentColor: '#8F3946', buttonColor: '#5A1B25', buttonTextColor: '#FFF8F2' },
      },
      {
        name: 'Hồng Đất & Vàng Đồng',
        desc: 'Hồng đất trầm ấm tinh tế, nhẹ nhàng và bền dáng.',
        colors: { bgGradient1: '#FFF9F7', bgGradient2: '#F6E8E3', bgGradient3: '#EDD7CF', surfaceColor: '#FFFFFF', contrastBg: '#6B3632', contrastText: '#FFF8F6', textColor: '#422825', mutedColor: '#80605B', primaryColor: '#9C524A', secondaryColor: '#C79668', ornamentColor: '#AC6961', buttonColor: '#85423B', buttonTextColor: '#FFFFFF' },
      },
    ],
  },
};

export function analyzeCoupleFengShui(groomYear, brideYear) {
  const g = calculateNguHanhByYear(groomYear);
  const b = calculateNguHanhByYear(brideYear);
  if (!g && !b) return null;
  if (g && !b) {
    return { groom: g, bride: null, primaryElement: g.element, bridgeElement: null, summary: `Chú rể ${g.year} (${g.canChi}) thuộc ${NGU_HANH_DATA[g.element].name}. Phù hợp bảng màu bản mệnh và tương sinh hành ${g.element}.` };
  }
  if (!g && b) {
    return { groom: null, bride: b, primaryElement: b.element, bridgeElement: null, summary: `Cô dâu ${b.year} (${b.canChi}) thuộc ${NGU_HANH_DATA[b.element].name}. Nên ưu tiên tông màu hợp ${NGU_HANH_DATA[b.element].name}.` };
  }
  const tuongSinh = { Kim: 'Thủy', Thủy: 'Mộc', Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim' };
  const hoaGiai = {
    'Kim-Mộc': 'Thủy', 'Mộc-Kim': 'Thủy',
    'Mộc-Thổ': 'Hỏa', 'Thổ-Mộc': 'Hỏa',
    'Thổ-Thủy': 'Kim', 'Thủy-Thổ': 'Kim',
    'Thủy-Hỏa': 'Mộc', 'Hỏa-Thủy': 'Mộc',
    'Hỏa-Kim': 'Thổ', 'Kim-Hỏa': 'Thổ',
  };
  if (g.element === b.element) {
    return { groom: g, bride: b, primaryElement: b.element, bridgeElement: null, summary: `Cả hai cùng ${NGU_HANH_DATA[b.element].name} (${g.canChi} & ${b.canChi}) — Song Hành Đại Cát. Chọn trực tiếp bảng màu ${NGU_HANH_DATA[b.element].name}.` };
  }
  if (tuongSinh[g.element] === b.element || tuongSinh[b.element] === g.element) {
    return { groom: g, bride: b, primaryElement: b.element, bridgeElement: g.element, summary: `${g.canChi} (${g.element}) & ${b.canChi} (${b.element}) là cặp Tương Sinh rất đẹp. Nên lấy ${NGU_HANH_DATA[b.element].name} làm chủ đạo phối điểm nhấn ${g.element}.` };
  }
  const bridge = hoaGiai[`${g.element}-${b.element}`];
  return { groom: g, bride: b, primaryElement: bridge, bridgeElement: bridge, summary: `${g.canChi} (${g.element}) & ${b.canChi} (${b.element}) nên chọn hành cầu nối ${NGU_HANH_DATA[bridge].name} để trung hòa hoàn hảo cho cả hai.` };
}

export const ZODIAC_PALETTES = [
  { id: 'aries', name: 'Bạch Dương (21/3–19/4)', element: 'Hỏa', paletteName: 'Đỏ Ruby & Vàng Nắng', colors: { bgGradient1: '#FFF8F6', bgGradient2: '#FCE8E2', bgGradient3: '#F5D5CC', surfaceColor: '#FFFFFF', contrastBg: '#6B181E', contrastText: '#FFF8F6', textColor: '#451A19', mutedColor: '#82504D', primaryColor: '#9E242B', secondaryColor: '#D69440', ornamentColor: '#B54046', buttonColor: '#8A1E25', buttonTextColor: '#FFFFFF' } },
  { id: 'taurus', name: 'Kim Ngưu (20/4–20/5)', element: 'Thổ', paletteName: 'Xanh Sage & Hồng Đất', colors: { bgGradient1: '#FBFBF8', bgGradient2: '#ECEFE7', bgGradient3: '#F2E4DF', surfaceColor: '#FFFFFF', contrastBg: '#374D36', contrastText: '#F8FAF7', textColor: '#2B3328', mutedColor: '#667062', primaryColor: '#4F6E4D', secondaryColor: '#C48B7E', ornamentColor: '#648562', buttonColor: '#3F5C3D', buttonTextColor: '#FFFFFF' } },
  { id: 'gemini', name: 'Song Tử (21/5–20/6)', element: 'Khí', paletteName: 'Vàng Kem & Xanh Thiên Thanh', colors: { bgGradient1: '#FFFDF7', bgGradient2: '#F8F0DC', bgGradient3: '#E2EEF8', surfaceColor: '#FFFFFF', contrastBg: '#234C6E', contrastText: '#F8FBFF', textColor: '#2A2F3A', mutedColor: '#697180', primaryColor: '#306A99', secondaryColor: '#D4A33D', ornamentColor: '#4B82B0', buttonColor: '#255882', buttonTextColor: '#FFFFFF' } },
  { id: 'cancer', name: 'Cự Giải (21/6–22/7)', element: 'Thủy', paletteName: 'Ngọc Trai & Bạc Ánh Trăng', colors: { bgGradient1: '#FDFEFF', bgGradient2: '#EDF2F8', bgGradient3: '#F5EBF0', surfaceColor: '#FFFFFF', contrastBg: '#324861', contrastText: '#F7FAFD', textColor: '#243040', mutedColor: '#647285', primaryColor: '#4B6B8C', secondaryColor: '#C99EAE', ornamentColor: '#6582A1', buttonColor: '#3D5B7A', buttonTextColor: '#FFFFFF' } },
  { id: 'leo', name: 'Sư Tử (23/7–22/8)', element: 'Hỏa', paletteName: 'Vàng Hoàng Kim & Đỏ Nhung', colors: { bgGradient1: '#FFFDF7', bgGradient2: '#FAF0D8', bgGradient3: '#F3DFC2', surfaceColor: '#FFFFFF', contrastBg: '#5C2218', contrastText: '#FFF8EC', textColor: '#3B2314', mutedColor: '#7D5C45', primaryColor: '#A66A19', secondaryColor: '#8F2627', ornamentColor: '#BD802B', buttonColor: '#8F5A13', buttonTextColor: '#FFFFFF' } },
  { id: 'virgo', name: 'Xử Nữ (23/8–22/9)', element: 'Thổ', paletteName: 'Trắng Sứ & Nâu Hạnh Nhân', colors: { bgGradient1: '#FDFCF9', bgGradient2: '#F2ECE2', bgGradient3: '#E7DDD1', surfaceColor: '#FFFFFF', contrastBg: '#47392B', contrastText: '#FAF7F2', textColor: '#302A23', mutedColor: '#72695E', primaryColor: '#6E5841', secondaryColor: '#B59E82', ornamentColor: '#876F56', buttonColor: '#5C4834', buttonTextColor: '#FFFFFF' } },
  { id: 'libra', name: 'Thiên Bình (23/9–22/10)', element: 'Khí', paletteName: 'Hồng Phấn & Xanh Pastel', colors: { bgGradient1: '#FFF9FB', bgGradient2: '#FAE9F0', bgGradient3: '#E6EFF8', surfaceColor: '#FFFFFF', contrastBg: '#6B2F49', contrastText: '#FFF8FB', textColor: '#3A2838', mutedColor: '#7A6378', primaryColor: '#A84B73', secondaryColor: '#7DA5CC', ornamentColor: '#BA658A', buttonColor: '#913D61', buttonTextColor: '#FFFFFF' } },
  { id: 'scorpio', name: 'Bọ Cạp (23/10–21/11)', element: 'Thủy', paletteName: 'Rượu Vang & Vàng Hồng Đêm', colors: { bgGradient1: '#1E151B', bgGradient2: '#2B1923', bgGradient3: '#181116', surfaceColor: '#291B23', contrastBg: '#120C10', contrastText: '#F8EAEF', textColor: '#F8EAEF', mutedColor: '#C4A5B0', primaryColor: '#E39AA8', secondaryColor: '#D8A96B', ornamentColor: '#DF9EA9', buttonColor: '#C9687C', buttonTextColor: '#FFFFFF' } },
  { id: 'sagittarius', name: 'Nhân Mã (22/11–21/12)', element: 'Hỏa', paletteName: 'Tím Hoàng Gia & Vàng Đồng', colors: { bgGradient1: '#FBF8FF', bgGradient2: '#EFE5FA', bgGradient3: '#F7ECDB', surfaceColor: '#FFFFFF', contrastBg: '#442361', contrastText: '#FBF8FF', textColor: '#331E47', mutedColor: '#715887', primaryColor: '#63358C', secondaryColor: '#C9974B', ornamentColor: '#7E4CA8', buttonColor: '#522978', buttonTextColor: '#FFFFFF' } },
  { id: 'capricorn', name: 'Ma Kết (22/12–19/1)', element: 'Thổ', paletteName: 'Xanh Rêu Đậm & Vàng Cát', colors: { bgGradient1: '#F7F8F5', bgGradient2: '#E7EAE1', bgGradient3: '#DDD9CD', surfaceColor: '#FFFFFF', contrastBg: '#273625', contrastText: '#F6F7F2', textColor: '#252B22', mutedColor: '#5E6659', primaryColor: '#384C35', secondaryColor: '#B29869', ornamentColor: '#4B6148', buttonColor: '#2D3E2A', buttonTextColor: '#FFFFFF' } },
  { id: 'aquarius', name: 'Bảo Bình (20/1–18/2)', element: 'Khí', paletteName: 'Xanh Ngọc Lam & Bạc Sương', colors: { bgGradient1: '#F5FCFD', bgGradient2: '#E1F2F6', bgGradient3: '#D3E8F3', surfaceColor: '#FFFFFF', contrastBg: '#124959', contrastText: '#F3FBFC', textColor: '#15343F', mutedColor: '#4D717E', primaryColor: '#186E85', secondaryColor: '#7AB3C9', ornamentColor: '#26839C', buttonColor: '#135D70', buttonTextColor: '#FFFFFF' } },
  { id: 'pisces', name: 'Song Ngư (19/2–20/3)', element: 'Thủy', paletteName: 'Tím Mơ & Xanh Biển Nhạt', colors: { bgGradient1: '#FAF9FF', bgGradient2: '#ECEAF9', bgGradient3: '#E1F0F9', surfaceColor: '#FFFFFF', contrastBg: '#343366', contrastText: '#F8F8FF', textColor: '#272645', mutedColor: '#626187', primaryColor: '#4F4D94', secondaryColor: '#7CB0D4', ornamentColor: '#6765AD', buttonColor: '#413F80', buttonTextColor: '#FFFFFF' } },
];

function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

export function generateHarmonyMix(baseHex, secondHex, mode = 'editorial-contrast') {
  const [h1, s1] = hexToHsl(baseHex || '#511419');
  const [h2, s2] = hexToHsl(secondHex || '#C59A57');
  if (mode === 'luxury-dark') {
    return {
      bgMode: 'gradient',
      bgGradient1: hslToHex(h1, Math.min(s1, 32), 11),
      bgGradient2: hslToHex(h1, Math.min(s1, 28), 8),
      bgGradient3: hslToHex(h2, Math.min(s2, 32), 14),
      surfaceColor: hslToHex(h1, Math.min(s1, 26), 14),
      contrastBg: hslToHex(h1, Math.min(s1, 34), 7),
      contrastText: hslToHex(h2, 26, 94),
      textColor: hslToHex(h2, 26, 94),
      mutedColor: hslToHex(h2, 16, 70),
      primaryColor: hslToHex(h2, Math.max(46, s2), 66),
      secondaryColor: hslToHex(h1, Math.max(42, s1), 70),
      ornamentColor: hslToHex(h2, Math.max(48, s2), 62),
      buttonColor: hslToHex(h2, Math.max(48, s2), 58),
      buttonTextColor: '#16121A',
    };
  }
  if (mode === 'editorial-contrast') {
    return {
      bgMode: 'gradient',
      bgGradient1: '#FFFDF9',
      bgGradient2: hslToHex(h2, Math.min(s2, 36), 95),
      bgGradient3: hslToHex(h2, Math.min(s2, 34), 90),
      surfaceColor: '#FDF9F3',
      contrastBg: hslToHex(h1, Math.max(38, Math.min(s1, 68)), 22),
      contrastText: '#FDF8F2',
      textColor: hslToHex(h1, Math.min(s1, 42), 18),
      mutedColor: hslToHex(h1, Math.min(s1, 22), 44),
      primaryColor: hslToHex(h1, Math.max(40, Math.min(s1, 70)), 24),
      secondaryColor: hslToHex(h2, Math.max(40, s2), 52),
      ornamentColor: hslToHex(h2, Math.max(35, s2), 46),
      buttonColor: hslToHex(h1, Math.max(42, Math.min(s1, 70)), 22),
      buttonTextColor: '#FFF9F2',
    };
  }
  // pastel-silk
  return {
    bgMode: 'gradient',
    bgGradient1: '#FFFFFF',
    bgGradient2: hslToHex(h1, Math.min(s1, 52), 95),
    bgGradient3: hslToHex(h2, Math.min(s2, 48), 91),
    surfaceColor: '#FFFFFF',
    contrastBg: hslToHex(h1, Math.max(36, Math.min(s1, 58)), 30),
    contrastText: '#FFFFFF',
    textColor: hslToHex(h1, Math.min(s1, 40), 20),
    mutedColor: hslToHex(h1, Math.min(s1, 22), 46),
    primaryColor: hslToHex(h1, Math.max(38, s1), 36),
    secondaryColor: hslToHex(h2, Math.max(38, s2), 58),
    ornamentColor: hslToHex(h1, Math.max(34, s1), 46),
    buttonColor: hslToHex(h1, Math.max(42, s1), 34),
    buttonTextColor: '#FFFFFF',
  };
}

export const COPY_SUGGESTIONS = {
  invitations: [
    { label: 'Trang trọng truyền thống', text: 'Sự hiện diện của Quý khách là niềm vinh hạnh lớn lao, góp phần làm trọn vẹn ngày vui trọng đại của hai gia đình và đôi uyên ương chúng con.' },
    { label: 'Ấm áp hiện đại', text: 'Sau hành trình dài yêu thương và đồng hành, chúng mình chính thức về chung một nhà. Rất mong có bạn cùng nâng ly chúc phúc trong ngày hạnh phúc nhất cuộc đời.' },
    { label: 'Thơ ca lãng mạn', text: 'Trăm năm tình viên mãn, bạc đầu nghĩa phu thê. Kính mời những người thân yêu đến chung vui, chứng kiến khoảnh khắc chúng mình nên duyên vợ chồng.' },
    { label: 'Song ngữ Việt - Anh', text: 'Trân trọng kính mời Quý khách đến chung vui trong lễ thành hôn của chúng tôi.\nTogether with our families, we joyfully invite you to share in our wedding celebration.' },
  ],
  quickWishes: [
    'Chúc hai bạn trăm năm hạnh phúc, luôn nắm chặt tay nhau và giữ mãi nụ cười rạng rỡ như ngày hôm nay!',
    'Mừng ngày trọng đại của đôi bạn trẻ! Chúc gia đình nhỏ luôn ấm áp, bình an và ngập tràn tiếng cười.',
    'Chúc cô dâu chú rể đầu bạc răng long, đồng tâm hiệp lực xây dựng tổ ấm viên mãn!',
    'Thật hạnh phúc khi được chứng kiến cái kết đẹp của hai bạn. Chúc hai bạn một đời an yên bên nhau!',
  ],
  zaloTemplates: [
    { label: 'Gửi bạn bè thân thiết', body: 'Chào {guest}, mình chuẩn bị lên xe hoa rồi đây. Gửi {guest} tấm thiệp cưới online này, rất mong {guest} sắp xếp thời gian đến chung vui cùng vợ chồng mình nhé!\nXem thiệp & xác nhận tham dự tại: {link}' },
    { label: 'Gửi người lớn / Cô chú / Sếp', body: 'Dạ con/em xin kính chào {guest}. Nhân dịp lễ thành hôn của {groom} và {bride}, gia đình xin trân trọng kính gửi {guest} thiệp mời dự tiệc chung vui cùng hai bên gia đình.\nKính mời {guest} xem chi tiết tại: {link}' },
    { label: 'Gửi đồng nghiệp', body: 'Trân trọng kính mời {guest} đến chung vui trong ngày cưới của {groom} & {bride}. Sự có mặt của {guest} sẽ làm buổi tiệc thêm trọn vẹn.\nMở thiệp online tại: {link}' },
  ],
};

export function createInvitationFromTemplate(templateId, overrides = {}) {
  const tpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const uid = overrides.id || ('thiep-' + Math.random().toString(36).slice(2, 8));
  const token = overrides.clientToken || ('kh_' + Math.random().toString(36).slice(2, 10));
  const trialDays = Number(overrides.trialDays ?? (tpl.isTrialTemplate ? tpl.trialDays : 0)) || 0;
  const trialCfg = trialDays > 0 ? buildTrialConfig(trialDays) : null;
  const initGallery = trialCfg
    ? EDITORIAL_SAMPLE_PHOTOS.album.slice(0, trialCfg.limits.maxPhotos)
    : [...EDITORIAL_SAMPLE_PHOTOS.album];

  return {
    id: uid,
    clientToken: token,
    templateId: tpl.id,
    templateName: tpl.name,
    title: overrides.title || 'Thiệp Cưới Minh Quân & Bảo Ngọc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    trial: trialCfg,
    order: {
      customerName: overrides.customerName || 'Nguyễn Minh Quân',
      customerPhone: overrides.customerPhone || '0901 234 567',
      packageName: overrides.packageName || (trialCfg ? `Dùng thử miễn phí ${trialDays} ngày` : 'Gói Tiêu Chuẩn'),
      price: overrides.price ?? (trialCfg ? 0 : 189000),
      status: overrides.status || (trialCfg ? 'trial' : 'paid'),
      showWatermark: overrides.showWatermark ?? Boolean(trialCfg),
      note: overrides.note || '',
    },
    permissions: {
      locked: false,
      allowMusicChange: trialCfg ? false : true,
      allowPhotoUpload: true,
      allowGuestFormEdit: true,
    },
    sections: [
      { id: 'sec_hero', type: 'hero', enabled: true, title: 'Phong Bì & Bìa Chính' },
      { id: 'sec_quote', type: 'quote', enabled: true, title: 'Gia Đình & Lễ Cưới' },
      { id: 'sec_gallery', type: 'gallery', enabled: true, title: 'Album Ảnh 3D' },
      { id: 'sec_countdown', type: 'countdown', enabled: true, title: 'Tiệc Cưới & Lịch' },
      { id: 'sec_events', type: 'events', enabled: true, title: 'Địa Điểm & Bản Đồ' },
      { id: 'sec_story', type: 'story', enabled: true, title: 'Chuyện Tình Yêu' },
      { id: 'sec_gift', type: 'gift', enabled: true, title: 'Hộp Mừng Cưới' },
      { id: 'sec_rsvp', type: 'rsvp', enabled: true, title: 'Xác Nhận Tham Dự' },
      { id: 'sec_guestbook', type: 'guestbook', enabled: true, title: 'Sổ Lưu Bút' },
      { id: 'sec_footer', type: 'footer', enabled: true, title: 'Cảm Ơn' },
    ],
    design: { ...tpl.design },
    music: {
      trackId: tpl.design.musicTrack || 'canon-d',
      customUrl: '',
      customName: '',
      autoplay: true,
      volume: 0.65,
    },
    content: {
      topBadge: 'TRÂN TRỌNG KÍNH MỜI',
      groomName: 'Minh Quân',
      groomFullName: 'Nguyễn Minh Quân',
      groomYear: '1996',
      brideName: 'Bảo Ngọc',
      brideFullName: 'Trần Bảo Ngọc',
      brideYear: '1998',
      weddingDate: '2026-12-20',
      weddingTime: '17:00',
      lunarDate: 'Tức ngày 12 tháng 11 năm Bính Ngọ',
      quoteText: 'Sự hiện diện của Quý khách là niềm vinh hạnh lớn lao, góp phần làm trọn vẹn ngày vui trọng đại của hai gia đình và đôi uyên ương chúng con.',
      groomFamilyTitle: 'NHÀ TRAI',
      groomFather: 'Ông Nguyễn Văn Thành',
      groomMother: 'Bà Lê Thị Hồng',
      groomAddress: 'Quận 3, TP. Hồ Chí Minh',
      brideFamilyTitle: 'NHÀ GÁI',
      brideFather: 'Ông Trần Quốc Dũng',
      brideMother: 'Bà Phạm Thị Mai',
      brideAddress: 'Quận Phú Nhuận, TP. Hồ Chí Minh',
      heroPhoto: EDITORIAL_SAMPLE_PHOTOS.hero,
      gallery: initGallery,
      events: [
        {
          id: 'ev_1',
          name: 'Lễ Gia Tiên & Vu Quy',
          time: '08:30 — Chủ Nhật, 20/12/2026',
          venue: 'Tư Gia Nhà Gái',
          address: '128 Nguyễn Văn Trỗi, Quận Phú Nhuận, TP.HCM',
          mapUrl: 'https://maps.google.com/?q=128+Nguyen+Van+Troi+Phu+Nhuan+HCMC',
        },
        {
          id: 'ev_2',
          name: 'Tiệc Cưới Chung Vui',
          time: '17:00 — Chủ Nhật, 20/12/2026',
          venue: 'Trung Tâm Hội Nghị GEM Center — Sảnh Pollux',
          address: '08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP.HCM',
          mapUrl: 'https://maps.google.com/?q=GEM+Center+Ho+Chi+Minh',
        },
      ],
      story: [
        { id: 'st_1', date: 'Tháng 05 / 2022', title: 'Lần Đầu Gặp Gỡ', text: 'Một buổi chiều mưa nhẹ tại góc phố quen đã mở ra câu chuyện thật dịu dàng của hai đứa.' },
        { id: 'st_2', date: 'Tháng 11 / 2023', title: 'Chính Thức Bên Nhau', text: 'Từ những người bạn đồng hành đến lời tỏ tình dưới ánh đèn Đà Lạt se lạnh.' },
        { id: 'st_3', date: 'Tháng 08 / 2026', title: 'Lời Cầu Hôn Ngọt Ngào', text: 'Và hôm nay, chúng mình sẵn sàng nắm tay nhau bước sang chương mới trọn đời.' },
      ],
      gift: {
        title: 'Hộp Mừng Cưới',
        subtitle: 'Sự hiện diện của Quý khách là món quà quý giá nhất. Nếu ở xa không thể tham dự, Quý khách có thể gửi lời chúc phúc tới đôi uyên ương qua mã QR dưới đây.',
        groomBank: { bankCode: 'VCB', accountNo: '0123456789', accountName: 'NGUYEN MINH QUAN' },
        brideBank: { bankCode: 'TCB', accountNo: '190368689999', accountName: 'TRAN BAO NGOC' },
      },
      footerText: 'Cảm ơn Quý khách đã dành thời gian và tình cảm trân quý đến chung vui cùng hai gia đình.',
    },
    guestForm: {
      heading: 'Xác Nhận Tham Dự',
      subtitle: 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi. Xin xác nhận để gia đình chuẩn bị chu đáo nhất.',
      askAttendance: true,
      askGuestsCount: true,
      askSide: true,
      askWish: true,
      customFields: [
        { id: 'cf_diet', label: 'Bạn dùng thực đơn nào?', type: 'select', options: ['Tiệc mặn tiêu chuẩn', 'Tiệc chay thanh đạm', 'Không yêu cầu đặc biệt'], required: false },
        { id: 'cf_phone', label: 'Số điện thoại liên hệ', type: 'text', options: [], required: false },
      ],
    },
    guests: [
      { id: 'gs_1', name: 'Anh Hoàng Nam & Gia Đình', side: 'Nhà Trai', group: 'Bạn thân' },
      { id: 'gs_2', name: 'Chị Thanh Thảo', side: 'Nhà Gái', group: 'Đồng nghiệp' },
      { id: 'gs_3', name: 'Bạn Gia Huy', side: 'Nhà Trai', group: 'Đại học' },
    ],
    rsvps: [
      {
        id: 'r_demo_1',
        name: 'Chị Thanh Thảo',
        attendance: 'yes',
        guestsCount: 2,
        side: 'Nhà Gái',
        customAnswers: { 'Bạn dùng thực đơn nào?': 'Tiệc mặn tiêu chuẩn' },
        note: 'Chắc chắn có mặt sớm chụp ảnh cùng cô dâu!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    wishes: [
      {
        id: 'w_demo_1',
        name: 'Hải Cường',
        relation: 'Bạn thân chú rể',
        message: 'Chúc Minh Quân & Bảo Ngọc trăm năm hạnh phúc, dù cuộc sống có bận rộn vẫn luôn kiên nhẫn lắng nghe và giữ trọn yêu thương như ngày hôm nay.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        hidden: false,
      },
      {
        id: 'w_demo_2',
        name: 'Thanh Thảo',
        relation: 'Đồng nghiệp',
        message: 'Thật hạnh phúc khi được chứng kiến cái kết đẹp của hai bạn. Chúc tổ ấm nhỏ mãi an yên và viên mãn!',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        hidden: false,
      },
    ],
  };
}

export const DEFAULT_PACKAGES_V9 = [
  {
    id: 'pkg_basic',
    name: 'Gói Cơ Bản',
    price: 99000,
    photoLimit: '8 ảnh HD',
    duration: 'Báo hỷ gọn nhẹ',
    badge: 'Tiết kiệm',
    tags: ['Vị trí Maps', 'Nhạc nền', '8 ảnh'],
    capabilities: { maxPhotos: 8, hasMap: true, hasGuestbook: false, hasGiftQr: false, hasRsvp: false, hasGuestLinks: false, hasCustomMusic: false },
    features: [
      'Chọn 1 mẫu bất kỳ trong kho mẫu & gỡ hoàn toàn dải bản thử',
      'Thông tin hai họ, ngày giờ, lịch cưới & đếm ngược',
      'Bản đồ chỉ đường vị trí tiệc Google Maps chính xác',
      'Tối đa 8 ảnh cưới + Nhạc nền tự phát & hoa rơi nhẹ',
    ],
    excluded: [
      'Giản lược: không gồm mục Gửi lời chúc (Sổ lưu bút)',
      'Không gồm Mã VietQR mừng cưới (Bao Lì Xì)',
      'Không gồm Form xác nhận RSVP & Link tên riêng từng khách',
    ],
  },
  {
    id: 'pkg_standard',
    name: 'Gói Tiêu Chuẩn',
    price: 189000,
    photoLimit: '20 ảnh HD',
    duration: 'Đủ Lời chúc & Mã QR',
    badge: 'Bán chạy nhất',
    tags: ['Vị trí Maps', 'Gửi lời chúc', 'Mã QR mừng cưới', 'Mở bìa 3D'],
    capabilities: { maxPhotos: 20, hasMap: true, hasGuestbook: true, hasGiftQr: true, hasRsvp: false, hasGuestLinks: false, hasCustomMusic: false },
    features: [
      'Toàn bộ Gói Cơ Bản (Thông tin lễ + Vị trí bản đồ Google Maps)',
      'Mở mục Gửi Lời Chúc (Sổ Lưu Bút) & quản lý duyệt lời chúc',
      'Mở Bao Lì Xì & Mã VietQR Mừng Cưới (Chú Rể & Cô Dâu)',
      'Tối đa 20 ảnh cưới Album 3D + 5 hiệu ứng mở bìa 3D & 10 kiểu hoa rơi',
    ],
    excluded: [
      'Giản lược: chưa gồm Form xác nhận RSVP câu hỏi riêng & xuất Excel',
      'Chưa gồm Tạo link tên từng khách, tải nhạc MP3 riêng & phối màu Phong Thủy',
    ],
  },
  {
    id: 'pkg_pro',
    name: 'Gói Cao Cấp',
    price: 299000,
    photoLimit: '45 ảnh Full HD',
    duration: 'Đủ RSVP & Link khách',
    badge: 'Đầy đủ nhất',
    tags: ['Maps + Lời chúc + Mã QR', 'Xác nhận RSVP', 'Link tên khách', 'Nhạc MP3'],
    capabilities: { maxPhotos: 45, hasMap: true, hasGuestbook: true, hasGiftQr: true, hasRsvp: true, hasGuestLinks: true, hasCustomMusic: true },
    features: [
      'Đầy đủ Vị trí Maps + Gửi Lời Chúc + Mã VietQR Mừng Cưới',
      'Mở Form Xác Nhận Tham Dự RSVP (thêm câu hỏi riêng & xuất Excel)',
      'Tạo Link mang tên riêng từng khách không giới hạn & mẫu tin mời Zalo',
      'Tối đa 45 ảnh Full HD + Tải nhạc MP3 riêng + Lật trang sách 3D',
      'Phối màu hợp mệnh Ngũ Hành + Đổi ảnh nền mờ bìa & hoa văn ép kim',
    ],
    excluded: [
      'Không gồm thiết kế bố cục độc quyền 1-1 từ đầu',
    ],
  },
  {
    id: 'pkg_vip',
    name: 'Gói Thiết Kế Riêng',
    price: 499000,
    photoLimit: 'Không giới hạn ảnh',
    duration: 'Làm trọn gói A–Z',
    badge: 'Thiết kế 1-1',
    tags: ['Full tính năng', 'Thiết kế độc quyền', 'Làm hộ A–Z', 'QR in thiệp giấy'],
    capabilities: { maxPhotos: 999, hasMap: true, hasGuestbook: true, hasGiftQr: true, hasRsvp: true, hasGuestLinks: true, hasCustomMusic: true },
    features: [
      'Đầy đủ 100% tính năng (Vị trí Maps, Lời chúc, Mã QR, RSVP, Link từng khách, MP3)',
      'Thiết kế bố cục, màu sắc & hoa văn độc quyền 1-1 theo bộ ảnh cưới',
      'Không giới hạn số lượng ảnh cưới Full HD + Tặng ảnh Mã QR in thiệp giấy',
      'Đội ngũ nhập nội dung, tối ưu ảnh & tạo sẵn danh sách khách mời trọn gói A–Z',
      'Hỗ trợ chỉnh sửa nhanh ưu tiên qua Zalo 0354 248 177 xuyên suốt lễ cưới',
    ],
    excluded: [],
  },
];

export function createInitialSeedDb() {
  const inv1 = createInvitationFromTemplate('nhung-do-co-dien', {
    id: 'baongoc-minhquan',
    clientToken: 'kh_demo2026',
    title: 'Minh Quân & Bảo Ngọc (Nhung Đỏ Cung Điện)',
    customerName: 'Nguyễn Minh Quân',
    customerPhone: '0901 234 567',
    packageName: 'Gói Cao Cấp',
    price: 299000,
    status: 'paid',
    showWatermark: false,
  });

  const inv2 = createInvitationFromTemplate('ngoc-luc-bao', {
    id: 'hoanganh-khanhlinh',
    clientToken: 'kh_royal99',
    title: 'Hoàng Anh & Khánh Linh (Song Hỷ Lục Bảo)',
    customerName: 'Lê Hoàng Anh',
    customerPhone: '0988 776 554',
    packageName: 'Gói Tiêu Chuẩn',
    price: 189000,
    status: 'trial',
    showWatermark: true,
  });
  inv2.content.groomName = 'Hoàng Anh';
  inv2.content.groomFullName = 'Lê Hoàng Anh';
  inv2.content.groomYear = '1995';
  inv2.content.brideName = 'Khánh Linh';
  inv2.content.brideFullName = 'Vũ Khánh Linh';
  inv2.content.brideYear = '1997';
  inv2.content.weddingDate = '2027-01-16';
  inv2.content.lunarDate = 'Tức ngày 09 tháng 12 năm Bính Ngọ';

  return {
    version: 9,
    settings: {
      brandName: "L'Amour Atelier",
      tagline: 'Thiết kế thiệp cưới online mang dấu ấn riêng — bìa ảnh mờ cuốn hút, hoa văn ép kim, hiệu ứng 3D mượt mà và phối màu chuẩn Ngũ Hành.',
      hotline: '0354 248 177',
      phoneRaw: '0354248177',
      zaloUrl: 'https://zalo.me/0354248177',
      facebookUrl: 'https://zalo.me/0354248177',
      paymentBankCode: 'MB',
      paymentBankName: 'MB Bank — Ngân hàng Quân Đội',
      paymentAccountNo: '0354248177',
      paymentAccountName: '',
      adminPin: 'admin123',
      packages: JSON.parse(JSON.stringify(DEFAULT_PACKAGES_V9)),
    },
    customTemplates: [],
    templates: JSON.parse(JSON.stringify(TEMPLATES)),
    chatbotConfig: JSON.parse(JSON.stringify(DEFAULT_CHATBOT_CONFIG)),
    bookings: [
      {
        id: 'bk_demo_1',
        userId: '',
        name: 'Trần Ngọc Hân',
        phone: '0938 441 209',
        email: 'ngochan.wedding@gmail.com',
        date: '2026-11-28',
        timeSlot: '19:30',
        channel: 'Zalo Call',
        service: 'Tư vấn phối màu hợp mệnh Ngũ Hành & Gói 369k',
        note: 'Chú rể 1995, cô dâu 1998, muốn phong cách sang trọng tông đỏ rượu hoặc xanh lục bảo.',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'bk_demo_2',
        userId: '',
        name: 'Phạm Đức Anh',
        phone: '0912 665 890',
        email: '',
        date: '2026-11-29',
        timeSlot: '14:00',
        channel: 'Nhắn tin Zalo',
        service: 'Thiết kế riêng theo bộ ảnh cưới Đà Lạt (Gói 599k)',
        note: 'Cần hoàn thiện trước ngày 10/12 để gửi khách mời.',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    chatThreads: [
      {
        id: 'th_demo_1',
        userId: '',
        customerName: 'Nguyễn Thảo Vy',
        customerPhone: '0977 321 654',
        customerEmail: 'thaovy@gmail.com',
        botActive: true,
        unreadByAdmin: 1,
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        messages: [
          {
            id: 'm_d1',
            sender: 'customer',
            text: 'Chào shop, mình muốn hỏi bảng giá các gói thiệp cưới và xem màu hợp mệnh Mộc ạ?',
            createdAt: new Date(Date.now() - 1900000).toISOString(),
          },
          {
            id: 'm_d2',
            sender: 'bot',
            text: DEFAULT_CHATBOT_CONFIG.rules[0].reply,
            createdAt: new Date(Date.now() - 1880000).toISOString(),
          },
          {
            id: 'm_d3',
            sender: 'customer',
            text: 'Gói 369k rất hợp lý, shop tư vấn giúp mình mẫu xanh lục bảo nhé!',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
          },
        ],
      },
    ],
    consultations: [
      {
        id: 'cs_demo_1',
        userId: '',
        email: 'minhquan@gmail.com',
        kind: 'qr_order',
        name: 'Nguyễn Minh Quân',
        phone: '0901 234 567',
        templateId: 'nhung-do-co-dien',
        templateName: 'Nhung Đỏ Cung Điện',
        packageName: 'Gói Cao Cấp Phong Thủy',
        amount: 369000,
        transferCode: 'THIEP NHUNGDO 0901234567',
        message: 'Đã chuyển khoản MB Bank 0354248177, nhờ shop mở khóa bản chính thức.',
        status: 'paid',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    invitations: [inv1, inv2],
  };
}
