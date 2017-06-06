var main = function(){
	var CANVAS = document.getElementById("your_canvas");
	  CANVAS.width  = window.innerWidth;
	  CANVAS.height = window.innerHeight;	

	var GL;
	try{
		GL = CANVAS.getContext("experimental-webgl", {antialias:true, stencil: true});
		var EXT = GL.getExtension("OES_element_index_uint") ||
		  GL.getExtension("MOZ_OES_element_index_uint") ||
			GL.getExtension("WEBKIT_OES_element_index_uint");	
		} catch (e) {
			alert("You are not webgl compatible :(") ;
			return false;
		}
		
	var shader_vertex_source_tex = "\n\
		attribute vec3 position;\n\
		attribute vec2 uv;\n\
		attribute vec3 normal;\n\
		uniform mat4 Pmatrix;\n\
		uniform mat4 Vmatrix;\n\
		uniform mat4 Mmatrix;\n\
		varying vec2 vUV;\n\
		varying vec3 vNormal;\n\
		varying vec3 vView;\n\
		\n\
		void main(void) {\n\
		gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
		vNormal=vec3(Mmatrix*vec4(normal, 0.));\n\
		vView=vec3(Vmatrix*Mmatrix*vec4(position, 1.));\n\
		vUV = uv;\n\
		}";

	 var shader_fragment_source_tex = "\n\
		precision mediump float;\n\
		uniform sampler2D sampler;\n\
		varying vec2 vUV;\n\
		varying vec3 vNormal;\n\
		varying vec3 vView;\n\
		const vec3 source_ambient_color=vec3(1.,1.,1.);\n\
		const vec3 source_diffuse_color=vec3(1.,1.,1.);\n\
		const vec3 source_specular_color=vec3(1.,1.,1.);\n\
		const vec3 source_direction=vec3(0.,0.,1.);\n\
		\n\
		const vec3 mat_ambient_color=vec3(0.3,0.3,0.3);\n\
		const vec3 mat_diffuse_color=vec3(1.,1.,1.);\n\
		const vec3 mat_specular_color=vec3(1.,1.,1.);\n\
		const float mat_shininess=10.;\n\
		\n\
		\n\
		\n\
		void main(void) {\n\
		vec3 color=vec3(texture2D(sampler, vUV));\n\
		vec3 I_ambient=source_ambient_color*mat_ambient_color;\n\
		vec3 I_diffuse=source_diffuse_color*mat_diffuse_color*max(0., dot(vNormal, source_direction));\n\
		vec3 V=normalize(vView);\n\
		vec3 R=reflect(source_direction, vNormal);\n\
		\n\
		\n\
		vec3 I_specular=source_specular_color*mat_specular_color*pow(max(dot(R,V),0.), mat_shininess);\n\
		vec3 I=I_ambient+I_diffuse+I_specular;\n\
		gl_FragColor = vec4(I*color, 1.);\n\
		}";

	var shader_vertex_source_quard = "\n\
		attribute vec4 vPosition; \n\
		attribute vec2 uv; \n\
		varying vec2 vUV;  \n\
						   \n\
		void main(void) {  \n\
			gl_Position = vPosition; \n\
			vUV = uv; \n\
		}";
		
	var shader_fragment_source_quard = "  \n\
		precision mediump float;          \n\
		varying vec2 vUV;                 \n\
		uniform sampler2D sampler;        \n\
		void main(void) {\n\
			vec3 color   = vec3(texture2D(sampler, vUV));\n\
			gl_FragColor = vec4(color, 1.0);\n\
		}";
	
	var _Pmatrix, _Vmatrix, _Mmatrix, _sampler_tex, _uv_tex, _position_tex, _normal_tex;
	var _position_quard, _sampler_quard, _uv_quard;
	
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
		
		//GL.useProgram(SHADER_PROGRAM);
		//GL.uniform1i(_sampler_tex, 0);
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
		_uv_quard 		= GL.getAttribLocation(SHADER_PROGRAM, "uv");
		_position_quard 	= GL.getAttribLocation(SHADER_PROGRAM, "vPosition");
	
		GL.enableVertexAttribArray(_uv_quard);
		GL.enableVertexAttribArray(_position_quard);
		
		//GL.useProgram(SHADER_PROGRAM);
		//GL.uniform1i(_sampler_quard, 0);
		return SHADER_PROGRAM; 		
	}
			
    // load quard object
	var VERTEX, FACES, NPOINTS, TEXTURE_COORD, NORMALS;
	var VERTEX_QUARD, FACES_QUARD;
	var vertices = [-1.0, -1.0, 0.5, 0.0, 0.0, 
					 1.0, -1.0, 0.5, 1.0, 0.0,
					 1.0,  1.0, 0.5, 1.0, 1.0,
					-1.0,  1.0, 0.5, 0.0, 1.0];
	var indices = [0,1,2,0,2,3];				
	VERTEX_QUARD = GL.createBuffer();
	GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_QUARD);
	GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
	GL.vertexAttribPointer(_position_quard, 3, GL.FLOAT, false,5 * 4 ,0) ;	
	GL.vertexAttribPointer(_uv_quard, 2, GL.FLOAT, false, 5 * 4 ,3 * 4) ;
	
	FACES_QUARD = GL.createBuffer();
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES_QUARD);
	GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Float32Array(indices), GL.STATIC_DRAW);	
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	
	// load matrix
	var PROJMATRIX	= LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1, 100);
	var MOVEMATRIX	= LIBS.get_I4();
	var VIEWMATRIX	= LIBS.get_I4();	
	LIBS.translateZ(VIEWMATRIX, -50);
	LIBS.translateY(VIEWMATRIX, -4);	
	
	var get_texture = function(image_URL){
		var image = new Image();
		image.src = image_URL;
		image.webglTexture = false;
		
		image.onload = function(e){
			var texture = GL.createTexture();
			GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
			GL.bindTexture(GL.TEXTURE_2D, texture);
			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);
			GL.generateMipmap(GL.TEXTURE_2D);
			GL.bindTexture(GL.TEXTURE_2D, null);
			image.webglTexture = texture;			
		}
		return image;
	}
	
	var teapot_texture = get_texture("ressources/teapot_texture.png");
	THETA = 0;
	PHI   = 0;
	var tex_shader_program   = initial_texture_shader();
	var quard_shader_program = initial_quard_shader();

	var framebuffer, depthRenderbuffer, texture;
	var texWidth = CANVAS.width, texHeight = CANVAS.height;
	var maxRenderbufferSize = GL.getParameter(GL.MAX_RENDERBUFFER_SIZE);
	
	var animate = function(){
		var SHADER_PROGRAM_FRAMEBUFFER, SHADER_PROGRAM_MAIN; 
		//check for framebuffer complete
		GL.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
		status = GL.checkFramebufferStatus(GL.FRAMEBUFFER);
		if(status == GL.FRAMEBUFFER_COMPLETE)
		{
			// render to texture using FBO
			GL.enable(GL.DEPTH_TEST);
			GL.depthFunc(GL.LEQUAL);
			GL.clearDepth(1.0);
			//GL.clearColor(0.0f, 0.0f, 0.0f, 1.0f);
			GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
			
			// draw teapot
			THETA += 0.01;
			PHI   += 0.01;
			LIBS.set_I4(MOVEMATRIX);
			LIBS.rotateY(MOVEMATRIX, THETA);
			LIBS.rotateX(MOVEMATRIX, PHI);

			GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
			GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);	

			GL.useProgram(tex_shader_program);
			
			GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
			GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
			GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
			GL.uniform1i(_sampler_tex, 0);

			if (teapot_texture.webglTexture) {	
				GL.activeTexture(GL.TEXTURE0);	
				GL.bindTexture(GL.TEXTURE_2D, teapot_texture.webglTexture);
			}
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);
			GL.drawElements(GL.TRIANGLES, NPOINTS, GL.UNSIGNED_INT, 0);	
			
			//switch buffer to render main scene
			GL.useProgram(quard_shader_program);
			GL.uniform1i(_sampler_quard, 0);
			GL.bindFramebuffer(GL.FRAMEBUFFER, null);
				
			GL.enable(GL.DEPTH_TEST);
			GL.depthFunc(GL.LEQUAL);
			GL.clearDepth(1.0);
			/*GL.clearColor(0.0, 0.0, 0.0, 0.0);*/
			
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES_QUARD);
			GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_INT, 0);
		}
			
		GL.flush();
		window.requestAnimationFrame(animate);
	}
	
	var initFramebuffer = function(){		
		if((maxRenderbufferSize <= texWidth) || (maxRenderbufferSize <= texHeight)){
			// return a appropriate error
		}
		
		// generate framebuffer, renderbuffer and texture object
		framebuffer 		= GL.createFramebuffer();
		depthRenderbuffer 	= GL.createRenderbuffer();
		texture             = GL.createTexture();
		
		// bind texture 
		GL.bindTexture(GL_TEXTURE_2D, texture);
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, texWidth, texHeight, 0, GL.RGBA, GL.UNSIGNED_SHORT_5_6_5, null);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
		
		// bind renderbuffer
		GL.bindRenderbuffer(GL.RENDERBUFFER, depthRenderbuffer);
		GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, texWidth, texHeight);
		
		// bind framebuffer
		GL.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
		
		// specify the color and depth attachment
		GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
		GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, depthRenderbuffer);		
	} 
	
	LIBS.get_json("ressources/teapot.json", function(teapot){
		//vertices
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
	
		initFramebuffer();
		animate();
    });
				
	//clean
	GL.deleteRenderbuffer(depthRenderbuffer);
	GL.deleteFramebuffer(framebuffer);
	GL.deleteTexture(texture);
}

	 	  