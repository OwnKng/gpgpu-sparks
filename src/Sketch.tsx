import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import "./SketchMaterial"
import { useSpark } from "./hooks/useSpark"
import { Center } from "@react-three/drei"

const size = 256

const tempVector = new THREE.Vector3()

const rotations = 10
const pointsPerTurn = 30
const length = rotations * pointsPerTurn

const angleStep = (Math.PI * 2) / pointsPerTurn
const d = 60

const curvePoints = Array.from({ length: length }, (_, i) => {
  // make the radius smaller with each rotation
  let r = d * (i / length) * 0.5
  r += 1

  return new THREE.Vector3(
    Math.cos(angleStep * i) * r,
    (i / (rotations * pointsPerTurn)) * 120 - 60,
    Math.sin(angleStep * i) * r
  )
})

const curve = new THREE.CatmullRomCurve3(curvePoints, false)

const Sketch = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const [simulation, positions, velocity] = useSpark(size)

  const emitterPosition = useRef(new THREE.Vector3(0, 0, 0))

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

    const progress = (state.clock.getElapsedTime() * 0.1) % 1

    emitterPosition.current = curve.getPointAt(1.0 - progress)

    const direction = tempVector
      .copy(emitterPosition.current)
      .sub(positions.material.uniforms.originPoint.value)
    const length = direction.length() * 2.0

    velocity.material.uniforms.dragForce.value = length
    velocity.material.uniforms.dragDirection.value = direction.normalize()
    positions.material.uniforms.originPoint.value = emitterPosition.current

    materialRef.current.uniformsNeedUpdate = true
  })

  return (
    <Center>
      <instancedMesh args={[undefined, undefined, size * size]}>
        <boxGeometry args={[0.1, 0.1, 1.5]}>
          <instancedBufferAttribute
            attach='attributes-pIndex'
            args={[pIndex, 2]}
          />
        </boxGeometry>
        <sketchMaterial
          ref={materialRef}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </Center>
  )
}

export default Sketch
