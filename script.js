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

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

let currentCoords = { lat: -11.9333, lon: -77.0500 }; // Carabayllo, Lima
let currentAddress = "Carabayllo, Lima";
let capturedMedia = [];

// Reloj en tiempo real
function updateClock() {
    const now = new Date();
    liveTime.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    liveDate.textContent = now.toLocaleDateString('es-ES', options);
}
setInterval(updateClock, 1000);
updateClock();

// Obtener ubicación GPS real
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

// Iniciar Cámara
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
        audio: true
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
    } catch (err) {
        console.warn("Aviso de cámara/audio:", err);
    }
}

// Girar Cámara
flipBtn.addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
});

// Flash
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
    
    if (currentStream) {
        const track = currentStream.getVideoTracks()[0];
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            try {
                await track.applyConstraints({ advanced: [{ torch: flashState }] });
            } catch (e) {}
        }
    }
});

// HDR
hdrBtn.addEventListener('click', () => {
    hdrState = !hdrState;
    if (hdrState) {
        hdrBtn.style.color = "#ff9f0a";
        hdrBtn.style.borderColor = "#ff9f0a";
        videoElement.style.filter = "contrast(1.25) saturate(1.3) brightness(1.05)";
    } else {
        hdrBtn.style.color = "#ffffff";
        hdrBtn.style.borderColor = "rgba(255, 255, 255, 0.15)";
        videoElement.style.filter = "none";
    }
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
    const mapUrl = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lon}`;
    window.open(mapUrl, '_blank');
});

// Disparo
captureBtn.addEventListener('click', () => {
    if (currentMode === 'VIDEO') {
        toggleVideoRecording();
    } else {
        capturePhoto();
    }
});

// Capturar Foto y Descargarla a la Galería del Celular
function capturePhoto() {
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    canvasElement.width = width;
    canvasElement.height = height;
    const ctx = canvasElement.getContext('2d');

    if (hdrState) {
        ctx.filter = "contrast(1.25) saturate(1.3) brightness(1.05)";
    }

    if (currentMode === 'PORTRAIT') {
        ctx.filter = "contrast(1.1) brightness(1.02)";
    }

    ctx.drawImage(videoElement, 0, 0, width, height);
    ctx.filter = "none";

    if (currentMode === 'PANO') {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, width, height * 0.15);
        ctx.fillRect(0, height * 0.85, width, height * 0.15);
    }

    // Tarjeta de Sello GPS / Fecha
    const padding = 40;
    const boxWidth = width - (padding * 2);
    const boxHeight = 160;
    const boxX = padding;
    const boxY = height - boxHeight - padding;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.roundRect ? ctx.beginPath() || ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16) || ctx.fill() : ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

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
    const modeLabel = currentMode === 'PORTRAIT' ? 'Retrato' : currentMode === 'PANO' ? 'Panorámica' : 'Foto Estándar';
    ctx.fillText(`☁️ 18°C • ${modeLabel}`, boxX + 30, boxY + 138);

    const dataUrl = canvasElement.toDataURL('image/jpeg', 0.92);

    // NUEVO: Descarga automática a la galería del dispositivo
    const link = document.createElement('a');
    link.href = dataUrl;
    const fileName = `CamaraPro_${now.toISOString().slice(0,10)}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.jpg`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const mediaObj = {
        type: 'image',
        url: dataUrl,
        date: `${dateStr} - ${timeStr}`,
        location: `${currentAddress} [${currentCoords.lat.toFixed(2)}, ${currentCoords.lon.toFixed(2)}]`
    };

    capturedMedia.unshift(mediaObj);
    updateThumbnail();
}

// Grabación de Vídeo
function toggleVideoRecording() {
    if (!isRecording) {
        recordedChunks = [];
        try {
            mediaRecorder = new MediaRecorder(currentStream, { mimeType: 'video/webm' });
        } catch (e) {
            try { mediaRecorder = new MediaRecorder(currentStream); } 
            catch (err) { alert("Tu navegador no soporta grabación de vídeo."); return; }
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

            // Descarga automática del vídeo a la galería/descargas
            const link = document.createElement('a');
            link.href = videoUrl;
            link.download = `CamaraPro_Video_${now.getTime()}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            const mediaObj = {
                type: 'video',
                url: videoUrl,
                date: `${dateStr} - ${timeStr}`,
                location: `${currentAddress} [${currentCoords.lat.toFixed(2)}, ${currentCoords.lon.toFixed(2)}]`
            };

            capturedMedia.unshift(mediaObj);
            updateThumbnail();
            alert("¡Vídeo guardado y descargado a tu galería!");
        };

        mediaRecorder.start();
        isRecording = true;
        captureBtn.style.transform = "scale(0.85)";
        document.querySelector('.shutter-inner').style.borderRadius = "4px";
    } else {
        mediaRecorder.stop();
        isRecording = false;
        captureBtn.style.transform = "scale(1)";
        document.querySelector('.shutter-inner').style.borderRadius = "50%";
    }
}

// Actualizar miniatura
function updateThumbnail() {
    if (capturedMedia.length > 0) {
        const lastItem = capturedMedia[0];
        if (lastItem.type === 'image') {
            openGalleryBtn.querySelector('.thumbnail-preview').innerHTML = `<img src="${lastItem.url}" alt="Miniatura">`;
        } else {
            openGalleryBtn.querySelector('.thumbnail-preview').innerHTML = `<i class="fa-solid fa-video" style="color:#ff3b30;"></i>`;
        }
    }
}

// Galería y Visualizador
openGalleryBtn.addEventListener('click', () => {
    renderGalleryModal();
    galleryModal.classList.add('active');
});

closeGalleryBtn.addEventListener('click', () => {
    galleryModal.classList.remove('active');
});

function renderGalleryModal() {
    if (capturedMedia.length === 0) {
        galleryGrid.innerHTML = `<p class="empty-msg">No hay fotos ni vídeos capturados aún.</p>`;
        return;
    }

    galleryGrid.innerHTML = '';
    capturedMedia.forEach((media, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        if (media.type === 'image') {
            item.innerHTML = `<img src="${media.url}" alt="Foto ${index}">`;
        } else {
            item.innerHTML = `<div style="width:100%; height:100%; background:#222; display:flex; justify-content:center; align-items:center; color:#ff3b30; font-size:24px;"><i class="fa-solid fa-play"></i></div>`;
        }
        item.addEventListener('click', () => openPreview(media));
        galleryGrid.appendChild(item);
    });
}

function openPreview(media) {
    const previewContainer = document.querySelector('.preview-content');
    const existingMediaEl = document.getElementById('preview-media-el');
    if (existingMediaEl) existingMediaEl.remove();

    if (media.type === 'image') {
        previewImg.style.display = 'block';
        previewImg.src = media.url;
        downloadBtn.href = media.url;
        downloadBtn.download = "camara-pro-foto.jpg";
    } else {
        previewImg.style.display = 'none';
        const videoEl = document.createElement('video');
        videoEl.id = 'preview-media-el';
        videoEl.src = media.url;
        videoEl.controls = true;
        videoEl.autoplay = true;
        videoEl.style.maxWidth = '100%';
        videoEl.style.maxHeight = '60vh';
        videoEl.style.borderRadius = '12px';
        previewContainer.insertBefore(videoEl, previewMetaText);
        downloadBtn.href = media.url;
        downloadBtn.download = "camara-pro-video.webm";
    }

    previewMetaText.innerHTML = `<i class="fa-solid fa-clock"></i> ${media.date}<br><i class="fa-solid fa-location-dot"></i> ${media.location}`;
    previewModal.classList.add('active');
}

closePreviewBtn.addEventListener('click', () => {
    previewModal.classList.remove('active');
});

// Inicializar
window.addEventListener('load', () => {
    startCamera();
});
