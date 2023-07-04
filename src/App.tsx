import "./App.css"
import Sketch from "./Sketch"
import { Canvas } from "@react-three/fiber"

function App() {
  return (
    <div className='App'>
      <Canvas
        camera={{
          position: [0, 0, 30],
        }}
      >
        <Sketch />
      </Canvas>
    </div>
  )
}

export default App
