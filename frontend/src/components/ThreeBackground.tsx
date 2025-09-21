import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, MeshDistortMaterial, Stars } from '@react-three/drei';
import { useTheme } from '../contexts/ThemeContext';

function FloatingBlob({ isDark }: { isDark: boolean }) {
  return (
    <Float speed={1} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh>
        <icosahedronGeometry args={[2.2, 1]} />
        <MeshDistortMaterial
          color={isDark ? "#60a5fa" : "#93c5fd"}
          roughness={0.2}
          metalness={isDark ? 0.3 : 0.1}
          distort={0.35}
          speed={1.2}
          transparent
          opacity={isDark ? 0.4 : 0.25}
        />
      </mesh>
    </Float>
  );
}

const ThreeBackground: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        pointerEvents: 'none',
      }}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={isDark ? 0.4 : 0.6} />
          <directionalLight position={[2, 2, 3]} intensity={isDark ? 1.2 : 0.8} />
          <directionalLight position={[-2, -2, -3]} intensity={isDark ? 0.5 : 0.3} />

          {/* Soft starfield for depth */}
          <Stars 
            radius={50} 
            depth={30} 
            count={isDark ? 6000 : 4000} 
            factor={4} 
            saturation={0} 
            fade 
            speed={0.5} 
          />

          {/* Main floating blob */}
          <group position={[0, 0, 0]}>
            <FloatingBlob isDark={isDark} />
          </group>

          {/* Subtle environment lighting */}
          <Environment preset={isDark ? "night" : "city"} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
