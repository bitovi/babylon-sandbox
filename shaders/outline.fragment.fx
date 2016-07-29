precision highp float;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;

// Refs
uniform vec3 cameraPosition;

void main(void) {



    vec3 color = vec3(1., 1., 1.);
    vec3 cameraPos = vec3(-3, 1.5, -4);

    vec3 viewDirectionW = normalize(cameraPos - vPositionW);

    //gl_FragColor = vec4(cameraPosition, 1.0);

    // Fresnel
	float fresnelTerm = dot(viewDirectionW, vNormalW);
	fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);
    fresnelTerm = pow(fresnelTerm,80.)* 1250.0;
    gl_FragColor = vec4(color * fresnelTerm , 1.);
}