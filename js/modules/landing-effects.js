/**
 * landing-effects.js
 * Effets visuels non critiques de la landing.
 */

// Marching Ants Animation - optimized to avoid forced reflow
(function () {
    const svg = document.querySelector('.example-btn-border-svg');
    const path = document.querySelector('.marching-path');
    if (!svg || !path) return;

    let pathLength = 0;
    const speed = 15;
    let lastTime = performance.now();
    let animationId;
    let animationInitialized = false;
    let offset = 0;

    function updateDimensions() {
        const wrapper = svg.parentElement;
        const btn = wrapper?.querySelector('.example-btn');
        if (!btn) return;

        const width = btn.offsetWidth + 4;
        const height = btn.offsetHeight + 4;
        const r = 11;
        const inset = 1.5;

        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        const d = `M ${width / 2},${inset}
                   L ${width - r},${inset}
                   Q ${width - inset},${inset} ${width - inset},${r}
                   L ${width - inset},${height - r}
                   Q ${width - inset},${height - inset} ${width - r},${height - inset}
                   L ${r},${height - inset}
                   Q ${inset},${height - inset} ${inset},${height - r}
                   L ${inset},${r}
                   Q ${inset},${inset} ${r},${inset}
                   Z`;
        path.setAttribute('d', d);
    }

    function initAnimation() {
        pathLength = path.getTotalLength();
        const dashCount = 24;
        const dashLength = pathLength / dashCount;
        path.style.strokeDasharray = `${dashLength * 0.4} ${dashLength * 0.6}`;
        animationInitialized = true;
    }

    function animate(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        offset -= speed * deltaTime;
        if (offset <= -pathLength) offset = 0;
        path.style.strokeDashoffset = offset;
        animationId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (!animationInitialized) {
            updateDimensions();
            initAnimation();
        }
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
        if (!animationId) return;
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => {
            if (animationInitialized) {
                updateDimensions();
                initAnimation();
            }
        });
        resizeObserver.observe(svg.parentElement);
    }

    if ('IntersectionObserver' in window) {
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(startAnimation);
                } else {
                    stopAnimation();
                }
            });
        });
        intersectionObserver.observe(path);
    } else {
        requestAnimationFrame(startAnimation);
    }
})();

// Header boat/title animations are applied directly in HTML classes
// to keep their start order predictable: boat -> title -> rest.
