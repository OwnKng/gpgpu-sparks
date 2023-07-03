uniform float time;
uniform float delta;

uniform float width;
uniform float height;
uniform float depth; 
uniform sampler2D originalPositions;
uniform sampler2D attributesTexture; 

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main()	{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec3 velocity = texture2D(velocityTexture, uv).xyz;	
	vec3 position = texture2D(positionsTexture, uv).xyz;
	vec3 originalPosition = texture2D(originalPositions, uv).xyz;

	float lifespan = texture2D(attributesTexture, uv).z;

	float wave = round(fract(time * 2.0));

	if (wave == 0.0) {
		position = originalPosition;
	}

    gl_FragColor = vec4(position + velocity * delta * 15.0, 1.0);
}