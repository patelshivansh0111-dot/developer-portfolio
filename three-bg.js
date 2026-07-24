import * as THREE from 'three';

/**
 * Unique backdrop: "Signal Prism"
 * - Morphing crystal core
 * - Mouse-reactive data wavefield
 * - Orbiting packet rings
 * - Vertical bitstream columns
 * - Sweeping scan plane
 */
export function initThreeBackground() {
    const container = document.getElementById('canvas-container');
    if (!container) return { setScrollProgress() {}, setTheme() {} };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1220, 0.038);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 1.2, 7.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const key = new THREE.DirectionalLight(0x6cb6ff, 1.3);
    key.position.set(5, 8, 6);
    const fill = new THREE.DirectionalLight(0x3dd68c, 0.55);
    fill.position.set(-6, -1, 3);
    const coreLight = new THREE.PointLight(0x3dd68c, 1.2, 14);
    const accentLight = new THREE.PointLight(0xff9f43, 0.7, 12);
    accentLight.position.set(3, 2, 2);
    scene.add(ambient, key, fill, coreLight, accentLight);

    const root = new THREE.Group();
    root.position.set(window.innerWidth < 768 ? 0.15 : 1.35, 0.15, 0);
    scene.add(root);

    // —— Morphing crystal core (lerp between two geometries) ——
    const geoA = new THREE.IcosahedronGeometry(1.15, 1);
    const coreCount = geoA.attributes.position.count;
    const corePositions = new Float32Array(coreCount * 3);
    const posA = geoA.attributes.position.array;
    const posB = new Float32Array(coreCount * 3);

    // Sample octahedron onto same vertex count by projecting unit directions
    for (let i = 0; i < coreCount; i++) {
        const ax = posA[i * 3];
        const ay = posA[i * 3 + 1];
        const az = posA[i * 3 + 2];
        const len = Math.hypot(ax, ay, az) || 1;
        const nx = ax / len;
        const ny = ay / len;
        const nz = az / len;
        // Approximate octahedron radius along direction
        const oct = 1.25 / (Math.abs(nx) + Math.abs(ny) + Math.abs(nz) || 1);
        posB[i * 3] = nx * oct;
        posB[i * 3 + 1] = ny * oct;
        posB[i * 3 + 2] = nz * oct;
        corePositions[i * 3] = ax;
        corePositions[i * 3 + 1] = ay;
        corePositions[i * 3 + 2] = az;
    }

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    if (geoA.index) coreGeo.setIndex(geoA.index);

    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x1557ff,
        wireframe: true,
        transparent: true,
        opacity: 0.92,
        metalness: 0.35,
        roughness: 0.3,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    const nucleus = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({
            color: 0x3dd68c,
            transparent: true,
            opacity: 0.55,
            metalness: 0.8,
            roughness: 0.15,
            emissive: 0x0a3d28,
            emissiveIntensity: 0.6,
        })
    );
    root.add(nucleus);

    // Glass shell
    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1.55, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0x6cb6ff,
            transparent: true,
            opacity: 0.06,
            metalness: 0.9,
            roughness: 0.1,
            side: THREE.DoubleSide,
        })
    );
    root.add(shell);

    // —— Segmented signal rings ——
    const rings = [];
    const ringConfigs = [
        { radius: 2.05, tube: 0.018, color: 0xff9f43, speed: 0.35, tilt: [1.2, 0.2, 0] },
        { radius: 2.45, tube: 0.014, color: 0x3dd68c, speed: -0.28, tilt: [0.4, 1.1, 0.3] },
        { radius: 2.9, tube: 0.012, color: 0x6cb6ff, speed: 0.22, tilt: [0.9, -0.6, 0.5] },
    ];

    ringConfigs.forEach((cfg) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(cfg.radius, cfg.tube, 10, 100),
            new THREE.MeshStandardMaterial({
                color: cfg.color,
                transparent: true,
                opacity: 0.7,
                metalness: 0.7,
                roughness: 0.25,
            })
        );
        ring.rotation.set(...cfg.tilt);
        ring.userData.speed = cfg.speed;
        root.add(ring);
        rings.push(ring);
    });

    // —— Packet satellites on ring paths ——
    const packets = [];
    const packetGeo = new THREE.BoxGeometry(0.12, 0.12, 0.28);
    for (let i = 0; i < 14; i++) {
        const packet = new THREE.Mesh(
            packetGeo,
            new THREE.MeshStandardMaterial({
                color: i % 2 ? 0x3dd68c : 0x1557ff,
                emissive: i % 2 ? 0x0d3320 : 0x0a1f55,
                emissiveIntensity: 0.5,
                metalness: 0.5,
                roughness: 0.3,
            })
        );
        packet.userData = {
            ring: i % 3,
            angle: (i / 14) * Math.PI * 2,
            speed: 0.55 + (i % 5) * 0.08,
            radius: ringConfigs[i % 3].radius,
        };
        root.add(packet);
        packets.push(packet);
    }

    // —— Reactive wavefield (digital terrain) ——
    const gridX = 42;
    const gridZ = 28;
    const spacing = 0.32;
    const waveCount = gridX * gridZ;
    const wavePos = new Float32Array(waveCount * 3);
    const waveBase = new Float32Array(waveCount * 3);
    const waveColors = new Float32Array(waveCount * 3);

    let wi = 0;
    for (let z = 0; z < gridZ; z++) {
        for (let x = 0; x < gridX; x++) {
            const px = (x - gridX / 2) * spacing + 0.8;
            const pz = (z - gridZ / 2) * spacing - 0.5;
            waveBase[wi * 3] = px;
            waveBase[wi * 3 + 1] = -1.85;
            waveBase[wi * 3 + 2] = pz;
            wavePos[wi * 3] = px;
            wavePos[wi * 3 + 1] = -1.85;
            wavePos[wi * 3 + 2] = pz;
            waveColors[wi * 3] = 0.08;
            waveColors[wi * 3 + 1] = 0.34;
            waveColors[wi * 3 + 2] = 1.0;
            wi += 1;
        }
    }

    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));
    waveGeo.setAttribute('color', new THREE.BufferAttribute(waveColors, 3));
    const wavePoints = new THREE.Points(
        waveGeo,
        new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
            depthWrite: false,
        })
    );
    scene.add(wavePoints);

    // Connecting lines for wave grid (horizontal + vertical)
    const waveLinePos = [];
    for (let z = 0; z < gridZ; z++) {
        for (let x = 0; x < gridX - 1; x++) {
            const i = z * gridX + x;
            const j = i + 1;
            waveLinePos.push(
                waveBase[i * 3], waveBase[i * 3 + 1], waveBase[i * 3 + 2],
                waveBase[j * 3], waveBase[j * 3 + 1], waveBase[j * 3 + 2]
            );
        }
    }
    for (let x = 0; x < gridX; x++) {
        for (let z = 0; z < gridZ - 1; z++) {
            const i = z * gridX + x;
            const j = i + gridX;
            waveLinePos.push(
                waveBase[i * 3], waveBase[i * 3 + 1], waveBase[i * 3 + 2],
                waveBase[j * 3], waveBase[j * 3 + 1], waveBase[j * 3 + 2]
            );
        }
    }
    const waveLineGeo = new THREE.BufferGeometry();
    const waveLineArr = new Float32Array(waveLinePos);
    waveLineGeo.setAttribute('position', new THREE.BufferAttribute(waveLineArr, 3));
    const waveLines = new THREE.LineSegments(
        waveLineGeo,
        new THREE.LineBasicMaterial({ color: 0x1557ff, transparent: true, opacity: 0.12 })
    );
    scene.add(waveLines);

    // —— Vertical bitstream columns ——
    const streams = [];
    const streamGeo = new THREE.BoxGeometry(0.04, 0.18, 0.04);
    for (let c = 0; c < 18; c++) {
        const col = new THREE.Group();
        const cx = -3.2 + (c % 6) * 0.55;
        const cz = -2.2 + Math.floor(c / 6) * 1.1;
        col.position.set(cx, 0, cz);
        for (let b = 0; b < 10; b++) {
            const bit = new THREE.Mesh(
                streamGeo,
                new THREE.MeshStandardMaterial({
                    color: b % 3 === 0 ? 0x3dd68c : 0x6cb6ff,
                    transparent: true,
                    opacity: 0.15 + (b / 10) * 0.5,
                    emissive: b % 3 === 0 ? 0x3dd68c : 0x1557ff,
                    emissiveIntensity: 0.25,
                })
            );
            bit.position.y = -2 + b * 0.35;
            bit.userData.offset = Math.random() * Math.PI * 2;
            bit.userData.speed = 0.8 + Math.random() * 0.6;
            col.add(bit);
        }
        col.userData.phase = Math.random() * 10;
        scene.add(col);
        streams.push(col);
    }

    // —— Sweeping scan plane ——
    const scan = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 0.04),
        new THREE.MeshBasicMaterial({
            color: 0x3dd68c,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        })
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = -1.6;
    scene.add(scan);

    // Soft floating motes
    const moteCount = 280;
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount * 3; i++) motePos[i] = (Math.random() - 0.5) * 18;
    const motes = new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(motePos, 3)),
        new THREE.PointsMaterial({ size: 0.018, color: 0xffffff, transparent: true, opacity: 0.25 })
    );
    scene.add(motes);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollProgress = 0;
    let pulse = 0;

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('pointerdown', () => {
        pulse = 1;
    });

    const clock = new THREE.Clock();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const corePosAttr = coreGeo.attributes.position;
    const wavePosAttr = waveGeo.attributes.position;
    const waveColorAttr = waveGeo.attributes.color;
    const waveLineAttr = waveLineGeo.attributes.position;

    function tick() {
        const t = clock.getElapsedTime();
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
        pulse *= 0.9;

        if (!prefersReduced) {
            // Morph crystal between icosahedron and octahedron
            const morph = (Math.sin(t * 0.45) + 1) * 0.5;
            for (let i = 0; i < coreCount; i++) {
                corePosAttr.array[i * 3] = posA[i * 3] * (1 - morph) + posB[i * 3] * morph;
                corePosAttr.array[i * 3 + 1] = posA[i * 3 + 1] * (1 - morph) + posB[i * 3 + 1] * morph;
                corePosAttr.array[i * 3 + 2] = posA[i * 3 + 2] * (1 - morph) + posB[i * 3 + 2] * morph;
            }
            corePosAttr.needsUpdate = true;

            const beat = 1 + pulse * 0.18 + Math.sin(t * 2.2) * 0.03;
            core.scale.setScalar(beat);
            nucleus.scale.setScalar(1 + Math.sin(t * 3) * 0.08 + pulse * 0.2);
            shell.scale.setScalar(1 + Math.sin(t * 1.2) * 0.02);

            core.rotation.x = t * 0.18 + mouse.y * 0.4;
            core.rotation.y = t * 0.32 + mouse.x * 0.5;
            nucleus.rotation.y = -t * 0.7;
            nucleus.rotation.z = t * 0.4;

            rings.forEach((ring) => {
                ring.rotation.z += ring.userData.speed * 0.01;
                ring.rotation.x += ring.userData.speed * 0.004;
            });

            packets.forEach((p) => {
                p.userData.angle += p.userData.speed * 0.012;
                const a = p.userData.angle;
                const r = p.userData.radius;
                const tilt = ringConfigs[p.userData.ring].tilt;
                // Simple elliptical orbit with tilt influence
                p.position.x = Math.cos(a) * r;
                p.position.y = Math.sin(a) * r * 0.35 + Math.sin(a * 2 + tilt[0]) * 0.25;
                p.position.z = Math.sin(a) * r * 0.75;
                p.lookAt(0, 0, 0);
                p.rotateX(Math.PI / 2);
            });

            // Wavefield reacts to mouse + time
            const mx = mouse.x * 4.5 + root.position.x;
            const mz = -mouse.y * 3.5;
            let lineIdx = 0;

            // Update point heights + colors
            for (let i = 0; i < waveCount; i++) {
                const bx = waveBase[i * 3];
                const by = waveBase[i * 3 + 1];
                const bz = waveBase[i * 3 + 2];
                const dx = bx - mx;
                const dz = bz - mz;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const ripple = Math.sin(dist * 2.2 - t * 3.2) * Math.exp(-dist * 0.35) * (0.55 + pulse * 0.8);
                const swell = Math.sin(bx * 0.9 + t * 1.1) * 0.12 + Math.cos(bz * 0.7 + t * 0.8) * 0.1;
                const y = by + ripple + swell;
                wavePosAttr.array[i * 3] = bx;
                wavePosAttr.array[i * 3 + 1] = y;
                wavePosAttr.array[i * 3 + 2] = bz;

                const heat = Math.min(1, Math.abs(ripple) * 1.8 + 0.15);
                waveColorAttr.array[i * 3] = 0.08 + heat * 0.1;
                waveColorAttr.array[i * 3 + 1] = 0.35 + heat * 0.55;
                waveColorAttr.array[i * 3 + 2] = 0.95 - heat * 0.35;
            }
            wavePosAttr.needsUpdate = true;
            waveColorAttr.needsUpdate = true;

            // Sync a lighter subset of grid lines (sample every other for perf)
            // Rebuild line Y from nearest point lookup via formula again
            for (let z = 0; z < gridZ; z++) {
                for (let x = 0; x < gridX - 1; x++) {
                    const i = z * gridX + x;
                    const j = i + 1;
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[i * 3];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[i * 3 + 1];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[i * 3 + 2];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[j * 3];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[j * 3 + 1];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[j * 3 + 2];
                }
            }
            for (let x = 0; x < gridX; x++) {
                for (let z = 0; z < gridZ - 1; z++) {
                    const i = z * gridX + x;
                    const j = i + gridX;
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[i * 3];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[i * 3 + 1];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[i * 3 + 2];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[j * 3];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[j * 3 + 1];
                    waveLineAttr.array[lineIdx++] = wavePosAttr.array[j * 3 + 2];
                }
            }
            waveLineAttr.needsUpdate = true;

            // Bitstream rise
            streams.forEach((col) => {
                col.children.forEach((bit) => {
                    const speed = bit.userData.speed;
                    bit.position.y = ((t * speed + bit.userData.offset) % 4.2) - 2.1;
                    bit.material.opacity = 0.15 + (0.5 * (1 + Math.sin(t * 2 + bit.userData.offset))) / 2;
                });
                col.position.x += Math.sin(t * 0.3 + col.userData.phase) * 0.0008;
            });

            // Scan sweep
            scan.position.z = Math.sin(t * 0.55) * 3.5;
            scan.material.opacity = 0.15 + Math.abs(Math.sin(t * 0.55)) * 0.25;

            motes.rotation.y = t * 0.02;
            motes.rotation.x = mouse.y * 0.05;

            root.rotation.y = mouse.x * 0.35;
            root.rotation.x = mouse.y * 0.18;
            root.position.y = 0.15 + Math.sin(t * 0.7) * 0.12 - scrollProgress * 1.1;
            root.position.x = (window.innerWidth < 768 ? 0.15 : 1.35) + mouse.x * 0.2;
            root.scale.setScalar(1 - scrollProgress * 0.22);

            coreLight.position.copy(root.position);
            coreLight.intensity = 1.0 + Math.sin(t * 2.5) * 0.25 + pulse * 0.8;
            accentLight.intensity = 0.55 + pulse * 0.5;
        }

        camera.position.x = mouse.x * 0.55;
        camera.position.y = 1.2 + mouse.y * 0.3 - scrollProgress * 0.4;
        camera.position.z = 7.2 - scrollProgress * 1.5;
        camera.lookAt(0.6, 0, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    tick();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        root.position.x = window.innerWidth < 768 ? 0.15 : 1.35;
    });

    const applyTheme = (theme) => {
        const dark = theme === 'dark';
        scene.fog = new THREE.FogExp2(dark ? 0x070b12 : 0x0b1220, dark ? 0.042 : 0.038);
        waveLines.material.opacity = dark ? 0.16 : 0.12;
        wavePoints.material.opacity = dark ? 0.92 : 0.85;
        shell.material.opacity = dark ? 0.08 : 0.06;
        coreMat.opacity = dark ? 0.96 : 0.92;
        nucleus.material.opacity = dark ? 0.65 : 0.55;
        motes.material.opacity = dark ? 0.32 : 0.25;
        ambient.intensity = dark ? 0.35 : 0.45;
        key.intensity = dark ? 1.45 : 1.3;
        scan.material.color.set(dark ? 0x55e6a0 : 0x3dd68c);
    };

    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

    return {
        setScrollProgress(value) {
            scrollProgress = Math.max(0, Math.min(1, value));
        },
        setTheme(theme) {
            applyTheme(theme);
        },
    };
}
