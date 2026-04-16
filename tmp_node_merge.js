const fs = require('fs');

const demo1Path = 'g:/我的雲端硬碟/2025_lee/+++++專案/++++++核點創意Nudot/web_site/+++lab/demo1/index_standalone.html';
const demo3Path = 'g:/我的雲端硬碟/2025_lee/+++++專案/++++++核點創意Nudot/web_site/+++lab/demo3/index.html';

const linesDemo1 = fs.readFileSync(demo1Path, 'utf-8').split('\n');

let htmlStart = linesDemo1.findIndex(l => l.includes('<div class="spacer"></div>'));
let htmlEnd = linesDemo1.findIndex(l => l.includes('<div class="spacer-bottom"></div>')) + 1;
let htmlStr = linesDemo1.slice(htmlStart, htmlEnd).join('\n').replace(/public\//g, '../demo1/public/');

let jsStart = linesDemo1.findIndex(l => l.includes('const imageCache = new Map();')) - 1;
let jsEnd = linesDemo1.findIndex(l => l.includes('destroy() {')) + 4;
let jsStr = linesDemo1.slice(jsStart, jsEnd).join('\n');

let content = fs.readFileSync(demo3Path, 'utf-8');

// 1. Inject CSS link
content = content.replace(
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@1,500;1,600&family=Syncopate:wght@700&display=swap" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@1,500;1,600&family=Syncopate:wght@700&display=swap" rel="stylesheet">\n    <link rel="stylesheet" href="../demo1/src/dual-wave/style.css" />'
);

// 2. Remove CSS for ecommerce
const cssStart = content.indexOf('        /* ------------------------------------------------\n           ECOMMERCE 區塊 (左影片右文字)');
let cssEnd = content.indexOf('</style>', cssStart);
if (cssStart === -1) {
    // try finding with windows CRLF
    const cssStartCRLF = content.indexOf('        /* ------------------------------------------------\r\n           ECOMMERCE 區塊 (左影片右文字)');
    if (cssStartCRLF !== -1) {
        cssEnd = content.indexOf('</style>', cssStartCRLF);
        if (cssEnd !== -1) content = content.substring(0, cssStartCRLF) + content.substring(cssEnd);
    }
} else if (cssEnd !== -1) {
    content = content.substring(0, cssStart) + content.substring(cssEnd);
}

// 3. Replace HTML
const htmlToReplaceStart = content.indexOf('    <!-- 左影片右文字的 E-Commerce 區塊 -->');
const htmlToReplaceEnd = content.indexOf('</section>', htmlToReplaceStart) + 10;
const newHtml = `    <!-- ================= Dual Wave Text Animation Section ================= -->
    <section class="dual-wave-section" style="position: relative; width: 100vw; background-color: #050505; color: #fff; z-index: 10; padding: 20vh 0; overflow: hidden;">
      <div id="dw-smooth-content" style="padding: 0 1.5rem;">
${htmlStr}
      </div>
    </section>
`;
if (htmlToReplaceStart !== -1) {
    content = content.substring(0, htmlToReplaceStart) + newHtml + content.substring(htmlToReplaceEnd);
}

// 4. Inject JS classes before gsap.registerPlugin
const jsInjectPos = content.indexOf('        gsap.registerPlugin(ScrollTrigger);');
if (jsInjectPos !== -1) {
    content = content.substring(0, jsInjectPos) + jsStr + '\n' + content.substring(jsInjectPos);
}

// 5. Remove ecommerce JS logic
const jsEcomStart = content.indexOf('                // 白框退場動畫');
const jsEcomEnd = content.indexOf('            }', jsEcomStart) + 13;
if (jsEcomStart !== -1) {
    const initDualWave = `                // Initialize dual wave animation
                const dualWaveWrapper = document.querySelector(".dual-wave-wrapper");
                if (dualWaveWrapper) {
                    const animation = new DualWaveAnimation(dualWaveWrapper);
                    preloadImages(".dual-wave-wrapper").then(() => {
                        animation.init();
                    });
                }
            }`;
    content = content.substring(0, jsEcomStart) + initDualWave + content.substring(jsEcomEnd);
}

fs.writeFileSync(demo3Path, content, 'utf-8');
console.log('Node transformation complete.');
