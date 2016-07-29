precision highp float;

uniform sampler2D diffuseSampler;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

void main(void) {

    vec4 color = texture2D(diffuseSampler, vUV);
    if (color.a < 0.05)
    {
        discard;
    }
    vec3 normal = normalize(vNormalW);

    //gl_FragColor = vec4(n, n, n, 1.);
    gl_FragColor = vec4(normal, 1.0);
}