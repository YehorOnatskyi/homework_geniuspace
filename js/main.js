(function () {
  const modal = document.getElementById('call-modal');
  const backdrop = document.querySelector('[data-modal-backdrop]');
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeButtons = document.querySelectorAll('[data-modal-close]');
  const forms = document.querySelectorAll('.js-validate-form');

  if (!modal || !backdrop) {
    return;
  }

  let savedScrollY = 0;

  function lockPageScroll() {
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('is-modal-open');
  }

  function unlockPageScroll() {
    document.body.classList.remove('is-modal-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }

  function openModal() {
    lockPageScroll();
    modal.classList.remove('is-hidden');
    backdrop.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.scrollTop = 0;
    modal.focus({ preventScroll: true });
    modal.querySelector('.modal__close')?.focus({ preventScroll: true });
  }

  function closeModal() {
    modal.classList.add('is-hidden');
    backdrop.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    unlockPageScroll();
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', openModal);
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      closeModal();
    }
  });

  modal.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  const regexByField = {
    name: /^[A-Za-zА-Яа-яІіЇїЄєҐґ'-]+(?:\s+[A-Za-zА-Яа-яІіЇїЄєҐґ'-]+)+$/,
    phone: /^\+380\d{9}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  };

  function validateInput(input) {
    const value = input.value.trim();
    const field = input.dataset.field;
    const regex = regexByField[field];
    const defaultError = input.dataset.errorName || 'Поле заповнено некоректно';

    input.value = value;
    input.classList.remove('is-error');
    input.setCustomValidity('');

    if (!value) {
      input.classList.add('is-error');
      input.setCustomValidity('Поле є обовʼязковим');
      return false;
    }

    if (regex && !regex.test(value)) {
      input.classList.add('is-error');
      input.setCustomValidity(defaultError);
      return false;
    }

    return true;
  }

  forms.forEach((form) => {
    const fields = form.querySelectorAll('[data-field]');

    fields.forEach((input) => {
      input.addEventListener('input', () => {
        validateInput(input);
      });

      input.addEventListener('blur', () => {
        validateInput(input);
      });
    });

    form.addEventListener('submit', (event) => {
      let isFormValid = true;

      fields.forEach((input) => {
        if (!validateInput(input)) {
          isFormValid = false;
        }
      });

      if (!isFormValid) {
        event.preventDefault();
        form.reportValidity();
        return;
      }

      event.preventDefault();
      form.reset();
      fields.forEach((input) => input.classList.remove('is-error'));
    });
  });
})();

(function () {
  const section = document.getElementById('services');
  const wrapper = section?.querySelector('.services__track');
  const dots = section ? Array.from(section.querySelectorAll('.services__dot')) : [];
  const prevBtn = section?.querySelector('.services__arrow:not(.services__arrow--next)');
  const nextBtn = section?.querySelector('.services__arrow--next');
  const slideCount = 3;
  const slideDurationMs = 300;
  const defaultSliderConfig = {
    slidesPerView: 1,
    spaceBetween: 0,
  };
  const sliderBreakpoints = {
    861: {
      slidesPerView: 2,
      spaceBetween: 16,
    },
    1201: {
      slidesPerView: 3,
      spaceBetween: 16,
    },
  };

  if (!wrapper || dots.length === 0 || !prevBtn || !nextBtn) {
    return;
  }

  let activeIndex = 0;
  let isAnimating = false;
  let currentSlidesPerView = null;

  function getSliderConfig() {
    const width = window.innerWidth;
    let config = { ...defaultSliderConfig };

    Object.keys(sliderBreakpoints)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((breakpoint) => {
        if (width >= breakpoint) {
          config = { ...config, ...sliderBreakpoints[breakpoint] };
        }
      });

    return config;
  }

  function applySliderConfig() {
    const { slidesPerView, spaceBetween } = getSliderConfig();

    wrapper.style.gap = `${spaceBetween}px`;
    wrapper.style.justifyContent = slidesPerView === 3 ? 'center' : 'flex-start';

    if (currentSlidesPerView !== null && currentSlidesPerView !== slidesPerView && !isAnimating) {
      wrapper.style.transition = 'none';
      wrapper.style.transform = '';
      void wrapper.offsetHeight;
      wrapper.style.transition = '';
      updateDots(activeIndex);
    }

    currentSlidesPerView = slidesPerView;
  }

  function getStep() {
    const firstSlide = wrapper.firstElementChild;
    if (!firstSlide) {
      return 0;
    }

    const { spaceBetween } = getSliderConfig();
    const gap =
      Number.parseFloat(getComputedStyle(wrapper).columnGap || getComputedStyle(wrapper).gap) ||
      spaceBetween;

    return firstSlide.offsetWidth + gap;
  }

  function updateDots(index) {
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle('is-active', isActive);

      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function finishTransition(onComplete) {
    wrapper.style.transition = 'none';
    wrapper.style.transform = '';
    void wrapper.offsetHeight;
    wrapper.style.transition = '';
    isAnimating = false;
    onComplete?.();
  }

  function runRotation(applyTransform, reorderDom, onComplete) {
    if (isAnimating) {
      return;
    }

    isAnimating = true;
    const step = getStep();
    let isFinished = false;

    const finish = () => {
      if (isFinished) {
        return;
      }

      isFinished = true;
      reorderDom();
      updateDots(activeIndex);
      finishTransition(onComplete);
    };

    applyTransform(step);

    const onTransitionEnd = (event) => {
      if (event.target !== wrapper || event.propertyName !== 'transform') {
        return;
      }

      wrapper.removeEventListener('transitionend', onTransitionEnd);
      finish();
    };

    wrapper.addEventListener('transitionend', onTransitionEnd);
    window.setTimeout(finish, slideDurationMs + 50);
  }

  function rotateNext(onComplete) {
    runRotation(
      (step) => {
        wrapper.style.transition = `transform ${slideDurationMs}ms ease-in-out`;
        wrapper.style.transform = 'translateX(0)';
        void wrapper.offsetWidth;
        wrapper.style.transform = `translateX(-${step}px)`;
      },
      () => {
        wrapper.appendChild(wrapper.firstElementChild);
        activeIndex = (activeIndex + 1) % slideCount;
      },
      onComplete,
    );
  }

  function rotatePrev(onComplete) {
    runRotation(
      (step) => {
        wrapper.style.transition = `transform ${slideDurationMs}ms ease-in-out`;
        wrapper.style.transform = 'translateX(0)';
        void wrapper.offsetWidth;
        wrapper.style.transform = `translateX(${step}px)`;
      },
      () => {
        wrapper.insertBefore(wrapper.lastElementChild, wrapper.firstElementChild);
        activeIndex = (activeIndex - 1 + slideCount) % slideCount;
      },
      onComplete,
    );
  }

  function goToIndex(targetIndex) {
    if (isAnimating || targetIndex === activeIndex) {
      return;
    }

    const stepsForward = (targetIndex - activeIndex + slideCount) % slideCount;
    const stepsBackward = (activeIndex - targetIndex + slideCount) % slideCount;

    if (stepsForward <= stepsBackward) {
      rotateNext(() => {
        if (activeIndex !== targetIndex) {
          goToIndex(targetIndex);
        }
      });
      return;
    }

    rotatePrev(() => {
      if (activeIndex !== targetIndex) {
        goToIndex(targetIndex);
      }
    });
  }

  prevBtn.addEventListener('click', () => {
    rotatePrev();
  });

  nextBtn.addEventListener('click', () => {
    rotateNext();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToIndex(index);
    });
  });

  wrapper.querySelectorAll('article').forEach((article) => {
    const slideIndex = Number(article.dataset.slideIndex);

    article.addEventListener('click', () => {
      goToIndex(slideIndex);
    });
  });

  applySliderConfig();

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applySliderConfig, 150);
  });
})();

(function () {
  const menu = document.getElementById('mobile-menu');
  const openButton = document.querySelector('[data-mobile-menu-open]');
  const closeButton = menu?.querySelector('[data-mobile-menu-close]');
  const menuLinks = menu ? Array.from(menu.querySelectorAll('.mobile-menu__link')) : [];

  if (!menu || !openButton || !closeButton) {
    return;
  }

  function setActiveLink() {
    const hash = window.location.hash || '#about';

    menuLinks.forEach((link) => {
      link.classList.toggle('mobile-menu__link--active', link.hash === hash);
    });
  }

  function openMenu() {
    setActiveLink();
    menu.classList.remove('is-hidden');
    menu.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    openButton.setAttribute('aria-label', 'Закрити меню');
    document.body.classList.add('is-mobile-menu-open');
    closeButton.focus();
  }

  function closeMenu() {
    menu.classList.add('is-hidden');
    menu.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.setAttribute('aria-label', 'Відкрити меню');
    document.body.classList.remove('is-mobile-menu-open');
    openButton.focus();
  }

  function toggleMenu() {
    if (menu.classList.contains('is-hidden')) {
      openMenu();
      return;
    }

    closeMenu();
  }

  openButton.addEventListener('click', toggleMenu);
  closeButton.addEventListener('click', closeMenu);

  menuLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.classList.contains('is-hidden')) {
      closeMenu();
    }
  });
})();
