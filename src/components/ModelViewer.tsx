import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei'
import { useMemo, Suspense } from 'react'
import * as THREE from 'three'

// A stylized low-poly "dino keychain" stand-in built procedurally so the
// prototype has a genuinely rotatable 3D hero without shipping a GLB asset.
// The point isn't fidelity — it's that the model is real geometry the user
// can orbit, matching PRD §15.1 "右侧 3D 预览、尺寸、构建板".

function DinoModel({ color }: { color: string }) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, flatShading: true }),
    [color],
  )
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* body */}
      <mesh material={mat} position={[0, 0.55, 0]} castShadow>
        <icosahedronGeometry args={[0.62, 1]} />
      </mesh>
      {/* belly / lower body */}
      <mesh material={mat} position={[0.08, 0.05, 0]} castShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
      </mesh>
      {/* head */}
      <mesh material={mat} position={[0.5, 1.15, 0]} castShadow>
        <icosahedronGeometry args={[0.4, 1]} />
      </mesh>
      {/* snout */}
      <mesh material={mat} position={[0.92, 1.05, 0]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.32]} />
      </mesh>
      {/* tail — deliberately thin (the audit "wall too thin" story) */}
      <mesh material={mat} position={[-0.72, 0.35, 0]} rotation={[0, 0, 0.5]} castShadow>
        <coneGeometry args={[0.16, 0.9, 6]} />
      </mesh>
      {/* legs — point contact (the "won't stand" story) */}
      <mesh material={mat} position={[0.28, -0.42, 0.22]} castShadow>
        <cylinderGeometry args={[0.1, 0.06, 0.5, 6]} />
      </mesh>
      <mesh material={mat} position={[-0.05, -0.42, -0.22]} castShadow>
        <cylinderGeometry args={[0.1, 0.06, 0.5, 6]} />
      </mesh>
      {/* eye hint */}
      <mesh position={[0.66, 1.24, 0.22]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1a1815" roughness={0.3} />
      </mesh>
    </group>
  )
}

export function ModelViewer({
  color = '#5B7C99',
  showBuildPlate = true,
  className,
}: {
  color?: string
  showBuildPlate?: boolean
  className?: string
}) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.2, 2.4, 3.6], fov: 42 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#eceae5']} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 3]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#e8552f" />
          <Environment preset="city" />

          <group position={[0, -0.55, 0]}>
            <DinoModel color={color} />
            <ContactShadows position={[0, -0.45, 0]} opacity={0.35} scale={6} blur={2.2} far={3} />
            {showBuildPlate && (
              <Grid
                position={[0, -0.46, 0]}
                args={[8, 8]}
                cellSize={0.4}
                cellThickness={0.6}
                cellColor="#c4bfb4"
                sectionSize={2}
                sectionThickness={1}
                sectionColor="#3d6a8f"
                fadeDistance={11}
                fadeStrength={1.2}
                infiniteGrid
              />
            )}
          </group>
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 + 0.1}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  )
}
