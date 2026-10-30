/*
 * Rounded selection for the static LunaGrid site.
 * Standalone adaptation of the SVG selection-geometry approach documented by
 * Zovanion's RoundSelect project (https://roundselect.zovanion.com/).
 * The Angular host directive itself is not directly usable in a static site.
 * Native Selection and Range APIs remain authoritative (copy/keyboard work).
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = {
    coarse: matchMedia('(pointer: coarse)'),
    forced: matchMedia('(forced-colors: active)')
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  const overlay = document.createElementNS(svgNS, 'svg');
  overlay.classList.add('rounded-selection-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('focusable', 'false');
  overlay.style.display = 'none';
  document.body.appendChild(overlay);
  let pending = false;
  const MAX_TEXT = 12000;
  const MAX_NODES = 350;
  const MAX_FRAGMENTS = 180;

  function clear() {
    overlay.replaceChildren();
    overlay.style.display = 'none';
    root.classList.remove('rounded-selection-enabled');
  }

  function disabled() {
    return media.coarse.matches || media.forced.matches;
  }

  function isEditable(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return !!element?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]');
  }

  function roundRectPath(x, y, w, h) {
    const r = Math.max(1, Math.min(5, h / 3, w / 2));
    const right = x + w, bottom = y + h;
    return `M ${x+r} ${y} H ${right-r} Q ${right} ${y} ${right} ${y+r} V ${bottom-r} Q ${right} ${bottom} ${right-r} ${bottom} H ${x+r} Q ${x} ${bottom} ${x} ${bottom-r} V ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
  }

  // Merge adjacent fragments from nested spans on the same visual line.
  function mergeFragments(fragments) {
    fragments.sort((a,b) => (a.y-b.y) || (a.x-b.x));
    const lines = [];
    for (const fragment of fragments) {
      let line = lines.find(l => Math.abs(l.y-fragment.y)<2.5 && Math.abs(l.h-fragment.h)<4);
      if (!line) { line = {y:fragment.y, h:fragment.h, segments:[]}; lines.push(line); }
      const previous = line.segments[line.segments.length-1];
      if (previous && fragment.x <= previous.x + previous.w + 3.5) {
        previous.w = Math.max(previous.x + previous.w, fragment.x + fragment.w) - previous.x;
      } else { line.segments.push({...fragment}); }
    }
    return lines.flatMap(line => line.segments);
  }

  function render() {
    pending = false;
    if (disabled()) { clear(); return; }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount || selection.toString().length > MAX_TEXT) {
      clear(); return;
    }
    const range = selection.getRangeAt(0);
    if (isEditable(range.startContainer) || isEditable(range.endContainer)) { clear(); return; }
    if (!document.body.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== document.body) {
      clear(); return;
    }

    const fragments = [];
    let scanned = 0;
    const ancestor = range.commonAncestorContainer;
    const walkerRoot = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
    if (!walkerRoot) { clear(); return; }
    const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (++scanned > MAX_NODES || fragments.length > MAX_FRAGMENTS) { clear(); return; }
      if (!node.nodeValue || isEditable(node) || !range.intersectsNode(node)) continue;
      const tag = node.parentElement?.closest('script, style, noscript, svg');
      if (tag) continue;
      const part = document.createRange();
      let first = 0, last = node.nodeValue.length;
      if (node === range.startContainer) first = range.startOffset;
      if (node === range.endContainer) last = range.endOffset;
      if (first >= last) continue;
      part.setStart(node, first);
      part.setEnd(node, last);
      for (const r of part.getClientRects()) {
        if (r.width < 0.6 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
        fragments.push({x: r.left, y: r.top, w: r.width, h: r.height});
        if (fragments.length > MAX_FRAGMENTS) break;
      }
    }
    if (!fragments.length || fragments.length > MAX_FRAGMENTS) { clear(); return; }

    const merged = mergeFragments(fragments);
    const chosen = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
    const color = getComputedStyle(chosen || document.body).getPropertyValue('--sel-bg').trim() || 'rgba(91, 131, 245, .38)';
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill', color);
    path.setAttribute('d', merged.map(f => roundRectPath(f.x, f.y, f.w, f.h)).join(' '));
    overlay.replaceChildren(path);
    overlay.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    overlay.style.display = 'block';
    root.classList.add('rounded-selection-enabled');
  }

  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  document.addEventListener('selectionchange', schedule);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('keyup', schedule);
  window.addEventListener('mouseup', schedule);
  document.fonts?.ready.then(schedule).catch(() => {});
  for (const query of Object.values(media)) query.addEventListener?.('change', schedule);
})();
