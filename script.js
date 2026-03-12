const canvas = document.getElementById("experience-canvas");
const context = canvas.getContext("2d");

// Configuration
const frameCount = 740;
const framesDir = "frames_webp/";
// To format number to 4 digits: e.g., 0012
const currentFrame = index => (
    `${framesDir}frame_${index.toString().padStart(4, '0')}.webp`
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
const loader = document.getElementById("loader");
const loadingText = document.getElementById("loading-text");
const fastLoadCount = 30; // Frames before we start the experience

async function preloadImages() {
    let initialLoaded = 0;
    
    // Create an array of Promises for the initial fast-load frames
    const fastLoadPromises = [];
    
    for (let i = 0; i < fastLoadCount; i++) {
        const img = new Image();
        images.push(img); // Reserve spot
        
        const p = new Promise(resolve => {
            img.onload = () => {
                initialLoaded++;
                let progress = Math.floor((initialLoaded / fastLoadCount) * 100);
                loadingText.innerText = `Loading Assets... ${progress}%`;
                resolve();
            };
            img.onerror = () => {
                // If an image fails to load, resolve anyway so it doesn't block
                initialLoaded++;
                resolve();
            };
            img.src = currentFrame(i); // Assign src after setting handlers
        });
        fastLoadPromises.push(p);
    }
    
    for (let i = fastLoadCount; i < frameCount; i++) {
        images.push(new Image()); // Just reserve spots for the rest
    }
    
    // Wait for the first batch to finish
    await Promise.all(fastLoadPromises);
    
    // Start experience immediately after fast load
    init();
    
    // Silently load the rest
    lazyLoadRest();
}

function lazyLoadRest() {
    // Load remaining frames in small batches (e.g., 5 at a time) to avoid
    // hitting iOS/Safari concurrent connection limits which cause silent failures
    const batchSize = 5;
    let currentIndex = fastLoadCount;
    
    function loadNextBatch() {
        if (currentIndex >= frameCount) return;
        
        const end = Math.min(currentIndex + batchSize, frameCount);
        for (let i = currentIndex; i < end; i++) {
            // No strict error tracking here, just load them into browser cache
            images[i].src = currentFrame(i);
        }
        
        currentIndex = end;
        setTimeout(loadNextBatch, 100); // Wait 100ms before next batch
    }
    
    loadNextBatch();
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
    // Render the first frame explicitly just in case scrolling hasn't happened
    updateImage(0); 
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
}

function handleScroll() {
    // Use requestAnimationFrame for smooth visual updates
    requestAnimationFrame(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
        
        if (maxScrollTop <= 0) return;
        
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
        
        const frameIndex = Math.min(
            frameCount - 1,
            Math.floor(scrollFraction * frameCount)
        );
        
        updateImage(frameIndex);
    });
}

function updateImage(index) {
    imageObj.frame = index;
    render();
}

function render() {
    // Don't try to render if the image object doesn't exist or hasn't actually loaded a src yet
    if (!images[imageObj.frame] || !images[imageObj.frame].complete || images[imageObj.frame].naturalWidth === 0) return;
    
    const img = images[imageObj.frame];
    // Scale image to cover the canvas (Object-Fit: Cover equivalent)
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width / 2) - (img.width / 2) * scale;
    const y = (canvas.height / 2) - (img.height / 2) * scale;
    
    // Performance optimization: no need to clearRect if we are drawing a completely opaque image over the whole canvas
    // context.clearRect(0, 0, canvas.width, canvas.height); 
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
function handleDeviceOrientation(e) {
    if (window.scrollY > window.innerHeight) return;

    // e.gamma is left/right tilt [-90 to 90]
    // e.beta is front/back tilt [-180 to 180]
    let xAxis = e.gamma;
    let yAxis = e.beta - 45; // Offset assuming user holds phone at 45 degree angle

    // Clamp values to prevent extreme flipping
    xAxis = Math.max(-30, Math.min(30, xAxis));
    yAxis = Math.max(-30, Math.min(30, yAxis));

    applyTilt(xAxis, -yAxis); // Invert Y axis for natural feel
}

function enableDeviceOrientation() {
    window.addEventListener('deviceorientation', handleDeviceOrientation);
}

// iOS 13+ requires a user-gesture-triggered permission request
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // Show a one-time button to request permission on iOS
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
    // Android and older iOS — no permission needed
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
