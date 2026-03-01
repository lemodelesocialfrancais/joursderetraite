/**
 * landing-effects.js
 * Effets visuels non critiques de la landing.
 */

// Marching Ants Animation - optimized to avoid forced reflow
(function () {
    const svg = document.querySelector('.example-btn-border-svg');
    const path = document.querySelector('.marching-path');
    const wrapper = svg?.parentElement;
    const btn = wrapper?.querySelector('.example-btn');
    if (!svg || !path || !btn) return;

    const speed = 15;
    const dashCount = 24;
    const borderPadding = 4;
    const cornerRadius = 11;
    const inset = 1.5;
    let pathLength = 0;
    let lastTime = 0;
    let animationId = null;
    let animationInitialized = false;
    let offset = 0;
    let isInViewport = true;
    let isPageVisible = !document.hidden;
    let lastWidth = -1;
    let lastHeight = -1;
    let resizeRafId = null;

    function canAnimate() {
        return isInViewport && isPageVisible;
    }

    function applyDimensions(width, height) {
        if (width === lastWidth && height === lastHeight) {
            return false;
        }
        lastWidth = width;
        lastHeight = height;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        const d = `M ${width / 2},${inset}
                   L ${width - cornerRadius},${inset}
                   Q ${width - inset},${inset} ${width - inset},${cornerRadius}
                   L ${width - inset},${height - cornerRadius}
                   Q ${width - inset},${height - inset} ${width - cornerRadius},${height - inset}
                   L ${cornerRadius},${height - inset}
                   Q ${inset},${height - inset} ${inset},${height - cornerRadius}
                   L ${inset},${cornerRadius}
                   Q ${inset},${inset} ${cornerRadius},${inset}
                   Z`;
        path.setAttribute('d', d);
        return true;
    }

    function updateDimensions() {
        const width = btn.offsetWidth + borderPadding;
        const height = btn.offsetHeight + borderPadding;
        return applyDimensions(width, height);
    }

    function refreshPathMetrics() {
        pathLength = path.getTotalLength();
        const dashLength = pathLength / dashCount;
        path.style.strokeDasharray = `${dashLength * 0.4} ${dashLength * 0.6}`;
        animationInitialized = true;
    }

    function initAnimation(forceGeometryRefresh) {
        const geometryChanged = forceGeometryRefresh ? updateDimensions() : (!animationInitialized && updateDimensions());
        if (!animationInitialized || geometryChanged) {
            refreshPathMetrics();
        }
    }

    function animate(currentTime) {
        if (animationId === null) return;

        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        offset -= speed * deltaTime;
        if (offset <= -pathLength && pathLength > 0) {
            // Garder une progression continue même après un long "delta".
            offset = -((-offset) % pathLength);
        }
        path.style.strokeDashoffset = offset;
        animationId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (!canAnimate()) return;
        initAnimation(false);
        if (animationId !== null) return;
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
        if (animationId === null) return;
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    function scheduleResizeRefresh() {
        if (resizeRafId !== null) return;
        resizeRafId = requestAnimationFrame(() => {
            resizeRafId = null;
            const geometryChanged = updateDimensions();
            if (geometryChanged) {
                refreshPathMetrics();
            }
        });
    }

    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        if (canAnimate()) {
            startAnimation();
        } else {
            stopAnimation();
        }
    });

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(scheduleResizeRefresh);
        resizeObserver.observe(btn);
    } else {
        window.addEventListener('resize', scheduleResizeRefresh, { passive: true });
    }

    if ('IntersectionObserver' in window) {
        const intersectionObserver = new IntersectionObserver((entries) => {
            const entry = entries[0];
            isInViewport = !!entry && entry.isIntersecting;
            if (canAnimate()) {
                startAnimation();
            } else {
                stopAnimation();
            }
        });
        intersectionObserver.observe(path);
    } else {
        isInViewport = true;
        requestAnimationFrame(startAnimation);
    }
})();

// Header boat/title animations are applied directly in HTML classes
// to keep their start order predictable: boat -> title -> rest.
