/**
 * cards.js - Lưới 7 thẻ di tích tinh gọn & Bộ lọc chủ đề
 */

import { NAM_O_HERITAGE_SITES, getPinColor } from '../data/relics.js';
import { state } from './state.js';
import { updateInspector, activatePin } from './map.js';
import { openDetailModal } from './modal.js';

/**
 * Render lưới thẻ di tích theo bộ lọc hiện tại
 */
export function renderRelicsCardsGrid() {
  const grid = document.getElementById("relics-cards-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const filtered = NAM_O_HERITAGE_SITES.filter(site => {
    return state.currentFilter === "all" || site.categoryKey === state.currentFilter;
  });

  filtered.forEach(site => {
    const pinColor = getPinColor(site.number);
    const imgSrc = state.userImages[site.id] || site.image;
    const hasImage = !!imgSrc;
    const hasVideo = !!(site.guideVideo || (site.videos && site.videos.length > 0));
    const isHoverVideo = !!site.hoverVideo;

    const card = document.createElement("article");
    card.className = `relic-simple-card ${isHoverVideo ? 'has-hover-video' : ''}`;
    card.id = `card-${site.id}`;
    card.title = isHoverVideo 
      ? `Rê chuột hoặc chạm giữ để xem video quay ${site.title}, nhấp để xem chi tiết`
      : `Nhấp xem hình ảnh, video và thông tin chi tiết của ${site.title}`;

    card.innerHTML = `
      <!-- Khung ảnh di tích có Skeleton Loading -->
      <div class="relic-simple-media ${hasImage ? 'has-image' : ''}" id="card-media-${site.id}">
        <div class="photo-slide-skeleton">
          <span class="slide-skel-icon" style="font-size:1.8rem;"><i class="fa-regular fa-image"></i></span>
          <span class="slide-skel-badge"><i class="fa-solid fa-arrow-pointer"></i> Nhấp xem chi tiết</span>
        </div>
        <img src="${imgSrc}" class="relic-simple-img" id="card-img-${site.id}" alt="${site.title}" onerror="window.handleCardImgError('${site.id}')" onload="window.handleCardImgSuccess('${site.id}')" />
        
        <!-- Video phát khi rê chuột / chạm giữ (Miếu Bà Bô Bô) -->
        ${isHoverVideo ? `
          <video class="relic-hover-video" id="hover-vid-${site.id}" src="${site.hoverVideo}" preload="metadata" muted loop playsinline></video>
        ` : ''}

        <!-- Nhãn thông báo video nếu di tích có video -->
        ${hasVideo ? `
          <div class="relic-simple-video-pill">
            <i class="fa-solid fa-play"></i>
            <span>Video</span>
          </div>
        ` : ''}

        <!-- Lớp phủ gợi ý khi rê chuột (chỉ hiện khi không phải hover video) -->
        ${!isHoverVideo ? `
          <div class="relic-simple-overlay-hint">
            <span><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem chi tiết & Media</span>
          </div>
        ` : ''}
      </div>

      <!-- Tên di tích tinh gọn -->
      <div class="relic-simple-caption">
        <h3 class="relic-simple-title">${site.title}</h3>
      </div>
    `;

    if (isHoverVideo) {
      const mediaBox = card.querySelector(`#card-media-${site.id}`);
      const videoEl = card.querySelector(`#hover-vid-${site.id}`);
      let touchTimer = null;
      let isHolding = false;

      const startPlaying = () => {
        if (!mediaBox || !videoEl) return;
        mediaBox.classList.add("is-video-hovering");
        videoEl.play().catch(() => {});
      };

      const stopPlaying = () => {
        if (!mediaBox || !videoEl) return;
        mediaBox.classList.remove("is-video-hovering");
        videoEl.pause();
      };

      // Desktop: Hover mouse in/out
      card.addEventListener("mouseenter", startPlaying);
      card.addEventListener("mouseleave", stopPlaying);

      // Mobile: Touch & Hold
      card.addEventListener("touchstart", () => {
        isHolding = false;
        touchTimer = setTimeout(() => {
          isHolding = true;
          startPlaying();
        }, 180);
      }, { passive: true });

      card.addEventListener("touchend", (e) => {
        if (touchTimer) clearTimeout(touchTimer);
        if (isHolding) {
          stopPlaying();
          e.preventDefault();
        }
      });

      card.addEventListener("touchcancel", () => {
        if (touchTimer) clearTimeout(touchTimer);
        if (isHolding) stopPlaying();
      });

      card.onclick = () => {
        if (isHolding) {
          isHolding = false;
          return;
        }
        openDetailModal(site.id);
      };
    } else {
      card.onclick = () => openDetailModal(site.id);
    }

    grid.appendChild(card);
  });
}

/**
 * Cuộn mượt màn hình tới thẻ di tích cụ thể và phát sáng viền
 */
export function scrollToRelicCard(siteId) {
  const targetCard = document.getElementById(`card-${siteId}`);
  if (!targetCard) return;

  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

  document.querySelectorAll(".relic-simple-card").forEach(c => c.classList.remove("card-targeted"));
  targetCard.classList.add("card-targeted");

  setTimeout(() => {
    targetCard.classList.remove("card-targeted");
  }, 2200);

  const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
  if (site) {
    updateInspector(site);
    activatePin(site.id);
  }
}

export function handleCardImgError(siteId) {
  const box = document.getElementById(`card-media-${siteId}`);
  if (box) box.classList.remove("has-image");
}

export function handleCardImgSuccess(siteId) {
  const box = document.getElementById(`card-media-${siteId}`);
  if (box) box.classList.add("has-image");
}

/**
 * Khởi tạo sự kiện bấm cho thanh bộ lọc chuyên đề
 */
export function initFilterChips() {
  document.querySelectorAll(".chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.dataset.filter;

      renderRelicsCardsGrid();

      if (state.map) {
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
      }
    });
  });
}

