/**
 * state.js - Quản lý trạng thái tập trung & Lưu trữ LocalStorage
 */

import { NAM_O_HERITAGE_SITES } from '../data/relics.js';

export const state = {
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
  customVideos: {},
  targetUploadSiteId: null,
  targetVideoSiteId: null
};

/**
 * Tải ảnh đã lưu từ LocalStorage khi khởi động
 */
export function loadStoredImages() {
  NAM_O_HERITAGE_SITES.forEach(site => {
    const stored = localStorage.getItem(`nam_o_img_${site.id}`);
    if (stored) {
      state.userImages[site.id] = stored;
    }
  });
}

/**
 * Lưu ảnh người dùng tải lên vào State và LocalStorage
 */
export function saveUserImage(siteId, base64) {
  state.userImages[siteId] = base64;
  try {
    localStorage.setItem(`nam_o_img_${siteId}`, base64);
  } catch (err) {
    console.warn("LocalStorage dung lượng đầy:", err);
  }
  syncImageEverywhere(siteId, base64);
}

/**
 * Lưu video tùy chỉnh người dùng chọn xem thử
 */
export function saveCustomVideo(siteId, videoUrl) {
  state.customVideos[siteId] = videoUrl;
}

/**
 * Đồng bộ ảnh mới cập nhật tức thì trên tất cả các thành phần giao diện
 */
export function syncImageEverywhere(siteId, src) {
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

  // 3. Cập nhật Inspector nếu đang soi di tích này
  if (state.activeSiteId === siteId) {
    const inspMedia = document.getElementById("insp-media-box");
    const inspImg = document.getElementById("insp-loaded-img");
    if (inspMedia && inspImg) {
      inspImg.src = src;
      inspMedia.classList.add("has-image");
    }
  }

  // 4. Cập nhật Modal nếu đang mở di tích này
  const modalHero = document.getElementById("modal-hero-box");
  const modalImg = document.getElementById("modal-hero-img");
  if (modalHero && modalImg && state.activeSiteId === siteId) {
    modalImg.src = src;
    modalHero.classList.add("has-image");
  }
}

