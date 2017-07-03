#ifdef GL_ES 
precision highp float;
#endif

precision mediump float;							
uniform sampler2D sampler;							
varying vec2 vUV;										
varying vec3 vNormal;									
varying vec3 vView;										          
													
const vec3 source_ambient_color  = vec3(1.,1.,1.);		
const vec3 source_diffuse_color  = vec3(1.,1.,1.);		
const vec3 source_specular_color = vec3(1.,1.,1.);	    
const vec3 source_direction = vec3(0.,0.,1.);			
													
const vec3 mat_ambient_color  = vec3(0.3,0.3,0.3);		
const vec3 mat_diffuse_color  = vec3(1.,1.,1.);		
const vec3 mat_specular_color = vec3(1.,1.,1.);		
const float mat_shininess = 10.;						
													
void main(void) {									
	vec3 color = vec3(texture2D(sampler, vUV));															
	vec3 I_ambient = source_ambient_color * mat_ambient_color;											
	vec3 I_diffuse = source_diffuse_color * mat_diffuse_color * max(0., dot(vNormal, source_direction));	
	vec3 V = normalize(vView);																			
	vec3 R = reflect(source_direction, vNormal);														
	vec3 I_specular = source_specular_color * mat_specular_color * pow(max(dot(R,V),0.), mat_shininess);		
	vec3 I = I_ambient + I_diffuse + I_specular;														
	gl_FragColor = vec4(I * color, 1.);				
}