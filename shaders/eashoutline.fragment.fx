// The rendered image awaiting post-process
uniform sampler2D passSampler;
// The red texture
uniform sampler2D maskSampler;
// How many steps to get 1 pixel for x & y
// So value is for example 1 / 1920
uniform vec2 uUVsteps;

varying vec2 vUV;

void main(void){
    // Color from first render
    vec4 orig = texture2D(passSampler, vUV);
    // Makes the uv coordinate go more pixels per step out.
    //The bigger thickness the less accurate for hard edges.
    // 1.5 would mean 1.5 pixels / uv step
    float thickness = 1.5;

    vec2 deltaUV = vec2(uUVsteps.x * thickness, uUVsteps.y * thickness);

    // Get current pixel and all adjacent pixels
    // Center
    float c0 = texture2D( maskSampler, vec2( vUV.x, vUV.y ) ).r;
    // Top right
    float c1 =  texture2D( maskSampler, vec2( vUV.x + deltaUV.x, vUV.y + deltaUV.y ) ).r;
    // Top left
    float c2 = texture2D( maskSampler, vec2( vUV.x - deltaUV.x, vUV.y + deltaUV.y ) ).r;
    // Bottom right
    float c3 = texture2D( maskSampler, vec2( vUV.x + deltaUV.x, vUV.y - deltaUV.y ) ).r;
    // Bottom left
    float c4 = texture2D( maskSampler, vec2( vUV.x - deltaUV.x, vUV.y - deltaUV.y ) ).r;
    // Right
    float c5 = texture2D( maskSampler, vec2( vUV.x + deltaUV.x, vUV.y ) ).r;
    // Left
    float c6 = texture2D( maskSampler, vec2( vUV.x - deltaUV.x, vUV.y ) ).r;
    // Up
    float c7 = texture2D( maskSampler, vec2( vUV.x, vUV.y + deltaUV.y ) ).r;
    // Down
    float c8 = texture2D( maskSampler, vec2( vUV.x, vUV.y - deltaUV.y ) ).r;

    // Is an adjacent pixel red?
    // Check all 8 adjacent pixels
    float adjacent = 0;
    adjacent = max( adjacent, c1 );
    adjacent = max( adjacent, c2 );
    adjacent = max( adjacent, c3 );
    adjacent = max( adjacent, c4 );
    adjacent = max( adjacent, c5 );
    adjacent = max( adjacent, c6 );
    adjacent = max( adjacent, c7 );
    adjacent = max( adjacent, c8 );

    // n will be 1 if no outline
    // 0 if there is a border
    float n = 1.0 - ( adjacent - c0);
    // When adj = 0 and c0 = 1 the result will be 2
    clamp(n, 0.0, 1.0);

    // Original rgb and return outline depending on n
    vec3 color = orig.rgb * n + (1.0 - n) * vec3(0.4, 1.0, 0.6);
    gl_FragColor = vec4( color, 1.0 );
}
