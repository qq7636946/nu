// Global image cache to prevent garbage collection and re-fetching
const imageCache = new Map();

/**
 * Preloads all images from data-image attributes and img elements within a container.
 * Images are cached globally to prevent re-fetching on subsequent uses.
 *
 * @function
 * @param {string} containerSelector - CSS selector for the container with images
 * @returns {Promise} - Resolves when all images are loaded
 */
const preloadImages = (containerSelector) => {
  return new Promise((resolve) => {
    const container = document.querySelector(containerSelector);

    if (!container) {
      resolve();
      return;
    }

    // Collect all unique image sources to preload (using relative paths for Codrops deployment)
    const imagesToLoad = new Set();

    // 1. Collect images from data-image attributes
    container.querySelectorAll('[data-image]').forEach((el) => {
      const imgSrc = el.dataset.image;
      if (imgSrc) imagesToLoad.add(imgSrc);
    });

    // 2. Collect visible <img> elements (use getAttribute to preserve relative paths)
    container.querySelectorAll('img').forEach((img) => {
      const imgSrc = img.getAttribute('src');
      if (imgSrc) imagesToLoad.add(imgSrc);
    });

    // No images to load
    if (imagesToLoad.size === 0) {
      resolve();
      return;
    }

    // Preload all collected images and cache them
    let loaded = 0;
    const total = imagesToLoad.size;

    imagesToLoad.forEach((src) => {
      // Skip if already cached
      if (imageCache.has(src)) {
        loaded++;
        if (loaded === total) resolve();
        return;
      }

      const img = new Image();

      // Resolve when image loads or fails
      img.onload = () => {
        // Cache the image object to prevent garbage collection
        imageCache.set(src, img);
        loaded++;
        if (loaded === total) resolve();
      };

      img.onerror = () => {
        loaded++;
        if (loaded === total) resolve();
      };

      img.src = src;
    });
  });
};

export { preloadImages };
