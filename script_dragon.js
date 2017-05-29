
var main=function() {
  var CANVAS=document.getElementById("your_canvas");
  CANVAS.width=window.innerWidth;
  CANVAS.height=window.innerHeight;

  /*========================= CAPTURE MOUSE EVENTS ========================= */

  var AMORTIZATION=0.95;
  var drag=false;
  var old_x, old_y;
  var dX=0, dY=0;

  var mouseDown=function(e) {
    drag=true;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
    return false;
  };

  var mouseUp=function(e){
    drag=false;
  };

  var mouseMove=function(e) {
    if (!drag) return false;
    dX=(e.pageX-old_x)*Math.PI/CANVAS.width,
      dY=(e.pageY-old_y)*Math.PI/CANVAS.height;
    THETA+=dX;
    PHI+=dY;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
  };

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  /*========================= GET WEBGL CONTEXT ========================= */
  var GL;
  try {
    GL = CANVAS.getContext("experimental-webgl", {antialias: true});
    var EXT = GL.getExtension("OES_element_index_uint") ||
      GL.getExtension("MOZ_OES_element_index_uint") ||
        GL.getExtension("WEBKIT_OES_element_index_uint");
  } catch (e) {
    alert("You are not webgl compatible :(") ;
    return false;
  }

  /*========================= SHADERS ========================= */
  /*jshint multistr: true */

  var shader_vertex_source="\n\
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

  var shader_fragment_source="\n\
precision mediump float;\n\
uniform sampler2D sampler;\n\
varying vec2 vUV;\n\
varying vec3 vNormal;\n\
varying vec3 vView;\n\
const vec3 source_ambient_color=vec3(1.,1.,1.);\n\
const vec3 source_diffuse_color=vec3(1.,2.,4.);\n\
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

  var get_shader=function(source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
      return false;
    }
    return shader;
  };

  var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

  var SHADER_PROGRAM=GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);

  GL.linkProgram(SHADER_PROGRAM);

  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
  var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "sampler");

  var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  var _normal = GL.getAttribLocation(SHADER_PROGRAM, "normal");

  GL.enableVertexAttribArray(_uv);
  GL.enableVertexAttribArray(_position);
  GL.enableVertexAttribArray(_normal);

  GL.useProgram(SHADER_PROGRAM);
  GL.uniform1i(_sampler, 0);


  /*========================= THE DRAGON ========================= */

  var CUBE_VERTEX=false, CUBE_FACES=false, CUBE_NPOINTS=0;

  LIBS.get_json("ressources/dragon.json", function(dragon){
    //vertices
    CUBE_VERTEX = GL.createBuffer ();
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER,
                  new Float32Array(dragon.vertices),
      GL.STATIC_DRAW);

    //faces
    CUBE_FACES = GL.createBuffer ();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                  new Uint32Array(dragon.indices),
      GL.STATIC_DRAW);

    CUBE_NPOINTS=dragon.indices.length;

    animate(0);

  });


  /*========================= MATRIX ========================= */

  var PROJMATRIX=LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1, 100);
  var MOVEMATRIX=LIBS.get_I4();
  var VIEWMATRIX=LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -20);
  LIBS.translateY(VIEWMATRIX, -4);
  var THETA	=	0,
      PHI	=	0;

  /*========================= TEXTURES ========================= */
  var get_texture=function(image_URL){

    var image=new Image();

    image.src=image_URL;
    image.webglTexture=false;

    image.onload=function(e) {
      var texture	=	GL.createTexture();
      GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
      GL.bindTexture(GL.TEXTURE_2D, texture);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);
      GL.generateMipmap(GL.TEXTURE_2D);
      GL.bindTexture(GL.TEXTURE_2D, null);
      image.webglTexture=texture;
    };

    return image;
  };

  var cube_texture=get_texture("ressources/dragon.png");

  /*========================= DRAWING ========================= */
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.0, 0.0, 0.0, 0.0);
  GL.clearDepth(1.0);

  var time_old=0;
  var animate = function(time) {
    var dt = time - time_old;
    if (!drag) {
      dX*=AMORTIZATION, dY*=AMORTIZATION;
      THETA+=dX, PHI+=dY;
    }
    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);
    time_old=time;

    GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
    if (cube_texture.webglTexture) {

      GL.activeTexture(GL.TEXTURE0);

      GL.bindTexture(GL.TEXTURE_2D, cube_texture.webglTexture);
    }

    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false,4*(3+3+2),0) ;
    GL.vertexAttribPointer(_normal, 3, GL.FLOAT, false,4*(3+3+2),3*4) ;
    GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false,4*(3+3+2),(3+3)*4) ;

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.drawElements(GL.TRIANGLES, CUBE_NPOINTS, GL.UNSIGNED_INT, 0);

    GL.flush();
    window.requestAnimationFrame(animate);
  };
};