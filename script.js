
// Referencias del DOM
const nativeCameraInput = document.getElementById('native-camera-input');
const triggerNativeCam = document.getElementById('trigger-native-cam');
const canvasElement = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('btn-capture');
const flipBtn = document.getElementById('btn-flip');
const flashBtn = document.getElementById('btn-flash');
const flashIcon = document.getElementById('flash-icon');
const hdrBtn = document.getElementById('btn-hdr');

const settingsBtn = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');

const inputCustomText = document.getElementById('input-custom-text');
const selectCoordFormat = document.getElementById('select-coord-format');
const selectLens = document.getElementById('select-lens');
const selectQuality = document.getElementById('select-quality');
const inputLogo = document.getElementById('input-logo');

const liveTime = document.getElementById('live-time');
const liveDate = document.getElementById('live-date');
const locationText = document.getElementById('location-text');
const liveCoords = document.getElementById('live-coords');

const splashScreen = document.getElementById('splash-screen');
const mainApp = document.getElementById('main-app');
const progressFill = document.getElementById('progress-fill');
const splashTime = document.getElementById('splash-time');
const splashDate = document.getElementById('splash-date');

const modes = document.querySelectorAll('.mode-btn');
const openGalleryBtn = document.getElementById('open-gallery');
const galleryModal = document.getElementById('gallery-modal');
const closeGalleryBtn = document.getElementById('close-gallery');
const galleryGrid = document.getElementById('gallery-grid');

const openMapBtn = document.getElementById('open-map');
const previewModal = document.getElementById('preview-modal');
const closePreviewBtn = document.getElementById('close-preview');
const previewImg = document.getElementById('preview-img');
const previewMetaText = document.getElementById('preview-meta-text');
const downloadBtn = document.getElementById('download-btn');

let useFrontCamera = false;
let flashState = false;
let hdrState = false;
let currentMode = 'PHOTO';

let currentCoords = { lat: -12.0464, lon: -77.0428 };
let currentAddress = "Lima, Perú";
let capturedMedia = [];
let customLogoImage = null;

let proSettings = {
    customText: "Cámara Pro - Negocios",
    coordFormat: "decimal",
    lens: "environment",
    quality: 0.80
};

// Reloj en tiempo real
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    liveTime.textContent = timeString;
    liveDate.textContent = dateString;
    
    if (splashTime) splashTime.textContent = timeString;
    if (splashDate) splashDate.textContent = dateString;
}
setInterval(updateClock, 1000);
updateClock();

// Formato de Coordenadas
function formatCoordinates(lat, lon) {
    if (proSettings.coordFormat === 'decimal') {
        return `${lat.toFixed(4)}° S, ${lon.toFixed(4)}° O`;
    } else {
        const latDeg = Math.abs(Math.floor(lat));
        const latMin = Math.abs(Math.floor((lat - latDeg) * 60));
        const latSec = ((Math.abs(lat - latDeg) - latMin / 60) * 3600).toFixed(1);
        
        const lonDeg = Math.abs(Math.floor(lon));
        const lonMin = Math.abs(Math.floor((lon - lonDeg) * 60));
        const lonSec = ((Math.abs(lon - lonDeg) - lonMin / 60) * 3600).toFixed(1);

        return `${latDeg}°${latMin}'${latSec}"S, ${lonDeg}°${lonMin}'${lonSec}"O`;
    }
}

// GPS Real
function initGPS() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentCoords.lat = position.coords.latitude;
                currentCoords.lon = position.coords.longitude;
                liveCoords.innerHTML = `<i class="fa-solid fa-crosshairs"></i> ${formatCoordinates(currentCoords.lat, currentCoords.lon)}`;
                locationText.textContent = `Carabayllo, Lima`;
            },
            () => { locationText.textContent = "Lima, Perú"; },
            { enableHighAccuracy: true }
        );
    }
}

// Abrir cámara nativa del celular al presionar el visor o el botón de disparo
function openNativeCamera() {
    nativeCameraInput.click();
}

triggerNativeCam.addEventListener('click', openNativeCamera);
captureBtn.addEventListener('click', openNativeCamera);

// Procesar la foto tomada por la cámara nativa y aplicarle el sello profesional
nativeCameraInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const width = img.width;
            const height = img.height;

            canvasElement.width = width;
            canvasElement.height = height;
            const ctx = canvasElement.getContext('2d');

            if (hdrState) ctx.filter = "contrast(1.25) saturate(1.3) brightness(1.05)";
            if (currentMode === 'PORTRAIT') ctx.filter = "contrast(1.1) brightness(1.02)";

            ctx.drawImage(img, 0, 0, width, height);
            ctx.filter = "none";

            if (currentMode === 'PANO') {
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0, 0, width, height * 0.15);
                ctx.fillRect(0, height * 0.85, width, height * 0.15);
            }

            // Tarjeta de Sello GPS y Datos
            const padding = 40;
            const boxWidth = width - (padding * 2);
            const boxHeight = 180;
            const boxX = padding;
            const boxY = height - boxHeight - padding;

            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.roundRect ? ctx.beginPath() || ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16) || ctx.fill() : ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 30px sans-serif";
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

            ctx.fillText(`${timeStr}  •  ${dateStr}`, boxX + 30, boxY + 45);

            ctx.fillStyle = "#ff9f0a";
            ctx.font = "bold 22px sans-serif";
            ctx.fillText(`📌 ${proSettings.customText}`, boxX + 30, boxY + 88);

            ctx.fillStyle = "#3b82f6";
            ctx.font = "22px sans-serif";
            ctx.fillText(`📍 ${currentAddress} (${formatCoordinates(currentCoords.lat, currentCoords.lon)})`, boxX + 30, boxY + 128);

            ctx.fillStyle = "#a1a1a6";
            ctx.font = "18px sans-serif";
            ctx.fillText(`☁️ 18°C • Modo: ${currentMode}`, boxX + 30, boxY + 162);

            if (customLogoImage) {
                const logoSize = 90;
                ctx.drawImage(customLogoImage, width - logoSize - 40, 40, logoSize, logoSize);
            }

            const dataUrl = canvasElement.toDataURL('image/jpeg', proSettings.quality);

            // Descarga automática de la imagen sellada
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `CamaraPro_${now.toISOString().slice(0,10)}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            capturedMedia.unshift({
                type: 'image',
                url: dataUrl,
                date: `${dateStr} - ${timeStr}`,
                location: `${currentAddress} [${formatCoordinates(currentCoords.lat, currentCoords.lon)}]`
            });
            updateThumbnail();
            nativeCameraInput.value = ""; // Limpiar input
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
});

// Secuencia Splash Screen de 4 segundos
function initSplashSequence() {
    initGPS();
    
    let progress = 0;
    const intervalTime = 40;
    const increment = 100 / (4000 / intervalTime);

    const progressInterval = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);

            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainApp.style.opacity = '1';
                mainApp.style.pointerEvents = 'auto';
            }, 800);
        }
        progressFill.style.width = `${progress}%`;
    }, intervalTime);
}

// Girar Cámara (Cambia la preferencia de lente nativa)
flipBtn.addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    proSettings.lens = useFrontCamera ? 'user' : 'environment';
    if (useFrontCamera) {
        nativeCameraInput.setAttribute('capture', 'user');
    } else {
        nativeCameraInput.setAttribute('capture', 'environment');
    }
    alert(useFrontCamera ? "Modo Cámara Frontal Activo" : "Modo Cámara Trasera Activo");
});

// Flash
flashBtn.addEventListener('click', () => {
    flashState = !flashState;
    if (flashState) {
        flashIcon.className = "fa-solid fa-bolt";
        flashBtn.querySelector('span').textContent = "ENCENDIDO";
        flashBtn.style.color = "#ff9f0a";
    } else {
        flashIcon.className = "fa-solid fa-bolt-slash";
        flashBtn.querySelector('span').textContent = "APAGADO";
        flashBtn.style.color = "#ffffff";
    }
});

// HDR
hdrBtn.addEventListener('click', () => {
    hdrState = !hdrState;
    if (hdrState) {
        hdrBtn.style.color = "#ff9f0a";
        hdrBtn.style.borderColor = "#ff9f0a";
    } else {
        hdrBtn.style.color = "#ffffff";
        hdrBtn.style.borderColor = "rgba(255, 255, 255, 0.15)";
    }
});

// Ajustes Pro
settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));

saveSettingsBtn.addEventListener('click', () => {
    proSettings.customText = inputCustomText.value || "Cámara Pro";
    proSettings.coordFormat = selectCoordFormat.value;
    proSettings.lens = selectLens.value;
    proSettings.quality = parseFloat(selectQuality.value);
    useFrontCamera = (selectLens.value === 'user');

    if (useFrontCamera) {
        nativeCameraInput.setAttribute('capture', 'user');
    } else {
        nativeCameraInput.setAttribute('capture', 'environment');
    }

    if (inputLogo.files && inputLogo.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            customLogoImage = new Image();
            customLogoImage.src = e.target.result;
        };
        reader.readAsDataURL(inputLogo.files[0]);
    }

    settingsModal.classList.remove('active');
    liveCoords.innerHTML = `<i class="fa-solid fa-crosshairs"></i> ${formatCoordinates(currentCoords.lat, currentCoords.lon)}`;
    alert("¡Ajustes Pro guardados correctamente!");
});

// Modos
modes.forEach(btn => {
    btn.addEventListener('click', () => {
        modes.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        
        const shutterInner = document.querySelector('.shutter-inner');
        const shutterBtn = document.getElementById('btn-capture');

        if (currentMode === 'VIDEO') {
            shutterInner.style.background = "#ff3b30";
            shutterBtn.style.borderColor = "#ff3b30";
        } else {
            shutterInner.style.background = "#ffffff";
            shutterBtn.style.borderColor = "#ffffff";
        }
    });
});

// Mapa
openMapBtn.addEventListener('click', () => {
    window.open(`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lon}`, '_blank');
});

// Miniatura y Galería
function updateThumbnail() {
    if (capturedMedia.length > 0) {
        const last = capturedMedia[0];
        openGalleryBtn.querySelector('.thumbnail-preview').innerHTML = `<img src="${last.url}" alt="Miniatura">`;
    }
}

openGalleryBtn.addEventListener('click', () => {
    galleryGrid.innerHTML = capturedMedia.length === 0 ? `<p class="empty-msg">No hay fotos capturadas aún.</p>` : '';
    capturedMedia.forEach((media, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${media.url}" alt="Foto ${index}">`;
        item.addEventListener('click', () => openPreview(media));
        galleryGrid.appendChild(item);
    });
    galleryModal.classList.add('active');
});

closeGalleryBtn.addEventListener('click', () => galleryModal.classList.remove('active'));

function openPreview(media) {
    previewImg.style.display = 'block';
    previewImg.src = media.url;
    downloadBtn.href = media.url;
    downloadBtn.download = "camara-pro-foto.jpg";

    previewMetaText.innerHTML = `<i class="fa-solid fa-clock"></i> ${media.date}<br><i class="fa-solid fa-location-dot"></i> ${media.location}`;
    previewModal.classList.add('active');
}

closePreviewBtn.addEventListener('click', () => previewModal.classList.remove('active'));

// Iniciar secuencia al cargar
window.addEventListener('load', () => {
    initSplashSequence();
});
