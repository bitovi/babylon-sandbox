precision highp float;
varying vec2 vUV;
varying vec4 vPos;
varying vec4 vNormal;

void main(void) {
    gl_FragColor = vNormal;
}