import { useMemo } from "react"
import * as THREE from "three"
import {
  GPUComputationRenderer,
  Variable,
} from "three/examples/jsm/misc/GPUComputationRenderer.js"
import { useThree, useFrame } from "@react-three/fiber"
import velocity from "../shaders/simulation/velocity.glsl"
import position from "../shaders/simulation/position.glsl"

const r = 10

const curve = new THREE.CatmullRomCurve3(
  new Array(20).fill(0).map((_, i) => {
    const theta = (i / 20) * Math.PI * 2
    const x = Math.cos(theta) * r
    const y = Math.sin(theta) * r

    return new THREE.Vector3(x, y, 0)
  }),
  true
)

export const useSpark = (
  size: number
): [GPUComputationRenderer, Variable, Variable] => {
  const { gl } = useThree()

  //_ Create the fbo and simulation data
  const [gpuCompute, positionTexture, velocityTexture] = useMemo(() => {
    const gpuRender = new GPUComputationRenderer(size, size, gl)

    const positionsArray = Float32Array.from(
      new Array(size * size * 4).fill(0).flatMap((_, i) => {
        return [0, 0, 0, 1]
      })
    )

    const velocityArray = Float32Array.from(
      new Array(size * size * 4).fill(0).flatMap((_, i) => {
        const direction = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          0
        ).setLength(0.5)

        return [direction.x, direction.y, direction.z, 1]
      })
    )

    const dtPosition = new THREE.DataTexture(
      positionsArray,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    dtPosition.needsUpdate = true

    const dtVelocity = new THREE.DataTexture(
      velocityArray,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    dtVelocity.needsUpdate = true

    const velocityTexture = gpuRender.addVariable(
      "velocityTexture",
      velocity,
      dtVelocity
    )

    const positionTexture = gpuRender.addVariable(
      "positionsTexture",
      position,
      dtPosition
    )

    //* depenendies
    gpuRender.setVariableDependencies(positionTexture, [
      velocityTexture,
      positionTexture,
    ])

    gpuRender.setVariableDependencies(velocityTexture, [
      velocityTexture,
      positionTexture,
    ])

    // attributes
    //* particle attributes
    const attributesVector = Float32Array.from(
      new Array(size * size * 4).fill(0).flatMap(() => [
        // maxSpeed
        0.5,
        // maxForce
        1.0,
        // lifespan
        0.25, 1,
      ])
    )

    const dtAttributes = new THREE.DataTexture(
      attributesVector,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    dtAttributes.needsUpdate = true

    positionTexture.material.uniforms.time = { value: 0.0 }
    positionTexture.material.uniforms.delta = { value: 0.0 }

    velocityTexture.material.uniforms.time = { value: 0.0 }
    velocityTexture.material.uniforms.delta = { value: 0.0 }

    velocityTexture.material.uniforms.uMouse = {
      value: new THREE.Vector3(10, 10, 10),
    }

    velocityTexture.material.uniforms.width = { value: 10 }
    velocityTexture.material.uniforms.height = { value: 10 }
    velocityTexture.material.uniforms.depth = { value: 10 }

    velocityTexture.material.uniforms.originalPositions = {
      value: dtPosition.clone(),
    }

    positionTexture.material.uniforms.originalPositions = {
      value: dtPosition.clone(),
    }

    velocityTexture.material.uniforms.originalPositions = {
      value: dtPosition.clone(),
    }

    positionTexture.material.uniforms.width = { value: 10 }
    positionTexture.material.uniforms.height = { value: 10 }
    positionTexture.material.uniforms.depth = { value: 10 }

    velocityTexture.material.uniforms.attributesTexture = {
      value: dtAttributes.clone(),
    }

    velocityTexture.material.uniforms.originalVelocities = {
      value: dtVelocity.clone(),
    }

    positionTexture.material.uniforms.attributesTexture = {
      value: dtAttributes.clone(),
    }

    positionTexture.wrapS = THREE.RepeatWrapping
    positionTexture.wrapT = THREE.RepeatWrapping
    velocityTexture.wrapS = THREE.RepeatWrapping
    velocityTexture.wrapT = THREE.RepeatWrapping

    gpuRender.init()

    return [gpuRender, positionTexture, velocityTexture]
  }, [gl, size])

  useFrame((state, delta) => {
    positionTexture.material.uniforms.time.value = state.clock.getElapsedTime()
    velocityTexture.material.uniforms.time.value = state.clock.getElapsedTime()

    positionTexture.material.uniforms.delta.value = delta
    velocityTexture.material.uniforms.delta.value = delta
  })

  return [gpuCompute, positionTexture, velocityTexture]
}
