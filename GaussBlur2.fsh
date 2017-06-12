#version 300 es                                                                                
precision mediump float; 
precision mediump int;  
                                                                               
out vec4 FragColor;                                                                                     																										
in vec2 vUV;     
                                                                                 		
uniform sampler2D sampler;                                                                                																										
uniform bool horizontal; 
uniform int sigma;
                                                                                
//float weight[] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);  
// sigma = 3,5 ,7,9,11                       

float gaussianPdf(in float x, in float sigma) {
	return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
}
																										
void main()                                                                                             
{                                                                                                       
	vec2 tex_size = vec2( textureSize(sampler, 0));                                                       
	vec2 tex_offset = 1.0 / tex_size; 					 // gets size of single texel 
	float weightSum = gaussianPdf(0.0, float(sigma));                                   
	vec3 result = texture(sampler, vUV).rgb * weightSum; // current fragment's contribution 
	
	int KERNEL_RADIUS = sigma;
	for(int i = 0; i < KERNEL_RADIUS; ++i)
	{
		float x = float(i);
		float w = gaussianPdf(x, float(sigma));
		if(horizontal){
			result += texture(sampler, vUV + vec2(tex_offset.x * float(i), 0.0)).rgb * w;
			result += texture(sampler, vUV - vec2(tex_offset.x * float(i), 0.0)).rgb * w;
		}
		else{
			result += texture(sampler, vUV + vec2(0.0, tex_offset.y * float(i))).rgb * w;   		
			result += texture(sampler, vUV - vec2(0.0, tex_offset.y * float(i))).rgb * w;   
		}
		weightSum += 2.0 * w;
	}
	                                                                                                 
	FragColor = vec4(result / weightSum, 1.0);                                                                      
}        