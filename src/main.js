/**
 * main.js - Entry Point của Landing Page Nam Ô Thất Bảo
 */

import './styles/main.css';

import { NAM_O_HERITAGE_SITES, MAP_CONFIG, getPinColor } from './data/relics.js';
import { state, loadStoredImages } from './modules/state.js';
import {
  renderPhotoCarouselSlides,
  initSwiper,
  handleSlideImgError,
  handleSlideImgSuccess
} from './modules/carousel.js';
import {
  renderRelicsCardsGrid,
  scrollToRelicCard,
  handleCardImgError,
  handleCardImgSuccess,
  initFilterChips
} from './modules/cards.js';
import {
  initMap,
  focusRelicOnMap,
  activatePin,
  updateInspector
} from './modules/map.js';
import {
  initModal,
  openDetailModal,
  closeDetailModal,
  switchModalTab,
  focusRelicFromModal
} from './modules/modal.js';
import {
  initUploadHandlers,
  triggerUpload,
  triggerPickLocalVideo
} from './modules/upload.js';

// Gắn các hàm điều khiển lên window để tương thích với các sự kiện onclick trong HTML
window.NAM_O_HERITAGE_SITES = NAM_O_HERITAGE_SITES;
window.state = state;
window.openDetailModal = openDetailModal;
window.closeDetailModal = closeDetailModal;
window.focusRelicFromModal = focusRelicFromModal;
window.focusRelicOnMap = focusRelicOnMap;
window.scrollToRelicCard = scrollToRelicCard;
window.triggerUpload = triggerUpload;
window.triggerPickLocalVideo = triggerPickLocalVideo;
window.handleSlideImgError = handleSlideImgError;
window.handleSlideImgSuccess = handleSlideImgSuccess;
window.handleCardImgError = handleCardImgError;
window.handleCardImgSuccess = handleCardImgSuccess;

/**
 * Khởi động ứng dụng
 */
function initApp() {
  loadStoredImages();
  renderPhotoCarouselSlides();
  renderRelicsCardsGrid();
  initFilterChips();
  initModal();
  initUploadHandlers();
  initSwiper();
  initMap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

