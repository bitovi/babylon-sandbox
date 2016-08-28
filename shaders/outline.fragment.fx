uniform sampler2D passSampler;
uniform sampler2D maskSampler;
uniform vec3 uOutlineColor;
varying vec2 vUV;

void main(void)
{
    //vec2 uv = vec2(mod(vuv.x,1.),vuv.y);
    vec4 orig = texture2D(passSampler, vUV);
    vec4 mask = texture2D(maskSampler, vUV);
    float dx = 0.0005208 * 1.5;
    float dy = 0.001923 * 1.5;
    // Center
    float c0 = texture2D( maskSampler, vec2( vUV.x, vUV.y ) ).r;
    // Top right
    float c1 = texture2D( maskSampler, vec2( vUV.x + dx, vUV.y + dy ) ).r;
    // Top left
    float c2 = texture2D( maskSampler, vec2( vUV.x - dx, vUV.y + dy ) ).r;
    // Bottom right
    float c3 = texture2D( maskSampler, vec2( vUV.x + dx, vUV.y - dy ) ).r;
    // Bottom left
    float c4 = texture2D( maskSampler, vec2( vUV.x - dx, vUV.y - dy ) ).r;
    // Right
    float c5 = texture2D( maskSampler, vec2( vUV.x + dx, vUV.y ) ).r;
    // Left
    float c6 = texture2D( maskSampler, vec2( vUV.x - dx, vUV.y ) ).r;
    // Up
    float c7 = texture2D( maskSampler, vec2( vUV.x, vUV.y + dy ) ).r;
    // Down
    float c8 = texture2D( maskSampler, vec2( vUV.x, vUV.y - dy ) ).r;
    // If center isn't on the mesh
    // But if the surrounding ones are then return white color
    float adjacent = 0.0;
    adjacent = max( adjacent, c1 );
    adjacent = max( adjacent, c2 );
    adjacent = max( adjacent, c3 );
    adjacent = max( adjacent, c4 );
    adjacent = max( adjacent, c5 );
    adjacent = max( adjacent, c6 );
    adjacent = max( adjacent, c7 );
    adjacent = max( adjacent, c8 );

    float n = 1.0 - ( adjacent - c0);
    clamp(n, 0.0, 1.0);
    // Original rgb and return border if border
    vec3 color = orig.rgb * n + (1.0- n) * vec3(0.4, 1.0, 0.6);
    // vec3 color = orig.rgb * n;
    gl_FragColor = vec4( color, 1.0 );
    // gl_FragColor = vec4( n, 0.0, 0.0, 1.0 );
}