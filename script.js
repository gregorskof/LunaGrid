'use strict';
const menu = document.getElementById('menuToggle');
const links = document.getElementById('navlinks');
menu?.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
links?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  links.classList.remove('is-open');
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Open navigation');
}));
const preview = document.getElementById('themePreview');
document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
  const dark = button.dataset.theme === 'dark';
  preview?.classList.toggle('is-dark', dark);
  document.querySelectorAll('[data-theme]').forEach(b => {
    const selected = b === button;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-pressed', String(selected));
  });
}));
document.getElementById('year').textContent = new Date().getFullYear();

// Respect reduced motion and preserve full content for users without JS.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const revealItems = document.querySelectorAll('.section-heading, .feature-card, .toolkit-heading, .toolkit-card, .toolkit-footer, .statement-inner, .experience-text, .experience-panel, .step, .faq-grid, .download-inner');
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-visible');
      instance.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
  revealItems.forEach(node => {
    node.classList.add('motion-reveal');
    observer.observe(node);
  });
  document.documentElement.classList.add('has-motion');
}
