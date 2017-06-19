var main = function(){
	var CANVAS = document.getElementById("your_canvas");
	  CANVAS.width  = window.innerWidth;
	  CANVAS.height = window.innerHeight;	

	var GL;
	try{
		GL = CANVAS.getContext("webgl2", {antialias:true, stencil: true, depth: true});
		var EXT = GL.getExtension("OES_element_index_uint") 		||
				  GL.getExtension("MOZ_OES_element_index_uint") 	||
				  GL.getExtension("WEBKIT_OES_element_index_uint")	
		} catch (e) {
			alert("You are not webgl compatible :(") ;
			return false;
		}
	
	var ext = GL.getExtension('WEBGL_depth_texture');
	
	var shader_vertex_source_tex = "#version 300 es \n\
		in vec3 position;							\n\
		in vec2 uv;									\n\
		in vec3 normal;								\n\
		uniform mat4 Pmatrix;						\n\
		uniform mat4 Vmatrix;						\n\
		uniform mat4 Mmatrix;						\n\
		out vec2 vUV;								\n\
		out vec3 vNormal;							\n\
		out vec3 vView;								\n\
		mat4 scaleMatrix = mat4(.2,0,0,0,   		\n\
		                    0,.2,0,0,    			\n\
							0,0,.2,0,    			\n\
							0,0,0,1 );   			\n\
													\n\
		void main(void) {							\n\
			gl_Position = Pmatrix * Vmatrix * Mmatrix * scaleMatrix * vec4(position, 1.);	\n\
			vNormal=vec3(Mmatrix*vec4(normal, 0.));											\n\
			vView=vec3(Vmatrix*Mmatrix*vec4(position, 1.));									\n\
			vUV = uv;																		\n\
		}";
		
	 var shader_fragment_source_tex = "#version 300 es		\n\
		precision mediump float;							\n\
		uniform sampler2D sampler;							\n\
		in vec2 vUV;										\n\
		in vec3 vNormal;									\n\
		in vec3 vView;										\n\
		layout(location = 0) out vec4 FlagColor1;           \n\
		layout(location = 1) out vec4 FlagColor2;           \n\
															\n\
		const vec3 source_ambient_color = vec3(1.,1.,1.);		\n\
		const vec3 source_diffuse_color = vec3(1.,1.,1.);		\n\
		const vec3 source_specular_color = vec3(1.,1.,1.);	    \n\
		const vec3 source_direction = vec3(0.,0.,1.);			\n\
															\n\
		const vec3 mat_ambient_color=vec3(0.3,0.3,0.3);		\n\
		const vec3 mat_diffuse_color=vec3(1.,1.,1.);		\n\
		const vec3 mat_specular_color=vec3(1.,1.,1.);		\n\
		const float mat_shininess=10.;						\n\
															\n\
		void main(void) {									\n\
			vec3 color = vec3(texture(sampler, vUV));															\n\
			vec3 I_ambient = source_ambient_color*mat_ambient_color;											\n\
			vec3 I_diffuse = source_diffuse_color*mat_diffuse_color*max(0., dot(vNormal, source_direction));	\n\
			vec3 V = normalize(vView);																			\n\
			vec3 R = reflect(source_direction, vNormal);														\n\
			vec3 I_specular=source_specular_color*mat_specular_color*pow(max(dot(R,V),0.), mat_shininess);		\n\
			vec3 I = I_ambient + I_diffuse + I_specular;														\n\
			FlagColor1 = vec4(I * color, 1.);	                                                                \n\
			if (FlagColor1.r >= 0.95 && FlagColor1.g >= 0.95 && FlagColor1.b >= 0.95){                             \n\
				FlagColor1 = vec4(0.9, 0.9, 0.9, 1.0);														\n\
			}																									\n\
			FlagColor2 = vec4(0.0, 0.0, 0.0, 1.);															    \n\
		}";

	var shader_vertex_source_quard = "#version 300 es 	\n\
		in vec4 vPosition; 								\n\
		in vec2 uv; 									\n\
		out vec2 vUV;  									\n\
														\n\
		void main(void) {   							\n\
			gl_Position = vPosition; 					\n\
			vUV = uv; 									\n\
		}";
		
	var shader_fragment_source_quard = "#version 300 es \n\
		precision mediump float;         				\n\
		in vec2 vUV;                	 				\n\
		uniform sampler2D sampler;       				\n\
		uniform float uWidth;            				\n\
		uniform float uHeight;           				\n\
		out vec4 FragColor;              				\n\
		void main(void) {								\n\
		    float time = 5.0; 							\n\
			vec3 color   = vec3(texture(sampler, vUV));                   										\n\
			//vec2 res = gl_FragCoord.xy / vec2(uWidth, uHeight);             									\n\
			FragColor = texture( sampler, vUV + 0.005*vec2( sin(time+1024.0*vUV.x),cos(time+768.0*vUV.y)) ) ;   \n\
			FragColor = vec4(color, 1.0);        																\n\
			//gl_FragColor = vec4(color.x, color.x, color.x, 1.0);       										 \n\
		}";
	
	var blurShader =   "#version 300 es   					\n\
						precision mediump float; 			\n\
						in vec2 vUV; 						\n\
						uniform sampler2D sampler; 			\n\
						uniform float offset;\n\
						//const float offset = 1.0 / 600.0; 	\n\
						out vec4 FragColor;					\n\
						void main(void) 					\n\
						{                                                                        \n\
							vec2 offsets[9] = vec2[9]( 	vec2(-offset, offset), // top-left       \n\
													vec2( 0.0f, offset), // top-center           \n\
													vec2( offset, offset), // top-right          \n\
													vec2(-offset, 0.0f), // center-left          \n\
													vec2( 0.0f, 0.0f), // center-center          \n\
													vec2( offset, 0.0f), // center-right         \n\
													vec2(-offset, -offset), // bottom-left       \n\
													vec2( 0.0f, -offset), // bottom-center       \n\
													vec2( offset, -offset) // bottom-right       \n\
												);	                                             \n\
																								 \n\
							float kernel[9] = float[9]( 			                             \n\
												1.0, 2.0,  1.0,		                             \n\
												2.0, 4.0 , 2.0,		                             \n\
												1.0, 2.0, 1.0);	                                 \n\
							vec3 sampleTex[9];                                                   \n\
							for(int i = 0; i < 9; ++i){                                          \n\
								sampleTex[i] = vec3(texture(sampler, vUV.st + offsets[i]));      \n\
								}  																 \n\
							vec3 col = vec3(0.0);                                                \n\
							for(int i = 0; i < 9; ++i) {                                         \n\
							col += sampleTex[i] * (kernel[i] / 16.0);                            \n\
							}                                                                    \n\
							FragColor = vec4(col, 1.0);                                          \n\
						}";

	var	blurShader1 = "#version 300 es   					                                    \n\
				precision mediump float; 			                                            \n\
				in vec2 vUV; 						                                            \n\
				uniform sampler2D sampler; 			                                            \n\
				const float offset = 1.0 / 300.0; 	                                            \n\
				out vec4 FragColor;					                                            \n\
				void main(void) 					                                            \n\
				{                                                                               \n\
					vec2 offsets[25] = vec2[25]( 	vec2(-2.0f * offset, 2.0f * offset),        \n\
													vec2(       -offset, 2.0f * offset),        \n\
													vec2(          0.0f, 2.0f * offset),        \n\
													vec2(        offset, 2.0f * offset),        \n\
													vec2( 2.0f * offset, 2.0f * offset),        \n\
													vec2(-2.0f * offset,     offset),           \n\
													vec2(-1.0f * offset,     offset),           \n\
													vec2( 		   0.0f, 	 offset),           \n\
													vec2(        offset,     offset),           \n\
													vec2( 2.0f * offset,     offset),           \n\
													vec2(-2.0f * offset,     0.0f),             \n\
													vec2(       -offset,     0.0f),             \n\
													vec2(          0.0f,     0.0f),             \n\
													vec2(        offset,     0.0f),             \n\
													vec2( 2.0f * offset,     0.0f),             \n\
													vec2(-2.0f * offset,    -offset),           \n\
													vec2(-1.0f * offset,    -offset),           \n\
													vec2( 		   0.0f, 	-offset),           \n\
													vec2(        offset,    -offset),           \n\
													vec2( 2.0f * offset,    -offset),           \n\
													vec2(-2.0f * offset, -2.0f * offset),       \n\
													vec2(       -offset, -2.0f * offset),       \n\
													vec2(          0.0f, -2.0f * offset),       \n\
													vec2(        offset, -2.0f * offset),       \n\
													vec2( 2.0f * offset, -2.0f * offset) );	    \n\
																								\n\
																								\n\
					float kernel[25] = float[25](1.0,  4.0,  7.0,  4.0, 1.0,                                     \n\
											4.0, 16.0, 26.0, 16.0, 4.0,                                   \n\
											7.0, 26.0, 41.0, 26.0, 7.0,                                   \n\
											4.0, 16.0, 26.0, 16.0, 4.0,                                  \n\
											1.0,  4.0,  7.0,  4.0, 1.0);		                                \n\
																								\n\
					vec3 sampleTex[25];                                                         \n\
					for(int i = 0; i < 25; ++i){                                                \n\
						sampleTex[i] = vec3(texture(sampler, vUV.st + offsets[i]));             \n\
					}  	                                                                        \n\
																								\n\
					vec3 col = vec3(0.0);                                                       \n\
					for(int i = 0; i < 25; ++i) {                                               \n\
						col += sampleTex[i] * (kernel[i] / 273.0);                              \n\
						FragColor = vec4(col, 1.0);                                             \n\
					}                                                                           \n\
				} "	;
							
	var kernelEffect =   "#version 300 es  					 									\n\
						precision mediump float; 			 									\n\
						in vec2 vUV;                         									\n\
						uniform sampler2D sampler;           									\n\
						const float offset = 10.0 / 300.0;   									\n\
						out vec4 FragColor;														\n\
						void main(void) 														\n\
						{                                                                        \n\
							vec2 offsets[9] = vec2[9]( 	vec2(-offset, offset), // top-left       \n\
													vec2( 0.0f, offset), // top-center           \n\
													vec2( offset, offset), // top-right          \n\
													vec2(-offset, 0.0f), // center-left          \n\
													vec2( 0.0f, 0.0f), // center-center          \n\
													vec2( offset, 0.0f), // center-right         \n\
													vec2(-offset, -offset), // bottom-left       \n\
													vec2( 0.0f, -offset), // bottom-center       \n\
													vec2( offset, -offset) // bottom-right       \n\
												);	                                             \n\
																								 \n\
							float kernel[9] = float[9]( 			                             \n\
												2.0, 2.0,  2.0,		                             \n\
												2.0, -15.0 , 2.0,		                         \n\
												2.0, 2.0, 2.0);	                                 \n\
							vec3 sampleTex[9];                                                   \n\
							for(int i = 0; i < 9; ++i){                                          \n\
								sampleTex[i] = vec3(texture(sampler, vUV.st + offsets[i]));      \n\
								}  																 \n\
							vec3 col = vec3(0.0);                                                \n\
							for(int i = 0; i < 9; ++i) {                                         \n\
							col += sampleTex[i] * (kernel[i] / 16.0);                            \n\
							}                                                                    \n\
							FragColor = vec4(col, 1.0);                                          \n\
						}";
	
	var shader_guassBlur = "#version 300 es                                                   							   \n\
							precision mediump float;                                                                       \n\
							precision mediump int;                                                                         \n\
																														   \n\
							out vec4 FragColor;                                                                            \n\
							in vec2 vUV;                                                                                   \n\
																														   \n\
							uniform sampler2D sampler;                                                                     \n\
							uniform int horizontal;                                                                       \n\
							uniform int sigma;                                                                             \n\
																														   \n\
							//float weight[] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);               \n\
							// sigma = 3,5 ,7,9,11                                                                         \n\
																														   \n\
							float gaussianPdf(in float x, in float sigma) {                                                \n\
								return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;                                \n\
							}                                                                                              \n\
																															\n\
							void main()                                                                                     \n\
							{                                                                                               \n\
								vec2 tex_size = vec2( textureSize(sampler, 0));                                             \n\
								vec2 tex_offset = 1.0 / tex_size; 					 // gets size of single texel           \n\
								float weightSum = gaussianPdf(0.0, float(sigma));                                           \n\
								vec3 result = texture(sampler, vUV).rgb * weightSum; // current fragment's contribution     \n\
																															\n\
								int KERNEL_RADIUS = sigma;                                                                  \n\
								for(int i = 0; i < KERNEL_RADIUS; ++i)                                                      \n\
								{                                                                                           \n\
									float x = float(i);                                                                     \n\
									float w = gaussianPdf(x, float(sigma));                                                 \n\
									if(horizontal == 1){                                                                         \n\
										result += texture(sampler, vUV + vec2(tex_offset.x * float(i), 0.0)).rgb * w;       \n\
										result += texture(sampler, vUV - vec2(tex_offset.x * float(i), 0.0)).rgb * w;       \n\
									}                                                                                       \n\
									else{                                                                                   \n\
										result += texture(sampler, vUV + vec2(0.0, tex_offset.y * float(i))).rgb * w;   	\n\
										result += texture(sampler, vUV - vec2(0.0, tex_offset.y * float(i))).rgb * w;       \n\
									}                                                                                       \n\
									weightSum += 2.0 * w;                                                                   \n\
								}                                                                                           \n\
																															\n\
								FragColor = vec4(result / weightSum, 1.0);                                                              \n\
							}"
	
	/*var shader_combine = "#version 300 es                                                \n\
						   precision mediump float;                                      \n\
																						 \n\
						   out vec4 FragColor;                                           \n\
						   in vec2 vUV;                                                  \n\
						   															     \n\
						   uniform sampler2D scene;                                      \n\
						   uniform sampler2D bloomBlur;                                  \n\
						   float exposure = 1.0;                                       \n\
						   															     \n\
						   void main()                                                   \n\
						   {                                                             \n\
								const float gamma = 2.2;                                 \n\
								vec3 hdrColor = texture(scene, vUV).rgb;           	     \n\
								vec3 bloomColor = texture(bloomBlur, vUV).rgb;           \n\
								hdrColor += bloomColor; // additive blending             \n\
								// tone mapping                                          \n\
								vec3 result = vec3(1.0) - exp(-hdrColor * exposure);     \n\
								// also gamma correct while we're at it                  \n\
								result = pow(result, vec3(1.0 / gamma));                 \n\
								FragColor = vec4(result, 1.0);                           \n\
						   } " */
	
	shader_combine = "#version 300 es                                                	 \n\
						   precision mediump float;                                      \n\
																						 \n\
						   out vec4 FragColor;                                           \n\
						   in vec2 vUV;                                                  \n\
						   															     \n\
						   uniform sampler2D scene;                                      \n\
						   uniform sampler2D bloomBlur;                                  \n\
						   float exposure = 1.0;                                         \n\
						   															     \n\
						   void main()                                                   \n\
						   {                                                             \n\
								const float gamma = 2.2;                                 \n\
								vec3 hdrColor 	= texture(scene, vUV).rgb;           	 \n\                                                      \n\
								vec3 bloomColor = texture(bloomBlur, vUV).rgb;           \n\
								vec3 result;                                              \n\
								if(hdrColor.r >= 0.99 && hdrColor.g >= 0.99 && hdrColor.b >= 0.99){       \n\
										result = bloomColor;               							   \n\
									}                                                    			   \n\
								else{                                                   			   \n\
										result = hdrColor;												\n\
								} 								                         \n\
								// tone mapping                                          \n\
								FragColor = vec4(bloomColor, 1.0);                       \n\
								FragColor = vec4(hdrColor, 1.0);                       \n\
								FragColor = vec4(result, 1.0);                           \n\
						   } "
	
	//shader_fragment_source_quard = blurShader;
	//shader_fragment_source_quard = kernelEffect;
	//shader_fragment_source_quard = guassBlur;
	
	var _Pmatrix, _Vmatrix, _Mmatrix, _sampler_tex, _uv_tex, _position_tex, _normal_tex;
	var _position_quard, _sampler_quard, _uv_quard, _uwidth, _uheight, _horizontal;
	var _image, _scene, _bloomBlur, _uv_blur, _uv_combine, _sigma;
	var global_teapot;

	var PROJMATRIX, MOVEMATRIX, VIEWMATRIX;			
	var teapot_texture;
	var tex_shader_program , quard_shader_program;
	var bloom_shader_blur, bloom_shader_combine;
	var framebuffer, depthRenderbuffer, texture, blackTexture, depthTexture;
	var texWidth , texHeight;
	var pingpongFBO, pingpongTexture;
	var bloomFBO, bloomInitTex;

	var VERTEX, FACES, NPOINTS, TEXTURE_COORD, NORMALS;
	var VERTEX_QUARD, FACES_QUARD;
	var vertices = [-1.0, -1.0, 0.5, 0.0, 0.0, 
					 1.0, -1.0, 0.5, 1.0, 0.0,
					 1.0,  1.0, 0.5, 1.0, 1.0,
					-1.0,  1.0, 0.5, 0.0, 1.0];
	var indices = [0,1,2,0,2,3];
	
	var get_shader = function(source, type, typeString) {
		var shader = GL.createShader(type);
		GL.shaderSource(shader, source);
		GL.compileShader(shader);
		if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
		  alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
		  return false;
		}
		return shader;
	};

	var get_texture = function(image_URL){
		var image = new Image();
		image.src = image_URL;
		image.webglTexture = false;
		
		image.onload = function(e){
			var tex = GL.createTexture();
			GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
			GL.bindTexture(GL.TEXTURE_2D, tex);
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);
			GL.generateMipmap(GL.TEXTURE_2D);
			GL.bindTexture(GL.TEXTURE_2D, null);
			image.webglTexture = tex;			
		}
		return image;
	}
	
	function initial_texture_shader(){
		var shader_vertex	=	get_shader(shader_vertex_source_tex, GL.VERTEX_SHADER, "VERTEX");
		var shader_fragment	=	get_shader(shader_fragment_source_tex, GL.FRAGMENT_SHADER, "FRAGMENT");
	
		var SHADER_PROGRAM = GL.createProgram();
		GL.attachShader(SHADER_PROGRAM, shader_vertex);
		GL.attachShader(SHADER_PROGRAM, shader_fragment);
	
		GL.linkProgram(SHADER_PROGRAM);
	
		_Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
		_Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
		_Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
		_sampler_tex = GL.getUniformLocation(SHADER_PROGRAM, "sampler");
		
		_uv_tex 		= GL.getAttribLocation(SHADER_PROGRAM, "uv");
		_position_tex 	= GL.getAttribLocation(SHADER_PROGRAM, "position");
		_normal_tex 	= GL.getAttribLocation(SHADER_PROGRAM, "normal");
	
		GL.enableVertexAttribArray(_uv_tex);
		GL.enableVertexAttribArray(_position_tex);
		GL.enableVertexAttribArray(_normal_tex);
		
		return SHADER_PROGRAM; 
	}
		
	function initial_quard_shader(){
		var shader_vertex	=	get_shader(shader_vertex_source_quard, GL.VERTEX_SHADER, "VERTEX");
		var shader_fragment	=	get_shader(shader_fragment_source_quard, GL.FRAGMENT_SHADER, "FRAGMENT");
	
		var SHADER_PROGRAM = GL.createProgram();
		GL.attachShader(SHADER_PROGRAM, shader_vertex);
		GL.attachShader(SHADER_PROGRAM, shader_fragment);
	
		GL.linkProgram(SHADER_PROGRAM);
	
		_sampler_quard 		= GL.getUniformLocation(SHADER_PROGRAM, "sampler");	
		_uwidth 		    = GL.getUniformLocation(SHADER_PROGRAM, "_uwidth");	
		_uheight 			= GL.getUniformLocation(SHADER_PROGRAM, "_uheight");	
		
		_uv_quard 			= GL.getAttribLocation(SHADER_PROGRAM, "uv");
		_position_quard 	= GL.getAttribLocation(SHADER_PROGRAM, "vPosition");
	
		GL.enableVertexAttribArray(_uv_quard);
		GL.enableVertexAttribArray(_position_quard);
		
		//GL.useProgram(SHADER_PROGRAM);
		//GL.uniform1i(_sampler_quard, 0);
		return SHADER_PROGRAM; 		
	}

	function initial_bloom_blur_shader(){
		var shader_vertex	=	get_shader(shader_vertex_source_quard, GL.VERTEX_SHADER, "VERTEX");
		var shader_fragment	=	get_shader(shader_guassBlur, GL.FRAGMENT_SHADER, "FRAGMENT");
		//var shader_fragment	=	get_shader(blurShader, GL.FRAGMENT_SHADER, "FRAGMENT");
	
		var SHADER_PROGRAM = GL.createProgram();
		GL.attachShader(SHADER_PROGRAM, shader_vertex);
		GL.attachShader(SHADER_PROGRAM, shader_fragment);
	
		GL.linkProgram(SHADER_PROGRAM);
			
		_uv_blur 	 = GL.getAttribLocation(SHADER_PROGRAM,  "uv");
		_image       = GL.getUniformLocation(SHADER_PROGRAM, "sampler");
		_horizontal  = GL.getUniformLocation(SHADER_PROGRAM, "horizontal");
		_sigma       = GL.getUniformLocation(SHADER_PROGRAM, "sigma");
	
		GL.enableVertexAttribArray(_uv_blur);
		
		return SHADER_PROGRAM; 		
	}
	
	function initial_bloom_combine_shader(){
		var shader_vertex	=	get_shader(shader_vertex_source_quard, GL.VERTEX_SHADER, "VERTEX");
		var shader_fragment	=	get_shader(shader_combine, GL.FRAGMENT_SHADER, "FRAGMENT");
	
		var SHADER_PROGRAM = GL.createProgram();
		GL.attachShader(SHADER_PROGRAM, shader_vertex);
		GL.attachShader(SHADER_PROGRAM, shader_fragment);
	
		GL.linkProgram(SHADER_PROGRAM);
	
		_scene       = GL.getUniformLocation(SHADER_PROGRAM, "scene");
		_bloomBlur   = GL.getUniformLocation(SHADER_PROGRAM, "bloomBlur");
		
		_uv_combine  = GL.getAttribLocation(SHADER_PROGRAM,  "uv");
	
		GL.enableVertexAttribArray(_uv_combine);
		
		return SHADER_PROGRAM; 		
	}
	
	var initDrawParameter = function(){
		THETA = 0;
		PHI   = 0;
		teapot_texture = get_texture("ressources/teapot_texture.png");
		tex_shader_program   = initial_texture_shader();
		quard_shader_program = initial_quard_shader();
		bloom_shader_blur    = initial_bloom_blur_shader();
		bloom_shader_combine = initial_bloom_combine_shader();
		
		//bloom_
		texWidth = CANVAS.width;
		texHeight = CANVAS.height;
		
		PROJMATRIX	= LIBS.get_projection(60, CANVAS.width/CANVAS.height, 1, 100);
		MOVEMATRIX	= LIBS.get_I4();
		VIEWMATRIX	= LIBS.get_I4();	
		LIBS.translateZ(VIEWMATRIX, -10);
		//LIBS.translateY(VIEWMATRIX, -4);
		
		// load quard object				
		VERTEX_QUARD = GL.createBuffer();
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_QUARD);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_position_quard, 3, GL.FLOAT, false, 5 * 4 ,0) ;	
		GL.vertexAttribPointer(_uv_quard, 2, GL.FLOAT, false, 5 * 4 ,3 * 4) ;
		
		FACES_QUARD = GL.createBuffer();
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES_QUARD);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), GL.STATIC_DRAW);	
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	}
	
	var initFramebuffer = function(){		
		if((maxRenderbufferSize <= texWidth) || (maxRenderbufferSize <= texHeight)){
			// return a appropriate error
		}
		
		// generate framebuffer, renderbuffer and texture object
		framebuffer 		= GL.createFramebuffer();
		depthRenderbuffer 	= GL.createRenderbuffer();
		texture             = GL.createTexture();
		//depthTexture        = GL.createTexture();
		
		// bind texture 
		GL.bindTexture(GL.TEXTURE_2D, texture);
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, texWidth, texHeight, 0, GL.RGB, GL.UNSIGNED_SHORT_5_6_5, null);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
		
		// bind depth texture 
	/*	GL.bindTexture(GL.TEXTURE_2D, depthTexture);
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.DEPTH_COMPONENT, texWidth , texHeight, 0, GL.DEPTH_COMPONENT, GL.UNSIGNED_SHORT, null);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);*/
		
		// bind renderbuffer
		GL.bindRenderbuffer(GL.RENDERBUFFER, depthRenderbuffer);
		GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, texWidth, texHeight);
		
		// bind framebuffer
		GL.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
		
		// specify the color and depth attachment
		GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
		GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, depthRenderbuffer);
		//GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.TEXTURE_2D, depthTexture, 0);
		
		//check framebuffer complete
		var maxRenderbufferSize = GL.getParameter(GL.MAX_RENDERBUFFER_SIZE);
		var status = GL.checkFramebufferStatus(GL.FRAMEBUFFER);
		if(status != GL.FRAMEBUFFER_COMPLETE){
			console.log("ERROR::FRAMEBUFFER:: Framebuffer is not complete!");
		}		
		GL.bindFramebuffer(GL.FRAMEBUFFER, null);		
	} 
	
	var initBloomFBO = function(){
			bloomFBO 			= GL.createFramebuffer();
			bloomInitTex   		= GL.createTexture();
			depthRenderbuffer   = GL.createRenderbuffer();
			blackTexture        = GL.createTexture();
			
			GL.bindFramebuffer(GL.FRAMEBUFFER, bloomFBO);
			
			GL.bindTexture(GL.TEXTURE_2D, bloomInitTex);			
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, texWidth, texHeight, 0, GL.RGB, GL.UNSIGNED_SHORT_5_6_5, null);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

			// bind texture where all of scene object are drawn in black.
			GL.bindTexture(GL.TEXTURE_2D, blackTexture);
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, texWidth, texHeight, 0, GL.RGB, GL.UNSIGNED_SHORT_5_6_5, null);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
			
			// bind renderbuffer
			GL.bindRenderbuffer(GL.RENDERBUFFER, depthRenderbuffer);
			GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, texWidth, texHeight);
			
			GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, bloomInitTex, 0);
			GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT1, GL.TEXTURE_2D, blackTexture, 0);			
			GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, depthRenderbuffer);			
	}
	
	var initPingpongFBO = function(){
		pingpongFBO     = new Array(2);
		pingpongTexture = new Array(2);
		for(let i = 0 ; i < 2; ++i){
			pingpongFBO[i] 			= GL.createFramebuffer();
			pingpongTexture[i]   	= GL.createTexture();
			
			GL.bindFramebuffer(GL.FRAMEBUFFER, pingpongFBO[i]);
			GL.bindTexture(GL.TEXTURE_2D, pingpongTexture[i]);
			
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGB, texWidth, texHeight, 0, GL.RGB, GL.UNSIGNED_SHORT_5_6_5, null);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
			
			GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, pingpongTexture[i], 0);			
		}
	}
	
	var animateForBloom = function(){
		GL.bindFramebuffer(GL.FRAMEBUFFER, bloomFBO);
		GL.drawBuffers([GL.COLOR_ATTACHMENT0, GL.COLOR_ATTACHMENT1]);
		GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);	
		var intHorizaontal = 0, sigma = 5, firstIteration = true;
		var iterCount = 5;	
		
		// render Teapot
		GL.enable(GL.DEPTH_TEST);
		GL.depthFunc(GL.LEQUAL);
		GL.clearColor(1.0, 1.0, 1.0, 1.0);
		GL.clearDepth(1.0);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		
		THETA += 0.01;
		//PHI   += 0.01;
		LIBS.set_I4(MOVEMATRIX);
		LIBS.rotateY(MOVEMATRIX, THETA);
		LIBS.rotateX(MOVEMATRIX, PHI);
		GL.useProgram(tex_shader_program);
		
		GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
		GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
		GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
		GL.uniform1i(_sampler_tex, 0);
	
		if (teapot_texture.webglTexture) {	
			GL.activeTexture(GL.TEXTURE0);	
			GL.bindTexture(GL.TEXTURE_2D, teapot_texture.webglTexture);
		}
		
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX);
		GL.vertexAttribPointer(_position_tex, 3, GL.FLOAT, false,0,0) ;
	
		// texture coordinates
		GL.bindBuffer(GL.ARRAY_BUFFER, TEXTURE_COORD);
		GL.vertexAttribPointer(_uv_tex, 2, GL.FLOAT, false, 0, 0) ;
	
		// normals coordinates
		GL.bindBuffer(GL.ARRAY_BUFFER, NORMALS);
		GL.vertexAttribPointer(_normal_tex, 3, GL.FLOAT, false, 0, 0) ;
		
		//faces 
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);	
		NPOINTS = global_teapot.indices.length;	
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);
		GL.drawElements(GL.TRIANGLES, NPOINTS, GL.UNSIGNED_INT, 0);	
				
		GL.useProgram(bloom_shader_blur);
		GL.activeTexture(GL.TEXTURE1);
		for(let i = 0; i < iterCount; ++i){
			var tempSigma = sigma + i * 2;
			GL.bindFramebuffer(GL.FRAMEBUFFER, pingpongFBO[intHorizaontal]);
			
			GL.uniform1i(_horizontal, intHorizaontal);
			GL.uniform1i(_image, 1);
			GL.uniform1i(_sigma,tempSigma);
			
			intHorizaontal = (intHorizaontal + 1) % 2;			
			GL.bindTexture(GL.TEXTURE_2D, firstIteration ?  blackTexture : pingpongTexture[intHorizaontal]);
			
			// render quard
			GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_QUARD);
			GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
			GL.vertexAttribPointer(_position_quard, 3, GL.FLOAT, false,5 * 4 ,0) ;	
			GL.vertexAttribPointer(_uv_quard, 2, GL.FLOAT, false, 5 * 4 ,3 * 4) ;
			
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES_QUARD);
			GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_INT, 0);
			
			if(firstIteration){
				firstIteration = false;
			}			
		}
				
		// render quard
		GL.bindFramebuffer(GL.FRAMEBUFFER, null);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		
		GL.useProgram(bloom_shader_combine);	
		GL.uniform1i(_scene, 0);
		GL.uniform1i(_bloomBlur, 1);
				
		//GL.useProgram(quard_shader_program);	
		//GL.uniform1i(_sampler_quard, 1);
		
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_QUARD);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_position_quard, 3, GL.FLOAT, false,5 * 4 ,0) ;	
		GL.vertexAttribPointer(_uv_combine, 2, GL.FLOAT, false, 5 * 4 ,3 * 4) ;
		//GL.vertexAttribPointer(_uv_quard, 2, GL.FLOAT, false, 5 * 4 ,3 * 4) ;
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES_QUARD);

		//GL.activeTexture(GL.TEXTURE1);
		//GL.bindTexture(GL.TEXTURE_2D,  pingpongTexture[0]);
		
		GL.activeTexture(GL.TEXTURE0);
		GL.bindTexture(GL.TEXTURE_2D, bloomInitTex);
		GL.activeTexture(GL.TEXTURE1);
		GL.bindTexture(GL.TEXTURE_2D,  pingpongTexture[0]);
		
		GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_INT, 0);
	
		GL.flush();	
		window.requestAnimationFrame(animateForBloom);		
	}
	
	var animate = function(){

		GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);	
		GL.clearColor(1.0, 1.0, 1.0, 1.0);
		GL.clearDepth(1.0);
		
		GL.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
		// render to texture using FBO
		GL.enable(GL.DEPTH_TEST);
		GL.depthFunc(GL.LEQUAL);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		
		////////////// draw teapot as texture attach to quard in main scene /////////////////
		THETA += 0.01;
		//PHI   += 0.01;
		LIBS.set_I4(MOVEMATRIX);
		//LIBS.scale(MOVEMATRIX, 1.2);
		LIBS.rotateY(MOVEMATRIX, THETA);
		LIBS.rotateX(MOVEMATRIX, PHI);
		GL.useProgram(tex_shader_program);
		
		GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
		GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
		GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
		GL.uniform1i(_sampler_tex, 0);
		GL.uniform1f(_uheight, CANVAS.height);
		GL.uniform1f(_uwidth,  CANVAS.width);

		if (teapot_texture.webglTexture) {	
			GL.activeTexture(GL.TEXTURE0);	
			GL.bindTexture(GL.TEXTURE_2D, teapot_texture.webglTexture);
		}
		
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX);
		GL.vertexAttribPointer(_position_tex, 3, GL.FLOAT, false,0,0) ;

		// texture coordinates
		GL.bindBuffer(GL.ARRAY_BUFFER, TEXTURE_COORD);
		GL.vertexAttribPointer(_uv_tex, 2, GL.FLOAT, false, 0, 0) ;

		// normals coordinates
		GL.bindBuffer(GL.ARRAY_BUFFER, NORMALS);
		GL.vertexAttribPointer(_normal_tex, 3, GL.FLOAT, false, 0, 0) ;
		
		//faces 
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);	
		NPOINTS = global_teapot.indices.length;	
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);
		GL.drawElements(GL.TRIANGLES, NPOINTS, GL.UNSIGNED_INT, 0);			
		
		/////////////////////// switch buffer to render main scene /////////////////////
		GL.bindFramebuffer(GL.FRAMEBUFFER, null);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		
		GL.useProgram(quard_shader_program);
		GL.activeTexture(GL.TEXTURE1);
		GL.uniform1i(_sampler_quard, 1);
		GL.bindTexture(GL.TEXTURE_2D, texture);
		//GL.bindTexture(GL.TEXTURE_2D, depthTexture);		
		
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_QUARD);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_position_quard, 3, GL.FLOAT, false,5 * 4 ,0) ;	
		GL.vertexAttribPointer(_uv_quard, 2, GL.FLOAT, false, 5 * 4 ,3 * 4) ;
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES_QUARD);
		GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_INT, 0);
		
		GL.flush();	
		window.requestAnimationFrame(animate);
	}
		
	LIBS.get_json("ressources/teapot.json", function(teapot){
		//vertices
		global_teapot = teapot;
		VERTEX = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(teapot.vertexPositions), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_position_tex, 3, GL.FLOAT, false,0,0) ;

		// texture coordinates
		TEXTURE_COORD = GL.createBuffer();
		GL.bindBuffer(GL.ARRAY_BUFFER, TEXTURE_COORD);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(teapot.vertexTextureCoords), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_uv_tex, 2, GL.FLOAT, false, 0, 0) ;

		// normals coordinates
		NORMALS = GL.createBuffer();
		GL.bindBuffer(GL.ARRAY_BUFFER, NORMALS);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(teapot.vertexNormals), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_normal_tex, 3, GL.FLOAT, false, 0, 0) ;
		
		//faces 
		FACES = GL.createBuffer ();
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint32Array(teapot.indices), GL.STATIC_DRAW);	
		NPOINTS = teapot.indices.length;
	
		//initDrawParameter();
		//initFramebuffer();
		//animate();
		
		initDrawParameter();
		initBloomFBO();
		initPingpongFBO();
		animateForBloom();
    });
	
	//clean
	GL.deleteRenderbuffer(depthRenderbuffer);
	GL.deleteFramebuffer(framebuffer);
	GL.deleteTexture(texture);
}

	 	  