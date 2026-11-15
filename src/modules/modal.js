/**
 * modal.js - Điều khiển Cửa sổ chi tiết di tích, Tabs chuyển đổi, Gallery & Video
 */

import { NAM_O_HERITAGE_SITES, getPinColor } from '../data/relics.js';
import { state } from './state.js';
import { focusRelicOnMap } from './map.js';

export function initModal() {
  // Lắng nghe bấm chuyển tabs
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchModalTab(tab);
    });
  });

  // Lắng nghe click ngoài nền để đóng modal
  const modalBackdrop = document.getElementById("relic-modal");
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target.id === "relic-modal") closeDetailModal();
    });
  }

  // Lắng nghe phím ESC để đóng modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetailModal();
  });
}

export function switchModalTab(tabKey) {
  document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".modal-tab-pane").forEach(p => p.classList.remove("active"));

  if (tabKey !== "video") {
    document.querySelectorAll("#modal-video-container video").forEach(v => v.pause());
  }

  const targetBtn = document.getElementById(`tab-btn-${tabKey}`);
  const targetPane = document.getElementById(`modal-pane-${tabKey}`);
  if (targetBtn) targetBtn.classList.add("active");
  if (targetPane) targetPane.classList.add("active");
}

export function openDetailModal(siteId, initialTab = "info") {
  const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
  if (!site) return;

  state.activeSiteId = site.id;
  window.activeSiteId = site.id;

  const pinColor = getPinColor(site.number);
  const imgSrc = state.userImages[site.id] || site.image;

  // 1. Cập nhật Hero Image
  const modalHero = document.getElementById("modal-hero-box");
  const modalImg = document.getElementById("modal-hero-img");
  if (modalImg && modalHero) {
    modalImg.src = imgSrc;
    modalHero.classList.add("has-image");
  }

  // 2. Cập nhật Tiêu đề & Subtitle
  const modalBadge = document.getElementById("modal-badge");
  if (modalBadge) {
    modalBadge.innerText = `DI TÍCH • ${site.category}`;
    modalBadge.style.color = pinColor;
    modalBadge.style.background = `${pinColor}18`;
  }

  const titleEl = document.getElementById("modal-title");
  if (titleEl) titleEl.innerText = site.title;

  const subtitleEl = document.getElementById("modal-subtitle");
  if (subtitleEl) subtitleEl.innerText = site.subTitle;

  // 3. Tab 1: Thông tin & Lịch sử
  const addrEl = document.getElementById("modal-address");
  if (addrEl) addrEl.innerText = site.address;

  const coordsEl = document.getElementById("modal-coords");
  if (coordsEl) {
    coordsEl.innerText = `${site.coordinates.lat.toFixed(5)}, ${site.coordinates.lng.toFixed(5)} (${site.plusCode})`;
  }

  const eraEl = document.getElementById("modal-era");
  if (eraEl) eraEl.innerText = site.era;

  const hlUl = document.getElementById("modal-highlights-list");
  if (hlUl) {
    hlUl.innerHTML = site.highlights.map(h => `<li>✦ ${h}</li>`).join("");
  }

  const narrativeEl = document.getElementById("modal-narrative-text");
  if (narrativeEl) {
    narrativeEl.innerHTML = site.fullHistory.map(p => `<p style="margin-bottom:12px;">${p}</p>`).join("");
  }

  const gmapsLink = document.getElementById("modal-gmaps-link");
  if (gmapsLink) gmapsLink.href = site.googleMapsUrl;

  // 4. Tab 2: Render thư viện ảnh liên quan
  renderModalGallery(site);

  // 5. Tab 3: Render video liên quan & Hướng dẫn đường đi
  renderModalVideo(site);

  // 6. Kích hoạt tab mặc định
  switchModalTab(initialTab);

  // Mở modal
  const modal = document.getElementById("relic-modal");
  if (modal) modal.classList.add("open");
}

export function renderModalGallery(site) {
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
      if (modalImg) modalImg.src = imgUrl;
      const modalHero = document.getElementById("modal-hero-box");
      if (modalHero) modalHero.classList.add("has-image");
    };
    galleryGrid.appendChild(item);
  });
}

export function renderModalVideo(site) {
  const container = document.getElementById("modal-video-container");
  if (!container) return;
  container.innerHTML = "";

  const tabVideoTitle = document.getElementById("tab-video-title");
  const tabVideoBadge = document.getElementById("tab-video-badge");

  // TRƯỜNG HỢP 1: MIẾU BÀ BÔ BÔ (VIDEO HƯỚNG DẪN ĐƯỜNG ĐI VÀO NẾU CHƯA CÓ VIDEO TƯ LIỆU)
  if (site.id === "mieu-ba-bo-bo" && (!site.videos || site.videos.length === 0)) {
    if (tabVideoTitle) tabVideoTitle.innerText = "Video Hướng Dẫn";
    if (tabVideoBadge) {
      tabVideoBadge.style.display = "inline-flex";
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

        <div class="modal-video-wrapper">
          <video id="modal-active-video-player" controls preload="metadata" playsinline poster="${site.image}">
            <source src="${guideVideoSrc}" type="video/mp4">
            Trình duyệt không hỗ trợ phát thẻ video.
          </video>
        </div>
      </div>
    `;
    return;
  }

  // TRƯỜNG HỢP 2: CÁC DI TÍCH CÓ VIDEO TƯ LIỆU
  const videos = site.videos || [];
  if (videos.length > 0) {
    if (tabVideoTitle) tabVideoTitle.innerText = "Video Tư Liệu";
    if (tabVideoBadge) {
      tabVideoBadge.style.display = "inline-flex";
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

    // Danh sách nhiều video tư liệu
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

    // Tự động tạm dừng các video khác khi 1 video bắt đầu phát
    container.querySelectorAll("video").forEach(v => {
      v.addEventListener("play", () => {
        container.querySelectorAll("video").forEach(other => {
          if (other !== v) other.pause();
        });
      });
    });

    return;
  }

  // TRƯỜNG HỢP 3: CHƯA CÓ VIDEO (Dự phòng thông báo tinh gọn)
  if (tabVideoTitle) tabVideoTitle.innerText = "Video Tư Liệu";
  if (tabVideoBadge) tabVideoBadge.style.display = "none";

  container.innerHTML = `
    <div class="modal-video-card">
      <div class="modal-video-helper-box" style="padding: 36px 20px;">
        <div class="helper-video-icon" style="background:#f1f5f9; color:#64748b;">
          <i class="fa-solid fa-film"></i>
        </div>
        <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin:0;">Video đang được chuẩn bị</h3>
        <p class="helper-video-text">
          Tư liệu video của di tích đang được biên tập để phục vụ người xem tốt nhất.
        </p>
      </div>
    </div>
  `;
}

export function closeDetailModal() {
  document.querySelectorAll("#modal-video-container video").forEach(v => v.pause());
  const modal = document.getElementById("relic-modal");
  if (modal) modal.classList.remove("open");
}

export function focusRelicFromModal() {
  const siteId = state.activeSiteId;
  closeDetailModal();
  focusRelicOnMap(siteId);
}
