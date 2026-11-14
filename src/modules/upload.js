/**
 * upload.js - Xử lý tải ảnh và chọn video từ máy tính
 */

import { NAM_O_HERITAGE_SITES } from '../data/relics.js';
import { state, saveUserImage, saveCustomVideo } from './state.js';
import { renderModalVideo } from './modal.js';

export function initUploadHandlers() {
  const fileInput = document.getElementById("relic-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !state.targetUploadSiteId) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64 = evt.target.result;
        saveUserImage(state.targetUploadSiteId, base64);
      };
      reader.readAsDataURL(file);
      fileInput.value = "";
    });
  }

  const videoInput = document.getElementById("relic-video-input");
  if (videoInput) {
    videoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !state.targetVideoSiteId) return;

      const videoUrl = URL.createObjectURL(file);
      saveCustomVideo(state.targetVideoSiteId, videoUrl);

      const site = NAM_O_HERITAGE_SITES.find(s => s.id === state.targetVideoSiteId);
      if (site) {
        renderModalVideo(site);
        const activePlayer = document.getElementById("modal-active-video-player");
        if (activePlayer) {
          activePlayer.src = videoUrl;
          activePlayer.load();
          activePlayer.play().catch(() => {});
        }
      }

      videoInput.value = "";
    });
  }
}

export function triggerUpload(siteId) {
  state.targetUploadSiteId = siteId || state.activeSiteId;
  const fileInput = document.getElementById("relic-file-input");
  if (fileInput) fileInput.click();
}

export function triggerPickLocalVideo(siteId) {
  state.targetVideoSiteId = siteId || state.activeSiteId;
  const input = document.getElementById("relic-video-input");
  if (input) input.click();
}

