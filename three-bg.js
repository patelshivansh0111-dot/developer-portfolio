import * as THREE from 'three';

export function initThreeBackground() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Starfield over open water
    const starCount = 900;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 18;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
        starSizes[i] = Math.random();
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.025,
        color: 0xd4a84b,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Soft seafoam sparks (cooler tones)
    const foamCount = 280;
    const foamGeometry = new THREE.BufferGeometry();
    const foamPositions = new Float32Array(foamCount * 3);

    for (let i = 0; i < foamCount * 3; i++) {
        foamPositions[i] = (Math.random() - 0.5) * 16;
    }

    foamGeometry.setAttribute('position', new THREE.BufferAttribute(foamPositions, 3));

    const foamMaterial = new THREE.PointsMaterial({
        size: 0.035,
        color: 0x9ec8c4,
        transparent: true,
        opacity: 0.35,
    });

    const foam = new THREE.Points(foamGeometry, foamMaterial);
    scene.add(foam);

    camera.position.z = 3.2;

    let mouseX = 0;
    let mouseY = 0;

    function onMouseMove(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    document.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();

    function tick() {
        const t = clock.getElapsedTime();

        stars.rotation.y = t * 0.018;
        stars.rotation.x = t * 0.008;
        foam.rotation.y = -t * 0.03;
        foam.rotation.z = Math.sin(t * 0.2) * 0.05;

        stars.rotation.y += mouseX * 0.00004;
        stars.rotation.x += mouseY * 0.00004;
        foam.position.y = Math.sin(t * 0.4) * 0.08;

        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    }

    tick();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
