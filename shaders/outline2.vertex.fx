precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldView;
uniform mat4 worldViewProjection;

// Varying
varying vec2 vUV;

void main(void) {

    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    vUV = uv;

    gl_Position = outPosition;

}
