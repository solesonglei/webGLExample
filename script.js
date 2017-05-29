var main = function(){
	var CANVAS = document.getElementById("your_canvas");
	  CANVAS.width  = window.innerWidth;
	  CANVAS.height = window.innerHeight;	

	var GL;
	try{
<<<<<<< HEAD
		GL = CANVAS.getContext("experimental-webgl", {antialias:true});
=======
		GL = CANVAS.getContext("experimental-webgl", {antialias:true, stencil: true});
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
		var EXT = GL.getExtension("OES_element_index_uint") ||
		  GL.getExtension("MOZ_OES_element_index_uint") ||
			GL.getExtension("WEBKIT_OES_element_index_uint");	
		} catch (e) {
			alert("You are not webgl compatible :(") ;
			return false;
		}
		
	var shader_vertex_source = "\n\
			attribute vec3 position; 		\n\
			uniform vec4 color;  			\n\
											\n\
			varying vec4 vColor;				\n\
											\n\
			void main(void) {   			\n\
				gl_Position = vec4(position, 1.); //0. is the z, and 1 is w			\n\
				vColor = vec4(1.0, 0.0, 0.0, 1.0);									\n\
				vColor = color;									\n\
			}";


  var shader_fragment_source = "\n\
		precision mediump float;			\n\
		varying vec4 vColor;				\n\
											\n\
		void main(void) {					\n\
		gl_FragColor = vColor;				\n\
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
	
	  var shader_vertex		=	get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	  var shader_fragment	=	get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	  var SHADER_PROGRAM = GL.createProgram();
	  GL.attachShader(SHADER_PROGRAM, shader_vertex);
	  GL.attachShader(SHADER_PROGRAM, shader_fragment);

	  GL.linkProgram(SHADER_PROGRAM);
	  
	  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
      var _color    = GL.getUniformLocation(SHADER_PROGRAM, "color"); 
	  GL.enableVertexAttribArray(_position);	
		  
	 var vVertices = [
		-0.75, 0.25, 0.50, 	// Quad #0
		-0.25, 0.25, 0.50,
		-0.25, 0.75, 0.50,
		-0.75, 0.75, 0.50,
		 0.25, 0.25, 0.90,	// Quad #1
		 0.75, 0.25, 0.90, 
		 0.75, 0.75, 0.90,
		 0.25, 0.75, 0.90,
		-0.75, -0.75, 0.50, // Quad #2
		-0.25, -0.75, 0.50,
		-0.25, -0.25, 0.50,
		-0.75, -0.25, 0.50,
		 0.25, -0.75, 0.50, // Quad #3
		 0.75, -0.75, 0.50,
		 0.75, -0.25, 0.50,
<<<<<<< HEAD
		 0.25, -0.25, 0.50,
		-1.00, -1.00, 0.00, // Quad #4
		 1.00, -1.00, 0.00,
		 1.00,  1.00, 0.00,
		-1.00,  1.00, 0.00
=======
		 0.25, -0.25, 0.50,	 
		-1.00, -1.00, 0.50, // Quad #4
		 1.00, -1.00, 0.50,
		 1.00,  1.00, 0.50,
		-1.00,  1.00, 0.50
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
	 ]; 
	 
	 const numTests = 4;
	 
	 var indices = [
		[0, 1, 2, 0, 2, 3],
		[4, 5, 6, 4, 6, 7],
		[8, 9, 10, 8, 10, 11],
		[12, 13, 14, 12, 14, 15],
<<<<<<< HEAD
		[16,17,18,16, 18, 19]
=======
		[16,17,18,16, 18, 19],
		[20,21,22,20, 22, 23]
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
	 ]
	 
	 var colors = [
		[1.0, 0.0, 0.0, 1.0],
		[0.0, 1.0, 0.0, 1.0],
		[0.0, 0.0, 1.0, 1.0],
		[1.0, 1.0, 0.0, 0.0]
	 ];
	 
<<<<<<< HEAD
=======
	 GL.enable(GL.STENCIL_TEST);
	 //GL.enable(GL.DEPTH_TEST);
	 
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
	 VERTEX_DATA = GL.createBuffer();
	 GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_DATA);
	 GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vVertices), GL.STATIC_DRAW);
	 GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0); 
	 
	 var INDEX_DATA_0 = GL.createBuffer();
	 var INDEX_DATA_1 = GL.createBuffer();
	 var INDEX_DATA_2 = GL.createBuffer();
	 var INDEX_DATA_3 = GL.createBuffer();
	 var INDEX_DATA_4 = GL.createBuffer();
	 
	 var numStencilBits;
<<<<<<< HEAD
	 var stencilValues = [0x7, 0x0, 0x2, 0xff];
=======
	 var stencilValues = [0x7, 0x2, 0x2, 0xff];
	 //stencilValues = [0xff, 0xff, 0xff, 0xff];
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
	 GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);	 
	 GL.useProgram(SHADER_PROGRAM);// all of the object in the scene are shared one shader program.
	 
	 var animate = function(){
<<<<<<< HEAD
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT);			 
		 // Test 0
		 GL.stencilFunc(GL.LESS, 0x3, 0x7);
		 GL.stencilOp(GL.REPLACE, GL.DECR, GL.DECR);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_0);		 		 
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[0]), GL.STATIC_DRAW);
		 //GL.uniform4fv(_color, colors[0]);	
		 GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
		 
		 // Test 1
		 GL.stencilFunc(GL.GREATER, 0x3, 0x3);
		 GL.stencilOp(GL.KEEP, GL.DECR, GL.KEEP);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_1);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[1]), GL.STATIC_DRAW);
			GL.uniform4fv(_color, colors[1]);			 
=======
		 GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT);
		 GL.stencilMask(0xff);	
		 GL.colorMask(0, 0, 0, 0);	

		 //assign stencil buffer to 0xff
		 GL.stencilFunc(GL.ALWAYS, 0x1, 0xff);
		 GL.stencilOp(GL.KEEP, GL.KEEP, GL.REPLACE);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_4);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[4]), GL.STATIC_DRAW);
		 GL.drawElements(GL.TRIANGLES, 6,  GL.UNSIGNED_SHORT, 0);	
		 
		 // Test 0
		 GL.stencilFunc(GL.LESS, 0x7, 0x3); //  0x7
		 GL.stencilOp(GL.REPLACE, GL.DECR, GL.DECR);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_0);		 		 
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[0]), GL.STATIC_DRAW);
		 GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
		 
		 // Test 1
		 GL.stencilFunc(GL.GREATER, 0x3, 0x3); //0x3
		 GL.stencilOp(GL.KEEP, GL.DECR, GL.KEEP);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_1);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[1]), GL.STATIC_DRAW);		 
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
		 GL.drawElements(GL.TRIANGLES, 6,  GL.UNSIGNED_SHORT, 0);	
		 
		 // Test 2
		 GL.stencilFunc(GL.EQUAL, 0x1, 0x3);
<<<<<<< HEAD
		 GL.stencilOp(GL.KEEP, GL.INCR, GL.INCR);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_2);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[2]), GL.STATIC_DRAW);
		// GL.uniform4fv(_color, colors[2]);			 
=======
		 GL.stencilOp(GL.KEEP, GL.INCR, GL.INCR);// 0x4
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_2);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[2]), GL.STATIC_DRAW);		 
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
		 GL.drawElements(GL.TRIANGLES, 6,  GL.UNSIGNED_SHORT, 0);	

		 // Test 3
		 GL.stencilFunc(GL.EQUAL, 0x2, 0x1);
<<<<<<< HEAD
		 GL.stencilOp(GL.INVERT, GL.KEEP, GL.KEEP);
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_3);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[3]), GL.STATIC_DRAW);	
		 //GL.uniform4fv(_color, colors[3]);			 
		 GL.drawElements(GL.TRIANGLES, 6,  GL.UNSIGNED_SHORT, 0);
		 
		 numStencilBits = GL.getParameter( GL.STENCIL_BITS);
		 stencilValues[3] = ~(((1 << numStencilBits) - 1) & 0x1) & 0xff;
		 GL.stencilMask(0x0);
		 
		for(let i = 0; i < numTests; ++i){
			GL.stencilFunc(GL.EQUAL, stencilValues[i], 0xff);
			//GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_4);
		    //GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[4]), GL.STATIC_DRAW);
=======
		 GL.stencilOp(GL.INVERT, GL.KEEP, GL.KEEP);// 0x1
		 GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_3);
		 GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[3]), GL.STATIC_DRAW);			 
		 GL.drawElements(GL.TRIANGLES, 6,  GL.UNSIGNED_SHORT, 0);	 
		 
		 numStencilBits = GL.getParameter( GL.STENCIL_BITS);
		 
		// console.log(numStencilBits);
		 
		 stencilValues[3] = ~(((1 << numStencilBits) - 1) & 0x1) & 0xff;
		 GL.stencilMask(0x0);
		 GL.colorMask(1, 1, 1, 1);
		 		 		 
		for(let i = 0; i < numTests; ++i){
			GL.stencilFunc(GL.EQUAL, stencilValues[i], 0xff);
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, INDEX_DATA_4);
		    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices[4]), GL.STATIC_DRAW);
>>>>>>> ec54c228ade154529bb0b310429176111ef17cf9
			
			GL.uniform4fv(_color, colors[i]);			
			GL.drawElements(GL.TRIANGLES, 6,  GL.UNSIGNED_SHORT, 0);	
		 }		

		GL.flush();

		window.requestAnimationFrame(animate);		 
	 }
	animate();
	 
}

	  
	  
	   
	  
	  