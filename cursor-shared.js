(function () {
  'use strict';

  function boot() {
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    (function initGridMouseTracker() {
      var settings = {
        GRID_SIZE: 5,
        MAX_BLOCKS: 50,
        FADE_OUT_DURATION: 1.0,
        COLOR: '#ffffff'
      };

      var activeBlocks = [];
      var activeBlockKeys = new Set();
      var prevX = null;
      var prevY = null;
      var gridCols = 0;
      var gridRows = 0;

      function updateDynamicStyles() {
        var styleId = 'dynamic-block-style';
        var styleElement = document.getElementById(styleId);
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        styleElement.innerHTML = '.mouseTracker--01 {' +
          'width:' + settings.GRID_SIZE + 'px;' +
          'height:' + settings.GRID_SIZE + 'px;' +
          'background-color:' + settings.COLOR + ';' +
          'animation-duration:' + settings.FADE_OUT_DURATION + 's;' +
          '}';
      }

      function initializeGrid() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        gridCols = Math.ceil(width / settings.GRID_SIZE);
        gridRows = Math.ceil(height / settings.GRID_SIZE);

        activeBlocks.forEach(function (el) { el.remove(); });
        activeBlocks = [];
        activeBlockKeys.clear();
      }

      function getInterpolatedPoints(x1, y1, x2, y2) {
        var points = [];
        var dx = x2 - x1;
        var dy = y2 - y1;
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var steps = dist / settings.GRID_SIZE;

        for (var index = 0; index <= steps; index += 1) {
          var progress = steps > 0 ? index / steps : 0;
          points[index] = {
            x: Math.round(x1 + dx * progress),
            y: Math.round(y1 + dy * progress)
          };
        }

        return points;
      }

      function drawBlock(x, y) {
        var key = x + ',' + y;
        if (activeBlockKeys.has(key)) return;

        if (activeBlocks.length >= settings.MAX_BLOCKS) {
          var oldest = activeBlocks.shift();
          if (oldest) {
            activeBlockKeys.delete(oldest.dataset.pos);
            oldest.remove();
          }
        }

        var element = document.createElement('div');
        element.className = 'mouseTracker--01';
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.dataset.pos = key;

        document.body.appendChild(element);
        activeBlocks.push(element);
        activeBlockKeys.add(key);
      }

      function handleMouseMove(event) {
        var currentX = event.clientX;
        var currentY = event.clientY;

        if (prevX !== null && prevY !== null) {
          getInterpolatedPoints(prevX, prevY, currentX, currentY).forEach(function (point) {
            var cellX = Math.floor(point.x / settings.GRID_SIZE);
            var cellY = Math.floor(point.y / settings.GRID_SIZE);
            if (cellX >= 0 && cellX < gridCols && cellY >= 0 && cellY < gridRows) {
              drawBlock(cellX * settings.GRID_SIZE, cellY * settings.GRID_SIZE);
            }
          });
        }

        prevX = currentX;
        prevY = currentY;
      }

      updateDynamicStyles();
      initializeGrid();
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('resize', initializeGrid, { passive: true });
    })();

    var mouseX = 0;
    var mouseY = 0;
    var ringX = 0;
    var ringY = 0;
    var magnetTarget = null;
    var magnetRect = null;
    var magnetStrength = 0.22;
    var cursorLeaveTimer = null;
    var cursorExitDuration = 140;
    var lastDotX = -1;
    var lastDotY = -1;
    var lastRingX = -1;
    var lastRingY = -1;

    function showCursorLabel(label, side) {
      if (cursorLeaveTimer) {
        clearTimeout(cursorLeaveTimer);
        cursorLeaveTimer = null;
      }

      dot.classList.add('is-link');
      ring.classList.remove('is-leaving');
      ring.classList.remove('is-link');
      ring.setAttribute('data-cursor-label', label);
      ring.setAttribute('data-cursor-side', side);

      void ring.offsetWidth;
      ring.classList.add('is-link');
    }

    function hideCursorLabel() {
      ring.classList.remove('is-link');
      ring.classList.add('is-leaving');

      if (cursorLeaveTimer) {
        clearTimeout(cursorLeaveTimer);
      }

      cursorLeaveTimer = window.setTimeout(function () {
        ring.classList.remove('is-leaving');
        dot.classList.remove('is-link');
        ring.setAttribute('data-cursor-label', 'EXPLORE');
        ring.setAttribute('data-cursor-side', 'right');
        cursorLeaveTimer = null;
      }, cursorExitDuration);
    }

    document.addEventListener('mousemove', function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }, { passive: true });

    (function loop() {
      requestAnimationFrame(loop);

      var targetX = magnetTarget && magnetRect
        ? mouseX + ((magnetRect.left + magnetRect.width / 2) - mouseX) * magnetStrength
        : mouseX;
      var targetY = magnetTarget && magnetRect
        ? mouseY + ((magnetRect.top + magnetRect.height / 2) - mouseY) * magnetStrength
        : mouseY;

      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;

      if (targetX !== lastDotX || targetY !== lastDotY) {
        dot.style.transform = 'translate(' + targetX + 'px,' + targetY + 'px)';
        lastDotX = targetX;
        lastDotY = targetY;
      }

      if (Math.abs(ringX - lastRingX) > 0.05 || Math.abs(ringY - lastRingY) > 0.05) {
        ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
        lastRingX = ringX;
        lastRingY = ringY;
      }
    })();

    document.querySelectorAll('a, button, .slide-thumb, .pg-item, [data-cursor]').forEach(function (element) {
      element.addEventListener('mouseenter', function () {
        showCursorLabel(element.dataset.cursor || 'EXPLORE', element.dataset.cursorSide || 'right');
        if (element.offsetWidth < 300) {
          magnetTarget = element;
          magnetRect = element.getBoundingClientRect();
        }
      });

      element.addEventListener('mouseleave', function () {
        hideCursorLabel();
        magnetTarget = null;
        magnetRect = null;
      });
    });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '';
      ring.style.opacity = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();