import { initThreeBackground } from './three-bg.js';

document.addEventListener('DOMContentLoaded', () => {
    initThreeBackground();

    // Scroll-reveal for logbook sections
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));

    console.log(
        "%c Ahoy! \n%c Ye've boarded Shivansh's pirate portfolio. \n%c Fair winds & following seas.",
        "color: #d4a84b; font-size: 22px; font-weight: bold; font-family: Georgia;",
        "color: #9ec8c4; font-size: 14px;",
        "color: #e6efe9; font-size: 13px;"
    );
});
