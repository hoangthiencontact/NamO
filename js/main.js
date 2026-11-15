/**
 * NAM Ô THẤT BẢO - CONTROLLER LANDING PAGE
 * Carousel Chỉ Hiện Ảnh Lớn -> Nhấp vào ảnh tự động cuộn trỏ tới Thẻ Di Tích
 * Đồng bộ với Bản đồ tương tác Google Maps và nạp ảnh tức thì
 */

document.addEventListener("DOMContentLoaded", () => {
  // Trạng thái ứng dụng
  const state = {
    map: null,
    swiper: null,
    baseLayers: {},
    currentLayerName: "google-hybrid",
    markers: {},
    popups: {},
    activeSiteId: "dinh-lang-nam-o",
    currentFilter: "all",
    tourInterval: null,
    tourIndex: 0,
    userImages: {},
    customVideos: {}
  };

  function loadStoredImages() {
    NAM_O_HERITAGE_SITES.forEach(site => {
      const stored = localStorage.getItem(`nam_o_img_${site.id}`);
      if (stored) {
        state.userImages[site.id] = stored;
      }
    });
  }

  function getPinColor(num) {
    switch (num) {
      case "01": return "#f29900"; // Google Yellow
      case "02": return "#1a73e8"; // Google Blue
      case "03": return "#12b5cb"; // Google Teal
      case "04": return "#a142f4"; // Google Purple
      case "05": return "#fa7b17"; // Google Orange
      case "06": return "#ea4335"; // Google Red
      case "07": return "#d93025"; // Google Dark Red
      default: return "#1a73e8";
    }
  }

  // =========================================================================
  // 1. CAROUSEL CHỈ HIỆN ẢNH LỚN -> BẤM VÀO TRỎ TỚI THẺ CHI TIẾT
  // =========================================================================
  function renderPhotoCarouselSlides() {
    const wrapper = document.getElementById("carousel-slides-wrapper");
    wrapper.innerHTML = "";

    NAM_O_HERITAGE_SITES.forEach((site, index) => {
      const pinColor = getPinColor(site.number);
      const hasImage = !!state.userImages[site.id];
      const imgSrc = state.userImages[site.id] || site.image;

      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.dataset.siteId = site.id;

      // Khung CHỈ HIỆN ẢNH LỚN kèm tiêu đề tối giản nổi góc dưới
      slide.innerHTML = `
        <div class="photo-slide-card ${hasImage ? 'has-image' : ''}" id="photo-slide-${site.id}" onclick="openDetailModal('${site.id}')" title="Nhấp để xem ảnh, video và thông tin chi tiết của ${site.title}">
          
          <!-- Khung ảnh lớn có Skeleton Shimmer cao cấp -->
          <div class="photo-slide-skeleton">
            <span class="slide-skel-icon"><i class="fa-regular fa-image"></i></span>
            <span class="slide-skel-badge"><i class="fa-solid fa-arrow-pointer"></i> Nhấp xem chi tiết</span>
          </div>

          <img src="${imgSrc}" class="slide-real-image" id="slide-img-${site.id}" alt="${site.title}" onerror="handleSlideImgError('${site.id}')" onload="handleSlideImgSuccess('${site.id}')" />

          <!-- Bảng tiêu đề: Chỉ để đúng tên địa danh (Viết hoa toàn bộ) -->
          <div class="slide-overlay-caption">
            <div class="slide-overlay-title">
              <span>${site.title.toUpperCase()}</span>
            </div>
          </div>

        </div>
      `;

      wrapper.appendChild(slide);
    });
  }

  function initSwiper() {
    state.swiper = new Swiper("#relics-swiper", {
      slidesPerView: 1.15,
      spaceBetween: 16,
      centeredSlides: true,
      loop: false,
      grabCursor: true,
      speed: 650,
      pagination: {
        el: "#swiper-pagination-dots",
        clickable: true,
        dynamicBullets: true
      },
      navigation: {
        nextEl: "#swiper-next-btn",
        prevEl: "#swiper-prev-btn"
      },
      breakpoints: {
        640: {
          slidesPerView: 1.8,
          spaceBetween: 20,
          centeredSlides: false
        },
        900: {
          slidesPerView: 2.3,
          spaceBetween: 24,
          centeredSlides: false
        },
        1200: {
          slidesPerView: 2.6,
          spaceBetween: 26,
          centeredSlides: false
        }
      }
    });

    state.swiper.on("slideChange", () => {
      const activeSlide = state.swiper.slides[state.swiper.activeIndex];
      if (activeSlide) {
        const siteId = activeSlide.dataset.siteId;
        const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
        if (site) {
          updateInspector(site);
          activatePin(site.id);
        }
      }
    });
  }

  window.handleSlideImgError = function (siteId) {
    const card = document.getElementById(`photo-slide-${siteId}`);
    if (card) card.classList.remove("has-image");
  };

  window.handleSlideImgSuccess = function (siteId) {
    const card = document.getElementById(`photo-slide-${siteId}`);
    if (card) card.classList.add("has-image");
  };

  // =========================================================================
  // HÀNH ĐỘNG: BẤM VÀO ẢNH CAROUSEL THÌ TRỎ TỚI THẺ CHI TIẾT
  // =========================================================================
  window.scrollToRelicCard = function (siteId) {
    const targetCard = document.getElementById(`card-${siteId}`);
    if (!targetCard) return;

    // Cuộn mượt màn hình tới thẻ đó
    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

    // Kích hoạt hiệu ứng phát sáng viền và nhấp nháy thu hút sự chú ý
    document.querySelectorAll(".relic-simple-card").forEach(c => c.classList.remove("card-targeted"));
    targetCard.classList.add("card-targeted");

    setTimeout(() => {
      targetCard.classList.remove("card-targeted");
    }, 2200);

    // Đồng thời định vị trên bản đồ
    const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
    if (site) {
      updateInspector(site);
      activatePin(site.id);
    }
  };

  // =========================================================================
  // 2. RENDER LƯỚI THẺ DI TÍCH TINH GỌN (CHỈ HIỂN THỊ ẢNH VÀ TÊN DI TÍCH)
  // =========================================================================
  function renderRelicsCardsGrid() {
    const grid = document.getElementById("relics-cards-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const filtered = NAM_O_HERITAGE_SITES.filter(site => {
      return state.currentFilter === "all" || site.categoryKey === state.currentFilter;
    });

    filtered.forEach(site => {
      const pinColor = getPinColor(site.number);
      const hasImage = !!state.userImages[site.id];
      const imgSrc = state.userImages[site.id] || site.image;
      const hasVideo = !!(site.guideVideo || (site.videos && site.videos.length > 0));

      const card = document.createElement("article");
      card.className = "relic-simple-card";
      card.id = `card-${site.id}`;
      card.title = `Nhấp xem hình ảnh, video và thông tin chi tiết của ${site.title}`;
      card.onclick = () => openDetailModal(site.id);

      card.innerHTML = `
        <!-- Khung ảnh di tích có Skeleton Loading -->
        <div class="relic-simple-media ${hasImage ? 'has-image' : ''}" id="card-media-${site.id}">
          <div class="photo-slide-skeleton">
            <span class="slide-skel-icon" style="font-size:1.8rem;"><i class="fa-regular fa-image"></i></span>
            <span class="slide-skel-badge"><i class="fa-solid fa-arrow-pointer"></i> Nhấp xem chi tiết</span>
          </div>
          <img src="${imgSrc}" class="relic-simple-img" id="card-img-${site.id}" alt="${site.title}" onerror="handleCardImgError('${site.id}')" onload="handleCardImgSuccess('${site.id}')" />
          
          <!-- Huy hiệu số thứ tự di tích -->
          <div class="relic-simple-num-badge" style="background:${pinColor};">
            <span>${site.number}</span>
          </div>

          <!-- Nhãn thông báo video nếu di tích có video -->
          ${hasVideo ? `
            <div class="relic-simple-video-pill">
              <i class="fa-solid fa-play"></i>
              <span>${site.id === 'mieu-ba-bo-bo' && (!site.videos || site.videos.length <= 1) ? 'Video chỉ đường' : 'Video'}</span>
            </div>
          ` : ''}

          <!-- Lớp phủ gợi ý khi rê chuột -->
          <div class="relic-simple-overlay-hint">
            <span><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem chi tiết & Media</span>
          </div>
        </div>

        <!-- Tên di tích tinh gọn -->
        <div class="relic-simple-caption">
          <h3 class="relic-simple-title">${site.title}</h3>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  window.handleCardImgError = function (siteId) {
    const box = document.getElementById(`card-media-${siteId}`);
    if (box) box.classList.remove("has-image");
  };

  window.handleCardImgSuccess = function (siteId) {
    const box = document.getElementById(`card-media-${siteId}`);
    if (box) box.classList.add("has-image");
  };

  // Cuộn lên bản đồ khi bấm "Xem trên bản đồ"
  window.focusRelicOnMap = function (siteId) {
    const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
    if (!site) return;

    document.getElementById("ban-do").scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      state.map.flyTo([site.coordinates.lat + 0.0006, site.coordinates.lng], 17, { duration: 0.9 });
      activatePin(site.id);
      updateInspector(site);

      const marker = state.markers[site.id];
      if (marker) marker.openPopup();
    }, 450);
  };

  // =========================================================================
  // 3. KHỞI TẠO BẢN ĐỒ LEAFLET VỚI GOOGLE MAPS
  // =========================================================================
  function initMap() {
    state.map = L.map("map-container", {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      zoomSnap: 0.1,
      scrollWheelZoom: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    state.map.on("click", () => state.map.scrollWheelZoom.enable());

    state.baseLayers["google-hybrid"] = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "&copy; Google Maps" }
    );

    state.baseLayers["google-streets"] = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "&copy; Google Maps" }
    );

    state.baseLayers["osm"] = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19, attribution: "&copy; OpenStreetMap" }
    );

    state.baseLayers["google-hybrid"].addTo(state.map);

    renderMapMarkers();
    updateInspector(NAM_O_HERITAGE_SITES[0]);
  }

  function renderMapMarkers() {
    NAM_O_HERITAGE_SITES.forEach((site, index) => {
      const pinColor = getPinColor(site.number);

      const pinHtml = `
        <div class="google-pin-container" id="pin-${site.id}">
          <div class="google-pin">
            <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 30.5 18 44 18 44C18 44 36 30.5 36 18C36 8.06 27.94 0 18 0Z" fill="${pinColor}"/>
              <circle cx="18" cy="16" r="11" fill="#FFFFFF"/>
            </svg>
            <span class="pin-label" style="color:${pinColor};">${site.number}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "google-pin-wrapper",
        html: pinHtml,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44]
      });

      const marker = L.marker([site.coordinates.lat, site.coordinates.lng], {
        icon: customIcon,
        title: site.title,
        riseOnHover: true
      }).addTo(state.map);

      const popupContent = `
        <div class="google-popup-card">
          <div class="google-popup-header">
            <span class="google-popup-badge" style="color:${pinColor}; background:${pinColor}18;">
              DI TÍCH ${site.number}
            </span>
            <span class="google-popup-rating">★ 5.0</span>
          </div>
          <div class="google-popup-title">${site.title}</div>
          <div class="google-popup-desc">${site.shortDesc}</div>
          <div class="google-popup-actions">
            <button onclick="openDetailModal('${site.id}')" class="google-popup-btn primary">
              Xem chi tiết
            </button>
            <a href="${site.googleMapsUrl}" target="_blank" class="google-popup-btn secondary">
              Chỉ đường
            </a>
          </div>
        </div>
      `;

      const popup = L.popup({
        offset: [0, -2],
        closeButton: false,
        autoPan: true,
        autoPanPaddingTopLeft: [20, 20],
        autoPanPaddingBottomRight: [20, 20]
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // ==========================================================
      // TƯƠNG TÁC SỜ CHUỘT (HOVER TRÊN BẢN ĐỒ)
      // ==========================================================
      marker.on("mouseover", () => {
        marker.openPopup();
        activatePin(site.id);
        updateInspector(site);
        if (state.swiper) {
          state.swiper.slideTo(index, 450);
        }
      });

      marker.on("click", () => {
        openDetailModal(site.id);
      });

      state.markers[site.id] = marker;
      state.popups[site.id] = popup;
    });
  }

  function activatePin(siteId) {
    document.querySelectorAll(".google-pin-container").forEach(el => el.classList.remove("active"));
    const pin = document.getElementById(`pin-${siteId}`);
    if (pin) pin.classList.add("active");
  }

  function updateInspector(site) {
    state.activeSiteId = site.id;
    window.activeSiteId = site.id;

    const pinColor = getPinColor(site.number);
    const hasImage = !!state.userImages[site.id];
    const imgSrc = state.userImages[site.id] || site.image;

    const badgeEl = document.getElementById("insp-badge");
    badgeEl.innerText = `DI TÍCH ${site.number} • ${site.category}`;
    badgeEl.style.color = pinColor;
    badgeEl.style.background = `${pinColor}18`;

    const mediaBox = document.getElementById("insp-media-box");
    const imgEl = document.getElementById("insp-loaded-img");
    imgEl.src = imgSrc;
    if (hasImage) {
      mediaBox.classList.add("has-image");
    } else {
      mediaBox.classList.remove("has-image");
    }

    document.getElementById("insp-title").innerText = site.title;
    document.getElementById("insp-address").querySelector("span").innerText = site.address;
    document.getElementById("insp-desc").innerText = site.shortDesc;
    document.getElementById("insp-btn-gmaps").href = site.googleMapsUrl;
  }

  // =========================================================================
  // 4. BỘ TẢI ẢNH TỪ MÁY TỰ LƯU VÀO LOCALSTORAGE
  // =========================================================================
  let targetUploadSiteId = null;
  const fileInput = document.getElementById("relic-file-input");

  window.triggerUpload = function (siteId) {
    targetUploadSiteId = siteId || state.activeSiteId;
    fileInput.click();
  };

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !targetUploadSiteId) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const base64 = evt.target.result;
      state.userImages[targetUploadSiteId] = base64;
      try {
        localStorage.setItem(`nam_o_img_${targetUploadSiteId}`, base64);
      } catch (err) {
        console.warn("LocalStorage full", err);
      }
      syncImageEverywhere(targetUploadSiteId, base64);
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  });

  function syncImageEverywhere(siteId, src) {
    // 1. Cập nhật Slide Carousel
    const slideCard = document.getElementById(`photo-slide-${siteId}`);
    const slideImg = document.getElementById(`slide-img-${siteId}`);
    if (slideCard && slideImg) {
      slideImg.src = src;
      slideCard.classList.add("has-image");
    }

    // 2. Cập nhật Thẻ di tích
    const cardMedia = document.getElementById(`card-media-${siteId}`);
    const cardImg = document.getElementById(`card-img-${siteId}`);
    if (cardMedia && cardImg) {
      cardImg.src = src;
      cardMedia.classList.add("has-image");
    }

    // 3. Cập nhật Inspector
    if (state.activeSiteId === siteId) {
      const inspMedia = document.getElementById("insp-media-box");
      const inspImg = document.getElementById("insp-loaded-img");
      if (inspMedia && inspImg) {
        inspImg.src = src;
        inspMedia.classList.add("has-image");
      }
    }

    // 4. Cập nhật Modal nếu đang mở
    const modalHero = document.getElementById("modal-hero-box");
    const modalImg = document.getElementById("modal-hero-img");
    if (modalHero && modalImg && state.activeSiteId === siteId) {
      modalImg.src = src;
      modalHero.classList.add("has-image");
    }
  }

  // =========================================================================
  // 5. MODAL CHI TIẾT LỊCH SỬ, BỘ SƯU TẬP ẢNH & VIDEO LIÊN QUAN
  // =========================================================================
  function initModalTabs() {
    document.querySelectorAll(".modal-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        switchModalTab(tab);
      });
    });

    // Lắng nghe chọn file video từ máy
    const videoInput = document.getElementById("relic-video-input");
    if (videoInput) {
      videoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file || !state.targetVideoSiteId) return;

        const videoUrl = URL.createObjectURL(file);
        state.customVideos[state.targetVideoSiteId] = videoUrl;

        // Cập nhật lại khung video
        const site = NAM_O_HERITAGE_SITES.find(s => s.id === state.targetVideoSiteId);
        if (site) {
          renderModalVideo(site);
          const activePlayer = document.getElementById("modal-active-video-player");
          if (activePlayer) {
            activePlayer.src = videoUrl;
            activePlayer.load();
            activePlayer.play().catch(() => { });
          }
        }

        videoInput.value = "";
      });
    }
  }

  function switchModalTab(tabKey) {
    document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".modal-tab-pane").forEach(p => p.classList.remove("active"));

    const targetBtn = document.getElementById(`tab-btn-${tabKey}`);
    const targetPane = document.getElementById(`modal-pane-${tabKey}`);
    if (targetBtn) targetBtn.classList.add("active");
    if (targetPane) targetPane.classList.add("active");
  }

  window.openDetailModal = function (siteId, initialTab = "info") {
    const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
    if (!site) return;

    state.activeSiteId = site.id;
    const pinColor = getPinColor(site.number);
    const hasImage = !!state.userImages[site.id];
    const imgSrc = state.userImages[site.id] || site.image;

    // 1. Cập nhật Hero Image
    const modalHero = document.getElementById("modal-hero-box");
    const modalImg = document.getElementById("modal-hero-img");
    modalImg.src = imgSrc;
    if (hasImage) {
      modalHero.classList.add("has-image");
    } else {
      modalHero.classList.remove("has-image");
    }

    // 2. Cập nhật Tiêu đề & Subtitle
    const modalBadge = document.getElementById("modal-badge");
    modalBadge.innerText = `DI TÍCH ${site.number} • ${site.category}`;
    modalBadge.style.color = pinColor;
    modalBadge.style.background = `${pinColor}18`;

    document.getElementById("modal-title").innerText = site.title;
    document.getElementById("modal-subtitle").innerText = site.subTitle;

    // 3. Tab 1: Thông tin & Lịch sử
    document.getElementById("modal-address").innerText = site.address;
    document.getElementById("modal-coords").innerText = `${site.coordinates.lat.toFixed(5)}, ${site.coordinates.lng.toFixed(5)} (${site.plusCode})`;
    document.getElementById("modal-era").innerText = site.era;

    const hlUl = document.getElementById("modal-highlights-list");
    hlUl.innerHTML = site.highlights.map(h => `<li>✦ ${h}</li>`).join("");

    const narrativeEl = document.getElementById("modal-narrative-text");
    narrativeEl.innerHTML = site.fullHistory.map(p => `<p style="margin-bottom:12px;">${p}</p>`).join("");

    document.getElementById("modal-gmaps-link").href = site.googleMapsUrl;
    document.getElementById("modal-btn-upload").onclick = () => triggerUpload(site.id);

    // 4. Tab 2: Render thư viện ảnh liên quan
    renderModalGallery(site);

    // 5. Tab 3: Render video liên quan & Hướng dẫn đường đi
    renderModalVideo(site);

    // 6. Kích hoạt tab mặc định
    switchModalTab(initialTab);

    // Mở modal
    document.getElementById("relic-modal").classList.add("open");
  };

  function renderModalGallery(site) {
    const galleryGrid = document.getElementById("modal-gallery-grid");
    if (!galleryGrid) return;
    galleryGrid.innerHTML = "";

    const imagesList = [];
    const currentMainImg = state.userImages[site.id] || site.image;
    if (currentMainImg) imagesList.push(currentMainImg);

    if (site.gallery && Array.isArray(site.gallery)) {
      site.gallery.forEach(img => {
        if (!imagesList.includes(img)) imagesList.push(img);
      });
    }

    const countEl = document.getElementById("modal-gallery-count");
    if (countEl) countEl.innerText = imagesList.length;

    imagesList.forEach((imgUrl, idx) => {
      const item = document.createElement("div");
      item.className = `gallery-thumb-item ${idx === 0 ? 'active' : ''}`;
      item.title = "Nhấp để xem ảnh lớn ở khung phía trên";
      item.innerHTML = `<img src="${imgUrl}" class="gallery-thumb-img" alt="${site.title}" onerror="this.parentElement.style.display='none'" />`;
      item.onclick = () => {
        document.querySelectorAll(".gallery-thumb-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
        const modalImg = document.getElementById("modal-hero-img");
        modalImg.src = imgUrl;
        document.getElementById("modal-hero-box").classList.add("has-image");
      };
      galleryGrid.appendChild(item);
    });
  }

  function renderModalVideo(site) {
    const container = document.getElementById("modal-video-container");
    if (!container) return;
    container.innerHTML = "";

    const tabVideoTitle = document.getElementById("tab-video-title");
    const tabVideoBadge = document.getElementById("tab-video-badge");

    // TRƯỜNG HỢP 1: MIẾU BÀ BÔ BÔ (VIDEO HƯỚNG DẪN ĐƯỜNG ĐI VÀO NẾU CHƯA CÓ VIDEO TƯ LIỆU)
    if (site.id === "mieu-ba-bo-bo" && (!site.videos || site.videos.length === 0)) {
      if (tabVideoTitle) tabVideoTitle.innerText = "Video Hướng Dẫn Đường Đi";
      if (tabVideoBadge) {
        tabVideoBadge.style.display = "inline-block";
        tabVideoBadge.innerText = "Chỉ đường";
        tabVideoBadge.style.background = "#fa7b17";
      }

      const guideVideoSrc = state.customVideos[site.id] || site.guideVideo?.src || "videos/huong-dan-mieu-ba-bo-bo.mp4";

      container.innerHTML = `
        <div class="modal-video-card">
          <div class="modal-video-header">
            <span class="modal-video-badge guide">
              <i class="fa-solid fa-route"></i> Video Chỉ Dẫn Đường Đi
            </span>
            <h3 class="modal-video-title">${site.guideVideo?.title || "Video Hướng Dẫn Đường Đi Vào Miếu Bà Bô Bô"}</h3>
            <p class="modal-video-desc">
              ${site.guideVideo?.description || "Lối vào Miếu Bà Bô Bô nằm trong các ngõ cổ làng Nam Ô. Video ghi lại toàn bộ lộ trình từ đường lớn qua các ngã rẽ đến tận cổng miếu."}
            </p>
          </div>

          <!-- Trình phát Video HTML5 -->
          <div class="modal-video-wrapper">
            <video id="modal-active-video-player" controls preload="metadata" playsinline poster="${site.image}">
              <source src="${guideVideoSrc}" type="video/mp4">
              Trình duyệt không hỗ trợ phát thẻ video.
            </video>
          </div>

          <!-- Khung hướng dẫn thêm file video & chọn file từ máy -->
          <div class="modal-video-helper-box" id="guide-video-helper">
            <div class="helper-video-icon"><i class="fa-solid fa-route"></i></div>
            <p class="helper-video-text">
              <strong>Thêm video hướng dẫn:</strong> Sau khi bạn chỉnh sửa xong video, hãy đặt file vào thư mục: 
              <br><span class="helper-video-code">Di_Tich_Lich_Su_Nam_O/videos/huong-dan-mieu-ba-bo-bo.mp4</span>
            </p>
            <div class="helper-video-actions">
              <button class="btn-video-pick" onclick="triggerPickLocalVideo('mieu-ba-bo-bo')">
                <i class="fa-solid fa-file-video"></i> Chọn file video từ máy (Xem thử ngay)
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // TRƯỜNG HỢP 2: CÁC DI TÍCH CÓ VIDEO KHÁC (NHƯ NGHĨA TRỦNG NAM Ô, DINH ÂM LINH)
    const videos = site.videos || [];
    if (videos.length > 0) {
      if (tabVideoTitle) tabVideoTitle.innerText = "Video Tư Liệu";
      if (tabVideoBadge) {
        tabVideoBadge.style.display = "inline-block";
        tabVideoBadge.innerText = videos.length;
        tabVideoBadge.style.background = "#1a73e8";
      }

      if (videos.length === 1) {
        const vidData = videos[0];
        const vidSrc = state.customVideos[site.id] || vidData.src;

        container.innerHTML = `
          <div class="modal-video-card">
            <div class="modal-video-header">
              <span class="modal-video-badge">
                <i class="fa-solid fa-film"></i> ${vidData.badge || "Thước Phim Tư Liệu"}
              </span>
              <h3 class="modal-video-title">${vidData.title}</h3>
              ${vidData.description ? `<p class="modal-video-desc">${vidData.description}</p>` : ''}
            </div>

            <div class="modal-video-wrapper">
              <video id="modal-active-video-player" controls preload="metadata" playsinline poster="${site.image}">
                <source src="${vidSrc}" type="video/mp4">
                Trình duyệt không hỗ trợ phát thẻ video.
              </video>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="modal-videos-list" style="display: flex; flex-direction: column; gap: 24px;">
          ${videos.map((vidData, idx) => {
        const vidSrc = (idx === 0 && state.customVideos[site.id]) ? state.customVideos[site.id] : vidData.src;
        return `
              <div class="modal-video-card">
                <div class="modal-video-header">
                  <span class="modal-video-badge">
                    <i class="fa-solid fa-film"></i> ${vidData.badge || "Thước Phim Tư Liệu"} • Video ${idx + 1}/${videos.length}
                  </span>
                  <h3 class="modal-video-title">${vidData.title}</h3>
                  ${vidData.description ? `<p class="modal-video-desc">${vidData.description}</p>` : ''}
                </div>

                <div class="modal-video-wrapper">
                  <video class="modal-video-player-item" controls preload="metadata" playsinline poster="${site.image}">
                    <source src="${vidSrc}" type="video/mp4">
                    Trình duyệt không hỗ trợ phát thẻ video.
                  </video>
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;

      container.querySelectorAll("video").forEach(v => {
        v.addEventListener("play", () => {
          container.querySelectorAll("video").forEach(other => {
            if (other !== v) other.pause();
          });
        });
      });

      return;
    }

    // TRƯỜNG HỢP 3: CHƯA CÓ VIDEO
    if (tabVideoTitle) tabVideoTitle.innerText = "Video Tư Liệu";
    if (tabVideoBadge) tabVideoBadge.style.display = "none";

    container.innerHTML = `
      <div class="modal-video-card">
        <div class="modal-video-helper-box" style="padding: 36px 20px;">
          <div class="helper-video-icon" style="background:#f1f5f9; color:#64748b;">
            <i class="fa-solid fa-film"></i>
          </div>
          <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin:0;">Chưa có video cho di tích này</h3>
          <p class="helper-video-text">
            Bạn có thể thêm file video vào thư mục <span class="helper-video-code">Di_Tich_Lich_Su_Nam_O/videos/</span> hoặc chọn file video từ máy tính để xem thử tại đây.
          </p>
          <div class="helper-video-actions">
            <button class="btn-video-pick" onclick="triggerPickLocalVideo('${site.id}')">
              <i class="fa-solid fa-cloud-arrow-up"></i> Chọn file video từ máy tính
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.triggerPickLocalVideo = function (siteId) {
    state.targetVideoSiteId = siteId || state.activeSiteId;
    const input = document.getElementById("relic-video-input");
    if (input) input.click();
  };

  window.focusRelicFromModal = function () {
    const siteId = state.activeSiteId;
    closeDetailModal();
    focusRelicOnMap(siteId);
  };

  window.closeDetailModal = function () {
    // Dừng phát tất cả video nếu đang chạy
    document.querySelectorAll("#modal-video-container video").forEach(v => v.pause());
    document.getElementById("relic-modal").classList.remove("open");
  };

  document.getElementById("relic-modal").addEventListener("click", (e) => {
    if (e.target.id === "relic-modal") closeDetailModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetailModal();
  });

  // =========================================================================
  // 6. BỘ LỌC CHIPS THEO CHUYÊN ĐỀ
  // =========================================================================
  document.querySelectorAll(".chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.dataset.filter;

      renderRelicsCardsGrid();

      NAM_O_HERITAGE_SITES.forEach(site => {
        const marker = state.markers[site.id];
        const match = state.currentFilter === "all" || site.categoryKey === state.currentFilter;
        if (marker) {
          if (match) {
            state.map.addLayer(marker);
          } else {
            state.map.removeLayer(marker);
          }
        }
      });
    });
  });

  // =========================================================================
  // 7. CÁC CÔNG CỤ BẢN ĐỒ
  // =========================================================================
  const layerBtn = document.getElementById("btn-layer-menu");
  const layerMenu = document.getElementById("layer-dropdown");

  layerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    layerMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#layer-dropdown") && !e.target.closest("#btn-layer-menu")) {
      layerMenu.classList.remove("show");
    }
  });

  document.querySelectorAll(".layer-drop-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const layerName = btn.dataset.layer;
      if (layerName === state.currentLayerName) return;

      state.map.removeLayer(state.baseLayers[state.currentLayerName]);
      state.baseLayers[layerName].addTo(state.map);
      state.currentLayerName = layerName;

      document.querySelectorAll(".layer-drop-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      layerMenu.classList.remove("show");
    });
  });

  document.getElementById("btn-recenter-view").addEventListener("click", () => {
    state.map.flyTo(MAP_CONFIG.center, MAP_CONFIG.zoom, { duration: 0.8 });
  });

  const autoTourBtn = document.getElementById("btn-auto-tour-mode");
  let isTouring = false;

  autoTourBtn.addEventListener("click", () => {
    if (isTouring) {
      stopAutoTour();
    } else {
      startAutoTour();
    }
  });

  function startAutoTour() {
    isTouring = true;
    autoTourBtn.classList.add("active");
    autoTourBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    state.tourIndex = 0;
    stepAutoTour();
    state.tourInterval = setInterval(stepAutoTour, 5000);
  }

  function stepAutoTour() {
    if (state.tourIndex >= NAM_O_HERITAGE_SITES.length) state.tourIndex = 0;
    const site = NAM_O_HERITAGE_SITES[state.tourIndex];
    state.map.flyTo([site.coordinates.lat + 0.0006, site.coordinates.lng], 17, { duration: 1 });
    activatePin(site.id);
    updateInspector(site);

    const marker = state.markers[site.id];
    if (marker) marker.openPopup();

    if (state.swiper) {
      state.swiper.slideTo(state.tourIndex, 600);
    }
    state.tourIndex++;
  }

  function stopAutoTour() {
    isTouring = false;
    clearInterval(state.tourInterval);
    autoTourBtn.classList.remove("active");
    autoTourBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }

  // Khởi động
  loadStoredImages();
  renderPhotoCarouselSlides();
  renderRelicsCardsGrid();
  initModalTabs();
  initSwiper();
  initMap();
});
