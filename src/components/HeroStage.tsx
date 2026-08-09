import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type HeroStageProps = {
  className?: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export default function HeroStage({ className }: HeroStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (prefersReducedMotion()) {
      setUseFallback(true);
      return;
    }

    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scrollAmount = 0;
    let visible = true;

    try {
      const scene = new THREE.Scene();
      const fog = new THREE.FogExp2(0x0a0b0d, 0.055);
      scene.fog = fog;

      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0.55, 6.2);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarsePointer() ? 1.35 : 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      mount.appendChild(renderer.domElement);

      const root = new THREE.Group();
      scene.add(root);

      const lime = new THREE.Color("#5dffb1");
      const coral = new THREE.Color("#ff6b2c");
      const steel = new THREE.Color("#7ec8ff");

      const gemMat = new THREE.MeshPhysicalMaterial({
        color: lime,
        metalness: 0.25,
        roughness: 0.18,
        emissive: lime,
        emissiveIntensity: 0.28,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
      });
      const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), gemMat);
      gem.position.set(0.35, 0.35, 0);
      root.add(gem);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.28, 0)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
      );
      wire.position.copy(gem.position);
      root.add(wire);

      const torusMat = new THREE.MeshPhysicalMaterial({
        color: coral,
        metalness: 0.8,
        roughness: 0.22,
        emissive: coral,
        emissiveIntensity: 0.2,
        clearcoat: 0.5,
      });
      const torus = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.12, 28, 100), torusMat);
      torus.rotation.x = Math.PI / 2.35;
      root.add(torus);

      const knotMat = new THREE.MeshStandardMaterial({
        color: steel,
        metalness: 0.95,
        roughness: 0.18,
      });
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.12, 100, 14), knotMat);
      knot.position.set(-1.85, 0.95, 0.2);
      root.add(knot);

      const boxMat = new THREE.MeshStandardMaterial({
        color: "#dfe5f2",
        metalness: 0.85,
        roughness: 0.22,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), boxMat);
      box.position.set(-1.7, -0.7, 0.55);
      root.add(box);

      const orbMat = new THREE.MeshPhysicalMaterial({
        color: "#f4f6fb",
        metalness: 0.95,
        roughness: 0.1,
        emissive: coral,
        emissiveIntensity: 0.1,
        clearcoat: 1,
      });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 40), orbMat);
      orb.position.set(1.85, 1.05, 0.45);
      root.add(orb);

      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: lime,
        metalness: 0.1,
        roughness: 0.08,
        transmission: 0.55,
        thickness: 0.8,
        transparent: true,
        opacity: 0.9,
        emissive: lime,
        emissiveIntensity: 0.08,
      });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), crystalMat);
      crystal.position.set(1.7, -0.55, 0.8);
      root.add(crystal);

      // Floating debris field
      const debris: THREE.Mesh[] = [];
      for (let i = 0; i < 18; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: i % 3 === 0 ? lime : i % 3 === 1 ? coral : steel,
          metalness: 0.7,
          roughness: 0.3,
          emissive: i % 2 ? lime : coral,
          emissiveIntensity: 0.08,
        });
        const geo =
          i % 2 === 0
            ? new THREE.TetrahedronGeometry(0.12 + (i % 4) * 0.03, 0)
            : new THREE.BoxGeometry(0.14, 0.14, 0.14);
        const m = new THREE.Mesh(geo, mat);
        const a = (i / 18) * Math.PI * 2;
        m.position.set(Math.cos(a) * 2.8, Math.sin(a * 2) * 1.1, Math.sin(a) * 1.4);
        m.userData.phase = i;
        root.add(m);
        debris.push(m);
      }

      // Particle stars
      const count = isCoarsePointer() ? 120 : 260;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0xc8f542,
          size: 0.03,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        }),
      );
      scene.add(particles);

      // Ground grid
      const grid = new THREE.GridHelper(18, 28, 0x5dffb1, 0x1a2433);
      grid.position.y = -1.8;
      const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
      gridMats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.35;
      });
      scene.add(grid);

      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(3.5, 5, 5);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0xffffff, 0.32));
      const fill = new THREE.PointLight(0x5dffb1, 22, 14);
      fill.position.set(-3.2, 1.2, 2.2);
      scene.add(fill);
      const rim = new THREE.PointLight(0xff6b2c, 20, 14);
      rim.position.set(3.4, -0.8, -2.2);
      scene.add(rim);

      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointerMove);

      const onScroll = (event: Event) => {
        const detail = (event as CustomEvent).detail as { y?: number } | undefined;
        const y = detail?.y ?? window.scrollY;
        scrollAmount = Math.min(y / Math.max(window.innerHeight, 1), 1.5);
      };
      window.addEventListener("hub:scroll", onScroll as EventListener);
      onScroll(new CustomEvent("hub:scroll", { detail: { y: window.scrollY } }));

      const resize = () => {
        if (!renderer || !mount) return;
        const { clientWidth: w, clientHeight: h } = mount;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0.02 },
      );
      io.observe(mount);

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed || !renderer) return;
        frame = requestAnimationFrame(animate);
        if (!visible) return;

        const t = clock.getElapsedTime();
        const s = scrollAmount;

        root.rotation.y = t * 0.28 + pointer.x * 0.45 + s * 1.1;
        root.rotation.x = Math.sin(t * 0.45) * 0.1 + pointer.y * -0.22 + s * 0.35;
        root.position.y = Math.sin(t * 0.85) * 0.1 - s * 1.4;
        root.position.z = s * -1.8;
        root.scale.setScalar(1 + s * 0.15);

        gem.rotation.y = t * 0.75;
        gem.rotation.z = t * 0.28;
        wire.rotation.copy(gem.rotation);
        torus.rotation.z = t * 0.5;
        torus.rotation.y = Math.sin(t * 0.3) * 0.2;
        box.rotation.x = t * 0.65;
        box.rotation.y = t * 0.4;
        knot.rotation.x = t * 0.9;
        knot.rotation.y = t * 0.55;
        orb.position.y = 1.05 + Math.sin(t * 1.7) * 0.2;
        crystal.rotation.y = -t * 1.1;
        crystal.position.y = -0.55 + Math.cos(t * 1.3) * 0.15;

        debris.forEach((m) => {
          const phase = m.userData.phase as number;
          m.rotation.x = t * 0.7 + phase;
          m.rotation.y = t * 0.5;
          m.position.y += Math.sin(t + phase) * 0.0015;
        });

        particles.rotation.y = t * 0.04 + s * 0.2;
        grid.position.z = ((t * 0.35) % 1) * -0.65;
        camera.position.x = pointer.x * 0.35;
        camera.position.y = 0.55 + pointer.y * -0.15 - s * 0.2;
        camera.lookAt(0, 0.2 - s * 0.4, 0);

        gemMat.emissiveIntensity = 0.22 + Math.sin(t * 2.1) * 0.1;
        torusMat.emissiveIntensity = 0.16 + Math.cos(t * 1.7) * 0.08;

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("hub:scroll", onScroll as EventListener);
        ro.disconnect();
        io.disconnect();
        [
          gem,
          torus,
          knot,
          box,
          orb,
          crystal,
          ...debris,
        ].forEach((m) => {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        });
        wire.geometry.dispose();
        (wire.material as THREE.Material).dispose();
        pGeo.dispose();
        (particles.material as THREE.Material).dispose();
        renderer?.dispose();
        if (renderer?.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    } catch {
      setUseFallback(true);
    }
  }, []);

  return (
    <div className={className ? `hero-stage ${className}` : "hero-stage"}>
      {useFallback ? (
        <img
          className="hero-fallback"
          src="/previews/hero-fallback.svg"
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div ref={mountRef} className="hero-canvas" />
      )}
      <style>{`
        .hero-stage,
        .hero-canvas,
        .hero-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .hero-canvas canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        .hero-fallback {
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}
