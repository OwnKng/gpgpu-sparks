uniform float time;
uniform float delta;

uniform float width;
uniform float height;
uniform float depth; 
uniform sampler2D originalPositions;
uniform sampler2D attributesTexture; 
uniform vec3 originPoint; 

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main()	{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec3 velocity = texture2D(velocityTexture, uv).xyz;	
	vec3 position = texture2D(positionsTexture, uv).xyz;
	float lifespan = texture2D(attributesTexture, uv).z;

	// use time to reset the position of the particle every two seconds
	float t = fract(time * lifespan);

	if (t < 0.05) {
		position = originPoint;
	}


    gl_FragColor = vec4(position + velocity * delta * 15.0, t);
}