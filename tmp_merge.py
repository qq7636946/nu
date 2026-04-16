import sys

with open(r'g:\我的雲端硬碟\2025_lee\+++++專案\++++++核點創意Nudot\web_site\+++lab\demo1\index_standalone.html', 'r', encoding='utf-8') as f:
    lines_demo1 = f.readlines()

# Extract dual-wave wrapper HTML
html_start = -1
html_end = -1
for i, line in enumerate(lines_demo1):
    if '<div class=\"spacer\"></div>' in line:
        html_start = i
    if '<div class=\"spacer-bottom\"></div>' in line:
        html_end = i + 1
html_str = ''.join(lines_demo1[html_start:html_end])
html_str = html_str.replace('public/', '../demo1/public/')

# Extract dual-wave JS
js_start = -1
js_end = -1
for i, line in enumerate(lines_demo1):
    if 'const imageCache = new Map();' in line:
        js_start = i - 1
    if 'destroy() {' in line:
        js_end = i + 4
js_str = ''.join(lines_demo1[js_start:js_end])

with open(r'g:\我的雲端硬碟\2025_lee\+++++專案\++++++核點創意Nudot\web_site\+++lab\demo3\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject CSS link
content = content.replace(
    '<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@1,500;1,600&family=Syncopate:wght@700&display=swap\" rel=\"stylesheet\">',
    '<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@1,500;1,600&family=Syncopate:wght@700&display=swap\" rel=\"stylesheet\">\n    <link rel=\"stylesheet\" href=\"../demo1/src/dual-wave/style.css\" />'
)

# 2. Remove CSS for ecommerce
css_start = content.find('        /* ------------------------------------------------\\n           ECOMMERCE 區塊 (左影片右文字)\\n           ------------------------------------------------ */')
css_end = content.find('</style>', css_start)
if css_start != -1 and css_end != -1:
    content = content[:css_start] + content[css_end:]

# 3. Replace HTML
html_to_replace_start = content.find('<!-- 左影片右文字的 E-Commerce 區塊 -->')
html_to_replace_end = content.find('</section>', html_to_replace_start) + 10
new_html = f'''    <!-- ================= Dual Wave Text Animation Section ================= -->
    <section class="dual-wave-section" style="position: relative; width: 100vw; background-color: #050505; color: #000; z-index: 10; padding: 20vh 0; overflow: hidden;">
      <div id="dw-smooth-content" style="padding: 0 1.5rem;">
{html_str}      </div>
    </section>
'''
if html_to_replace_start != -1:
    content = content[:html_to_replace_start] + new_html + content[html_to_replace_end:]

# 4. Inject JS classes before gsap.registerPlugin
js_inject_pos = content.find('        gsap.registerPlugin(ScrollTrigger);')
if js_inject_pos != -1:
    content = content[:js_inject_pos] + js_str + '\n' + content[js_inject_pos:]

# 5. Remove ecommerce JS logic
js_ecom_start = content.find('                // 白框退場動畫')
js_ecom_end = content.find('            }', js_ecom_start) + 13
if js_ecom_start != -1:
    init_dual_wave = '''                // 白框退場動畫 (Optional transition, leaving blank to just end cleanly)\\n                \\n                // Initialize dual wave animation\\n                const dualWaveWrapper = document.querySelector(".dual-wave-wrapper");\\n                if (dualWaveWrapper) {\\n                    const animation = new DualWaveAnimation(dualWaveWrapper);\\n                    preloadImages(".dual-wave-wrapper").then(() => {\\n                        animation.init();\\n                    });\\n                }\\n            }'''
    init_dual_wave = init_dual_wave.replace('\\n', '\n')
    content = content[:js_ecom_start] + init_dual_wave + content[js_ecom_end:]

with open(r'g:\我的雲端硬碟\2025_lee\+++++專案\++++++核點創意Nudot\web_site\+++lab\demo3\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Transformation complete.')
