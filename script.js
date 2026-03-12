const video = document.getElementById("experience-video");

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

// Loading Logic
const loader = document.getElementById("loader");
const loadingText = document.getElementById("loading-text");

// Make sure the video is loaded enough to scrub
video.addEventListener('loadeddata', () => {
    loadingText.innerText = "Loading Assets... 100%";
    init();
});

// Fallback just in case loadeddata doesn't fire as expected on some mobile browsers
setTimeout(() => {
    if (loader.style.display !== 'none') {
        init();
    }
}, 3000);

function init() {
    // Hide loader
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
        // Give hero text immediate visibility
        document.querySelector('.hero-content').classList.add('visible');
    }, 800);

    // Force video to pause so we can scrub it
    video.pause();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Run once to set initial state
    handleScroll();
}

function handleScroll() {
    // Use requestAnimationFrame for smooth visual updates
    requestAnimationFrame(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
        
        // Ensure we don't divide by zero
        if (maxScrollTop <= 0) return;
        
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
        
        // Scrub the video
        if (!isNaN(video.duration) && video.duration > 0) {
            video.currentTime = video.duration * scrollFraction;
        }
    });
}

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
