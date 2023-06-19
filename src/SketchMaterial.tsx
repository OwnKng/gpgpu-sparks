import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

const SketchMaterial = shaderMaterial(
  {
    uTime: 0,
    delta: new THREE.Vector2(0, 0),
    uMouse: new THREE.Vector3(0, 0, 0),
    positionTexture: null,
    velocityTexture: null,
  },
  // vertex shader
  /*glsl*/ `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform sampler2D positionTexture;
  uniform sampler2D velocityTexture;
  attribute vec2 pIndex;

  varying float vectorLength; 
  
  void main() {
	vec3 tempPosition = texture2D(positionTexture, pIndex).xyz;	
  
  float distanceFromOriginal = texture2D(positionTexture, pIndex).w;

	vec3 newPositon = position;   
	newPositon += tempPosition; 
    
  vec4 movePosition = modelViewMatrix * vec4(newPositon, 1.0 );
  gl_Position = projectionMatrix * movePosition; 

  vectorLength = distanceFromOriginal;
}`,
  //_ fragment shader
  /*glsl*/ `
  float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  void main() {
    gl_FragColor = vec4(vec3(1.0), 1.0);
  }
`
)

extend({ SketchMaterial })
