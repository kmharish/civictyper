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

function preloadImages() {
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);
        
        img.onload = () => {
            loadedImages++;
            let progress = Math.floor((loadedImages / frameCount) * 100);
            loadingText.innerText = `Loading Assets... ${progress}%`;
            
            if (loadedImages === frameCount) {
                // Done loading
                init();
            }
        };
        img.onerror = () => {
            // If an image fails, still count it so we don't get stuck
            loadedImages++;
            if (loadedImages === frameCount) init();
        }
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

document.addEventListener('mousemove', (e) => {
    // Only apply effect when near the top (in hero section)
    if (window.scrollY > window.innerHeight) return;

    const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 25;

    // Apply the 3D transform
    if (heroContent && heroContent.classList.contains('visible')) {
        heroContent.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    }
});

// Reset transform on mouse leave
document.addEventListener('mouseleave', () => {
    if (heroContent && heroContent.classList.contains('visible')) {
        heroContent.style.transform = `rotateY(0deg) rotateX(0deg)`;
        heroContent.style.transition = 'transform 0.5s ease';
        setTimeout(() => {
             heroContent.style.transition = 'transform 0.1s ease-out';
        }, 500);
    }
});
