precision highp float;

uniform sampler2D diffuseSampler;

// Lights
varying vec3 vNormalW;
varying vec2 vUV;

void main(void) {

    vec4 diffColor = texture2D(diffuseSampler, vUV);
    if (diffColor.a < 0.05)
    {
        discard;
    }
    vec3 normal = normalize(vNormalW);

    //gl_FragColor = vec4(n, n, n, 1.);
    //gl_FragColor = vec4(normal, 1.0);
    vec3 color = vec3(1.0, 0.0, 0.0) * length(normal);
    //vec3 color = vec3(1.0, 0.0, 0.0);

    gl_FragColor = vec4(color.rgb, 1.0);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}