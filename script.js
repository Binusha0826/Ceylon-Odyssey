document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 1. GLOBAL FULL-PAGE SCROLL-CONTROLLED VIDEO BACKGROUND
  // ============================================================
  const TOTAL_FRAMES = 300;
  const FRAME_DIR = './Travel';
  const canvas = document.getElementById('canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const heroOverlay = document.getElementById('heroOverlay');
  const globalChapterPill = document.getElementById('globalChapterPill');
  const globalChapterText = document.getElementById('globalChapterText');
  const loader = document.getElementById('loader');
  const progress = document.getElementById('progress');
  const navbar = document.getElementById('navbar');

  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let lastRenderedFrame = -1;

  function getFrameUrl(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_DIR}/ezgif-frame-${num}.jpg`;
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    lastRenderedFrame = -1; // force re-render on next tick
  }

  function drawFrame(img) {
    if (!ctx || !canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const ratio = Math.max(cw / iw, ch / ih);
    const nw = iw * ratio;
    const nh = ih * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;

    ctx.drawImage(img, cx, cy, nw, nh);
  }

  function getBestFrame(idx) {
    if (images[idx] && images[idx].complete && images[idx].naturalWidth > 0) {
      return images[idx];
    }
    for (let i = idx - 1; i >= 0; i--) {
      if (images[i] && images[i].complete && images[i].naturalWidth > 0) return images[i];
    }
    for (let i = idx + 1; i < TOTAL_FRAMES; i++) {
      if (images[i] && images[i].complete && images[i].naturalWidth > 0) return images[i];
    }
    return null;
  }

  function updateScroll() {
    // 1. Calculate scroll progress relative to the FULL DOCUMENT HEIGHT (0 to 1)
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    }

    // 2. Hero Overlay fade & parallax as user scrolls past Hero
    if (heroOverlay) {
      const heroDistance = window.innerHeight * 0.75;
      const heroRatio = Math.min(1, Math.max(0, window.scrollY / heroDistance));
      heroOverlay.style.opacity = Math.max(0, 1 - heroRatio * 1.4);
      heroOverlay.style.transform = `translateY(-${heroRatio * 50}px)`;
    }

    // 3. Persistent Chapter pill update across the whole site timeline
    if (globalChapterPill && globalChapterText) {
      if (targetProgress < 0.22) {
        globalChapterText.textContent = 'Act I: Island Skies & Cloud Descent';
      } else if (targetProgress < 0.52) {
        globalChapterText.textContent = 'Act II: Historic Galle Fort & Ocean Coast';
      } else if (targetProgress < 0.78) {
        globalChapterText.textContent = 'Act III: Sacred Kandy & Cultural Realm';
      } else {
        globalChapterText.textContent = 'Act IV: Adam\'s Peak Night Pilgrimage';
      }
    }

    // 4. Navbar styling on scroll
    if (navbar) {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }

  function animate() {
    // Buttery smooth lerp (factor: 0.08)
    currentProgress += (targetProgress - currentProgress) * 0.08;

    const frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );

    if (frameIndex !== lastRenderedFrame) {
      const frameImg = getBestFrame(frameIndex);
      if (frameImg) {
        drawFrame(frameImg);
        lastRenderedFrame = frameIndex;
      }
    }

    requestAnimationFrame(animate);
  }

  function preloadImages() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);

      img.onload = () => {
        loadedCount++;
        if (progress) {
          progress.style.width = `${(loadedCount / TOTAL_FRAMES) * 100}%`;
        }

        if (i === 0 && lastRenderedFrame === -1) {
          drawFrame(img);
          lastRenderedFrame = 0;
        }

        if (loadedCount === TOTAL_FRAMES && loader) {
          setTimeout(() => {
            loader.classList.add('hidden');
          }, 350);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES && loader) {
          loader.classList.add('hidden');
        }
      };

      images[i] = img;
    }
  }

  // ============================================================
  // 2. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ============================================================
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ============================================================
  // 3. INTERACTIVE JOURNEY PLANNER MODAL
  // ============================================================
  const modal = document.getElementById('plannerModal');
  const modalOpenBtns = document.querySelectorAll('.js-open-planner');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const plannerForm = document.getElementById('plannerForm');
  const formSuccessMsg = document.getElementById('formSuccessMsg');

  function openModal() {
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (formSuccessMsg) formSuccessMsg.style.display = 'none';
      if (plannerForm) plannerForm.style.display = 'block';
    }
  }

  modalOpenBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Interactive Chip Selection in Modal
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = chip.parentElement;
      if (parent) {
        parent.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
      }
      chip.classList.add('active');
    });
  });

  // Form submission feedback
  if (plannerForm) {
    plannerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      plannerForm.style.display = 'none';
      if (formSuccessMsg) {
        formSuccessMsg.style.display = 'block';
      }
    });
  }

  // ============================================================
  // 4. MOBILE NAVIGATION TOGGLE
  // ============================================================
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }

  // ============================================================
  // 5. INITIALIZE
  // ============================================================
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updateScroll, { passive: true });

  resizeCanvas();
  preloadImages();
  updateScroll();
  requestAnimationFrame(animate);
});
