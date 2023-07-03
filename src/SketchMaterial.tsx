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

  mat3 lookAtPoint(vec3 eye, vec3 at) {
    vec3 localUp = vec3(0, 1, 0); // temp sop space up vector
    vec3 fwd = normalize(at - eye); // direction to look at position
    vec3 right = normalize(cross(localUp, fwd)); // right vector of direction
    vec3 up = normalize(cross(fwd, right)); // up vector of direction
    
    return mat3(right, up, fwd);
  }

  void main() {
    vec3 tempPosition = texture2D(positionTexture, pIndex).xyz;	
    float speed = texture2D(positionTexture, pIndex).w;
    float distanceFromOriginal = texture2D(positionTexture, pIndex).w;
    vec3 velocity = texture2D(velocityTexture, pIndex).xyz;

    vec3 newPositon = position;  
    newPositon = mat3(modelMatrix) * newPositon;
    
    //_ for direction
    vec3 futurePosition = normalize(velocity) * 10.0 + position + tempPosition;

    mat3 lookAtMat = lookAtPoint(tempPosition, velocity);
    vec3 newPos = lookAtMat * newPositon;

    newPos += tempPosition; 
    newPos += tempPosition; 
      
    vec4 movePosition = modelViewMatrix * vec4(newPos, 1.0 );
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
