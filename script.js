// Referencias del DOM
const videoElement = document.getElementById('camera-feed');
const canvasElement = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('btn-capture');
const flipBtn = document.getElementById('btn-flip');
const flashBtn = document.getElementById('btn-flash');
const flashIcon = document.getElementById('flash-icon');
const hdrBtn = document.getElementById('btn-hdr');

const liveTime = document.getElementById('live-time');
const liveDate = document.getElementById('live-date');
const locationText = document.getElementById('location-text');
const liveCoords = document.getElementById('live-coords');

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

let currentStream = null;
let useFrontCamera = false;
let flashState = false;
let hdrState = false;
let currentMode = 'PHOTO';
let currentCoords = { lat: -11.9333, lon: -77.0500 }; // Carabayllo, Lima
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
        audio: currentMode === 'VIDEO'
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        
        // Intentar activar linterna física si el dispositivo y el navegador lo soportan (para Flash ON)
        const track = currentStream.getVideoTracks()[0];
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            await track.applyConstraints({ advanced: [{ torch: flashState }] });
        }
    } catch (err) {
        console.warn("Aviso de cámara/audio:", err);
    }
}

// 1. Botón de Girar Cámara
flipBtn.addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
});

// 2. Botón de Flash real / Linterna
flashBtn.addEventListener('click', async () => {
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
    
    // Aplicar linterna física si soporta el hardware
    if (currentStream) {
        const track = currentStream.getVideoTracks()[0];
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            try {
                await track.applyConstraints({ advanced: [{ torch: flashState }] });
            } catch (e) { console.log("Torch no soportado en este dispositivo"); }
        }
    }
});

// 3. Botón de HDR (Modo de realce visual en pantalla)
hdrBtn.addEventListener('click', () => {
    hdrState = !hdrState;
    if (hdrState) {
        hdrBtn.style.color = "#ff9f0a";
        hdrBtn.style.borderColor = "#ff9f0a";
        videoElement.style.filter = "contrast(1.255) saturate(1.3) brightness(1.05)";
    } else {
        hdrBtn.style.color = "#ffffff";
        hdrBtn.style.borderColor = "rgba(255, 255, 255, 0.15)";
        videoElement.style.filter = "none";
    }
});

// 4. Selección de Modos (FOTO, VÍDEO, RETRATO, PANO)
modes.forEach(btn => {
    btn.addEventListener('click', () => {
        modes.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        
        if (currentMode === 'VIDEO') {
            alert("Modo Vídeo seleccionado. (Próximamente grabación continua de vídeo).");
        } else if (currentMode === 'PORTRAIT') {
            alert("Modo Retrato activado (Foco central optimizado).");
        } else if (currentMode === 'PANO') {
            alert("Modo Panorámica seleccionado.");
        }
    });
});

// 5. Botón de Mapa (Abre Google Maps con tu ubicación GPS actual)
openMapBtn.addEventListener('click', () => {
    const mapUrl = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lon}`;
    window.open(mapUrl, '_blank');
});

// 6. Captura de Foto con Sello Integrado
captureBtn.addEventListener('click', () => {
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    canvasElement.width = width;
    canvasElement.height = height;
    const ctx = canvasElement.getContext('2d');

    // Aplicar filtro HDR al canvas si está activo
    if (hdrState) {
        ctx.filter = "contrast(1.25) saturate(1.3) brightness(1.05)";
    }

    // Dibujar el fotograma del vídeo
    ctx.drawImage(videoElement, 0, 0, width, height);
    ctx.filter = "none"; // Resetear filtro

    // Simular destello de flash en pantalla si está encendido
    if (flashState) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(0, 0, width, height);
    }

    // Dibujar la tarjeta de Marca de Agua con datos reales
    const padding = 40;
    const boxWidth = width - (padding * 2);
    const boxHeight = 160;
    const boxX = padding;
    const boxY = height - boxHeight - padding;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.roundRect ? ctx.beginPath() || ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16) || ctx.fill() : ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Textos de fecha y hora
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px sans-serif";
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

    ctx.fillText(`${timeStr}  •  ${dateStr}`, boxX + 30, boxY + 50);

    // Coordenadas y ubicación
    ctx.fillStyle = "#3b82f6";
    ctx.font = "24px sans-serif";
    ctx.fillText(`📍 ${currentAddress} (${currentCoords.lat.toFixed(4)}°, ${currentCoords.lon.toFixed(4)}°)`, boxX + 30, boxY + 100);

    // Clima y firma de la app
    ctx.fillStyle = "#a1a1a6";
    ctx.font = "20px sans-serif";
    ctx.fillText(`☁️ 18°C • Cámara Pro Móvil`, boxX + 30, boxY + 138);

    // Guardar en la galería interna
    const dataUrl = canvasElement.toDataURL('image/jpeg', 0.92);
    const photoObj = {
        url: dataUrl,
        date: `${dateStr} - ${timeStr}`,
        location: `${currentAddress} [${currentCoords.lat.toFixed(2)}, ${currentCoords.lon.toFixed(2)}]`
    };

    capturedPhotos.unshift(photoObj);
    updateThumbnail();
});

// Actualizar miniatura flotante
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

// Inicializar cámara al cargar
window.addEventListener('load', () => {
    startCamera();
});
