import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/shirt.glb';

const bodyProfiles = {
  Athletic: { scale: [1.08, 1, 1.02], y: -0.18 },
  Slim: { scale: [0.9, 1.05, 0.95], y: -0.12 },
  Regular: { scale: [1, 1, 1], y: -0.15 },
};

function stripSceneArtifacts(scene) {
  const tokens = ['floor', 'ground', 'plane', 'grid', 'helper', 'axis'];

  scene.traverse((child) => {
    if (!child?.isMesh) return;
    const name = `${child.name || ''} ${child.material?.name || ''}`.toLowerCase();
    if (tokens.some((token) => name.includes(token))) child.visible = false;
  });
}

function ShirtPreviewModel({ color, bodyType }) {
  const groupRef = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);
  const profile = bodyProfiles[bodyType] || bodyProfiles.Regular;

  useEffect(() => {
    const shirtColor = new THREE.Color(color);

    model.traverse((child) => {
      if (!child?.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = child.material.clone();
      child.material.color = shirtColor;
      child.material.roughness = 0.72;
      child.material.metalness = 0.02;
      child.material.envMapIntensity = 0.72;
      child.material.side = THREE.DoubleSide;
      child.material.needsUpdate = true;
    });

    stripSceneArtifacts(model);
  }, [model, color]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    const pointerX = THREE.MathUtils.clamp(state.pointer.x, -0.8, 0.8);
    const pointerY = THREE.MathUtils.clamp(state.pointer.y, -0.6, 0.6);
    const targetY = Math.sin(elapsed * 0.42) * 0.18 + pointerX * 0.18;
    const targetX = 0.08 + pointerY * 0.05;

    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetY, 3.5, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetX, 3.5, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, profile.y + Math.sin(elapsed * 0.8) * 0.025, 4, delta);
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, profile.scale[0], 4, delta);
    groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, profile.scale[1], 4, delta);
    groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, profile.scale[2], 4, delta);
  });

  return (
    <group ref={groupRef} scale={profile.scale} position={[0, profile.y, 0]} rotation={[0.08, 0.1, 0]}>
      <primitive object={model} />
    </group>
  );
}

export default function AiTryOnPreview({ color, bodyType }) {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 5.2], fov: 32, near: 0.1, far: 40 }}
      dpr={[1, 1.4]}
      shadows
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      className="ai-preview-canvas"
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = null;
      }}
    >
      <ambientLight intensity={0.18} />
      <spotLight position={[2.2, 4, 4.5]} angle={0.34} penumbra={0.8} intensity={5.8} color="#fff7ef" castShadow />
      <spotLight position={[-3.2, 1.7, 2.4]} angle={0.45} penumbra={1} intensity={1.1} color="#ff3737" />
      <directionalLight position={[0, 2, -4]} intensity={1.25} color="#f4f7ff" />
      <Suspense fallback={null}>
        <ShirtPreviewModel color={color} bodyType={bodyType} />
        <ContactShadows position={[0, -1.42, 0]} opacity={0.34} scale={4.8} blur={2.4} far={3} color="#000000" />
        <Environment preset="studio" background={false} environmentIntensity={0.32} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
