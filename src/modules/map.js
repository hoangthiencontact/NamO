/**
 * map.js - Khởi tạo bản đồ tương tác Leaflet, ghim Google Pins & Auto-Tour
 */

import { NAM_O_HERITAGE_SITES, MAP_CONFIG, getPinColor } from '../data/relics.js';
import { state } from './state.js';
import { openDetailModal } from './modal.js';

/**
 * Khởi tạo bản đồ tương tác Leaflet
 */
export function initMap() {
  if (typeof L === "undefined") {
    console.warn("Leaflet library is not loaded.");
    return;
  }

  state.map = L.map("map-container", {
    center: MAP_CONFIG.center,
    zoom: MAP_CONFIG.zoom,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
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
  initMapTools();
}

/**
 * Tạo ghim vị trí tùy chỉnh với phong cách Google Pins
 */
export function renderMapMarkers() {
  NAM_O_HERITAGE_SITES.forEach((site, index) => {
    const pinColor = getPinColor(site.number);

    const pinHtml = `
      <div class="google-pin-container" id="pin-${site.id}">
        <div class="google-pin">
          <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18C0 30.5 18 44 18 44C18 44 36 30.5 36 18C36 8.06 27.94 0 18 0Z" fill="${pinColor}"/>
            <circle cx="18" cy="16" r="11" fill="#FFFFFF"/>
          </svg>
          <span class="pin-label" style="color:${pinColor};"><i class="fa-solid fa-landmark" style="font-size:11px;"></i></span>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: "google-pin-wrapper",
      html: pinHtml,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -42]
    });

    const marker = L.marker([site.coordinates.lat, site.coordinates.lng], {
      icon: customIcon,
      title: site.title,
      riseOnHover: true
    }).addTo(state.map);

    const popupContent = `
      <div class="google-popup-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.7rem; font-weight:700; color:${pinColor}; background:${pinColor}15; padding:2px 8px; border-radius:10px;">
            DI TÍCH • ${site.category}
          </span>
          <span style="font-size:0.7rem; color:#f29900; font-weight:600;">★ 5.0</span>
        </div>
        <div style="font-size:0.95rem; font-weight:700; color:#0f172a; margin-top:4px;">${site.title}</div>
        <div style="font-size:0.76rem; color:#475569; line-height:1.45;">${site.shortDesc}</div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button onclick="window.openDetailModal('${site.id}')" style="background:#1a73e8; color:#fff; border:none; padding:5px 12px; border-radius:14px; font-size:0.74rem; font-weight:600; cursor:pointer;">
            Xem chi tiết
          </button>
          <a href="${site.googleMapsUrl}" target="_blank" style="background:#fff; color:#1a73e8; border:1px solid #dadce0; padding:5px 12px; border-radius:14px; font-size:0.74rem; text-decoration:none; font-weight:600;">
            Chỉ đường
          </a>
        </div>
      </div>
    `;

    const popup = L.popup({
      offset: [0, -38],
      closeButton: false,
      autoPan: false
    }).setContent(popupContent);

    marker.bindPopup(popup);

    marker.on("mouseover", () => {
      marker.openPopup();
      activatePin(site.id);
      updateInspector(site);
      if (state.swiper) {
        if (typeof state.swiper.slideToLoop === 'function') {
          state.swiper.slideToLoop(index, 450);
        } else {
          state.swiper.slideTo(index, 450);
        }
      }
    });

    marker.on("click", () => {
      openDetailModal(site.id);
    });

    state.markers[site.id] = marker;
    state.popups[site.id] = popup;
  });
}

export function activatePin(siteId) {
  document.querySelectorAll(".google-pin-container").forEach(el => el.classList.remove("active"));
  const pin = document.getElementById(`pin-${siteId}`);
  if (pin) pin.classList.add("active");
}

export function updateInspector(site) {
  state.activeSiteId = site.id;
  window.activeSiteId = site.id;

  const pinColor = getPinColor(site.number);
  const imgSrc = state.userImages[site.id] || site.image;

  const badgeEl = document.getElementById("insp-badge");
  if (badgeEl) {
    badgeEl.innerText = `DI TÍCH • ${site.category}`;
    badgeEl.style.color = pinColor;
    badgeEl.style.background = `${pinColor}18`;
  }

  const mediaBox = document.getElementById("insp-media-box");
  const imgEl = document.getElementById("insp-loaded-img");
  if (imgEl && mediaBox) {
    imgEl.src = imgSrc;
    imgEl.alt = `Ảnh di tích ${site.title}`;
    mediaBox.classList.add("has-image");
  }

  const titleEl = document.getElementById("insp-title");
  if (titleEl) titleEl.innerText = site.title;

  const addrEl = document.getElementById("insp-address");
  if (addrEl) {
    const span = addrEl.querySelector("span");
    if (span) span.innerText = site.address;
  }

  const descEl = document.getElementById("insp-desc");
  if (descEl) descEl.innerText = site.shortDesc;

  const gmapsBtn = document.getElementById("insp-btn-gmaps");
  if (gmapsBtn) gmapsBtn.href = site.googleMapsUrl;
}

export function focusRelicOnMap(siteId) {
  const site = NAM_O_HERITAGE_SITES.find(s => s.id === siteId);
  if (!site || !state.map) return;

  const mapSec = document.getElementById("ban-do");
  if (mapSec) mapSec.scrollIntoView({ behavior: "smooth" });

  setTimeout(() => {
    state.map.flyTo([site.coordinates.lat, site.coordinates.lng], 17, { duration: 0.9 });
    activatePin(site.id);
    updateInspector(site);

    const marker = state.markers[site.id];
    if (marker) marker.openPopup();
  }, 450);
}

/**
 * Khởi tạo các công cụ bản đồ: Đổi lớp, Căn giữa, Tour tự động
 */
export function initMapTools() {
  const layerBtn = document.getElementById("btn-layer-menu");
  const layerMenu = document.getElementById("layer-dropdown");

  if (layerBtn && layerMenu) {
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
        if (layerName === state.currentLayerName || !state.baseLayers[layerName]) return;

        state.map.removeLayer(state.baseLayers[state.currentLayerName]);
        state.baseLayers[layerName].addTo(state.map);
        state.currentLayerName = layerName;

        document.querySelectorAll(".layer-drop-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        layerMenu.classList.remove("show");
      });
    });
  }

  const recenterBtn = document.getElementById("btn-recenter-view");
  if (recenterBtn) {
    recenterBtn.addEventListener("click", () => {
      if (state.map) state.map.flyTo(MAP_CONFIG.center, MAP_CONFIG.zoom, { duration: 0.8 });
    });
  }

  const autoTourBtn = document.getElementById("btn-auto-tour-mode");
  let isTouring = false;

  if (autoTourBtn) {
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
      if (state.map) {
        state.map.flyTo([site.coordinates.lat, site.coordinates.lng], 17, { duration: 1 });
      }
      activatePin(site.id);
      updateInspector(site);

      const marker = state.markers[site.id];
      if (marker) marker.openPopup();

      if (state.swiper) {
        if (typeof state.swiper.slideToLoop === 'function') {
          state.swiper.slideToLoop(state.tourIndex, 600);
        } else {
          state.swiper.slideTo(state.tourIndex, 600);
        }
      }
      state.tourIndex++;
    }

    function stopAutoTour() {
      isTouring = false;
      clearInterval(state.tourInterval);
      autoTourBtn.classList.remove("active");
      autoTourBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  }
}

