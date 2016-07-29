precision highp float;

uniform sampler2D uNormalSampler;
uniform sampler2D uDiffuseSampler;
uniform vec2 uResolution;
// Varying
varying vec2 vUV;

void main(void) {

    float dx = 1.0 / uResolution.x;
    float dy = 1.0 / uResolution.y;
//    float dx = 0.0005208;
//    float dy = 0.001923;

//    vec3 center = texture2D( uNormalSampler, vec2(0.0, 0.0) ).xyz;
    vec3 center = texture2D( uNormalSampler, vec2( vUV.x, vUV.y) ).xyz;

    // sampling just these 3 neighboring fragments keeps the outline thin.
//    vec3 top = texture2D( uNormalSampler, vec2(0.0, dy) ).xyz;
//    vec3 topRight = texture2D( uNormalSampler, vec2(dx, dy) ).xyz;
//    vec3 right = texture2D( uNormalSampler, vec2(dx, 0.0) ).xyz;

    vec2 topUV = vec2(vUV.x, vUV.y + dy);

    vec3 top = texture2D( uNormalSampler, topUV ).xyz;
    vec3 topRight = texture2D( uNormalSampler, vec2(vUV.x + dx, vUV.y + dy) ).xyz;
    vec3 right = texture2D( uNormalSampler, vec2(vUV.x + dx, vUV.y) ).xyz;

    // the rest is pretty arbitrary, but seemed to give me the
    // best-looking results for whatever reason.

    vec3 t = center - top;
    vec3 r = center - right;
    vec3 tr = center - topRight;

    t = abs( t );
    r = abs( r );
    tr = abs( tr );

    float n;
    n = max( n, t.x );
    n = max( n, t.y );
    n = max( n, t.z );
    n = max( n, r.x );
    n = max( n, r.y );
    n = max( n, r.z );
    n = max( n, tr.x );
    n = max( n, tr.y );
    n = max( n, tr.z );

    // threshold and scale.
    //n = 1.0 - clamp( clamp((n * 2.0) - 0.8, 0.0, 1.0) * 1.5, 0.0, 1.0 );
    //
    n = 1.0 - clamp( clamp((n * 2.0) - 0.8, 0.0, 1.0) * 1.5, 0.0, 1.0 );

//    if (n == 1.0)
//    {
//        discard;
//    }
//
//    gl_FragColor = vec4(1.0,0.0,0.0,1.0);

    vec4 color = texture2D( uNormalSampler, vUV );
    vec4 diffColor = texture2D( uDiffuseSampler, vUV );
    //gl_FragColor = vec4(n, n, n, 1.0);
    //gl_FragColor = vec4( vUV.x + dx, 0.0 , 0.0, 1.0 );
    gl_FragColor = vec4(n, n, n, 1.0);
    //gl_FragColor = vec4(top, 1.0);
    //gl_FragColor = vec4(diffColor.xyz * (0.1 + 0.9*n), 1.0);

}