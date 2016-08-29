uniform sampler2D passSampler;
// Blurred image
uniform sampler2D textureSampler;
uniform sampler2D maskSampler;
uniform vec3 uOutlineColor;
varying vec2 vUV;

void main(void)
{
    vec4 orig = texture2D(passSampler, vUV);
    vec4 mask = texture2D(maskSampler, vUV);
    vec4 blur = texture2D(textureSampler, vUV);

    float blurOutline = clamp((blur.r - mask.r) * 2.5, 0.0, 1.0);

    // Original rgb and return border if border
//    vec3 color = orig.rgb * n + (1.0- n) * vec3(1.0, 0.0, 0.0);
    vec3 color = orig.rgb * (1.0 - blurOutline) + blurOutline * vec3(0.0274509803921569, 0.6666666666666667, 0.9607843137254902);
    // vec3 color = orig.rgb * n;
    gl_FragColor = vec4( color, 1.0 );
//     gl_FragColor = vec4( blur.r, 0.0, 0.0, 1.0 );
}