import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, Grid, OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

function MechanicalDragon({ color, version }: { color: string; version: 'v0' | 'v1' | 'v2' }) {
  const shell = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color,
      roughness: version === 'v0' ? 0.62 : 0.28,
      metalness: version === 'v0' ? 0.12 : 0.48,
      clearcoat: version === 'v2' ? 0.9 : 0.55,
      clearcoatRoughness: 0.16,
      flatShading: version === 'v0',
    }),
    [color, version],
  )
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#343553', roughness: 0.3, metalness: 0.7 }),
    [],
  )
  const glow = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c8f5ff', emissive: '#5fd7ff', emissiveIntensity: 1.9, roughness: 0.2 }),
    [],
  )
  const accent = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: version === 'v2' ? '#7be5d0' : '#8bdbff', metalness: 0.38, roughness: 0.24, transmission: version === 'v2' ? 0.18 : 0 }),
    [version],
  )

  const scale = version === 'v0' ? 0.92 : 1

  return (
    <group scale={scale} rotation={[0, -0.28, 0]}>
      {/* torso armour */}
      <mesh material={shell} position={[0, 0.58, 0]} scale={[1.1, 0.72, 0.68]} castShadow>
        <icosahedronGeometry args={[0.66, version === 'v0' ? 1 : 2]} />
      </mesh>
      <mesh material={dark} position={[0.08, 0.48, 0]} scale={[0.72, 0.5, 0.72]} castShadow>
        <dodecahedronGeometry args={[0.62, 0]} />
      </mesh>
      <mesh material={accent} position={[0.06, 0.86, 0]} scale={[0.7, 0.15, 0.48]} castShadow>
        <octahedronGeometry args={[0.56, 0]} />
      </mesh>

      {/* articulated neck */}
      {[0, 1, 2].map((index) => (
        <mesh key={index} material={index === 1 ? accent : shell} position={[0.62 + index * 0.22, 0.86 + index * 0.17, 0]} rotation={[0, 0, -0.25]} castShadow>
          <cylinderGeometry args={[0.22 - index * 0.025, 0.25 - index * 0.02, 0.38, 8]} />
        </mesh>
      ))}

      {/* head and muzzle */}
      <mesh material={shell} position={[1.18, 1.35, 0]} scale={[0.8, 0.62, 0.66]} castShadow>
        <dodecahedronGeometry args={[0.48, 1]} />
      </mesh>
      <mesh material={dark} position={[1.56, 1.22, 0]} castShadow>
        <boxGeometry args={[0.48, 0.3, 0.48]} />
      </mesh>
      <mesh material={shell} position={[1.48, 1.39, 0]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[0.38, 0.18, 0.52]} />
      </mesh>

      {/* eyes */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={glow} position={[1.31, 1.48, side * 0.34]}>
          <sphereGeometry args={[0.07, 18, 18]} />
        </mesh>
      ))}

      {/* horns and spine fins */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={accent} position={[1.08, 1.72, side * 0.25]} rotation={[side * 0.22, 0, -0.2]} castShadow>
          <coneGeometry args={[0.09, 0.52, 6]} />
        </mesh>
      ))}
      {[-0.55, -0.18, 0.2, 0.52].map((x, index) => (
        <mesh key={x} material={accent} position={[x, 1.14 - Math.abs(x) * 0.12, 0]} rotation={[0, 0, index < 2 ? -0.08 : 0.1]} castShadow>
          <coneGeometry args={[0.12, 0.45 - Math.abs(x) * 0.1, 5]} />
        </mesh>
      ))}

      {/* legs and broad printable feet */}
      {[
        [0.48, 0.08, 0.42], [0.48, 0.08, -0.42], [-0.42, 0.05, 0.42], [-0.42, 0.05, -0.42],
      ].map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh material={shell} position={[0, 0.05, 0]} rotation={[0, 0, index > 1 ? -0.16 : 0.14]} castShadow>
            <cylinderGeometry args={[0.14, 0.11, 0.62, 8]} />
          </mesh>
          <mesh material={dark} position={[index > 1 ? -0.04 : 0.06, -0.3, 0]} scale={[0.34, 0.12, 0.25]} castShadow>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>
        </group>
      ))}

      {/* segmented tail */}
      {Array.from({ length: 6 }).map((_, index) => {
        const x = -0.72 - index * 0.28
        const y = 0.55 + index * 0.04
        return (
          <mesh key={index} material={index % 2 ? accent : shell} position={[x, y, 0]} rotation={[0, 0, Math.PI / 2 + 0.08]} castShadow>
            <coneGeometry args={[Math.max(0.08, 0.22 - index * 0.025), 0.43, 8]} />
          </mesh>
        )
      })}

      {/* V2 translucent technology ring */}
      {version === 'v2' && (
        <mesh material={accent} position={[0, -0.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.94, 0.075, 12, 72]} />
        </mesh>
      )}
    </group>
  )
}

export function ModelViewer({
  color = '#7567E8',
  showBuildPlate = true,
  className,
  version = 'v1',
  interactive = true,
  autoRotate = true,
}: {
  color?: string
  showBuildPlate?: boolean
  className?: string
  version?: 'v0' | 'v1' | 'v2'
  interactive?: boolean
  autoRotate?: boolean
}) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [4.1, 2.65, 4.6], fov: 39 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
      >
        <color attach="background" args={['#eef3ff']} />
        <fog attach="fog" args={['#eef3ff', 7, 14]} />
        <ambientLight intensity={1.35} color="#faf8ff" />
        <hemisphereLight args={["#ffffff", "#7c82a8", 1.15]} />
        <directionalLight position={[4, 7, 4]} intensity={2.4} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 3, -5]} intensity={1.25} color="#8e7cff" />
        <pointLight position={[3, 1.7, -3]} intensity={1.5} color="#63d7ff" />

        <Float speed={1.25} rotationIntensity={0.08} floatIntensity={0.1} enabled={autoRotate}>
          <group position={[0, -0.55, 0]}>
            <MechanicalDragon color={color} version={version} />
            <ContactShadows position={[0, -0.36, 0]} opacity={0.25} scale={7} blur={3.1} far={4} color="#57527d" />
            {showBuildPlate && (
              <Grid
                position={[0, -0.37, 0]}
                args={[10, 10]}
                cellSize={0.36}
                cellThickness={0.55}
                cellColor="#cdd5e8"
                sectionSize={1.8}
                sectionThickness={1}
                sectionColor="#8c83d8"
                fadeDistance={12}
                fadeStrength={1.15}
                infiniteGrid
              />
            )}
          </group>
        </Float>
        <OrbitControls
          enabled={interactive}
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          minDistance={3.2}
          maxDistance={8}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 + 0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={0.48}
        />
      </Canvas>
    </div>
  )
}
