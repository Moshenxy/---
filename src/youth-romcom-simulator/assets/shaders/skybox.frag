varying vec2 vUv;
uniform float u_time;

// 2D Random
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// 2D Noise
float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// Fractal Brownian Motion
float fbm (vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 st = vUv * 3.0; // Scale the coordinate system
    st += u_time * 0.01; // Animate over time

    float f = fbm(st);

    vec3 color1 = vec3(0.0, 0.0, 0.1); // Deep Blue
    vec3 color2 = vec3(0.1, 0.0, 0.3); // Indigo
    vec3 color3 = vec3(0.5, 0.1, 0.4); // Magenta
    vec3 color4 = vec3(0.9, 0.5, 0.2); // Orange

    vec3 color = mix(color1, color2, smoothstep(0.1, 0.4, f));
    color = mix(color, color3, smoothstep(0.3, 0.6, f));
    color = mix(color, color4, smoothstep(0.5, 0.8, f));

    gl_FragColor = vec4(color, 1.0);
}