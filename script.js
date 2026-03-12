const canvas = document.getElementById("experience-canvas");
const context = canvas.getContext("2d");

// Configuration
const frameCount = 740;
const framesDir = "frames/";
// To format number to 4 digits: e.g., 0012
const currentFrame = index => (
    `${framesDir}frame_${index.toString().padStart(4, '0')}.jpg`
);

const images = [];
const imageObj = { frame: 0 };

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
        } else {
            // Optional: remove visible class if you want it to animate out when scrolled past
            // entry.target.classList.remove('visible'); 
        }
    });
}, observerOptions);

document.querySelectorAll('.content').forEach(element => {
    observer.observe(element);
});

// Preload Images
let loadedImages = 0;
const loader = document.getElementById("loader");
const loadingText = document.getElementById("loading-text");

// How many frames need to load before we let the user interact
const fastLoadCount = 30;

function preloadImages() {
    // 1. Initial fast-load block
    let initialLoaded = 0;
    
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        images.push(img); // Reserve spot
        
        // Only trigger network requests for the first few frames initially
        if (i < fastLoadCount) {
            loadFrame(i, () => {
                initialLoaded++;
                let progress = Math.floor((initialLoaded / fastLoadCount) * 100);
                loadingText.innerText = `Loading Assets... ${progress}%`;
                
                if (initialLoaded === fastLoadCount) {
                    init(); // Start experience
                    lazyLoadRest(); // Silently load everything else
                }
            });
        }
    }
}

function loadFrame(index, callback) {
    images[index].src = currentFrame(index);
    images[index].onload = callback;
    images[index].onerror = callback; // ensure we dont lock up on failure
}

function lazyLoadRest() {
    let delay = 100;
    // Load remaining frames in batches to avoid network congestion
    for (let i = fastLoadCount; i < frameCount; i++) {
        setTimeout(() => {
            loadFrame(i, () => {});
        }, delay);
        delay += 5; // Stagger requests
    }
}

function init() {
    // Hide loader
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
        // Give hero text immediate visibility
        document.querySelector('.hero-content').classList.add('visible');
    }, 800);

    resizeCanvas();
    render();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    const scrollTop = document.documentElement.scrollTop;
    // Total scrollable area = Total document height - window height
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScrollTop;
    
    // Calculate the current frame based on scroll percentage
    const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollFraction * frameCount)
    );
    
    requestAnimationFrame(() => updateImage(frameIndex));
}

function updateImage(index) {
    imageObj.frame = index;
    render();
}

function render() {
    if (!images[imageObj.frame]) return;
    
    const img = images[imageObj.frame];
    // Scale image to cover the canvas (Object-Fit: Cover equivalent)
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width / 2) - (img.width / 2) * scale;
    const y = (canvas.height / 2) - (img.height / 2) * scale;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, x, y, img.width * scale, img.height * scale);
}

// Start preloading
preloadImages();

// Add 3D Mouse Parallax Effect to Hero Section
const heroContent = document.querySelector('.hero-content');

// Desktop Mouse Tracking
document.addEventListener('mousemove', (e) => {
    // Only apply effect when near the top (in hero section)
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
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
        if (window.scrollY > window.innerHeight) return;

        // e.gamma is left/right tilt [-90 to 90]
        // e.beta is front/back tilt [-180 to 180]
        // Limit the rotation so it doesn't spin uncontrollably
        
        let xAxis = e.gamma; 
        let yAxis = e.beta - 45; // Offset assuming user holds phone at 45 degree angle
        
        // Clamp values to prevent extreme flipping
        xAxis = Math.max(-30, Math.min(30, xAxis));
        yAxis = Math.max(-30, Math.min(30, yAxis));

        applyTilt(xAxis, -yAxis); // Invert Y axis for natural feel
    });
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
