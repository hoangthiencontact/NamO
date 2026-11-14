# LANDING PAGE: BẢN ĐỒ TƯƠNG TÁC 7 DI TÍCH LỊCH SỬ NAM Ô ("NAM Ô THẤT BẢO")
> Dự án tham dự cuộc thi: **"Dấu Chân Di Sản"** – *Lan tỏa Dấu ấn Di sản địa phương*  
> Địa bàn: Làng chài cổ Nam Ô, phường Hòa Hiệp Nam, quận Liên Chiểu, thành phố Đà Nẵng.

---

## ⚡ HƯỚNG DẪN KHỞI CHẠY (NPM RUN DEV)

Dự án đã được module hóa hoàn chỉnh với **Vite**:

```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy môi trường phát triển (Hot Module Replacement)
npm run dev

# Đóng gói xuất bản cho Production (vào thư mục dist/)
npm run build

# Xem thử bản đóng gói production
npm run preview
```

Server phát triển sẽ tự động mở tại: **`http://localhost:3000/`**

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN (MODULAR ARCHITECTURE)

Dự án được phân chia rõ ràng thành các module độc lập, dễ bảo trì và mở rộng:

```text
LandingPage/
├── index.html                   # HTML chính của Landing Page
├── package.json                 # Cấu hình scripts & dependencies Vite
├── vite.config.js               # Cấu hình cổng dev (3000) & build output
├── public/                      # Static assets phục vụ trực tiếp cho Vite
│   ├── images/                  # Liên kết/chứa ảnh di tích
│   └── videos/                  # Liên kết/chứa video tư liệu
├── images/                      # Thư mục ảnh di tích
├── videos/                      # Thư mục video tư liệu
└── src/
    ├── main.js                  # Entry point chính của ứng dụng
    ├── data/
    │   └── relics.js            # Dữ liệu chi tiết 7 di tích lịch sử Nam Ô
    ├── styles/                  # Toàn bộ CSS modules độc lập
    │   ├── main.css             # Điểm tập hợp import toàn bộ styles
    │   ├── variables.css        # Hệ thống biến màu sắc Google, font, bóng đổ
    │   ├── base.css             # Reset CSS, typography và buttons dùng chung
    │   ├── navbar.css           # Glass Floating Navbar cố định đầu trang
    │   ├── hero.css             # Hero Carousel & Swiper ảnh lớn
    │   ├── map.css              # Bản đồ Leaflet, Dashboard, Inspector soi thông tin
    │   ├── pins.css             # Marker ghim phong cách Google Pins & Popups
    │   ├── cards.css            # Lưới 7 thẻ di tích tinh gọn & hiệu ứng pulse
    │   ├── stories.css          # Dấu ấn văn hóa làng biển
    │   ├── footer.css           # Chân trang Landing Page
    │   ├── modal.css            # Modal chi tiết, Tabs (Info/Gallery/Video)
    │   └── responsive.css       # Tinh chỉnh giao diện di động & tablet
    └── modules/                 # Toàn bộ JavaScript logic chia theo nghiệp vụ
        ├── state.js             # Quản lý State tập trung & LocalStorage
        ├── carousel.js          # Điều khiển Swiper.js Touch Carousel
        ├── map.js               # Khởi tạo Leaflet map, layers, markers, Auto-Tour
        ├── cards.js             # Render thẻ di tích, lọc danh mục & cuộn mượt
        ├── modal.js             # Cửa sổ chi tiết di tích, tab switching, video
        └── upload.js            # Tải ảnh / chọn video từ máy tính
```

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Touch Carousel Siêu Mượt (Swiper.js Engine)**:
   - Trượt cảm ứng mượt mà 60fps trên điện thoại và máy tính.
   - Bấm vào bất kỳ ảnh nào để trỏ đến thẻ di tích hoặc mở Modal chi tiết.
2. **Đồng bộ Hai Chiều (Bi-directional Sync)**:
   - Rê chuột trên bản đồ -> Tự động chuyển slide Carousel và cập nhật bảng Inspector bên cạnh.
3. **Bản đồ Vệ tinh Google Maps & Ghim Tương tác**:
   - Lớp bản đồ Google Vệ tinh (Hybrid), Google Đường bộ (Streets) và OSM.
   - Ghim vị trí màu sắc nhận diện chuẩn theo từng số thứ tự di tích.
4. **Modal Đa Phương Tiện (Tabs Thông Tin - Gallery - Video)**:
   - Tab 1: Thông tin, tọa độ, niên đại, điểm nổi bật và quá trình lịch sử.
   - Tab 2: Bộ sưu tập hình ảnh tư liệu phóng to sắc nét của từng di tích.
   - Tab 3: Trình phát video tư liệu HTML5 sắc nét (100% cảnh quay di tích, không dính người), tự động nhận diện video của từng di tích kèm nút chọn video tùy chỉnh.
5. **Video Trải Nghiệm & Tương Tác Cảm Ứng (Miếu Bà Bô Bô)**:
   - Thẻ Miếu Bà Bô Bô tích hợp video: Khi rê chuột (`mouseenter`) trên máy tính hoặc chạm giữ tay (`touchstart`) trên điện thoại, video lập tức chuyển động phát mượt mà; khi thả tay / rời chuột sẽ tự động dừng.
   - Nhấp nhanh để mở Modal xem chi tiết và phát video toàn màn hình.
6. **Nạp & Lưu Ảnh/Video Tức Thì**:
   - Tải ảnh trực tiếp từ máy tính/điện thoại, tự động lưu vào LocalStorage và cập nhật đồng bộ trên toàn bộ trang.
