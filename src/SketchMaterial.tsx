import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"
import { hsl2rgb } from "./util/hsl2rgb"

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
  attribute float hue; 

  varying float vHue; 

  varying float speed; 
  varying float vLifespan; 
  varying vec2 vUv;

  float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  mat3 lookAtPoint(vec3 eye, vec3 at) {
    vec3 localUp = vec3(0, 1, 0); // temp sop space up vector
    vec3 fwd = normalize(at - eye); // direction to look at position
    vec3 right = normalize(cross(localUp, fwd)); // right vector of direction
    vec3 up = normalize(cross(fwd, right)); // up vector of direction
    
    return mat3(right, up, fwd);
  }

  void main() {
    vec3 tempPosition = texture2D(positionTexture, pIndex).xyz;	
    float lifespan = texture2D(positionTexture, pIndex).w;
    vec3 velocity = texture2D(velocityTexture, pIndex).xyz;

    vec3 newPositon = position;  
    newPositon.z *= length(velocity) * 1.0 - lifespan;

    newPositon = mat3(modelMatrix) * newPositon;

    //_ for direction
    vec3 futurePosition = normalize(velocity) * 5.0 + position + tempPosition;

    mat3 lookAtMat = lookAtPoint(vec3(0.0), velocity);
    vec3 newPos = lookAtMat * newPositon;
 
    newPos += tempPosition; 
        
    vec4 movePosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_Position = projectionMatrix * movePosition; 

    speed = length(velocity);
    vLifespan = texture2D(positionTexture, pIndex).w; 
    vHue = hue;
}`,
  //_ fragment shader
  /*glsl*/ `
  ${hsl2rgb}
  varying float speed; 
  varying vec2 vUv;
  varying float vLifespan;
  varying float vHue;

  float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  void main() {
    float hue = mix(0.55, 0.6, vLifespan); 
    float lightness = 1.0 - max(vLifespan, 0.8);
    
    vec3 color = hsl2rgb(hue, 0.8, lightness);

    if(vLifespan < 0.05) discard;

    gl_FragColor = vec4(color, 1.0 - vLifespan);
  }
`
)

extend({ SketchMaterial })
