import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export class DualWaveAnimation {
  constructor(wrapper, options = {}) {
    this.wrapper =
      wrapper instanceof Element ? wrapper : document.querySelector(wrapper);

    // Read config from data attributes
    const waveNumber = this.wrapper?.dataset.waveNumber
      ? parseFloat(this.wrapper.dataset.waveNumber)
      : 2;
    const waveSpeed = this.wrapper?.dataset.waveSpeed
      ? parseFloat(this.wrapper.dataset.waveSpeed)
      : 1;

    this.config = {
      waveNumber,
      waveSpeed,
      ...options,
    };

    this.currentImage = null;
  }

  init() {
    if (!this.wrapper) {
      console.warn("Wrapper not found");
      return;
    }

    this.leftColumn = this.wrapper.querySelector(".wave-column-left");
    this.rightColumn = this.wrapper.querySelector(".wave-column-right");

    if (!this.leftColumn || !this.rightColumn) {
      console.warn("Columns not found");
      return;
    }

    this.setupAnimation();
  }

  setupAnimation() {
    // Get texts from both columns
    this.leftTexts = gsap.utils.toArray(
      this.leftColumn.querySelectorAll(".animated-text")
    );
    this.rightTexts = gsap.utils.toArray(
      this.rightColumn.querySelectorAll(".animated-text")
    );

    this.thumbnail = this.wrapper.querySelector(".image-thumbnail");

    if (this.leftTexts.length === 0 || this.rightTexts.length === 0) return;

    // Create quick setters for smooth text animations
    this.leftQuickSetters = this.leftTexts.map((text) =>
      gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" })
    );

    this.rightQuickSetters = this.rightTexts.map((text) =>
      gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" })
    );

    // Calculate initial ranges and positions
    this.calculateRanges();
    this.setInitialPositions(this.leftTexts, this.leftRange, 1);
    this.setInitialPositions(this.rightTexts, this.rightRange, -1);

    // Setup scroll trigger
    this.setupScrollTrigger();

    // Recalculate ranges on window resize
    this.resizeHandler = () => {
      this.calculateRanges();
    };
    window.addEventListener("resize", this.resizeHandler);
  }

  calculateRanges() {
    // Calculate ranges based on column widths minus max element width
    const maxLeftTextWidth = Math.max(
      ...this.leftTexts.map((t) => t.offsetWidth)
    );
    const maxRightTextWidth = Math.max(
      ...this.rightTexts.map((t) => t.offsetWidth)
    );

    this.leftRange = {
      minX: 0,
      maxX: this.leftColumn.offsetWidth - maxLeftTextWidth,
    };
    this.rightRange = {
      minX: 0,
      maxX: this.rightColumn.offsetWidth - maxRightTextWidth,
    };
  }

  setInitialPositions(texts, range, multiplier) {
    const rangeSize = range.maxX - range.minX;

    texts.forEach((text, index) => {
      const initialPhase = this.config.waveNumber * index - Math.PI / 2;
      const initialWave = Math.sin(initialPhase);
      const initialProgress = (initialWave + 1) / 2;
      const startX = (range.minX + initialProgress * rangeSize) * multiplier;

      gsap.set(text, { x: startX });
    });
  }

  setupScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.wrapper,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => this.handleScroll(self),
    });
  }

  handleScroll(self) {
    const globalProgress = self.progress;

    // Since left and right texts are always aligned, we only need to check one column
    const closestIndex = this.findClosestToViewportCenter();

    // Update both columns with their respective multipliers
    this.updateColumn(
      this.leftTexts,
      this.leftQuickSetters,
      this.leftRange,
      globalProgress,
      closestIndex,
      1
    );

    this.updateColumn(
      this.rightTexts,
      this.rightQuickSetters,
      this.rightRange,
      globalProgress,
      closestIndex,
      -1
    );

    // Get the focused text element for thumbnail update
    const focusedText = this.leftTexts[closestIndex];
    this.updateThumbnail(this.thumbnail, focusedText);
  }

  updateColumn(texts, setters, range, progress, focusedIndex, multiplier) {
    const rangeSize = range.maxX - range.minX;

    texts.forEach((text, index) => {
      const finalX =
        this.calculateWavePosition(index, progress, range.minX, rangeSize) *
        multiplier;

      setters[index](finalX);

      if (index === focusedIndex) {
        text.classList.add("focused");
      } else {
        text.classList.remove("focused");
      }
    });
  }

  updateThumbnail(thumbnail, focusedText) {
    if (!thumbnail || !focusedText) return;

    // Get image from left column (single source)
    let newImage = focusedText.dataset.image;

    // If focused text has no image, look for the same index in left column
    if (!newImage) {
      const focusedIndex = this.rightTexts.indexOf(focusedText);
      if (focusedIndex !== -1 && this.leftTexts[focusedIndex]) {
        newImage = this.leftTexts[focusedIndex].dataset.image;
      }
    }

    // Only change image if different
    if (newImage && this.currentImage !== newImage) {
      this.currentImage = newImage;
      thumbnail.src = newImage;
    }

    // Position thumbnail to stay centered in viewport, clamped to allow centering on first/last text
    const wrapperRect = this.wrapper.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const thumbnailHeight = thumbnail.offsetHeight;
    const wrapperHeight = this.wrapper.offsetHeight;

    // Calculate ideal Y position (centered in viewport)
    const idealY = viewportCenter - wrapperRect.top - thumbnailHeight / 2;

    // Clamp to allow image to overflow wrapper to center on first/last text
    const minY = -thumbnailHeight / 2;
    const maxY = wrapperHeight - thumbnailHeight / 2;
    const clampedY = Math.max(minY, Math.min(maxY, idealY));

    // Apply position directly without animation for perfect scroll sync
    gsap.set(thumbnail, { y: clampedY });
  }

  calculateWavePosition(index, globalProgress, minX, range) {
    const phase =
      this.config.waveNumber * index +
      this.config.waveSpeed * globalProgress * Math.PI * 2 -
      Math.PI / 2;
    const wave = Math.sin(phase);
    const cycleProgress = (wave + 1) / 2;
    return minX + cycleProgress * range;
  }

  findClosestToViewportCenter() {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    // Only check left column since left and right are always horizontally aligned
    this.leftTexts.forEach((text, index) => {
      const rect = text.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
  }
}
