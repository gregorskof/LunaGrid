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
