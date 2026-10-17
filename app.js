'use strict';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const portfolioConfig = { cvUrl: 'assets/amy-ye-cv.pdf', aiesecProjectUrl: '' };
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const contactDialog = document.querySelector('#contact-dialog');
const toast = document.querySelector('.toast');
let toastTimeout;
let contactReturnFocus;
let smoothScroller = null;
function setMenu(open) {
  mobileNav.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
}
function notify(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 4200);
}
menuToggle.addEventListener('click', () => setMenu(mobileNav.hidden));
mobileNav.addEventListener('click', event => {
  if (event.target.closest('a, button')) setMenu(false);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header') && !mobileNav.hidden) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuToggle.focus(); }
});
window.matchMedia('(min-width: 1241px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});
document.querySelectorAll('[data-section]').forEach(button => {
  button.addEventListener('click', () => notify(button.dataset.section + ' coming soon'));
});
document.querySelector('[data-project-details]').addEventListener('click', () => {
  if (!portfolioConfig.aiesecProjectUrl) { notify('Project details coming soon'); return; }
  window.open(portfolioConfig.aiesecProjectUrl, '_blank', 'noopener,noreferrer');
});
document.querySelectorAll('[data-cv]').forEach(button => {
  button.addEventListener('click', () => {
    if (!portfolioConfig.cvUrl) { notify('CV coming soon'); return; }
    const link = document.createElement('a');
    link.href = portfolioConfig.cvUrl;
    link.download = 'Amy-YE-CV.pdf';
    link.click();
  });
});
document.querySelectorAll('[data-contact]').forEach(button => {
  button.addEventListener('click', () => {
    contactReturnFocus = window.matchMedia('(max-width: 1240px)').matches ? menuToggle : button;
    setMenu(false);
    smoothScroller?.stop();
    contactDialog.showModal();
    document.body.classList.add('dialog-open');
    setActiveNavigation('contact');
  });
});
contactDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  smoothScroller?.start();
  updateNavigation();
  contactReturnFocus?.focus({preventScroll: true});
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});

// Enhance the existing text without changing its content or line breaks.
// A single accessible copy stays readable by assistive technology.
function revealLetters(element, start, step) {
  const originalText = element.textContent.replace(/\s+/g, ' ').trim();
  const visual = document.createElement('span');
  visual.className = 'motion-text';
  visual.setAttribute('aria-hidden', 'true');
  while (element.firstChild) visual.appendChild(element.firstChild);
  const readable = document.createElement('span');
  readable.className = 'sr-only';
  readable.textContent = originalText;
  element.append(readable, visual);
  const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let index = 0;
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        index += part.length;
        return;
      }
      const word = document.createElement('span');
      word.className = 'motion-word';
      Array.from(part).forEach(character => {
        const letter = document.createElement('span');
        letter.className = 'motion-char';
        letter.textContent = character;
        letter.style.setProperty('--letter-delay', `${(start + index++ * step).toFixed(3)}s`);
        word.appendChild(letter);
      });
      fragment.appendChild(word);
    });
    node.replaceWith(fragment);
  });
  element.classList.add('text-reveal');
}
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealLetters(document.querySelector('.eyebrow'), .18, .045);
  const introduction = document.querySelector('.intro');
  const letterCount = Array.from(introduction.textContent).length;
  revealLetters(introduction, 1.85, 1.65 / Math.max(1, letterCount - 1));
}

const header = document.querySelector('.site-header');
const sections = Array.from(document.querySelectorAll('#home, .portfolio-section'));
const sectionLinks = Array.from(document.querySelectorAll('[data-nav-section], [data-contact]'));
let navigationFrame = 0;
let activeSection = '';
let sectionPositions = [];
let activationOffset = 0;
function measureNavigation() {
  activationOffset = parseFloat(getComputedStyle(header).top) + header.offsetHeight + Math.min(window.innerHeight * .16, 130);
  sectionPositions = sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top + window.scrollY }));
}
function setActiveNavigation(id) {
  if (activeSection === id) return;
  activeSection = id;
  sectionLinks.forEach(link => {
    const selected = (link.dataset.navSection || 'contact') === id;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function updateNavigation() {
  navigationFrame = 0;
  if (contactDialog.open) return;
  const activationLine = window.scrollY + activationOffset;
  let current = sections[0].id;
  sectionPositions.forEach(section => {
    if (section.top <= activationLine) current = section.id;
  });
  setActiveNavigation(current);
}
function scheduleNavigation() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}
function measureHeader() {
  document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  fitStackSpacing();
  measureNavigation();
  scheduleNavigation();
}
// Keep all stacked top edges below the navigation, including shorter windows.
function fitStackSpacing() {
  const pinTop = parseFloat(getComputedStyle(header).top) + header.offsetHeight + 22;
  document.querySelectorAll('.card-stack').forEach(stack => {
    const cards = Array.from(stack.querySelectorAll('.entry-card'));
    const intrinsicHeights = cards.map(card => card.querySelector('.entry-card-inner').offsetHeight + 2);
    const cardHeights = intrinsicHeights;
    const layerCount = Math.max(1, cards.length - 1);
    const tallestCard = Math.max(...cardHeights);
    const preferredStep = Math.min(30, Math.max(14, window.innerWidth * .0155));
    const availableStep = (window.innerHeight - pinTop - tallestCard - 24) / layerCount;
    const step = Math.min(preferredStep, Math.max(8, availableStep));
    stack.style.setProperty('--stack-step', `${step.toFixed(2)}px`);
    const stackPinTop = pinTop;
    cards.forEach((card, index) => {
      // An unusually tall card must be allowed to scroll past its final line.
      const fitTop = window.innerHeight - cardHeights[index] - 24;
      const normalTop = stackPinTop + index * step;
      card.style.setProperty('--card-fit-top', `${Math.min(normalTop, fitTop)}px`);
    });
  });
}
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', measureHeader, { passive: true });
new ResizeObserver(measureHeader).observe(header);
measureHeader();
const stackSizeObserver = new ResizeObserver(() => { fitStackSpacing(); measureNavigation(); scheduleNavigation(); });
document.querySelectorAll('.entry-card').forEach(card => stackSizeObserver.observe(card));
sections.forEach(section => stackSizeObserver.observe(section));
document.fonts.ready.then(measureHeader);
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.section-heading').forEach(element => {
    element.classList.add('scroll-reveal');
    revealObserver.observe(element);
  });
  document.documentElement.classList.add('motion-ready');
}

// Animate the real window scroll so sticky cards and section tracking stay aligned.
// Ease toward each gesture's destination, continuing gently after input ends.
// Time-normalized damping preserves the same short tail at different frame rates.
const scrollMotion = { lerp: .075, easing: t => 1 - Math.pow(1 - t, 3) };
if (typeof window.Lenis === 'function') {
  contactDialog.setAttribute('data-lenis-prevent', '');
  mobileNav.setAttribute('data-lenis-prevent', '');
  smoothScroller = new window.Lenis({
    ...scrollMotion,
    autoRaf: true,
    smoothWheel: true,
    wheelMultiplier: 1,
    syncTouch: false,
    respectReducedMotion: true,
    prevent: node => node === contactDialog || node === mobileNav
  });
  smoothScroller.on('scroll', scheduleNavigation);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    const href = link?.getAttribute('href');
    if (!href || href === '#' || contactDialog.open) return;
    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;
    event.preventDefault();
    setMenu(false);
    if (location.hash !== href) history.pushState(null, '', href);
    smoothScroller.scrollTo(target.id === 'home' ? 0 : target, {
      duration: 1.1,
      lerp: 0,
      easing: scrollMotion.easing,
      onComplete: () => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        scheduleNavigation();
      }
    });
  });
  // Keyboard scrolling shares the same motion and can reverse an active glide.
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || contactDialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable], [data-lenis-prevent]')) return;
    if (event.key === ' ' && event.target.closest('button, summary')) return;
    const distance = window.innerHeight * .86;
    const increments = { ArrowDown: 60, ArrowUp: -60, PageDown: distance, PageUp: -distance, ' ': event.shiftKey ? -distance : distance };
    let destination;
    if (event.key === 'Home') destination = 0;
    else if (event.key === 'End') destination = smoothScroller.limit;
    else if (Object.hasOwn(increments, event.key)) {
      const increment = increments[event.key];
      const reversing = increment * smoothScroller.velocity < 0;
      destination = (reversing ? smoothScroller.actualScroll : smoothScroller.targetScroll) + increment;
    }
    else return;
    event.preventDefault();
    smoothScroller.scrollTo(destination, { ...scrollMotion, programmatic: false });
  });
}

// A fresh visit always starts at Home; explicit section links remain addressable.
function restoreEntryPosition() {
  const id = location.hash.slice(1) || 'home';
  const target = document.getElementById(id) || document.getElementById('home');
  if (smoothScroller) smoothScroller.scrollTo(target.id === 'home' ? 0 : target, { immediate: true });
  else {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    window.scrollTo({ top: target.id === 'home' ? 0 : window.scrollY + target.getBoundingClientRect().top - padding, behavior: 'instant' });
  }
  scheduleNavigation();
}
window.addEventListener('pageshow', restoreEntryPosition);
window.addEventListener('popstate', restoreEntryPosition);
window.addEventListener('hashchange', restoreEntryPosition);
requestAnimationFrame(restoreEntryPosition);

const partnership = document.querySelector('.partnership');
const marqueeToggle = document.querySelector('.marquee-toggle');
marqueeToggle.addEventListener('click', () => {
  const paused = partnership.classList.toggle('is-paused');
  marqueeToggle.setAttribute('aria-pressed', String(paused));
  marqueeToggle.setAttribute('aria-label', paused ? 'Play logo animation' : 'Pause logo animation');
  marqueeToggle.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
});

// Recommendations: centered cards, accessible pagination and a circular track.
(() => {
  const carousel = document.querySelector('.review-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.reviews-track');
  const originals = [...track.querySelectorAll('.review-card')];
  const dots = [...carousel.querySelectorAll('.review-dot')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  originals.forEach((card, index) => { card.dataset.review = index; });
  function clone(card) {
    const copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    return copy;
  }
  originals.slice(-2).reverse().forEach(card => track.prepend(clone(card)));
  originals.slice(0, 2).forEach(card => track.append(clone(card)));
  const cards = [...track.children];
  let active = 0, timer, settle;
  function center(card, behavior = 'auto') {
    track.scrollTo({left: card.offsetLeft - track.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior});
  }
  function show(index, announce = false) {
    active = (index + originals.length) % originals.length;
    center(originals[active], reduced.matches ? 'auto' : 'smooth');
    if (announce) document.querySelector('#review-status').textContent = `Recommendation ${active + 1} of ${originals.length}`;
  }
  function stop() { clearInterval(timer); }
  function start() {
    stop();
    if (reduced.matches || document.hidden || carousel.contains(document.activeElement)) return;
    timer = setInterval(() => {
      const next = active + 1;
      center(next === originals.length ? cards[cards.length - 2] : originals[next], 'smooth');
    }, 4000);
  }
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const middle = track.scrollLeft + track.clientWidth / 2;
      const nearest = cards.reduce((a, b) => Math.abs(a.offsetLeft-track.offsetLeft+a.offsetWidth/2-middle) < Math.abs(b.offsetLeft-track.offsetLeft+b.offsetWidth/2-middle) ? a : b);
      active = Number(nearest.dataset.review);
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === active)));
      if (nearest.getAttribute('aria-hidden') === 'true') center(originals[active]);
    }, 140);
  }, {passive:true});
  dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index, true); }));
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? originals.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', () => setTimeout(start, 0));
  track.addEventListener('pointerdown', stop);
  track.addEventListener('pointerup', start);
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', start);
  new ResizeObserver(() => center(originals[active])).observe(track);
  document.fonts.ready.then(() => { center(originals[0]); start(); });
})();

// Prepare a real email draft; sending remains in the visitor’s mail application.
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const body = `Name: ${name}\nEmail: ${String(data.get('email')).trim()}\n\n${String(data.get('message')).trim()}`;
  window.location.href = `mailto:amy1836373068@gmail.com?subject=${encodeURIComponent('Portfolio enquiry from ' + name)}&body=${encodeURIComponent(body)}`;
});
