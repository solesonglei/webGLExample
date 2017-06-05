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
		
	var shader_vertex_source = "\n\
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

	 var shader_fragment_source = "\n\
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
	
	var shader_vertex	=	get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	var shader_fragment	=	get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	var SHADER_PROGRAM = GL.createProgram();
	GL.attachShader(SHADER_PROGRAM, shader_vertex);
	GL.attachShader(SHADER_PROGRAM, shader_fragment);

	GL.linkProgram(SHADER_PROGRAM);

	var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
	var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
	var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
	var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "sampler");
	
	var _uv 		= GL.getAttribLocation(SHADER_PROGRAM, "uv");
	var _position 	= GL.getAttribLocation(SHADER_PROGRAM, "position");
	var _normal 	= GL.getAttribLocation(SHADER_PROGRAM, "normal");

	GL.enableVertexAttribArray(_uv);
	GL.enableVertexAttribArray(_position);
	GL.enableVertexAttribArray(_normal);
	
	GL.useProgram(SHADER_PROGRAM);
	GL.uniform1i(_sampler, 0);
		
    //load teapot object
	var VERTEX, FACES, NPOINTS, TEXTURE_COORD, NORMALS;
	LIBS.get_json("ressources/teapot.json", function(teapot){
		//vertices
		VERTEX = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(teapot.vertexPositions), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_position, 3, GL.FLOAT, false,0,0) ;

		// texture coordinates
		TEXTURE_COORD = GL.createBuffer();
		GL.bindBuffer(GL.ARRAY_BUFFER, TEXTURE_COORD);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(teapot.vertexTextureCoords), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 0, 0) ;

		// normals coordinates
		NORMALS = GL.createBuffer();
		GL.bindBuffer(GL.ARRAY_BUFFER, NORMALS);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(teapot.vertexNormals), GL.STATIC_DRAW);
		GL.vertexAttribPointer(_normal, 3, GL.FLOAT, false, 0, 0) ;
		
		//faces 
		FACES = GL.createBuffer ();
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint32Array(teapot.indices), GL.STATIC_DRAW);	
		NPOINTS = teapot.indices.length;
	
		animate();
    });
	
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
			image.webglTexture=texture;			
		}
		return image;
	}
	
	var teapot_texture = get_texture("ressources/teapot_texture.png");
	
	//DRAWING
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL);
	GL.clearColor(0.0, 0.0, 0.0, 0.0);
	GL.clearDepth(1.0);
	THETA = 0;
	PHI   = 0;
	
	var animate = function(){
		THETA += 0.01;
		PHI   += 0.01;
		LIBS.set_I4(MOVEMATRIX);
		LIBS.rotateY(MOVEMATRIX, THETA);
		LIBS.rotateX(MOVEMATRIX, PHI);

		GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
		GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
		GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

		if (teapot_texture.webglTexture) {	
			GL.activeTexture(GL.TEXTURE0);	
			GL.bindTexture(GL.TEXTURE_2D, teapot_texture.webglTexture);
		}
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FACES);
		GL.drawElements(GL.TRIANGLES, NPOINTS, GL.UNSIGNED_INT, 0);		
		
		GL.flush();
		window.requestAnimationFrame(animate);
	}
}

	  
	  
	   
	  
	  