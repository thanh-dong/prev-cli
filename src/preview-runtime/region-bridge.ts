// Bridge script injected into preview iframes to enable region interactivity.
// Handles: click events on [data-region] elements → postMessage to parent
//          highlight-regions message from parent → visual overlay on regions

export const REGION_BRIDGE_SCRIPT = `
(function() {
  // Click handler: delegate clicks on [data-region] elements
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document.body) {
      if (el.getAttribute && el.getAttribute('data-region')) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'region-click',
          region: el.getAttribute('data-region')
        }, '*');
        return;
      }
      el = el.parentElement;
    }
  }, true);

  // Highlight handler: parent sends list of region names to highlight
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'highlight-regions') return;

    // Remove existing highlights
    var existing = document.querySelectorAll('[data-region-highlight]');
    for (var i = 0; i < existing.length; i++) {
      existing[i].removeAttribute('data-region-highlight');
      existing[i].style.cursor = '';
    }

    var regions = e.data.regions || [];
    if (regions.length === 0) {
      // Report empty rects when cleared
      window.parent.postMessage({ type: 'region-rects', rects: [] }, '*');
      return;
    }

    for (var j = 0; j < regions.length; j++) {
      var els = document.querySelectorAll('[data-region="' + regions[j] + '"]');
      for (var k = 0; k < els.length; k++) {
        els[k].setAttribute('data-region-highlight', 'true');
        els[k].style.cursor = 'pointer';
      }
    }

    // Report bounding rects to parent
    reportRegionRects();
  });

  // Measure and report region rects to parent
  function reportRegionRects() {
    var highlighted = document.querySelectorAll('[data-region-highlight]');
    var rects = [];
    for (var i = 0; i < highlighted.length; i++) {
      var el = highlighted[i];
      var rect = el.getBoundingClientRect();
      rects.push({
        name: el.getAttribute('data-region') || '',
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
    }
    window.parent.postMessage({ type: 'region-rects', rects: rects }, '*');
  }

  // Debounced re-report on scroll/resize
  var debounceTimer = null;
  function debouncedReport() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      var highlighted = document.querySelectorAll('[data-region-highlight]');
      if (highlighted.length > 0) reportRegionRects();
    }, 100);
  }
  window.addEventListener('scroll', debouncedReport, true);
  window.addEventListener('resize', debouncedReport);
})();
`
