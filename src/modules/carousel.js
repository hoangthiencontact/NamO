/**
 * carousel.js - Khởi tạo và điều khiển Swiper Touch Carousel ảnh lớn
 */

import { NAM_O_HERITAGE_SITES, getPinColor } from '../data/relics.js';
import { state } from './state.js';
import { updateInspector, activatePin } from './map.js';
import { openDetailModal } from './modal.js';

let carouselEventsBound = false;

/**
 * Render danh sách 7 slides ảnh lớn trong Swiper Carousel
 */
export function renderPhotoCarouselSlides() {
  const wrapper = document.getElementById("carousel-slides-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  NAM_O_HERITAGE_SITES.forEach((site) => {
    const pinColor = getPinColor(site.number);
    const imgSrc = state.userImages[site.id] || site.image;
    const hasImage = !!imgSrc;
    const isHoverVideo = !!site.hoverVideo;

    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.dataset.siteId = site.id;

    slide.innerHTML = `
      <div class="photo-slide-card ${hasImage ? 'has-image' : ''} ${isHoverVideo ? 'has-hover-video' : ''}" id="photo-slide-${site.id}" title="${isHoverVideo ? 'Rê chuột hoặc chạm giữ để xem video, nhấp xem chi tiết' : `Nhấp để xem ảnh, video và thông tin chi tiết của ${site.title}`}">
        
        <!-- Khung ảnh lớn có Skeleton Shimmer cao cấp -->
        <div class="photo-slide-skeleton">
          <span class="slide-skel-icon"><i class="fa-regular fa-image"></i></span>
          <span class="slide-skel-badge"><i class="fa-solid fa-arrow-pointer"></i> Nhấp xem chi tiết</span>
        </div>

        <img src="${imgSrc}" class="slide-real-image" id="slide-img-${site.id}" alt="${site.title}" onerror="window.handleSlideImgError('${site.id}')" onload="window.handleSlideImgSuccess('${site.id}')" />

        <!-- Video phát khi rê chuột / chạm giữ (Miếu Bà Bô Bô) -->
        ${isHoverVideo ? `
          <video class="slide-hover-video" id="slide-hover-vid-${site.id}" src="${site.hoverVideo}" preload="metadata" muted loop playsinline></video>
          <div class="slide-hover-badge" id="slide-hover-badge-${site.id}">
            <i class="fa-solid fa-play"></i>
            <span>Video</span>
          </div>
        ` : ''}

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

/**
 * Gắn sự kiện tương tác bằng Event Delegation cho toàn bộ Carousel
 * Đảm bảo hoạt động hoàn hảo cho cả slides gốc và slides nhân bản của Swiper (loop mode)
 */
export function bindCarouselEvents() {
  if (carouselEventsBound) return;
  const swiperContainer = document.getElementById("relics-swiper");
  if (!swiperContainer) return;

  carouselEventsBound = true;

  let touchTimer = null;
  let isHolding = false;
  let activeTouchCard = null;

  const playHoverVideo = (card) => {
    const video = card.querySelector(".slide-hover-video");
    if (!video) return;
    card.classList.add("is-video-hovering");
    video.play().catch(() => {});
  };

  const pauseHoverVideo = (card) => {
    const video = card.querySelector(".slide-hover-video");
    if (!video) return;
    card.classList.remove("is-video-hovering");
    video.pause();
  };

  // 1. Click mở modal chi tiết
  swiperContainer.addEventListener("click", (e) => {
    if (isHolding) {
      isHolding = false;
      return;
    }
    const card = e.target.closest(".photo-slide-card");
    if (!card) return;
    const slide = card.closest(".swiper-slide");
    if (!slide) return;
    const siteId = slide.dataset.siteId;
    if (siteId) {
      openDetailModal(siteId);
    }
  });

  // 2. Desktop: Hover xem video
  swiperContainer.addEventListener("mouseover", (e) => {
    const card = e.target.closest(".photo-slide-card.has-hover-video");
    if (!card) return;
    if (card.contains(e.relatedTarget)) return; // Tránh nhấp nháy khi rê vào phần tử con
    playHoverVideo(card);
  });

  swiperContainer.addEventListener("mouseout", (e) => {
    const card = e.target.closest(".photo-slide-card.has-hover-video");
    if (!card) return;
    if (card.contains(e.relatedTarget)) return; // Di chuyển trong cùng card
    pauseHoverVideo(card);
  });

  // 3. Mobile / Touch: Chạm giữ xem video
  swiperContainer.addEventListener("touchstart", (e) => {
    const card = e.target.closest(".photo-slide-card.has-hover-video");
    if (!card) return;
    activeTouchCard = card;
    isHolding = false;
    touchTimer = setTimeout(() => {
      isHolding = true;
      playHoverVideo(card);
    }, 180);
  }, { passive: true });

  swiperContainer.addEventListener("touchend", (e) => {
    if (touchTimer) clearTimeout(touchTimer);
    if (activeTouchCard && isHolding) {
      pauseHoverVideo(activeTouchCard);
      e.preventDefault();
    }
    activeTouchCard = null;
    isHolding = false;
  });

  swiperContainer.addEventListener("touchcancel", () => {
    if (touchTimer) clearTimeout(touchTimer);
    if (activeTouchCard) {
      pauseHoverVideo(activeTouchCard);
      activeTouchCard = null;
    }
    isHolding = false;
  });
}

/**
 * Khởi tạo Swiper.js với cấu hình lặp vô tận (loop: true) và tự động trượt
 */
export function initSwiper() {
  if (typeof Swiper === "undefined") {
    console.warn("Swiper library is not loaded yet.");
    return;
  }

  // Nếu đã khởi tạo trước đó, hủy an toàn để tạo mới
  if (state.swiper && typeof state.swiper.destroy === "function") {
    state.swiper.destroy(true, true);
  }

  state.swiper = new Swiper("#relics-swiper", {
    slidesPerView: 1.15,
    spaceBetween: 16,
    centeredSlides: true,
    loop: true,
    loopPreventsSliding: false,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
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

  // Khi trượt slide (trong chế độ loop, dùng realIndex để xác định đúng di tích gốc 0..6)
  state.swiper.on("slideChange", () => {
    const realIdx = state.swiper.realIndex;
    const site = NAM_O_HERITAGE_SITES[realIdx];
    if (site) {
      updateInspector(site);
      activatePin(site.id);
    }
  });

  // Gắn sự kiện ủy quyền tương tác
  bindCarouselEvents();
}

export function handleSlideImgError(siteId) {
  document.querySelectorAll(`.swiper-slide[data-site-id="${siteId}"] .photo-slide-card`).forEach(card => {
    card.classList.remove("has-image");
  });
}

export function handleSlideImgSuccess(siteId) {
  document.querySelectorAll(`.swiper-slide[data-site-id="${siteId}"] .photo-slide-card`).forEach(card => {
    card.classList.add("has-image");
  });
}
