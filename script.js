import VanillaTilt from 'vanilla-tilt';
import { initThreeBackground } from './three-bg.js';

document.addEventListener('DOMContentLoaded', () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const threeApi = initThreeBackground();

    // Theme: light / dark
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const getTheme = () => root.getAttribute('data-theme') || 'light';

    const applyTheme = (theme, { persist = true } = {}) => {
        const next = theme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
        root.style.colorScheme = next;
        if (persist) {
            try {
                localStorage.setItem('theme', next);
            } catch (_) {
                /* ignore */
            }
        }
        themeToggle?.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle?.setAttribute('title', next === 'dark' ? 'Light mode' : 'Dark mode');
        threeApi?.setTheme?.(next);
    };

    applyTheme(getTheme(), { persist: false });

    themeToggle?.addEventListener('click', () => {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        try {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light', { persist: false });
            }
        } catch (_) {
            /* ignore */
        }
    });

    // Boot loader
    const loader = document.querySelector('.loader');
    requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
        setTimeout(() => {
            if (loader) {
                loader.classList.add('is-done');
                setTimeout(() => loader.remove(), 700);
            }
        }, prefersReduced ? 100 : 900);
    });

    // Custom cursor
    const cursor = document.querySelector('.cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (cursor && cursorDot && canHover && !prefersReduced) {
        document.body.classList.add('has-cursor');
        let x = 0;
        let y = 0;
        let dx = 0;
        let dy = 0;

        window.addEventListener('mousemove', (e) => {
            x = e.clientX;
            y = e.clientY;
            cursorDot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });

        const loopCursor = () => {
            dx += (x - dx) * 0.18;
            dy += (y - dy) * 0.18;
            cursor.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            requestAnimationFrame(loopCursor);
        };
        loopCursor();

        document.querySelectorAll('a, button, summary, [data-tilt]').forEach((el) => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
        });
    }

    // Keep theme toggle in cursor interactive set even if added later
    themeToggle?.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
    themeToggle?.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));

    // 3D tilt
    const tiltTargets = document.querySelectorAll('[data-tilt]');
    if (!prefersReduced && tiltTargets.length) {
        VanillaTilt.init(tiltTargets, {
            max: 9,
            speed: 500,
            glare: true,
            'max-glare': 0.14,
            scale: 1.025,
            perspective: 1000,
        });
    }

    // Hero parallax
    const heroLayer = document.querySelector('.hero-copy');
    if (heroLayer && !prefersReduced) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 14;
            heroLayer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    }

    // Rotating roles + typewriter
    const titleEl = document.querySelector('[data-roles]');
    if (titleEl) {
        const roles = titleEl.getAttribute('data-roles').split('|').map((s) => s.trim());
        let roleIndex = 0;

        const typeText = (text, onDone) => {
            if (prefersReduced) {
                titleEl.textContent = text;
                onDone?.();
                return;
            }
            titleEl.classList.add('is-typing');
            titleEl.classList.remove('is-typed');
            let i = 0;
            titleEl.textContent = '';
            const step = () => {
                if (i <= text.length) {
                    titleEl.textContent = text.slice(0, i);
                    i += 1;
                    setTimeout(step, 42);
                } else {
                    titleEl.classList.add('is-typed');
                    onDone?.();
                }
            };
            step();
        };

        const eraseText = (onDone) => {
            if (prefersReduced) {
                onDone?.();
                return;
            }
            const run = () => {
                const current = titleEl.textContent;
                if (current.length) {
                    titleEl.textContent = current.slice(0, -1);
                    setTimeout(run, 24);
                } else {
                    onDone?.();
                }
            };
            run();
        };

        const cycle = () => {
            typeText(roles[roleIndex], () => {
                setTimeout(() => {
                    eraseText(() => {
                        roleIndex = (roleIndex + 1) % roles.length;
                        cycle();
                    });
                }, 1800);
            });
        };
        setTimeout(cycle, prefersReduced ? 0 : 700);
    }

    // Scroll reveals
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.querySelectorAll('.reveal-child').forEach((child, idx) => {
                    child.style.transitionDelay = `${idx * 65}ms`;
                    child.classList.add('is-visible');
                });
                el.classList.add('is-visible');
                observer.unobserve(el);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    reveals.forEach((el) => observer.observe(el));

    // Nav spy + indicator + mobile menu + progress
    const progress = document.querySelector('.scroll-progress');
    const content = document.querySelector('.content');
    const siteNav = document.getElementById('site-nav');
    const navLinks = [...document.querySelectorAll('[data-nav]')];
    const mobileLinks = [...document.querySelectorAll('[data-nav-mobile]')];
    const navIndicator = document.querySelector('.nav-indicator');
    const navBurger = document.getElementById('nav-burger');
    const navDrawer = document.getElementById('nav-drawer');
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    const setNavOpen = (open) => {
        document.body.classList.toggle('nav-open', open);
        navBurger?.classList.toggle('is-open', open);
        navDrawer?.classList.toggle('is-open', open);
        if (navDrawer) navDrawer.hidden = !open;
        navBurger?.setAttribute('aria-expanded', open ? 'true' : 'false');
        navBurger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    navBurger?.addEventListener('click', () => {
        setNavOpen(!document.body.classList.contains('nav-open'));
    });

    [...navLinks, ...mobileLinks].forEach((link) => {
        link.addEventListener('click', () => setNavOpen(false));
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setNavOpen(false);
    });

    const moveIndicator = (activeLink) => {
        if (!navIndicator || !activeLink || window.innerWidth <= 720) {
            if (navIndicator) navIndicator.style.opacity = '0';
            return;
        }
        const parent = activeLink.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        navIndicator.style.width = `${linkRect.width}px`;
        navIndicator.style.transform = `translateX(${linkRect.left - parentRect.left}px)`;
        navIndicator.style.opacity = '1';
    };

    let targetProgress = 0;
    let smoothProgress = 0;

    const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        targetProgress = max > 0 ? window.scrollY / max : 0;
        threeApi?.setScrollProgress?.(Math.min(window.scrollY / (window.innerHeight * 1.2), 1));

        if (content && !prefersReduced) {
            content.style.setProperty('--scroll-shift', `${Math.min(window.scrollY * 0.03, 24)}px`);
        }

        const y = window.scrollY + window.innerHeight * 0.35;
        let active = sections[0];
        sections.forEach((sec) => {
            if (sec.offsetTop <= y) active = sec;
        });

        let activeLink = null;
        const activeHash = `#${active?.id}`;
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === activeHash;
            link.classList.toggle('is-active', isActive);
            if (isActive) activeLink = link;
        });
        mobileLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === activeHash);
        });
        moveIndicator(activeLink);

        document.body.classList.toggle('scrolled', window.scrollY > 40);
    };

    const animateProgress = () => {
        smoothProgress += (targetProgress - smoothProgress) * 0.12;
        if (progress) progress.style.transform = `scaleX(${smoothProgress})`;
        requestAnimationFrame(animateProgress);
    };
    animateProgress();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 720) setNavOpen(false);
        onScroll();
    });
    onScroll();

    setTimeout(onScroll, 1100);
    siteNav?.addEventListener('mouseleave', onScroll);

    // Magnetic CTAs
    if (!prefersReduced) {
        document.querySelectorAll('.cta-btn').forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate3d(${x * 0.22}px, ${y * 0.28}px, 0)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate3d(0, 0, 0)';
            });
        });
    }

    // Skill tag ripple hover trail
    if (!prefersReduced) {
        document.querySelectorAll('.skill-tags li').forEach((tag) => {
            tag.addEventListener('mouseenter', () => {
                tag.classList.add('is-hot');
                setTimeout(() => tag.classList.remove('is-hot'), 400);
            });
        });
    }

    // Back to top
    const topBtn = document.querySelector('.to-top');
    topBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
