import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type Variant = "gem" | "ring" | "shards";

type FloatStageProps = {
  variant?: Variant;
  modelUrl?: string;
  className?: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fitObjectToView(object: THREE.Object3D, targetSize = 2.2) {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  object.scale.multiplyScalar(targetSize / maxDim);

  object.updateWorldMatrix(true, true);
  const fitted = new THREE.Box3().setFromObject(object);
  const fittedCenter = fitted.getCenter(new THREE.Vector3());
  object.position.sub(fittedCenter);
}

function polishModelMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std) return;
      std.side = THREE.DoubleSide;
      if ("metalness" in std) {
        std.metalness = Math.min(std.metalness ?? 0.4, 0.55);
      }
      if ("roughness" in std) {
        std.roughness = Math.max(std.roughness ?? 0.4, 0.28);
      }
      if ("emissive" in std && std.emissive) {
        if (std.emissive.getHex() === 0) {
          std.emissive = new THREE.Color("#1a2a18");
          std.emissiveIntensity = 0.15;
        } else {
          std.emissiveIntensity = Math.max(std.emissiveIntensity ?? 0, 0.2);
        }
      }
      std.needsUpdate = true;
    });
  });
}

export default function FloatStage({
  variant = "gem",
  modelUrl,
  className,
}: FloatStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (prefersReducedMotion()) {
      setFallback(true);
      return;
    }

    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let pmrem: THREE.PMREMGenerator | null = null;
    let envMap: THREE.Texture | null = null;
    let visible = true;
    const disposables: Array<{ dispose: () => void }> = [];

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
      camera.position.set(0, 0.15, modelUrl ? 4.2 : 4.2);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      pmrem = new THREE.PMREMGenerator(renderer);
      envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;

      const group = new THREE.Group();
      scene.add(group);

      const lime = new THREE.Color("#5dffb1");
      const coral = new THREE.Color("#ff6b2c");
      const meshes: THREE.Mesh[] = [];

      const buildPrimitive = () => {
        if (variant === "gem") {
          const mat = new THREE.MeshStandardMaterial({
            color: lime,
            metalness: 0.4,
            roughness: 0.2,
            emissive: lime,
            emissiveIntensity: 0.2,
          });
          const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), mat);
          group.add(mesh);
          meshes.push(mesh);
          disposables.push(mesh.geometry, mat);
        } else if (variant === "ring") {
          const mat = new THREE.MeshStandardMaterial({
            color: coral,
            metalness: 0.75,
            roughness: 0.25,
            emissive: coral,
            emissiveIntensity: 0.16,
          });
          const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.75, 0.22, 120, 16), mat);
          group.add(mesh);
          meshes.push(mesh);
          disposables.push(mesh.geometry, mat);
        } else {
          for (let i = 0; i < 5; i++) {
            const mat = new THREE.MeshStandardMaterial({
              color: i % 2 ? lime : coral,
              metalness: 0.55,
              roughness: 0.3,
              emissive: i % 2 ? lime : coral,
              emissiveIntensity: 0.12,
            });
            const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.45, 0), mat);
            mesh.position.set(Math.sin(i) * 1.1, Math.cos(i * 1.4) * 0.7, Math.cos(i) * 0.5);
            group.add(mesh);
            meshes.push(mesh);
            disposables.push(mesh.geometry, mat);
          }
        }
      };

      if (modelUrl) {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (disposed) return;
            const model = gltf.scene;
            polishModelMaterials(model);
            fitObjectToView(model, 2.6);
            group.add(model);
          },
          undefined,
          (err) => {
            console.error("Failed to load model", modelUrl, err);
            if (!disposed) buildPrimitive();
          },
        );
      } else {
        buildPrimitive();
      }

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      scene.add(new THREE.HemisphereLight(0x5dffb1, 0x1a1520, 0.65));
      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.set(2.8, 3.6, 4.2);
      scene.add(key);
      const fillA = new THREE.PointLight(0x5dffb1, 18, 16);
      fillA.position.set(-2.4, 1, 2);
      scene.add(fillA);
      const fillB = new THREE.PointLight(0xff6b2c, 14, 16);
      fillB.position.set(2.4, 0.2, 1.4);
      scene.add(fillB);
      const rim = new THREE.DirectionalLight(0xffffff, 1.1);
      rim.position.set(-2.5, 1.5, -3.5);
      scene.add(rim);

      const resize = () => {
        if (!renderer) return;
        const w = Math.max(mount.clientWidth, 1);
        const h = Math.max(mount.clientHeight, 1);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0.01 },
      );
      io.observe(mount);

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed || !renderer) return;
        frame = requestAnimationFrame(animate);
        if (!visible) return;
        const t = clock.getElapsedTime();
        group.rotation.y = t * (modelUrl ? 0.45 : 0.55);
        group.rotation.x = Math.sin(t * 0.35) * (modelUrl ? 0.1 : 0.25);
        group.position.y = Math.sin(t * 0.9) * 0.08;
        meshes.forEach((m, i) => {
          m.rotation.x = t * (0.4 + i * 0.1);
          m.rotation.z = t * (0.25 + i * 0.05);
        });
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        ro.disconnect();
        io.disconnect();
        disposables.forEach((d) => d.dispose());
        group.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => mat?.dispose?.());
          }
        });
        envMap?.dispose();
        pmrem?.dispose();
        renderer?.dispose();
        if (renderer?.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.error(err);
      setFallback(true);
    }
  }, [variant, modelUrl]);

  return (
    <div className={className ? `float-stage ${className}` : "float-stage"}>
      {fallback ? <div className="float-fallback" /> : <div ref={mountRef} className="float-canvas" />}
      <style>{`
        .float-stage, .float-canvas, .float-fallback {
          width: 100%;
          height: 100%;
          min-height: 240px;
        }
        .float-canvas canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        .float-fallback {
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 30%, rgba(200,245,66,0.55), transparent 45%),
            radial-gradient(circle at 70% 70%, rgba(255,90,60,0.45), transparent 50%),
            #12141a;
        }
      `}</style>
    </div>
  );
}
