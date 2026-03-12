const canvas = document.getElementById("experience-canvas");
const context = canvas.getContext("2d");

// Video-based scroll scrubbing
const video = document.createElement('video');
video.src = 'video.mp4';
video.muted = true;
video.playsInline = true;
video.preload = 'auto';

// Resize canvas to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}
window.addEventListener("resize", resizeCanvas);

// Setup observer for text animation
const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.3
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.content').forEach(element => {
    observer.observe(element);
});

// Loading
const loader = document.getElementById("loader");
const loadingText = document.getElementById("loading-text");
let videoReady = false;

function startExperience() {
    if (videoReady) return;
    videoReady = true;
    loadingText.innerText = 'Loading Assets... 100%';
    init();
}

video.addEventListener('canplaythrough', startExperience);
video.addEventListener('loadeddata', startExperience);

// iOS Safari won't preload video data without user interaction.
// Once metadata is available, force-start playback then immediately pause
// to trigger data loading. If that still doesn't work, start anyway.
video.addEventListener('loadedmetadata', () => {
    loadingText.innerText = 'Loading Assets... 50%';

    // Try to kick-start data loading on iOS
    const playPromise = video.play();
    if (playPromise) {
        playPromise.then(() => {
            video.pause();
            video.currentTime = 0;
            startExperience();
        }).catch(() => {
            // Autoplay blocked — start experience anyway, seeking will load data on demand
            startExperience();
        });
    }
});

function init() {
    // Hide loader
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
        document.querySelector('.hero-content').classList.add('visible');
    }, 800);

    resizeCanvas();
    // Seek to start and render first frame
    video.currentTime = 0;

    window.addEventListener('scroll', handleScroll, { passive: true });
}

let pendingSeek = null;

function handleScroll() {
    requestAnimationFrame(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;

        if (maxScrollTop <= 0) return;

        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
        const targetTime = scrollFraction * video.duration;

        // Only seek if not already seeking to avoid queuing up seeks
        if (!video.seeking) {
            video.currentTime = targetTime;
        } else {
            pendingSeek = targetTime;
        }
    });
}

// When a seek completes, process any pending seek and render
video.addEventListener('seeked', () => {
    render();
    if (pendingSeek !== null) {
        const t = pendingSeek;
        pendingSeek = null;
        video.currentTime = t;
    }
});

// Also render on timeupdate as a fallback
video.addEventListener('timeupdate', render);

function render() {
    if (video.readyState < 2) return; // Not enough data yet

    // Scale video to cover the canvas
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
    const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;

    context.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
}

// Add 3D Mouse Parallax Effect to Hero Section
const heroContent = document.querySelector('.hero-content');

// Desktop Mouse Tracking
document.addEventListener('mousemove', (e) => {
    if (window.scrollY > window.innerHeight) return;

    const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 25;

    applyTilt(xAxis, yAxis);
});

// Reset transform on mouse leave
document.addEventListener('mouseleave', () => {
    resetTilt();
});

// Mobile Gyroscope Tracking
function handleDeviceOrientation(e) {
    if (window.scrollY > window.innerHeight) return;

    let xAxis = e.gamma;
    let yAxis = e.beta - 45;

    xAxis = Math.max(-30, Math.min(30, xAxis));
    yAxis = Math.max(-30, Math.min(30, yAxis));

    applyTilt(xAxis, -yAxis);
}

function enableDeviceOrientation() {
    window.addEventListener('deviceorientation', handleDeviceOrientation);
}

// iOS 13+ requires a user-gesture-triggered permission request
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permBtn = document.createElement('button');
    permBtn.textContent = 'Enable Motion';
    Object.assign(permBtn.style, {
        position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000',
        padding: '12px 20px', border: 'none', borderRadius: '8px',
        background: '#e21b22', color: '#fff', fontSize: '14px',
        fontFamily: "'Outfit', sans-serif", letterSpacing: '1px', cursor: 'pointer'
    });
    document.body.appendChild(permBtn);

    permBtn.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') enableDeviceOrientation();
        });
        permBtn.remove();
    });
} else if (window.DeviceOrientationEvent) {
    enableDeviceOrientation();
}

function applyTilt(x, y) {
    if (heroContent && heroContent.classList.contains('visible')) {
        heroContent.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    }
}

function resetTilt() {
    if (heroContent && heroContent.classList.contains('visible')) {
        heroContent.style.transform = `rotateY(0deg) rotateX(0deg)`;
        heroContent.style.transition = 'transform 0.5s ease';
        setTimeout(() => {
             heroContent.style.transition = 'transform 0.1s ease-out';
        }, 500);
    }
}
