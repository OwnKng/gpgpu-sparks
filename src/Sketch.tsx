import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import "./SketchMaterial"
import { useSpark } from "./hooks/useSpark"

const size = 256

const tempVector = new THREE.Vector3()
const MARGIN = 0.1

const Sketch = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const { viewport } = useThree()

  const dim = Math.min(viewport.width, viewport.height) * (0.5 - MARGIN)

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        new Array(20).fill(0).map((_, i) => {
          const theta = (i / 20) * Math.PI * 2
          const x = Math.cos(theta) * dim
          const y = Math.sin(theta) * dim

          return new THREE.Vector3(x, y, 0)
        }),
        true
      ),
    [dim]
  )

  const [simulation, positions, velocity] = useSpark(size)

  const mousePosition = useRef(new THREE.Vector3(0, 0, 0))

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

    const progress = (state.clock.getElapsedTime() * 0.5) % 1

    mousePosition.current = curve.getPointAt(progress)

    const direction = tempVector
      .copy(mousePosition.current)
      .sub(positions.material.uniforms.originPoint.value)
    const length = direction.length() * 2.0

    velocity.material.uniforms.dragForce.value = length
    velocity.material.uniforms.dragDirection.value = direction.normalize()
    positions.material.uniforms.originPoint.value = mousePosition.current

    materialRef.current.uniformsNeedUpdate = true
  })

  return (
    <>
      <mesh
        onPointerMove={(e) => {
          mousePosition.current = e.point
        }}
      >
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial transparent={true} opacity={0} />
      </mesh>
      <instancedMesh args={[undefined, undefined, size * size]}>
        <boxGeometry args={[0.1, 0.1, 0.75]}>
          <instancedBufferAttribute
            attach='attributes-pIndex'
            args={[pIndex, 2]}
          />
        </boxGeometry>
        <sketchMaterial
          ref={materialRef}
          transparent={true}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </>
  )
}

export default Sketch
