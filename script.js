// Referencias del DOM
const videoElement = document.getElementById('camera-feed');
const canvasElement = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('btn-capture');
const flipBtn = document.getElementById('btn-flip');
const flashBtn = document.getElementById('btn-flash');
const flashIcon = document.getElementById('flash-icon');

const liveTime = document.getElementById('live-time');
const liveDate = document.getElementById('live-date');
const locationText = document.getElementById('location-text');
const liveCoords = document.getElementById('live-coords');

const openGalleryBtn = document.getElementById('open-gallery');
const galleryModal = document.getElementById('gallery-modal');
const closeGalleryBtn = document.getElementById('close-gallery');
const galleryGrid = document.getElementById('gallery-grid');

const previewModal = document.getElementById('preview-modal');
const closePreviewBtn = document.getElementById('close-preview');
const previewImg = document.getElementById('preview-img');
const previewMetaText = document.getElementById('preview-meta-text');
const downloadBtn = document.getElementById('download-btn');

let currentStream = null;
let useFrontCamera = false;
let flashState = false;
let currentCoords = { lat: -11.9333, lon: -77.0500 }; // Coordenadas aproximadas de Carabayllo, Lima
let currentAddress = "Carabayllo, Lima";
let capturedPhotos = [];

// Reloj en tiempo real
function updateClock() {
    const now = new Date();
    liveTime.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    liveDate.textContent = now.toLocaleDateString('es-ES', options);
}
setInterval(updateClock, 1000);
updateClock();

// Obtener ubicación GPS real del dispositivo
function initGPS() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentCoords.lat = position.coords.latitude;
                currentCoords.lon = position.coords.longitude;
                liveCoords.innerHTML = `<i class="fa-solid fa-crosshairs"></i> ${currentCoords.lat.toFixed(4)}° S, ${currentCoords.lon.toFixed(4)}° O`;
                locationText.textContent = `Carabayllo, Lima`;
            },
            (error) => {
                console.warn("GPS no disponible, usando ubicación por defecto.");
                locationText.textContent = "Lima, Perú";
            },
            { enableHighAccuracy: true }
        );
    }
}
initGPS();

// Iniciar Cámara del Dispositivo
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            facingMode: useFrontCamera ? 'user' : 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios en tu navegador.");
    }
}

// Cambiar entre cámara frontal y trasera
flipBtn.addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
});

// Botón de Flash simulado
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

// Capturar Foto y estampar marca de agua GPS / Fecha
captureBtn.addEventListener('click', () => {
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    canvasElement.width = width;
    canvasElement.height = height;
    const ctx = canvasElement.getContext('2d');

    // 1. Dibujar el fotograma actual del vídeo
    ctx.drawImage(videoElement, 0, 0, width, height);

    // Si el flash está activo, simular destello blanco en la foto
    if (flashState) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Estampar la Tarjeta de Marca de Agua
    const padding = 40;
    const boxWidth = width - (padding * 2);
    const boxHeight = 160;
    const boxX = padding;
    const boxY = height - boxHeight - padding;

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.roundRect ? ctx.beginPath() || ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16) || ctx.fill() : ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Textos de la marca de agua
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px sans-serif";
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

    ctx.fillText(`${timeStr}  •  ${dateStr}`, boxX + 30, boxY + 50);

    ctx.fillStyle = "#3b82f6";
    ctx.font = "24px sans-serif";
    ctx.fillText(`📍 ${currentAddress} (${currentCoords.lat.toFixed(4)}°, ${currentCoords.lon.toFixed(4)}°)`, boxX + 30, boxY + 100);

    ctx.fillStyle = "#a1a1a6";
    ctx.font = "20px sans-serif";
    ctx.fillText(`☁️ 18°C • Cámara Pro Móvil`, boxX + 30, boxY + 138);

    // 3. Convertir a imagen y guardar en galería local
    const dataUrl = canvasElement.toDataURL('image/jpeg', 0.92);
    const photoObj = {
        url: dataUrl,
        date: `${dateStr} - ${timeStr}`,
        location: `${currentAddress} [${currentCoords.lat.toFixed(2)}, ${currentCoords.lon.toFixed(2)}]`
    };

    capturedPhotos.unshift(photoObj);
    updateThumbnail();
});

// Actualizar miniatura en la interfaz
function updateThumbnail() {
    if (capturedPhotos.length > 0) {
        openGalleryBtn.querySelector('.thumbnail-preview').innerHTML = `<img src="${capturedPhotos[0].url}" alt="Miniatura">`;
    }
}

// Abrir y cerrar Galería
openGalleryBtn.addEventListener('click', () => {
    renderGalleryModal();
    galleryModal.classList.add('active');
});

closeGalleryBtn.addEventListener('click', () => {
    galleryModal.classList.remove('active');
});

function renderGalleryModal() {
    if (capturedPhotos.length === 0) {
        galleryGrid.innerHTML = `<p class="empty-msg">No hay fotos capturadas aún.</p>`;
        return;
    }

    galleryGrid.innerHTML = '';
    capturedPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${photo.url}" alt="Foto ${index}">`;
        item.addEventListener('click', () => openPreview(photo));
        galleryGrid.appendChild(item);
    });
}

function openPreview(photo) {
    previewImg.src = photo.url;
    previewMetaText.innerHTML = `<i class="fa-solid fa-clock"></i> ${photo.date}<br><i class="fa-solid fa-location-dot"></i> ${photo.location}`;
    downloadBtn.href = photo.url;
    previewModal.classList.add('active');
}

closePreviewBtn.addEventListener('click', () => {
    previewModal.classList.remove('active');
});

// Arrancar cámara al cargar la página
window.addEventListener('load', () => {
    startCamera();
});
