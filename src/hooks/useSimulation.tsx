import { useMemo } from "react"
import * as THREE from "three"
import {
  GPUComputationRenderer,
  Variable,
} from "three/examples/jsm/misc/GPUComputationRenderer.js"
import { useThree, useFrame } from "@react-three/fiber"
import velocity from "../shaders/simulation/velocity.glsl"
import position from "../shaders/simulation/position.glsl"

const q = new THREE.Quaternion()

const getPosition = (index: number, vertices: ArrayLike<number>) => {
  const i3 = index * 3

  const x = vertices[i3]
  const y = vertices[i3 + 1]
  const z = vertices[i3 + 2]

  return [x, y, z, 1]
}

const getNormal = (index: number, normals: ArrayLike<number>) => {
  const i3 = index * 3

  q.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(normals[i3], normals[i3 + 1], normals[i3 + 2])
  )

  const velocity = new THREE.Vector3(0, 0, 1).applyQuaternion(q)

  return [velocity.x, velocity.y, velocity.z, 1]
}

export const useSimulation = (
  mesh: THREE.Mesh
): [GPUComputationRenderer, number, Variable, Variable] => {
  const { gl } = useThree()

  const [length, vertices, normals] = useMemo(
    () => [
      mesh.geometry.attributes.position.count,
      mesh.geometry.attributes.position.array,
      mesh.geometry.attributes.normal.array,
    ],
    [mesh]
  )

  const size = parseInt(Math.sqrt(length) + 0.5)

  //_ Create the fbo and simulation data
  const [gpuCompute, positionTexture, velocityTexture] = useMemo(() => {
    const gpuRender = new GPUComputationRenderer(size, size, gl)

    const dtPosition = new THREE.DataTexture(
      Float32Array.from(
        new Array(length * 4)
          .fill(0)
          .flatMap((_, i) => getPosition(i, vertices))
      ),
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    dtPosition.needsUpdate = true

    const dtVelocity = new THREE.DataTexture(
      Float32Array.from(
        new Array(length * 4).fill(0).flatMap(() => [0, 0, 0, 1])
      ),
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

    positionTexture.material.uniforms.uTime = { value: 0.0 }
    positionTexture.material.uniforms.delta = { value: 0.0 }

    velocityTexture.material.uniforms.uTime = { value: 0.0 }
    velocityTexture.material.uniforms.delta = { value: 0.0 }

    velocityTexture.material.uniforms.uMouse = {
      value: new THREE.Vector3(10, 10, 10),
    }

    velocityTexture.material.uniforms.width = { value: 10 }
    velocityTexture.material.uniforms.height = { value: 10 }
    velocityTexture.material.uniforms.depth = { value: 10 }

    const rotations = new THREE.DataTexture(
      Float32Array.from(
        new Array(length).fill(0).flatMap((_, i) => getNormal(i, normals))
      ),
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    rotations.needsUpdate = true

    velocityTexture.material.uniforms.forces = {
      value: rotations,
    }

    velocityTexture.material.uniforms.originalPositions = {
      value: dtPosition.clone(),
    }

    positionTexture.material.uniforms.width = { value: 10 }
    positionTexture.material.uniforms.height = { value: 10 }
    positionTexture.material.uniforms.depth = { value: 10 }

    positionTexture.wrapS = THREE.RepeatWrapping
    positionTexture.wrapT = THREE.RepeatWrapping
    velocityTexture.wrapS = THREE.RepeatWrapping
    velocityTexture.wrapT = THREE.RepeatWrapping

    gpuRender.init()

    return [gpuRender, positionTexture, velocityTexture]
  }, [gl, length, vertices, normals, size])

  useFrame((state, delta) => {
    positionTexture.material.uniforms.uTime.value = state.clock.getElapsedTime()
    velocityTexture.material.uniforms.uTime.value = state.clock.getElapsedTime()

    positionTexture.material.uniforms.delta.value = delta
    velocityTexture.material.uniforms.delta.value = delta
  })

  return [gpuCompute, size, positionTexture, velocityTexture]
}
