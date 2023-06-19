import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import "./SketchMaterial"
import { useSimulation } from "./hooks/useSimulation"
import { useGLTF } from "@react-three/drei"

const Sketch = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const { nodes } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/suzanne-high-poly/model.gltf"
  )

  const mesh = new THREE.Mesh(
    nodes.Suzanne.geometry,
    new THREE.MeshBasicMaterial()
  )

  const [simulation, size, positions, velocity] = useSimulation(mesh)

  // Buffer attributes for the presentational layer
  const pIndex = Float32Array.from(
    new Array(size * size)
      .fill(0)
      .flatMap((_, i) => [(i % size) / size, Math.floor(i / size) / size])
  )

  useFrame((state, delta) => {
    simulation.compute()

    materialRef.current.uniforms.positionTexture.value =
      simulation.getCurrentRenderTarget(positions).texture

    materialRef.current.uniforms.velocityTexture.value =
      simulation.getCurrentRenderTarget(velocity).texture

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    materialRef.current.uniforms.delta.value = delta

    materialRef.current.uniformsNeedUpdate = true
  })

  return (
    <>
      <instancedMesh args={[undefined, undefined, size * size]}>
        <boxGeometry args={[0.01, 0.01, 0.01]}>
          <instancedBufferAttribute
            attach='attributes-pIndex'
            args={[pIndex, 2]}
          />
        </boxGeometry>
        <sketchMaterial
          ref={materialRef}
          transparent={true}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      <mesh
        geometry={nodes.Suzanne.geometry}
        onPointerMove={(e) => {
          velocity.material.uniforms.uMouse.value = e.point
        }}
        onPointerLeave={() => {
          velocity.material.uniforms.uMouse.value = new THREE.Vector3(0, 0, 0)
        }}
      >
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/suzanne-high-poly/model.gltf"
)

export default Sketch
