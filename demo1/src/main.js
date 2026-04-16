import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { DualWaveAnimation } from "./dual-wave/DualWaveAnimation.js";
import { preloadImages } from "./utils.js";

// Register GSAP plugins globally
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Initialize smooth scroll
ScrollSmoother.create({
  smooth: 1.5,
  normalizeScroll: true,
});

// Initialize dual wave animation
const wrapper = document.querySelector(".dual-wave-wrapper");
if (wrapper) {
  const animation = new DualWaveAnimation(wrapper);
  // Wait for all images to preload before initializing layout and scroll effects
  preloadImages(".dual-wave-wrapper").then(() => {
    document.body.classList.remove("loading");
    animation.init();
  });
}
