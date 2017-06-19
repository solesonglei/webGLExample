precision highp float;
uniform mat4 SCENEJS_uVMatrix;
varying vec4 SCENEJS_vWorldVertex;
varying vec4 SCENEJS_vViewVertex;
uniform float SCENEJS_uZNear;
uniform float SCENEJS_uZFar;
uniform vec3 SCENEJS_uWorldEye;
uniform bool  SCENEJS_uClipping;
uniform vec3  SCENEJS_uSolidColor;
uniform bool  SCENEJS_uDepthMode;
uniform vec3  SCENEJS_uAmbientColor;
uniform vec3  SCENEJS_uMaterialColor;
uniform vec3  SCENEJS_uMaterialSpecularColor;
uniform vec3  SCENEJS_uMaterialEmitColor;
uniform float SCENEJS_uMaterialSpecular;
uniform float SCENEJS_uMaterialShine;
uniform float SCENEJS_uMaterialAlpha;
uniform float SCENEJS_uMaterialEmit;
uniform float SCENEJS_uEmitFresnelCenterBias;
uniform float SCENEJS_uEmitFresnelEdgeBias;
uniform float SCENEJS_uEmitFresnelPower;
uniform vec3 SCENEJS_uEmitFresnelCenterColor;
uniform vec3 SCENEJS_uEmitFresnelEdgeColor;
varying vec3 SCENEJS_vViewEyeVec;
varying vec3 SCENEJS_vViewNormal;
varying vec3 SCENEJS_vWorldNormal;
uniform vec3  SCENEJS_uLightColor1;
uniform vec3 SCENEJS_uLightDir1;
uniform vec3  SCENEJS_uLightColor2;
uniform vec3 SCENEJS_uLightDir2;
uniform vec3  SCENEJS_uLightColor3;
uniform vec3 SCENEJS_uLightDir3;
uniform bool  SCENEJS_uXray;
uniform float SCENEJS_uGlassFactor;
uniform float SCENEJS_uMurkiness;
uniform float SCENEJS_uXrayGlassFactor;
uniform float SCENEJS_uXrayMurkiness;
uniform float SCENEJS_uOpacity;
uniform vec3  SCENEJS_uXrayBGColor;
uniform bool SCENEJS_uHighlight;
uniform bool SCENEJS_uDesaturate;
uniform vec3 SCENEJS_uHighlightColor;
float fresnel(vec3 viewDirection, vec3 worldNormal, float edgeBias, float centerBias, float power) {
    float fr = abs(dot(viewDirection, worldNormal));
    float finalFr = clamp((fr - edgeBias) / (centerBias - edgeBias), 0.0, 1.0);
    return pow(finalFr, power);
}
void main(void) {
vec3 worldEyeVec = normalize(SCENEJS_uWorldEye - SCENEJS_vWorldVertex.xyz);
vec3 worldNormal = normalize(SCENEJS_vWorldNormal); 
  if (gl_FrontFacing == false) {
     gl_FragColor = vec4(SCENEJS_uSolidColor.xyz, 1.0);
     return;
  }
  vec3 ambient= SCENEJS_uAmbientColor;
  vec3    color   = SCENEJS_uMaterialColor;
  float alpha         = SCENEJS_uMaterialAlpha;
  float emit          = SCENEJS_uMaterialEmit;
  float specular      = SCENEJS_uMaterialSpecular;
  vec3  specularColor = SCENEJS_uMaterialSpecularColor;
  vec3  emitColor     = SCENEJS_uMaterialEmitColor;
  float shine         = SCENEJS_uMaterialShine;
  float   attenuation = 1.0;
  vec3    viewNormalVec = normalize(SCENEJS_vViewNormal);
vec3 viewEyeVec = normalize(SCENEJS_vViewEyeVec);
if (SCENEJS_uXray) {
    alpha = 1.0;
} else {
    alpha = min(alpha, SCENEJS_uOpacity);
    float gf = (SCENEJS_uGlassFactor  * (SCENEJS_uMurkiness - abs(dot(SCENEJS_vViewNormal, vec3(0.0, 0.0, -1.0)))));
    alpha = max(alpha, gf);
}
  vec4    fragColor;
  vec3    lightValue      = vec3(0.0, 0.0, 0.0);
  vec3    specularValue   = vec3(0.0, 0.0, 0.0);
  vec3    viewLightVec;
  vec3    viewLightDir;
  float   dotN;
  float   spotDirRatio;
  float   lightDist;
viewLightVec = normalize(SCENEJS_uLightDir1);
viewLightVec = -viewLightVec;
dotN = max(dot(viewNormalVec, normalize(viewLightVec)), 0.0);
lightValue += dotN * SCENEJS_uLightColor1;
viewLightVec = normalize(SCENEJS_uLightDir2);
viewLightVec = -viewLightVec;
dotN = max(dot(viewNormalVec, normalize(viewLightVec)), 0.0);
lightValue += dotN * SCENEJS_uLightColor2;
specularValue += specularColor * SCENEJS_uLightColor2 * specular * pow(max(dot(reflect(normalize(-viewLightVec), normalize(-viewNormalVec)), normalize(-SCENEJS_vViewVertex.xyz)), 0.0), shine);
viewLightVec = normalize(SCENEJS_uLightDir3);
viewLightVec = -viewLightVec;
dotN = max(dot(viewNormalVec, normalize(viewLightVec)), 0.0);
lightValue += dotN * SCENEJS_uLightColor3;
specularValue += specularColor * SCENEJS_uLightColor3 * specular * pow(max(dot(reflect(normalize(-viewLightVec), normalize(-viewNormalVec)), normalize(-SCENEJS_vViewVertex.xyz)), 0.0), shine);
float emitFresnel = fresnel(worldEyeVec, worldNormal, SCENEJS_uEmitFresnelEdgeBias, SCENEJS_uEmitFresnelCenterBias, SCENEJS_uEmitFresnelPower);
emitColor.rgb *= mix(SCENEJS_uEmitFresnelEdgeColor.rgb, SCENEJS_uEmitFresnelCenterColor.rgb, emitFresnel);
fragColor = vec4((specularValue.rgb + color.rgb * (lightValue.rgb + ambient.rgb)) + (emit * emitColor.rgb), alpha);
if (SCENEJS_uXray) {
    fragColor.a *= (SCENEJS_uXrayGlassFactor  * (SCENEJS_uXrayMurkiness - abs(dot(SCENEJS_vViewNormal, vec3(0.0, 0.0, -1.0)))));
}
if (SCENEJS_uHighlight) {
    float intensity = 0.3 * fragColor.r + 0.59 * fragColor.g + 0.11 * fragColor.b;
    fragColor = vec4((intensity * - 0.1) + fragColor.rgb * (1.0 + 0.1), fragColor.a);
    fragColor.r = clamp(fragColor.r * SCENEJS_uHighlightColor.r, 0.3, 1.0);
    fragColor.g = clamp(fragColor.g * SCENEJS_uHighlightColor.g, 0.3, 1.0);
    fragColor.b = fragColor.b * SCENEJS_uHighlightColor.b;
} else if (SCENEJS_uDesaturate) {
    fragColor.rgb = SCENEJS_uXrayBGColor;
} 
fragColor.rgb *= fragColor.a;
gl_FragColor = fragColor;
}