document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const burger = document.getElementById('nav-burger');
    const drawer = document.getElementById('nav-drawer');

    const getTheme = () => (root.classList.contains('dark') ? 'dark' : 'light');

    const applyTheme = (theme, { persist = true } = {}) => {
        const next = theme === 'dark' ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(next);
        if (themeToggle) {
            themeToggle.textContent = next === 'dark' ? 'light_mode' : 'dark_mode';
            themeToggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        if (persist) {
            try {
                localStorage.setItem('theme', next);
            } catch (_) {
                /* ignore */
            }
        }
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

    const setMenuOpen = (open) => {
        if (!drawer || !burger) return;
        drawer.classList.toggle('opacity-0', !open);
        drawer.classList.toggle('invisible', !open);
        drawer.classList.toggle('pointer-events-none', !open);
        burger.textContent = open ? 'close' : 'menu';
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('overflow-hidden', open);
    };

    burger?.addEventListener('click', () => {
        const open = burger.getAttribute('aria-expanded') !== 'true';
        setMenuOpen(open);
    });

    document.querySelectorAll('.drawer-link').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
    });

    // Active nav underline
    const navLinks = [...document.querySelectorAll('.nav-link')];
    const sections = navLinks
        .map((link) => {
            const id = link.getAttribute('href');
            return id && id.startsWith('#') ? document.querySelector(id) : null;
        })
        .filter(Boolean);

    const onScroll = () => {
        const y = window.scrollY + 120;
        let active = sections[0];
        sections.forEach((section) => {
            if (section.offsetTop <= y) active = section;
        });
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${active?.id || 'top'}`;
            link.classList.toggle('text-secondary', isActive);
            link.classList.toggle('border-b', isActive);
            link.classList.toggle('border-secondary', isActive);
            link.classList.toggle('text-on-surface-variant', !isActive);
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Entrance animations
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12 }
    );

    document.querySelectorAll('main section, main article').forEach((el) => {
        el.classList.add('smooth-glide', 'opacity-0', 'translate-y-10');
        observer.observe(el);
    });
});
