uniform float time;
uniform float delta;
uniform vec3 uMouse;
uniform float width; 
uniform float height;
uniform float depth; 

uniform vec3 dragDirection; 
uniform float dragForce; 

uniform sampler2D attributesTexture; 
uniform sampler2D originalVelocities; 

//_ some utilities
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
}

vec3 applyForce(vec3 force, vec3 acceleration, float maxForce) {
    if(length(acceleration) > maxForce) {
        acceleration = normalize(acceleration) * maxForce;
    }
    return acceleration + force;
}

vec3 updateVelocity(vec3 acceleration, vec3 velocity, float maxSpeed) {
    vec3 newVelocity = velocity + acceleration * delta;
    if (length(newVelocity) > maxSpeed) {
        newVelocity = normalize(newVelocity) * maxSpeed;
    }
    return newVelocity;
}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

//_ Noise functions
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

//_ Vehicle functions
vec3 seek(vec3 target, vec3 position, vec3 velocity, bool arrival, float maxSpeed, float maxForce) {
    vec3 force = target - position; 
    float desiredSpeed = maxSpeed;
    float r = 10.0; 

    if(arrival) {
        float slowRadius = 2.0;
        // get the length of the vector force
        float d = length(force);

        if(d < r) {
            desiredSpeed = map(d, 0.0, r, 0.0, maxSpeed);
            force = normalize(force) * desiredSpeed;

        } else {
            force = normalize(force) * maxSpeed;
        }
    }

    vec3 steer = force - velocity;

    // limit the force according to maxForce 
    if(length(steer) > maxForce) {
        steer = normalize(steer) * maxForce;
    }

    return steer;
}


void main()	{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    vec3 velocity = texture2D(velocityTexture, uv).xyz;
    vec3 position = texture2D(positionsTexture, uv).xyz;
    vec4 attributes = texture2D(attributesTexture, uv);
    vec3 originalVelocity = texture2D(originalVelocities, uv).xyz;

    float maxSpeed = attributes.x;
    float maxForce = attributes.y;
    float lifespan = attributes.z;

    vec3 acceleration = vec3(0.0);
    
    vec3 gravity = vec3(0.0, -0.5, 0.0);
    acceleration += applyForce(gravity, acceleration, maxForce);

    velocity = updateVelocity(acceleration, velocity, maxSpeed);

    // create a modulated time which counts from 0 to 5 seconds
	float t = fract(time * lifespan);

	if (t < 0.05) {
		velocity = (originalVelocity + dragDirection) * dragForce; 
	}


    gl_FragColor = vec4(velocity, 1.0);
}
