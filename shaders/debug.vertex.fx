precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;

// Normal
varying vec2 vUV;
varying vec4 vPos;
varying vec4 vNormal;

void main(void) {

    mat3 normalMatrix = mat3(world);
    vPos = worldViewProjection * vec4(position, 1.0);
    // worldspace normals
    vNormal = vec4(normalMatrix * normal, 1.0);
    // object normals
    //vNormal = vec4(normal, 1.0);
    gl_Position = vPos;

    vUV = uv;
}