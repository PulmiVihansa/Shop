import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import gsap from 'gsap';
import * as THREE from 'three';

const MODEL_URL = '/models/shirt.glb';

class HeroCanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Astravia hero canvas failed:', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const damp = (current, target, lambda, delta) => {
  const t = 1 - Math.exp(-lambda * delta);
  return THREE.MathUtils.lerp(current, target, t);
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function createSmokeTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  const grd = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  grd.addColorStop(0, 'rgba(255,255,255,0.30)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.16)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  // Add soft noise speckle so it feels less like a flat gradient.
  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function SmokeField({ introRef }) {
  const meshRef = useRef();
  const matRef = useRef();
  const { camera, size } = useThree();

  const texture = useMemo(() => createSmokeTexture(), []);

  const particles = useMemo(() => {
    const count = 44;
    const list = [];
    for (let i = 0; i < count; i += 1) {
      list.push({
        x: THREE.MathUtils.randFloat(-1, 1),
        y: THREE.MathUtils.randFloat(-0.65, 0.8),
        z: THREE.MathUtils.randFloat(-0.6, 0.65),
        r: THREE.MathUtils.randFloat(0, Math.PI * 2),
        s: THREE.MathUtils.randFloat(0.55, 1.25),
        dx: THREE.MathUtils.randFloat(0.012, 0.03),
        dy: THREE.MathUtils.randFloat(0.006, 0.02),
        dr: THREE.MathUtils.randFloat(-0.12, 0.12),
      });
    }
    return list;
  }, []);

  const temp = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const inst = meshRef.current;
    if (!inst) return;

    const intro = clamp01(Math.max(introRef.current?.move ?? 0, introRef.current?.reveal ?? 0));
    if (matRef.current) {
      matRef.current.opacity = 0.18 * intro;
    }

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = camera.position.z;
    const aspect = Math.max(0.0001, size.width / Math.max(1, size.height));
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const halfWidth = distance * Math.tan(hFov / 2);
    const halfHeight = distance * Math.tan(vFov / 2);

    particles.forEach((p, i) => {
      p.x += p.dx * delta;
      p.y += p.dy * delta;
      p.r += p.dr * delta;

      if (p.x > 1.2) p.x = -1.2;
      if (p.y > 1.15) p.y = -1.05;

      const x = p.x * halfWidth;
      const y = p.y * halfHeight;
      const z = p.z;
      const s = p.s * Math.min(halfWidth, halfHeight) * 0.16;

      temp.position.set(x, y, z);
      temp.rotation.set(0, 0, p.r);
      temp.scale.setScalar(s);
      temp.updateMatrix();
      inst.setMatrixAt(i, temp.matrix);
    });

    inst.instanceMatrix.needsUpdate = true;
  });

  if (!texture) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, particles.length]} frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.NormalBlending}
        opacity={0}
      />
    </instancedMesh>
  );
}

function stripSceneArtifacts(scene) {
  if (!scene) return;

  const overallBox = new THREE.Box3().setFromObject(scene);
  const overallSize = new THREE.Vector3();
  overallBox.getSize(overallSize);
  const overallMinY = overallBox.min.y;

  const tokens = ['floor', 'ground', 'plane', 'grid', 'helper', 'axis'];

  scene.traverse((child) => {
    if (!child?.isMesh) return;

    const name = `${child.name || ''} ${child.material?.name || ''}`.toLowerCase();
    const hasToken = tokens.some((token) => name.includes(token));

    // Heuristic: hide huge, very flat meshes near the bottom (common for imported floors).
    let looksLikeFloor = false;
    try {
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshSize = new THREE.Vector3();
      const meshCenter = new THREE.Vector3();
      meshBox.getSize(meshSize);
      meshBox.getCenter(meshCenter);

      const heightRatio = overallSize.y > 0 ? meshSize.y / overallSize.y : 1;
      const wideEnough = meshSize.x > overallSize.x * 1.35 && meshSize.z > overallSize.z * 1.35;
      const nearBottom = meshCenter.y < overallMinY + overallSize.y * 0.12;
      const flat = heightRatio < 0.02;

      looksLikeFloor = wideEnough && nearBottom && flat;
    } catch {
      looksLikeFloor = false;
    }

    if (hasToken || looksLikeFloor) {
      child.visible = false;
    }
  });
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isMobile = size.width < 640;
    const isTablet = size.width >= 640 && size.width < 1024;

    camera.fov = isMobile ? 45 : isTablet ? 42 : 40;
    camera.position.set(
      isMobile ? 0 : isTablet ? -0.28 : -0.38,
      isMobile ? 0.18 : 0.14,
      isMobile ? 7.8 : isTablet ? 7.2 : 7.6
    );
    camera.near = 0.1;
    camera.far = 50;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

function ExposureRig({ introRef }) {
  const { gl } = useThree();
  useFrame(() => {
    const t = clamp01(introRef.current?.t ?? 0);
    gl.toneMappingExposure = THREE.MathUtils.lerp(0.62, 1.02, t);
  });
  return null;
}

function TShirtModel({ introRef, pointerRef }) {
  const rig = useRef();
  const animationRoot = useRef();
  const contentOffset = useRef();
  const introStart = useRef(performance.now());
  const { camera, size } = useThree();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, animationRoot);

  const bounds = useRef({ height: 1, radius: 1 });

  const baseScale = useMemo(() => {
    // Conservative default scale; camera responsiveness handles most of the perceived size.
    return 2.32;
  }, []);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.side = THREE.DoubleSide;
        child.material.envMapIntensity = 1.15;
        child.material.needsUpdate = true;
      }
    });

    stripSceneArtifacts(scene);

    // Center the model so camera fitting is consistent and doesn't crop sleeves/hem.
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const sizeVec = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(sizeVec);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    bounds.current = {
      height: Math.max(0.0001, sizeVec.y),
      radius: Math.max(0.0001, sphere.radius),
    };

    if (contentOffset.current) {
      contentOffset.current.position.set(-center.x, -center.y, -center.z);
    }
  }, [scene]);

  useEffect(() => {
    const actionEntries = Object.entries(actions || {});
    if (!actionEntries.length) return;

    const preferredNames = ['walk', 'walking'];
    const preferred = actionEntries.find(([name]) =>
      preferredNames.some((preferredName) => name.toLowerCase().includes(preferredName))
    );

    const [, actionToPlay] = preferred ?? actionEntries[0];

    actionEntries.forEach(([, action]) => {
      if (action !== actionToPlay) action.stop();
    });

    actionToPlay.timeScale = 0.42;
    actionToPlay.reset().fadeIn(0.6).play();

    return () => {
      actionEntries.forEach(([, action]) => action.fadeOut(0.2));
    };
  }, [actions]);

  useFrame((_, delta) => {
    if (!rig.current) return;

    // Cinematic runway reveal: side profile glides behind the typography, then rotates open.
    const elapsed = (performance.now() - introStart.current) / 1000;
    const moveT = clamp01(introRef.current?.move ?? 0);
    const revealT = clamp01(introRef.current?.reveal ?? 0);
    const introT = clamp01(Math.max(moveT, revealT));
    const settleT = easeOutCubic(Math.min(1, elapsed / 0.9));

    const isMobile = size.width < 640;
    const isTablet = size.width >= 640 && size.width < 1024;

    const breath = Math.sin(elapsed * 1.25) * 0.012;
    const floatY = Math.sin(elapsed * 0.8) * 0.06;
    const rotateY = Math.sin(elapsed * 0.35) * 0.08;

    const moveEase = easeOutCubic(moveT);
    const revealEase = easeOutCubic(revealT);
    const idleT = revealEase;
    const introZ = THREE.MathUtils.lerp(-0.7, 0, moveEase);

    // Fit slightly smaller than before so the full shirt stays visible throughout the reveal.
    const desiredFrac = isMobile ? 0.22 : isTablet ? 0.29 : 0.3;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = camera.position.z - introZ;
    const fitScale = (2 * desiredFrac * distance * Math.tan(vFov / 2)) / bounds.current.height;

    const targetScale = baseScale * fitScale * (0.9 + settleT * 0.08) * (1 + breath * idleT);
    const targetY = (isMobile ? 0.3 : isTablet ? 0.16 : 0.12) + (1 - settleT) * 0.08 + floatY * idleT;

    const parX = (pointerRef.current?.y ?? 0) * 0.03;
    const parY = (pointerRef.current?.x ?? 0) * 0.05;

    // Keep the final pose on the right, slightly left of the old placement to avoid clipping.
    const aspect = Math.max(0.0001, size.width / Math.max(1, size.height));
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const halfWidth = distance * Math.tan(hFov / 2);
    const radiusScaled = bounds.current.radius * targetScale;
    const maxX = Math.max(0, halfWidth - radiusScaled * 0.72);

    const finalX = isMobile ? halfWidth * 0.16 : isTablet ? halfWidth * 0.34 : halfWidth * 0.46;
    const startX = isMobile ? -4.2 : isTablet ? -6.4 : -8;
    const desiredX = THREE.MathUtils.lerp(startX, finalX, moveEase);
    const targetX = THREE.MathUtils.clamp(desiredX, startX, maxX);
    const showcaseRotY = -0.08 + rotateY * idleT + parY * idleT + (pointerRef.current?.dragRotation ?? 0) * idleT;
    const targetRotX = THREE.MathUtils.lerp(0.03, 0.06, revealEase) + parX * idleT;
    const targetRotY = THREE.MathUtils.lerp(Math.PI / 2, showcaseRotY, revealEase);
    const targetRotZ = THREE.MathUtils.lerp(0.02, -0.02, revealEase);

    rig.current.scale.x = damp(rig.current.scale.x || targetScale, targetScale, 6, delta);
    rig.current.scale.y = damp(rig.current.scale.y || targetScale, targetScale, 6, delta);
    rig.current.scale.z = damp(rig.current.scale.z || targetScale, targetScale, 6, delta);

    rig.current.position.x = damp(rig.current.position.x || targetX, targetX, 6, delta);
    rig.current.position.y = damp(rig.current.position.y || targetY, targetY, 6, delta);
    rig.current.position.z = damp(rig.current.position.z || introZ, introZ, 5, delta);

    rig.current.rotation.x = damp(rig.current.rotation.x, targetRotX, 4.5, delta);
    rig.current.rotation.y = damp(rig.current.rotation.y, targetRotY, 4.5, delta);
    rig.current.rotation.z = damp(rig.current.rotation.z, targetRotZ, 4.5, delta);
  });

  return (
    <group ref={rig}>
      <group ref={animationRoot} position={[0, 0, 0]}>
        <group ref={contentOffset}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

export default function TShirtExperience({ className, style, onWebGLError }) {
  const introRef = useRef({ move: 0, reveal: 0 });
  const pointerRef = useRef({ x: 0, y: 0, dragRotation: 0 });
  const dragRef = useRef({ active: false, lastX: 0 });

  useEffect(() => {
    const onMove = (event) => {
      const nx = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    introRef.current.move = 0;
    introRef.current.reveal = 0;
    tl.to(introRef.current, { move: 1, duration: 6.2, ease: 'power3.inOut' }, 0.2)
      .to(introRef.current, { reveal: 1, duration: 2.6, ease: 'expo.out' }, 5.55);
    return () => tl.kill();
  }, []);

  return (
    <HeroCanvasErrorBoundary onError={onWebGLError}>
    <Canvas
      fallback={null}
      camera={{ position: [0, 0.22, 6.2], fov: 31, near: 0.1, far: 50 }}
      dpr={[1, 1.45]}
      shadows={false}
      frameloop="always"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      className={className}
      style={{ background: 'transparent', outline: 'none', pointerEvents: 'auto', touchAction: 'none', ...style }}
      onPointerDown={(event) => {
        dragRef.current.active = true;
        dragRef.current.lastX = event.clientX;
        event.target.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current.active) return;
        const deltaX = event.clientX - dragRef.current.lastX;
        dragRef.current.lastX = event.clientX;
        pointerRef.current.dragRotation += deltaX * 0.01;
      }}
      onPointerUp={(event) => {
        dragRef.current.active = false;
        event.target.releasePointerCapture?.(event.pointerId);
      }}
      onPointerLeave={() => {
        dragRef.current.active = false;
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0.01);
        gl.physicallyCorrectLights = true;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        scene.background = null;
      }}
    >
      <ResponsiveCamera />

      <ExposureRig introRef={introRef} />

      {/* Premium cinematic lighting: soft key + fill + rim. No harsh shadows. */}
      <ambientLight intensity={0.16} />
      <directionalLight
        position={[4.8, 5.8, 6.8]}
        intensity={1.42}
        color="#fff6ee"
      />
      <directionalLight
        position={[-5.5, 3.2, 3.5]}
        intensity={0.36}
        color="#e9f0ff"
      />
      <directionalLight
        position={[5.5, 2.4, -6.5]}
        intensity={1.32}
        color="#f5f8ff"
      />
      <Suspense fallback={null}>
        <TShirtModel introRef={introRef} pointerRef={pointerRef} />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.16} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.64} />
      </EffectComposer>
    </Canvas>
    </HeroCanvasErrorBoundary>
  );
}

useGLTF.preload(MODEL_URL);
