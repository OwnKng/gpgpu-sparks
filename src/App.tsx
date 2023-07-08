import "./App.css"
import Sketch from "./Sketch"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

const r = 110
const tempVector = new THREE.Vector3()
const cameraPosition = new THREE.Vector3()

const Rig = () =>
  useFrame(({ mouse, camera }) => {
    // rotate the camera based on mouse position
    let { x } = mouse
    x = x * 0.5 + 0.5

    const cameraX = Math.cos(x * Math.PI * 2) * r
    const cameraZ = Math.sin(x * Math.PI * 2) * r

    tempVector.set(cameraX, 0, cameraZ)

    cameraPosition.lerp(tempVector, 0.05).setLength(r)

    camera.position.copy(cameraPosition)
    camera.lookAt(0, 0, 0)
  })

function App() {
  return (
    <div className='App'>
      <Canvas
        camera={{
          position: [0, 20, r],
        }}
      >
        <Sketch />
        <Rig />
      </Canvas>
    </div>
  )
}

export default App
