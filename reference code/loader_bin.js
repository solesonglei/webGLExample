		/* coordinates systerm of three.js
				| Y                
				|                    
				|                  
				|
				/----------->  X  
			   /
			  /  
		     /  Z
		*/
		
		/* coordinates systerm of plan file
				| Z                
				|                    
				|                  
				|
				/----------->Y    
			   /
			  /  
		     /  X
		*/
		
		/// constants
		var PER_IPR_INFO_SIZE = 5;
		var IPR_BAND_R        = 10;
		
		/// Global variables.
			var container;
			var camera, scene, renderer, canvas2d, canvas2d_IPR;
			
			var camera_orth, camera_pers;
			var trackballControls_orth, trackballControls_pers;

			var clock, trackballControls, directionalLight;				
			var meshes_container, gumMeshesL, gumMeshesU;
			var ipr_info;
			var pca_info;
			
			var raycaster = new THREE.Raycaster();
			var mouse = new THREE.Vector2();
			
			var mouseX = 0, mouseY = 0;
			var zoomFactor = 0.02,
				factor 	   = 1;

			var windowHalfX = window.innerWidth  / 2 ;  // max_x
			var windowHalfY = window.innerHeight / 2 ;  // max_y
			var DPR = window.devicePixelRatio;
			
            var s = 1;// variable for animation.
			var showGrid = false;
			var pickMood = false;
			var textFlag = false;
			init();
			
			if(showGrid){
				generateGrid2D();
			}
			
			/// Functions...
			function readGumPoints()// read the compressed gum vertex index and its position then decompress it   
			{                   
				gumMeshesU = [];
				gumMeshesL = [];
 				var xhr = new XMLHttpRequest();
				IPRPosUrl = './MQ Models/GumPoints.lzma';
				//IPRPosUrl = './MQ Models/GumPoints.txt';
				xhr.open("GET", IPRPosUrl, true);
				xhr.responseType = 	"arraybuffer";		
				//xhr.responseType = 	"text";				
				xhr.onload = function(e){
					var response = this.response;
					response = new Uint8Array(response);
					var my_lzma = new LZMA("libs/lzma_worker.js");
					my_lzma.decompress(response, function on_decompress_complete(result, error) {
						result = result.split('\r\n');
						var pointNum = result[0];
						pointNum = pointNum.split(' ');
						var i = 1, len = result.length, 
							count = 0;
						var vertices;
						for(; i < len; ++i)
						{
							if(result[i] == "U0"){
								vertices = new Float32Array(parseInt(pointNum[0]) * 3);
								gumMeshesU.push(vertices);
								count = 0;
							}
							else if(result[i] == 'L0'){
								vertices =  new Float32Array(parseInt(pointNum[1]) * 3);
								gumMeshesL.push(vertices);
								count = 0;
							}
							else{
								var pos = result[i];
								pos = pos.split(' ');
								vertices[count * 3] 	 = parseFloat(pos[1]); 
								vertices[count * 3 + 1]  = parseFloat(pos[2]);
								vertices[count * 3 + 2]  = parseFloat(pos[3]);
								count += 1;
							}
						}
						animate();
					}, function on_decompress_progress_update(percent) {
							console.log( "Decompressing: " + (percent * 100) + "%" );
					});
									
				}  
				/* 
				// read raw gum vertex index and its position
				xhr.onload = function(e){
					var response = this.response;
					//console.log(response);
					res = result = response.split('\r\n');
					var pointNum = result[0];
					pointNum = pointNum.split(' ');
					var i = 1, len = result.length, 
						count = 0;
					var vertices;
					for(; i < len; ++i)
					{
						if(result[i] == "U0"){
							vertices = new Float32Array(parseInt(pointNum[0]) * 3);
							gumMeshesU.push(vertices);
							count = 0;
						}
						else if(result[i] == 'L0'){
							vertices =  new Float32Array(parseInt(pointNum[1]) * 3);
							gumMeshesL.push(vertices);
							count = 0;
						}
						else{
							var pos = result[i];
							pos = pos.split(' ');
							vertices[count * 3] 	 = parseFloat(pos[1]); 
							vertices[count * 3 + 1]  = parseFloat(pos[2]);
							vertices[count * 3 + 2]  = parseFloat(pos[3]);
							count += 1;
						}
					}
					animate();
				}	*/												
				xhr.send(null);
			}
			
			function convertToUniversal(name)
			{    
				var res;
				if(name[name.length - 1] != '0')
				{
					if( (name[0] ==="U") && (name[1] ==="L")){
						res = parseInt(name[2]) + 8;
					}
					else if( (name[0] ==="U") && (name[1] ==="R")){
						res = 9 - parseInt(name[2]);
					}
					else if( (name[0] ==="L") && (name[1] ==="L")){
						res = 25 - parseInt(name[2]);
					}
					else if( (name[0] ==="L") && (name[1] ==="R")){
						res = parseInt(name[2]) + 24;
					}
				}
				return res.toString();
			}
			
			function readIPRInfo()
			{
				var xhr = new XMLHttpRequest();
				IPRPosUrl = './MQ Models/20160704zhulinfang.iprpos';
				//var IPRPosUrl = './MQ Models/linhaiping/U.iprpos';
				xhr.open("GET", IPRPosUrl, true);
				xhr.responseType = 	"text";
				xhr.onload = function(e)
				{
					var response = this.response;
					response = response.split('\n');					
					for(var i = 0; i < response.length; ++i){
						line = response[i];
						line = line.split(' ');
						tooth1 = line[0];
						tooth2 = line[1];											
						vertexIndex = parseInt(line[2]);
						var index1 =  convertToUniversal(tooth1),
							index2 =  convertToUniversal(tooth2);
						index = index1 < index2 ? index1 : index2;
						index = parseInt(index) - 1;
						ipr_info[index * PER_IPR_INFO_SIZE] = vertexIndex; 
					}
					
					// colorize the start point for test purpose.
					
					var UpperGumMesh = meshes_container.getObjectByName('U0'),
						LowerGumMesh = meshes_container.getObjectByName('L0');
					
					var i = 0;
					for(i = 0 ; i < ipr_info.length / 2; i += PER_IPR_INFO_SIZE){
						var ipr_pos  = ipr_info[i],
							ipr_size = ipr_info[i + 1];
						if(ipr_size){
							var colors   = UpperGumMesh.geometry.attributes.color.array;						
							colors[ipr_pos * 3] 		= 255;
							colors[ipr_pos * 3 + 1] 	= 0;
							colors[ipr_pos * 3 + 2] 	= 0;							
						}	
						UpperGumMesh.geometry.attributes.color.needsUpdate = true;								
					}
					
 					for(i = ipr_info.length / 2 ; i < ipr_info.length; i += PER_IPR_INFO_SIZE){
						var ipr_pos  = ipr_info[i],
							ipr_size = ipr_info[i + 1];
						if(ipr_size){
							var colors   = LowerGumMesh.geometry.attributes.color.array;					
							colors[ipr_pos * 3] 		= 255;
							colors[ipr_pos * 3 + 1] 	= 0;
							colors[ipr_pos * 3 + 2] 	= 0;							
						}	
						LowerGumMesh.geometry.attributes.color.needsUpdate = true;								
					} 									
				}
				xhr.send(null);
			}
			
			function linearInterpolation(xa,ya,xb,yb,scale){
				var offset = (xb - xa) / scale;
				var slope  = (yb - ya) / (xb - xa);  
				var res = [];// [x0,y0,x1,y1...]
				var x = xa, y;
				for(var i = 0; i <= scale; ++i){
					y =  (x - xa) * slope + ya;
					res.push(x);
					res.push(y);
					x += offset;
				}
				return res;
			}
			
			function generateIPRTextBand(x, y, halfWidth, halfHeight, iprSize, ctx){
				var leftx   = x - halfWidth,
					rightx  = x + halfWidth,
					topy    = y + halfHeight,
					bottomy = y - halfHeight;
					
					ctx.beginPath();
					ctx.lineWidth = 1.2;
					ctx.moveTo(leftx, y);
					ctx.lineTo(x, topy);
					ctx.lineTo(rightx, y);
					ctx.lineTo(x, bottomy);
					ctx.closePath();
					ctx.fillStyle="white";
					ctx.fill();
					ctx.stroke();

					var iprSizeStr = iprSize.toString();
					iprSizeStr = iprSizeStr.substr(1, 2); 
					
					ctx.font= parseInt(halfWidth).toString() + "px Verdana";
					ctx.fillStyle="black";
					ctx.fillText(iprSizeStr,x - halfWidth / 2, y);					
			}
			
			function generateIPR(canvas){
					var UpperGumMesh = meshes_container.getObjectByName('U0'),
						LowerGumMesh = meshes_container.getObjectByName('L0');
						
					var context2d = canvas.getContext('2d');					
						context2d.clearRect(0,0,windowHalfX * 2, windowHalfY * 2);
						canvas.width  = windowHalfX * 2 * DPR ;
						canvas.height = windowHalfY * 2 * DPR ; 
						canvas.style.width  = windowHalfX * 2  + 'px';
						canvas.style.height = windowHalfY * 2  + 'px'; 
					
					var i = 0,	
						origin 		= new THREE.Vector3(0, 0, 0);
					origin.applyMatrix4(camera.matrixWorldInverse);

					var min_z = IPR_BAND_R * 0.34;
					var start_fade_z = IPR_BAND_R * 0.8;
					var alpha = 0.9,
						width = 0.6;
					
					var unitLength  = 8;// * window.devicePixelRatio;
					
					for(i = 0 ; i < ipr_info.length / 2; i += PER_IPR_INFO_SIZE){
						ipr_pos  = ipr_info[i];
						ipr_size = ipr_info[i + 1];
						if(ipr_size)
						{
							var positions 	= UpperGumMesh.geometry.attributes.position.array;

							var position 	= new THREE.Vector3(positions[ipr_pos * 3], positions[ipr_pos * 3 + 1], positions[ipr_pos * 3 + 2]);							
							var direction 	= new THREE.Vector3(ipr_info[ i + 2], ipr_info[ i + 3], ipr_info[ i + 4] );
							
							var flag = direction.clone(),
								initial_dir = direction.clone();
								initial_dir.z = 0;
								
							flag.applyMatrix4(camera.matrixWorldInverse);
							flag.sub(origin);
							initial_dir.applyMatrix4(camera.matrixWorldInverse);
							initial_dir.sub(origin);
														
							if(flag.z < 0 || initial_dir.z < 0){
							}	
							else
							{
								direction.add(position);								
							
								var screenCoord0 = toScreenCoord(position, camera),
									screenCoord1 = toScreenCoord(direction, camera);
																																
								var offsetX = screenCoord1.x - screenCoord0.x,
									offsetY = screenCoord1.y - screenCoord0.y;									
																				
								alpha = flag.z / start_fade_z > 1 ? 0.9 : (alpha - 0.2);
								if(alpha < 0){
									alpha = 0;
								}								
								context2d.beginPath();	
								context2d.strokeStyle = 'rgba(0,0,0,'+ alpha.toString() + ')';
								context2d.lineWidth   = 0.6;
								context2d.moveTo(screenCoord0.x, screenCoord0.y);
								context2d.lineTo(screenCoord0.x + offsetX / 5, screenCoord0.y + offsetY / 5);	
								context2d.stroke();	
								
  								context2d.beginPath();	
								context2d.strokeStyle = 'rgba(0,0,0,0.9)';
								context2d.lineWidth   = 0.6;
								context2d.moveTo(screenCoord0.x + offsetX / 5, screenCoord0.y + offsetY / 5);
								context2d.lineTo(screenCoord1.x, screenCoord1.y);	
								context2d.stroke();	  												
							
								generateIPRTextBand(screenCoord1.x, screenCoord1.y, unitLength * 2 / factor, unitLength * 3 / factor, ipr_size.toFixed(1), context2d);
							
/*   								var points = linearInterpolation(screenCoord0.x + offsetX / 5, screenCoord0.y + offsetY / 5,screenCoord1.x, screenCoord1.y, 10);
								
								var width = flag.z / start_fade_z > 1 ? 0.6 : width * 0.6;	
								for(var j = 0; j < points.length / 2; j += 2){
										context2d.beginPath();	
										context2d.lineWidth = width;
										context2d.strokeStyle = 'rgba(0,0,0,0.9)';
										context2d.moveTo(points[j], points[j + 1]);
										context2d.lineTo(points[j + 2], points[j + 3]);	
										width += 0.1;
										if(width > 0.6){
											width = 0.6;
										} 
										context2d.stroke();	
								};	  */							
							}		 				
						}								
					}
					
					for(i = ipr_info.length / 2 ; i < ipr_info.length; i += PER_IPR_INFO_SIZE){
						ipr_pos  = ipr_info[i];
						ipr_size = ipr_info[i + 1];
						if(ipr_size)
						{
							var positions 	= LowerGumMesh.geometry.attributes.position.array;
							var direction 	= new THREE.Vector3(ipr_info[ i + 2], ipr_info[ i + 3], ipr_info[ i + 4] );
							var position 	= new THREE.Vector3(positions[ipr_pos * 3], positions[ipr_pos * 3 + 1], positions[ipr_pos * 3 + 2]);
														
							var flag = direction.clone(),
								initial_dir = direction.clone();
								initial_dir.z = 0;
								
							flag.applyMatrix4(camera.matrixWorldInverse);
							flag.sub(origin);
							initial_dir.applyMatrix4(camera.matrixWorldInverse);
							initial_dir.sub(origin);
														
							if(flag.z < 0 || initial_dir.z < 0){
							}		
							else
							{
								direction.add(position);								
							
								var screenCoord0 = toScreenCoord(position, camera),
									screenCoord1 = toScreenCoord(direction, camera);
																	
 								var offsetX = screenCoord1.x - screenCoord0.x,
									offsetY = screenCoord1.y - screenCoord0.y; 
																				
								alpha = flag.z / start_fade_z > 1 ? 0.9 : (alpha - 0.2);
								if(alpha < 0){
									alpha = 0;
								}		
								
								context2d.beginPath();	
								context2d.strokeStyle = 'rgba(0,0,0,'+ alpha.toString() + ')';
								context2d.lineWidth   = 0.6;
								context2d.moveTo(screenCoord0.x, screenCoord0.y);
								context2d.lineTo(screenCoord0.x + offsetX / 5, screenCoord0.y + offsetY / 5);	
								context2d.stroke();	
								
 								context2d.beginPath();	
								context2d.strokeStyle = 'rgba(0,0,0,0.9)';
								context2d.lineWidth   = 0.6;
								context2d.moveTo(screenCoord0.x + offsetX / 5, screenCoord0.y + offsetY / 5);
								context2d.lineTo(screenCoord1.x, screenCoord1.y);	
								context2d.stroke();	
								
								generateIPRTextBand(screenCoord1.x, screenCoord1.y, unitLength * 2 / factor, unitLength * 3 / factor, ipr_size.toFixed(1), context2d);								
							}	
						}							
					}	
					//context2d.stroke();	
					
				/*	var xhr = new XMLHttpRequest();
					xhr.open("GET", IPRPosUrl, true);
					xhr.responseType = 	"text";
					xhr.onload = function(e){
						var response = this.response;// response string
						response = response.split('\n');
						for(var i = 0; i < response.length; ++i){
							line = response[i];
							line = line.split(' ');
							tooth1 = line[0];
							tooth2 = line[1];
							vertexIndex = parseInt(line[2]);
							var gumMesh 	= tooth1[0] == 'U' ? UpperGumMesh : LowerGumMesh;
							var normals 	= gumMesh.geometry.attributes.normal.array;
							var positions 	= gumMesh.geometry.attributes.position.array;
							var normal 		= new THREE.Vector3(normals[vertexIndex * 3], normals[vertexIndex * 3 + 1], normals[vertexIndex * 3 + 2]);
							var position 	= new THREE.Vector3(positions[vertexIndex * 3], positions[vertexIndex * 3 + 1], positions[vertexIndex * 3 + 2]);
							//normal.applyMatrix4(camera.matrix);
							//position.applyMatrix4(camera.matrix);
							var flag = normal.clone();
							flag.applyMatrix4(camera.matrix);
							if(flag.x < 0){
							}	
							else{
								normal.multiplyScalar(10);
								normal.add(position);							
							
								var screenCoord0 = toScreenCoord(position, camera),
									screenCoord1 = toScreenCoord(normal, camera);
									context2d.moveTo(screenCoord0.x, screenCoord0.y);
									context2d.lineTo(screenCoord1.x, screenCoord1.y);									
								}

							//console.log(screenCoord0.x, screenCoord0.y, '>>>', screenCoord1.x, screenCoord1.y);
						}
						context2d.stroke();		
					}
					xhr.send(null);*/
			}
	
			function generateIPR3D()
			{
					var UpperGumMesh = meshes_container.getObjectByName('U0'),
						LowerGumMesh = meshes_container.getObjectByName('L0');	

					var line_material = new THREE.LineBasicMaterial({
						//opacity: 0.2,
						color: new THREE.Color("rgb(255, 0, 0)")
						//transparent: true
					});						
						
					var i = 0;						
					for(i = 0 ; i < ipr_info.length / 2; i += PER_IPR_INFO_SIZE)
					{
						ipr_pos  = ipr_info[i];
						ipr_size = ipr_info[i + 1];
						if(ipr_size)
						{
							var positions 	= UpperGumMesh.geometry.attributes.position.array;
							
							var direction 	= new THREE.Vector3(ipr_info[ i + 2], ipr_info[ i + 3], ipr_info[ i + 4] );
							//var direction 		= new THREE.Vector3(0,0,20);
							var position 	= new THREE.Vector3(positions[ipr_pos * 3], positions[ipr_pos * 3 + 1], positions[ipr_pos * 3 + 2]);							
							direction.add(position);
							var line_geometry = new THREE.Geometry();
 							line_geometry.vertices.push(position);
							line_geometry.vertices.push(direction);
							var line = new THREE.Line(line_geometry, line_material);
							line.name = i;
							UpperGumMesh.add(line);
						}
					}								
					
				 	for(i = ipr_info.length / 2 ; i < ipr_info.length; i += PER_IPR_INFO_SIZE)
					{
						ipr_pos  = ipr_info[i];
						ipr_size = ipr_info[i + 1];
						if(ipr_size)
						{
							//var normals 	= LowerGumMesh.geometry.attributes.normal.array;
							var positions 	= LowerGumMesh.geometry.attributes.position.array;
							
							var direction 	= new THREE.Vector3(ipr_info[ i + 2], ipr_info[ i + 3], ipr_info[ i + 4] );
							var position 	= new THREE.Vector3(positions[ipr_pos * 3], positions[ipr_pos * 3 + 1], positions[ipr_pos * 3 + 2]);

							direction.add(position);
							var line_geometry = new THREE.Geometry();
 							line_geometry.vertices.push(position);
							line_geometry.vertices.push(direction);
							var line = new THREE.Line(line_geometry, line_material);
							line.name = i;
							LowerGumMesh.add(line);															
						}	
					} 							
			}
	
			function showText(showFlag){
				for(id in meshes_container.children){												
					mesh = meshes_container.children[id];
					var meshName = mesh.name;
					if(meshName[meshName.length - 1] == '0'){
						continue;
					}
					textMesh = mesh.children[0];
					textMesh.visible = showFlag;							
				}									
			}
			
			function checkGridBlockSize(screenUnitLength, minBlock, maxBlock)
			{				
				if(screenUnitLength < minBlock){
					screenUnitLength *= 10;
					return checkGridBlockSize(screenUnitLength, minBlock, maxBlock);					 				
				}			
				else if(screenUnitLength  > maxBlock){
					screenUnitLength /= 10;
					return checkGridBlockSize(screenUnitLength, minBlock, maxBlock);																
				}
				else{
					return screenUnitLength;
				}
			}

			function toScreenCoord(vec, camera){
				vec.project(camera);
				vec.x =   ( vec.x * windowHalfX )  + windowHalfX ;
				vec.y = - ( vec.y * windowHalfY )  + windowHalfY ;
				
				vec.x *= DPR;
				vec.y *= DPR;				
				return vec;
			}
			
			/*  for normalized vector in 3d world coordinates, return its length in screen coordinates*/
			function getScreenUnitLength(camera)
			{				
				var vector1 = new THREE.Vector3(1, 0, 0);
				var vector2 = new THREE.Vector3(0, 0, 0);
				var vector3 = new THREE.Vector3(); 
								
				vector1.applyMatrix4(camera.matrixWorld);
				vector2.applyMatrix4(camera.matrixWorld);
				
				vector1.project(camera);
				vector2.project(camera);
			
				vector1.x =   ( vector1.x * windowHalfX ) + windowHalfX;
				vector1.y = - ( vector1.y * windowHalfY ) + windowHalfY;

				vector2.x =   ( vector2.x * windowHalfX ) + windowHalfX;
				vector2.y = - ( vector2.y * windowHalfY ) + windowHalfY;
				vector3.subVectors(vector1, vector2);
			
				/*			
				var vector4 = new THREE.Vector3(1, 0, 0);
				var vector5 = new THREE.Vector3(0, 0, 0);				
				var vector6 = new THREE.Vector3(); 
				
				vector4.applyMatrix4(camera.matrixWorldInverse);
				vector5.applyMatrix4(camera.matrixWorldInverse);				
				vector4.project(camera);
				vector5.project(camera);
				
				vector4.x =   ( vector4.x * windowHalfX ) + windowHalfX;
				vector4.y = - ( vector4.y * windowHalfY ) + windowHalfY;
				vector5.x =   ( vector5.x * windowHalfX ) + windowHalfX;
				vector5.y = - ( vector5.y * windowHalfY ) + windowHalfY;
				vector6.subVectors(vector4, vector5);	*/			
			
				return vector3.length() ;
			};
		
			function toWorldCoordLength(camera, unitlen)
			{
				var vectora = new THREE.Vector3(0, 0, 0);
				var vectorb = new THREE.Vector3(unitlen, 0, 0);
				var res 	= new THREE.Vector3();
				vectora.unproject(camera);
				vectorb.unproject(camera);
				res.subVectors(vectora, vectorb);
				
				return res.length();
			}
			
			function toNDC(vec){
				var res = new THREE.Vector3();
				res.x = vec.x / windowHalfX - 1;
				res.y = 1 - vec.y / windowHalfY;
				res.z = 0.5;
				return res; 
			} 
			
			function vectorAdd(a, b){
				var res = new THREE.Vector3();
				res.addVectors(a, b);
				return res;
			}
						
		/*	function generateGrid(gridNum){
				// Determine the size of a grid block (square)
				var aspect = windowHalfX / windowHalfY;
				//var maxScreenLen = windowHalfX > windowHalfY ? windowHalfX : windowHalfY;
				gridNum = 400;//Math.floor(maxScreenLen / 5 )+ 1;
				var _X = 100;
				var _Y = 100;
				var Z_IN_WC = 100;
				
				var material_normal = new THREE.MeshLineMaterial({
					lineWidth: 0.01,
					opacity: 0.2,
					color: new THREE.Color("rgb(255, 0, 0)"),
					sizeAttenuation: true,
					depthTest: false,
					blending: THREE.AdditiveAlphaBlending,
					transparent: true
				});
				var material_red = new THREE.MeshLineMaterial({
						color: 0xFF0000,
						//opacity: 0.2
					});	
				
				var material_blue = new THREE.MeshLineMaterial({
						color: 0x0000FF,
						//opacity: 0.2
					});	
				
				var material_bold  = new THREE.MeshLineMaterial({
					color: 0x000000,
					lineWidth: 5
				});
				
				var grid = new THREE.Group();
				grid.name = "grid";	
				grid.scaleFactor  = 1.0;  	
				grid._3dBlockSize = 1;
				
				// add red  and blue line
				var geometry_red  = new THREE.Geometry();
				var geometry_blue = new THREE.Geometry(); 
				
				var veca = new THREE.Vector3(-_X * aspect, 0, Z_IN_WC);
				var vecb = new THREE.Vector3(_X * aspect, 0, Z_IN_WC);			
				var vecd = new THREE.Vector3(0, -_Y, Z_IN_WC);
				var vece = new THREE.Vector3(0,  _Y, Z_IN_WC);				
				
				geometry_blue.vertices.push(vecd, vece);
				geometry_red.vertices.push(veca, vecb);
				
				var line_red  = new THREE.MeshLine();
				var line_blue = new THREE.MeshLine();

				line_red.setGeometry( geometry_red );
				line_blue.setGeometry( geometry_blue);
				
				var line_red_mesh   =  new THREE.Mesh(line_red.geometry, material_normal);
				var line_blue_mesh  =  new THREE.Mesh(line_blue.geometry, material_normal);
				
				grid.add(line_red_mesh);
				grid.add(line_blue_mesh);
				
				var count = 0;
				var material;
				
				var row = veca.y;
				for(count ; count < gridNum; ++count){
					row += 1;
					material = row % 10 === 0 ? material_bold : material_normal;
					var tveca = new THREE.Vector3( veca.x,  row,  Z_IN_WC);
					var tvecb = new THREE.Vector3( vecb.x,  row,  Z_IN_WC);
					var tvecd = new THREE.Vector3( veca.x, -row,  Z_IN_WC);
					var tvece = new THREE.Vector3( vecb.x, -row,  Z_IN_WC);
					var geometry_up = new THREE.Geometry();
					geometry_up.vertices.push(tveca,tvecb);
					var geometry_bottom = new THREE.Geometry();
					geometry_bottom.vertices.push(tvecd,tvece);
					var line_up 	= new THREE.Mesh(geometry_up, material);
					var line_bottom = new THREE.Mesh(geometry_bottom, material);
					grid.add(line_up);
					grid.add(line_bottom);
				}
				
				var column = vecd.x;
				for(count = 0;count < gridNum; ++count){					
					column += 1;
					material = column % 10 === 0 ? material_bold : material_normal;
					material = material_bold;
					var tveca = new THREE.Vector3(column,  vecd.y,  Z_IN_WC);
					var tvecb = new THREE.Vector3(column,  vece.y,  Z_IN_WC);
					var tvecd = new THREE.Vector3(-column, vecd.y,  Z_IN_WC);
					var tvece = new THREE.Vector3(-column, vece.y,  Z_IN_WC);
					
					var geometry_right = new THREE.Geometry();
					geometry_right.vertices.push(tveca,tvecb);
					var geometry_left = new THREE.Geometry();
					geometry_left.vertices.push(tvecd,tvece);
					var line_right 	= new THREE.Mesh(geometry_right, material);
					var line_left 	= new THREE.Mesh(geometry_left, material);
					grid.add(line_left);
					grid.add(line_right);					
				}
				
				var len = getScreenUnitLength(camera);		
				
				scene.add(grid);	
				
				checkGridBlockSize(grid, 5, 50);
			}*/
	
			function generateGrid2D()
			{		
				var screenUnitLength = getScreenUnitLength(camera) * DPR; 	
				var scale = checkGridBlockSize(screenUnitLength, 5, 50 ) / screenUnitLength;
				var unitLength 	=  scale * getScreenUnitLength(camera) * DPR;
				var ratio = 3 / 4;
				var text_left = Math.floor(windowHalfX * ratio * DPR / unitLength) * unitLength ;
					text_top  = Math.floor(windowHalfY * ratio * DPR / unitLength) * unitLength ;
				
				var gridNum = windowHalfX > windowHalfY ? windowHalfX * DPR / unitLength : windowHalfY * DPR / unitLength;
				var context2d = canvas2d.getContext('2d');
				context2d.clearRect(0,0,windowHalfX * 2, windowHalfY * 2);
				
				canvas2d.width  = windowHalfX * 2 * DPR;
				canvas2d.height = windowHalfY * 2 * DPR; 
				canvas2d.style.width  = windowHalfX * 2  + 'px';
				canvas2d.style.height = windowHalfY * 2  + 'px'; 
				
				var aspect = windowHalfX / windowHalfY;
				var max_x  = windowHalfX * DPR * 2 + 10;
				var min_x  = -10 * DPR;
				var max_y  = windowHalfY * DPR * 2 + 10;
				var min_y  = -10 * DPR;
				var Z_IN_WC = 100;
			    
				var origin_point = new THREE.Vector3(0,0,1);
				origin_point = toScreenCoord(origin_point, camera);
				
				var thin_line_width  = screenUnitLength * scale  > 15 ? 0.8 : 0.5;
				var thick_line_width = 0.8;
				
				//middle thick line
				context2d.strokeStyle = 'rgba(100,100,100,0.9)';
				context2d.lineWidth = thick_line_width;
				
				context2d.beginPath();	
				context2d.moveTo(min_x,  origin_point.y);
				context2d.lineTo(max_x,  origin_point.y);				
				context2d.moveTo(origin_point.x,  min_y);
				context2d.lineTo(origin_point.x,  max_y);
				count 	= 1;
				row_bottom 	= origin_point.y;
				row_top 	= origin_point.y;
				for(count ; count <= gridNum; count += 10){
					row_bottom += unitLength * 10;
					row_top    -= unitLength * 10;	
					context2d.moveTo(min_x,  row_bottom);
					context2d.lineTo(max_x,  row_bottom);
					context2d.moveTo(min_x,  row_top);
					context2d.lineTo(max_x,  row_top);
				}
				
				count 	= 1;
				col_left 	= origin_point.x;
				col_right 	= origin_point.x;
				for(count ; count <= gridNum; count += 10){
					col_left  -= unitLength * 10;
					col_right += unitLength * 10;	

					context2d.moveTo(col_left,  min_y);
					context2d.lineTo(col_left,  max_y);
					context2d.moveTo(col_right, min_y);
					context2d.lineTo(col_right, max_y);
				}								
				context2d.stroke();	
				
				// draw thin line
				context2d.strokeStyle = 'rgba(100,100,100,0.7)';
				context2d.lineWidth = thin_line_width;
				context2d.beginPath();
				var count 	= 1;
				var row_bottom 	= origin_point.y;
				var row_top 	= origin_point.y;
				context2d.strokeStyle = 'rgba(100,100,100,0.7)';
				context2d.lineWidth = thin_line_width;
				for(count ; count <= gridNum; ++count){
					row_bottom += unitLength;
					row_top    -= unitLength;	
					if ((count) % 10 == 0 ){
						continue;
					}
					context2d.moveTo(min_x,  row_bottom);
					context2d.lineTo(max_x,  row_bottom);
					context2d.moveTo(min_x,  row_top);
					context2d.lineTo(max_x,  row_top);
				}	
				
				count 	= 1;
				var col_left 	= origin_point.x;
				var col_right 	= origin_point.x;
				for(count ; count <= gridNum; ++count){
					col_left  -= unitLength;
					col_right += unitLength;	
					if ((count ) % 10 == 0 ){
							continue;
					}

					context2d.moveTo(col_left,  min_y);
					context2d.lineTo(col_left,  max_y);
					context2d.moveTo(col_right, min_y);
					context2d.lineTo(col_right, max_y);
				}								
				context2d.stroke();		

				context2d.beginPath();
				context2d.lineWidth = 2;
				context2d.strokeStyle = 'rgba(255,100,100,1.0)';
				context2d.moveTo(origin_point.x - text_left, origin_point.y + text_top - 0.25 * unitLength);
				context2d.lineTo(origin_point.x - text_left, origin_point.y + text_top);
				context2d.lineTo(origin_point.x - text_left + unitLength, origin_point.y + text_top);
				context2d.lineTo(origin_point.x - text_left + unitLength, origin_point.y + text_top- 0.25 * unitLength);
				context2d.stroke();	
				
				context2d.font 		=  "15px  Verdana";
				context2d.fillStyle	=  "black";
				if(scale < 1){
					scale = scale.toFixed(1);
				}
				context2d.fillText(scale.toString() + 'mm', origin_point.x - text_left, origin_point.y + text_top - unitLength * 0.2);
			}
	
			function TransformData(){
				this.tx   = this.ty = this.tz = this.rx = this.ry = this.rz = 0;
				
				this.copy = function(){
					var obj = new this.constructor();
					obj.tx = this.tx;
					obj.ty = this.ty;
					obj.tz = this.tz;
					obj.rx = this.rx;
					obj.ry = this.ry;
					obj.rz = this.rz;
					return obj;
				}
			}

			function toothData() {

				this.rmat = new THREE.Matrix4();
				this.baryCenter_init = [];
				this.baryCenter_final = [];
				this.pca_init = [[], [], []];
				this.pca_cur = [[], [], []];
				this.transPath = [];
			}
			
			function showStage(stage)
			{	
				meshes_container.children.forEach(function(mesh){
					
					if (mesh.name[mesh.name.length - 1] !== '0')//make sure this mesh is not gum...
					{
						var dataPerTooth = mesh.dataPerTooth;
						//add a "isEditMode" flag if 3DControl is added.
						if(stage >= dataPerTooth.transPath.length){
							stage = dataPerTooth.transPath.length - 1;
						}	
						var transOfStage = dataPerTooth.transPath[stage];						
						var tmatrix = new THREE.Matrix4();
						var m1 = new THREE.Matrix4();
						var m2 = new THREE.Matrix4();
						var m3 = new THREE.Matrix4();
						var m4 = new THREE.Matrix4();
						var m5 = new THREE.Matrix4();
						tmatrix.identity ();
						m1.makeTranslation(transOfStage.tx + dataPerTooth.baryCenter_init[0] , transOfStage.ty + dataPerTooth.baryCenter_init[1], transOfStage.tz + dataPerTooth.baryCenter_init[2] );
						m2.makeRotationX(transOfStage.rx / 180 * Math.PI);
						m3.makeRotationY(transOfStage.ry / 180 * Math.PI);
						m4.makeRotationZ(transOfStage.rz / 180 * Math.PI);
						m5.makeTranslation(-dataPerTooth.baryCenter_init[0], -dataPerTooth.baryCenter_init[1], -dataPerTooth.baryCenter_init[2]);
						
						tmatrix.multiply(m1);
						tmatrix.multiply(m2);
						tmatrix.multiply(m3);						
						tmatrix.multiply(m4);
						tmatrix.multiply(m5);
						
						mesh.matrix.copy(mesh.initial_matrix);
						mesh.applyMatrix(tmatrix);
					}
					/*else if(mesh.name =='U0'){
						if(stage >= gumMeshesU.length){
							stage = gumMeshesU.length - 1;
						}	
						mesh.geometry.attributes.position.array = gumMeshesU[stage];
						mesh.geometry.attributes.position.needsUpdate = true;	
					}
					else{
						if(stage >= gumMeshesL.length){
							stage = gumMeshesL.length - 1;
						}	
						mesh.geometry.attributes.position.array = gumMeshesL[stage];
						mesh.geometry.attributes.position.needsUpdate = true;							
					}*/
				});
			}

			function readTreatmentPlan(url)
			{				
				var xhr = new XMLHttpRequest();
				xhr.open("GET",url,true);
				//xhr.overrideMimeType('text\/plain; charset=x-user-defined');
                xhr.responseType = 	"arraybuffer";
             
                xhr.onload = function(e){
					//var buffer = stringToArrayBuffer(this.response);
					var buffer = this.response;
					//var buffer = intArrayFromString(this.responseText || '', true)
					var reader = new DataView(buffer);
					var cursor = 0;
					
					//read plan file version
					var version = "";
					for (var i = 0; i < 4; ++i){
						var character = reader.getInt8(cursor,true);
						character =  String.fromCharCode(character);
						version += character;
						cursor ++;
					}
					
					// read patient ID
					var pid = reader.getInt32(cursor, true);
					cursor += 4;	
					
					// read Bolton Rate
					var bolton = [];
					for (var i = 0; i < 4 ; ++i){
						bolton[i] = reader.getFloat32(cursor, true);
						cursor += 4;
					}

					// read Teeth amount ,IPR amount and stage amount
					var teethNum = reader.getInt32(cursor, true);
					cursor += 4;
					var IPRNum   = reader.getInt32(cursor, true);
					cursor += 4;
					var stageNum = [];
					stageNum[0] = reader.getInt32(cursor, true);// U
					cursor += 4;
					stageNum[1] = reader.getInt32(cursor, true);// L
					cursor += 4;		
					
					// read IPR information 
					// (skip this infomation) cursor += 14 * IPRNum;// 4 + 3 + 3 + 4					
					for (var x = 0; x < IPRNum; ++ x)
					{
						var step = reader.getInt32(cursor, true);
						cursor += 4;
						var a =  String.fromCharCode(reader.getInt8(cursor++, true));
						var b =  String.fromCharCode(reader.getInt8(cursor++, true));
						var c =  String.fromCharCode(reader.getInt8(cursor++, true));
						var d =  String.fromCharCode(reader.getInt8(cursor++, true));
						var e =  String.fromCharCode(reader.getInt8(cursor++, true));
						var f =  String.fromCharCode(reader.getInt8(cursor++, true));
						var size = reader.getFloat32(cursor, true);
						cursor += 4;
						var index1 = convertToUniversal(a + b + c),
							index2 = convertToUniversal(d + e + f);
						var index = index1 < index2 ? index1 : index2;
						
						//console.log(a + b + c, d + e + f, index, size);
						index = parseInt(index) - 1;
						ipr_info[index * PER_IPR_INFO_SIZE + 1] = size;
					}

					// read teeth information
					for(var i = 0; i < teethNum; ++ i)
					{
						var toothNameLen = reader.getInt32(cursor, true);
						cursor += 4;
						var toothName = "";
						for(var j = 0; j < toothNameLen; ++j){
							var character = reader.getInt8(cursor, true);
							character = String.fromCharCode(character);
							toothName += character;
							cursor += 1;
						}
						var toothMesh = meshes_container.getObjectByName(toothName);
						var dataPerTooth = new toothData();
						
						//initial bary center and pca
						var baryCenter_init = new Array(3);
						for(var j = 0; j < 3; ++j){
							baryCenter_init[j] = reader.getFloat32(cursor, true);
							cursor += 4;
						}
						var pca_init = new Array(3);
						for(var j = 0; j < 3; ++j){
							var coord  = new Array(3);
							for(var k = 0; k < 3; ++ k){// x, y, z
								coord[k] = reader.getFloat32(cursor, true);
								cursor += 4;
							}
							pca_init[j] = coord;
						}
						dataPerTooth.baryCenter_init = baryCenter_init;
						dataPerTooth.pca_init        = pca_init;
						
						// final bary center and pca
						var baryCenter_final = new Array(3);
						for(var j = 0; j < 3; ++j){
							baryCenter_final[j] = reader.getFloat32(cursor, true);
							cursor += 4;
						}
						var pca_final = new Array(3);
						for(var j = 0; j < 3; ++j){
							var coord  = new Array(3);
							for(var k = 0; k < 3; ++ k){// x, y, z
								coord[k] = reader.getFloat32(cursor, true);
								cursor += 4;
							}
							pca_final[j] = coord;
						}
						dataPerTooth.baryCenter_final = baryCenter_final;
						dataPerTooth.pca_final = pca_final;
						
						// final transform 
						var tx,ty,tz,rx,ry,rz;
						tx = reader.getFloat32(cursor, true);
						cursor += 4;
						ty = reader.getFloat32(cursor, true);
						cursor += 4;
						tz = reader.getFloat32(cursor, true);
						cursor += 4;
						rx = reader.getFloat32(cursor, true);
						cursor += 4;
						ry = reader.getFloat32(cursor, true);
						cursor += 4;
						rz = reader.getFloat32(cursor, true);
						cursor += 4;
						// represent the transformation by matrix.
						var tmatrix = new THREE.Matrix4();
						var m1 = new THREE.Matrix4();
						var m2 = new THREE.Matrix4();
						var m3 = new THREE.Matrix4();
						var m4 = new THREE.Matrix4();
						var m5 = new THREE.Matrix4();
						tmatrix.identity ();
						m1.makeTranslation(tx + baryCenter_init[0] , ty + baryCenter_init[1], tz + baryCenter_init[2] );
						m2.makeRotationX(rx / 180 * Math.PI);
						m3.makeRotationY(ry / 180 * Math.PI);
						m4.makeRotationZ(rz / 180 * Math.PI);
						m5.makeTranslation(-baryCenter_init[0], -baryCenter_init[1], -baryCenter_init[2]);						
						tmatrix.multiply(m1);
						tmatrix.multiply(m2);
						tmatrix.multiply(m3);						
						tmatrix.multiply(m4);
						tmatrix.multiply(m5);
			
						dataPerTooth.rmat = tmatrix;
						
						// move measurement and tooth width
						cursor += 4 * 7;
						
						//middle path
						var stageCount =  (toothName[0] ==='U') ? stageNum[0] : stageNum[1];
						var middlePath = new Array(stageCount + 2);
						for(var j = 0 ; j < stageCount; ++j){
							//var tx,ty,tz,rx,ry,rz;
							var transData = new TransformData();
							transData.tx = reader.getFloat32(cursor, true);
							cursor += 4;
							transData.ty = reader.getFloat32(cursor, true);
							cursor += 4;
							transData.tz = reader.getFloat32(cursor, true);
							cursor += 4;
							transData.rx = reader.getFloat32(cursor, true);
							cursor += 4;
							transData.ry = reader.getFloat32(cursor, true);
							cursor += 4;
							transData.rz = reader.getFloat32(cursor, true);
							cursor += 4;	
							middlePath[j + 1] = transData;
						}
						middlePath[0]              = middlePath[1].copy();
						middlePath[stageCount + 1] = middlePath[stageCount].copy(); 
						dataPerTooth.transPath = middlePath;
						
						toothMesh.dataPerTooth = dataPerTooth;
						toothMesh.initial_matrix = new THREE.Matrix4();
						toothMesh.initial_matrix.copy(toothMesh.matrix);
					}
					
					// do everything that must wait for the "treatment plan file" loaded 
					// for example show the treatment slider bar
					//showStage(10);
					
					//readGumPoints();
					animate();
				
				};	
				xhr.send(null);				
		    }
			
			function generateNameText()
			{	
				var height 			= 0.1,
					size 			= 1.5,
					font 			= font,
					fontName 		= "optimer", // helvetiker, optimer, gentilis, droid sans, droid serif
					fontWeight 		= "regular", 	 // nregular or bold	
					curveSegments 	= 1,
					material = new THREE.MeshBasicMaterial({
						color: 0x565656
					});
			
				var loader = new THREE.FontLoader();
				loader.load( './fonts/' + fontName + '_' + fontWeight + '.typeface.js', function (response) {
					font = response;					
					textPosUrl = './MQ Models/TextPosition.txt';
					var xhr = new XMLHttpRequest();
					xhr.open("GET", textPosUrl, true);
					xhr.responseType = 	"text";
					
					xhr.onload = function(e){
						var text_string = this.response;
						text_string = text_string.split('\n');
					
						for (var j = 0; j < text_string.length; ++j)
						{
							pos = text_string[j].split(' ');
							var toothName = pos[0],
								x    = parseFloat(pos[1]),
								y	 = parseFloat(pos[2]),
								z	 = parseFloat(pos[3]);

							toothMesh = meshes_container.getObjectByName(toothName);
							
							var textGeo = new THREE.TextGeometry( convertToUniversal(toothName), {	
									font: font,
									size: size,
									height: height,
									curveSegments: curveSegments,
									material: 0,
									extrudeMaterial: 1
								});

							textGeo.computeBoundingBox();
							textGeo.computeVertexNormals();
				
							var centerOffsetX = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );
								centerOffsetY = -0.5 * ( textGeo.boundingBox.max.y - textGeo.boundingBox.min.y )
								textMesh = new THREE.Mesh( textGeo, material );
							 							
							//rotate the mesh text	
							var data = toothMesh.dataPerTooth;
							var initial_normal_direction = new THREE.Vector3(0, 0, 1);
							var initial_x_direction		 = new THREE.Vector3(1, 0, 0);
							var target_normal_direction  = new THREE.Vector3(data.pca_init[0][0], data.pca_init[0][1], data.pca_init[0][2]).normalize();
							var target_x_direction = toothName[0]=='L' ? new THREE.Vector3(data.pca_init[1][0], data.pca_init[1][1], data.pca_init[1][2]).normalize() : new THREE.Vector3(-data.pca_init[1][0], -data.pca_init[1][1], -data.pca_init[1][2]).normalize();
							
							var angle_ = Math.acos(initial_normal_direction.dot(target_normal_direction));
							var axis_  = new THREE.Vector3();
							axis_.crossVectors(initial_normal_direction, target_normal_direction);
							axis_.normalize();
							//textMesh.rotateOnAxis (axis_, angle_);
														
							var matrix1 = new THREE.Matrix4();
							matrix1.identity();
							matrix1.makeRotationAxis( axis_, angle_);
							initial_x_direction.applyMatrix4(matrix1);
							initial_x_direction.normalize();
							
							var matrix2 = new THREE.Matrix4();
							matrix2.identity();
							angle_ = Math.acos(initial_x_direction.dot(target_x_direction));
							axis_  = new THREE.Vector3();
							axis_.crossVectors(initial_x_direction, target_x_direction);
							axis_.normalize();
							matrix2.makeRotationAxis(axis_, angle_);
							//textMesh.rotateOnAxis (axisX, angleX);
							
							var matrix3 = new THREE.Matrix4();
							matrix3.identity();
							matrix3.makeTranslation(x + 0.6, y + 0.6, z );							
							matrix3.multiply(matrix2.multiply(matrix1));
						
							textMesh.applyMatrix(matrix3);
							toothMesh.add( textMesh );
						}
						//showText(textFlag);
					};	
					xhr.send(null);	

				});											
			}
			
			function init() 
			{
				container = document.createElement( 'div' );
				container.setAttribute("id","canvas_container");
				document.body.appendChild( container );
			    clock = new THREE.Clock();

				//var aspect = window.innerWidth / window.innerHeight;
				var aspect = windowHalfX / windowHalfY;
				var initial_orth_height = 100;
				camera_orth =  new THREE.OrthographicCamera( -initial_orth_height * aspect, initial_orth_height  * aspect, initial_orth_height, -initial_orth_height, 1, 1000 );	
				camera_pers =  new THREE.PerspectiveCamera( 45, aspect, 0.1, 1000 );					
				
				camera_orth.position.x = 250;
				camera_orth.up.set( 0, 0, 1 );
				camera_orth.lookAt(new THREE.Vector3(0,0,0));
				//camera_orth.zoom = 3;

				camera_pers.position.x = 250;
				camera_pers.up.set( 0, 0, 1 );
				camera_pers.lookAt(new THREE.Vector3(0,0,0));
				
				camera_pers.updateMatrix();
				camera_orth.updateMatrix();
				
				camera_orth.matrixWorld = camera_orth.matrix;
				camera_pers.matrixWorld = camera_pers.matrix;
				
				camera_orth.matrixWorldInverse.getInverse( camera_orth.matrixWorld );
				camera_pers.matrixWorldInverse.getInverse( camera_pers.matrixWorld );
				if(showGrid){
					camera = camera_orth;
				}
				else{
					camera = camera_pers;
				}	
				// trackball
				trackballControls_orth = new THREE.TrackballControls(camera_orth);
				trackballControls_orth.rotateSpeed 	= 1.0;
				trackballControls_orth.panSpeed 	= 1.0;
				trackballControls_orth.noZoom    	= true;
				trackballControls_orth.staticMoving  = true;
				trackballControls_orth.target.set( 0, 0, 0 );
				
				trackballControls_pers = new THREE.TrackballControls(camera_pers);
				trackballControls_pers.rotateSpeed 	 = 1.0;
				trackballControls_pers.panSpeed 	 = 1.0;
				trackballControls_pers.noZoom    	 = true;
				trackballControls_pers.staticMoving  = true;
				trackballControls_pers.target.set( 0, 0, 0 );
				
				// scene
				scene = new THREE.Scene();

				//light				
 				directionalLight = new THREE.DirectionalLight(0x6e6e6e, 1);				
				var ambientLight = new THREE.AmbientLight( 0x646464);		
				
 				scene.add( ambientLight );
				scene.add( directionalLight);
				
				// load manager
				var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {

					console.log( item, loaded, total );

				};

				var onProgress = function ( xhr ) {
					if ( xhr.lengthComputable ) {
						var percentComplete = xhr.loaded / xhr.total * 100;
						console.log( Math.round(percentComplete, 2) + '% downloaded' );
					}
				};

				var onError = function ( xhr ) {
				};

				// material
				/*var tooth_material = new THREE.MeshPhongMaterial({
				                                        color:    0xFDFBEB,
														specular: 0xB4B4B4,														
														shininess :  1,
														shading: THREE.SmoothShading
													});		
				tooth_material.shading = THREE.SmoothShading;
				if(pickMood){
					tooth_material.vertexColors = THREE.VertexColors;
					tooth_material.color =  new THREE.Color(0xffffff);
				}*/
				
				var gum_material =  new THREE.MeshPhongMaterial({
									                    color:    0xD19A95,
														specular: 0x969696,
														shininess :  1,
														//wireframe: true,
													})
				
				gum_material.shading = THREE.SmoothShading;
				if(pickMood){
					gum_material.vertexColors = THREE.VertexColors;
					gum_material.color =  new THREE.Color(0xffffff);
				}
				
				// initial global paraments
				ipr_info = new Array(32 * PER_IPR_INFO_SIZE);// position-1,direction-3,size-1
				for(var i = 0; i < 32 * PER_IPR_INFO_SIZE; ++i){
					ipr_info[i] = 0;
				}

				for(var i = 0; i < 16; ++i){				//Maxillary
					var rad = Math.PI * (1 + i / 15.0);
					ipr_info[ i * PER_IPR_INFO_SIZE + 2] = -Math.sin(rad) * IPR_BAND_R;
					ipr_info[ i * PER_IPR_INFO_SIZE + 3] = Math.cos(rad) * IPR_BAND_R;
					ipr_info[ i * PER_IPR_INFO_SIZE + 4] = Math.sqrt(3) / 2.0 * IPR_BAND_R; 					
				}
				
				for(var i = 16; i < 32; ++i){				// Mandibular
					var rad = -Math.PI / 15 * (i - 16);
					ipr_info[ i * PER_IPR_INFO_SIZE + 2] = -Math.sin(rad) * IPR_BAND_R;
					ipr_info[ i * PER_IPR_INFO_SIZE + 3] = Math.cos(rad) * IPR_BAND_R;
					ipr_info[ i * PER_IPR_INFO_SIZE + 4] = -Math.sqrt(3) / 2.0 * IPR_BAND_R; 
				}
				
				// model 
				var vShader = $('#vertexshader');
				var fShader = $('#fragmentshader');	
				
				//console.log( $('#tttt').text());
				
				var loader = new THREE.MQLoader( manager );
				loader.load( './MQ Models/20160704zhulinfang.bin', function ( meshes ) {
				//loader.load( './MQ Models/linhaiping/model.bin', function ( meshes ) {
				//var loader = new THREE.STLLoader( manager );
				//loader.load( './MQ Models/shape_cube.stl', function ( meshes ) {							
					meshes_container = meshes;
					meshes.children.forEach(function(mesh){
						
						mesh.geometry.computeBoundingBox();	
						mesh.geometry.computeFaceNormals();
						mesh.geometry.computeVertexNormals();
						mesh.geometry.dynamic = true;
					
					    if(mesh.name[mesh.name.length - 1] == '0'){
							mesh.material = gum_material;
							//console.log(mesh);
							//mesh.visible = false;
						} 
						else{
							
							var uniforms = {	
								bbMin:		 {	value: mesh.geometry.boundingBox.min	},
								bbMax:		 {	value: mesh.geometry.boundingBox.max	},
								isU:		 {	value: 1}
							}
				
							var shaderMaterialTooth = new THREE.ShaderMaterial({
									uniforms:   	uniforms,
									shading: 		THREE.SmoothShading,
									vertexShader:   vShader.text(),
									fragmentShader: fShader.text()
								});
							
							mesh.material = shaderMaterialTooth;
							
							if(mesh.name[0] == 'L'){
								//mesh.visible = false;
								uniforms.isU = 0;
							}
						}						
					});
										
					scene.add( meshes );
					// read the plan file after model reading completed.
					var url = './MQ Models/20160704zhulinfang.plan';
					//var url = './MQ Models/linhaiping/20161116.plan';
					readTreatmentPlan(url);	
															
					readIPRInfo();
										
				}, onProgress, onError );
				
				// initial WebGLRenderer
				renderer = new THREE.WebGLRenderer();
				renderer.domElement.setAttribute("style","position: absolute; left: 0; top: 0;");
				container.appendChild( renderer.domElement );
				renderer.setClearColor(new THREE.Color(0xeeeeee), 1.0);									
				renderer.setSize(windowHalfX * 2, windowHalfY * 2 );
				renderer.setPixelRatio(DPR);
				//renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
				//renderer.domElement.addEventListener("dragend", onMouseDrag, false);
				
				// initial Canvas for grid
				canvas2d = document.createElement( 'canvas' );
				container.appendChild( canvas2d );
				$(canvas2d).attr("id", '2dcanvas');
				$(canvas2d).attr("style","position: absolute; left: 0; top: 0;");
				$(canvas2d).attr("width", windowHalfX * 2 * DPR);
				$(canvas2d).attr("height",windowHalfY * 2 * DPR);				
				//canvas2d.addEventListener( 'mousemove', onDocumentMouseMove, false );	
 				if(pickMood){
					canvas2d.addEventListener( 'click', onDocumentMouseClick, false );						
				} 
			
			    //initial Canvas for IPR Info
 				canvas2dIPR = document.createElement( 'canvas' );
				container.appendChild( canvas2dIPR );
				$(canvas2dIPR).attr("id", '2dcanvasIPR');
				$(canvas2dIPR).attr("style","position: absolute; left: 0; top: 0;");
				$(canvas2dIPR).attr("width", windowHalfX * 2 * DPR);
				$(canvas2dIPR).attr("height",windowHalfY * 2 * DPR);								
				//canvas2d.addEventListener( 'mousemove', onDocumentMouseMove, false );	
				document.addEventListener( 'dblclick', onDocumentMousedbClick, false );
				if(pickMood){
					canvas2dIPR.addEventListener( 'click', onDocumentMouseClick, false );						
				}	 		
				
				//renderer.domElement.addEventListener( 'mousewheel', mousewheel, false );
				//renderer.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox	
					
				//canvas2d.addEventListener( 'mousewheel', mousewheel, false );
				//canvas2d.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox
				
				canvas2dIPR.addEventListener( 'mousewheel', mousewheel, false );
				canvas2dIPR.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox
			
				//document.addEventListener( 'mousewheel', mousewheel, false );
				//document.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox		
				//document.addEventListener( 'resize', onWindowResize, false );				
				window.addEventListener( 'resize', onWindowResize, false );
			}

			function onWindowResize() {		
				windowHalfX = window.innerWidth / 2;
				windowHalfY = window.innerHeight / 2;
				DPR = window.devicePixelRatio;
				var aspect  = windowHalfX / windowHalfY;
				
				camera_orth.aspect = camera_pers.aspect = aspect;
				camera_orth.left   = camera_orth.bottom * aspect;
				camera_orth.right  = camera_orth.top * aspect;
				camera_orth.updateProjectionMatrix();
				
				camera_pers.updateProjectionMatrix();
				
				renderer.setSize( windowHalfX * 2, windowHalfY * 2);//argument needn't multiply DPR here, as it will be 
				//$(canvas2d).attr("width", windowHalfX * 2);         // done inside the function
				//$(canvas2d).attr("height",windowHalfX * 2);				
				
				if(showGrid){
					generateGrid2D();				
				}	
										
			}

			function onDocumentMouseMove( event ) {
				//mouseX = ( event.clientX - windowHalfX ) / 2;
				//mouseY = ( event.clientY - windowHalfY ) / 2;
				
				//mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
				//mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
							
			}

			function onDocumentMouseClick( event ){				
				mouse.x =   event.clientX / windowHalfX - 1;
				mouse.y = - event.clientY / windowHalfY + 1;	
				
				// update the picking ray with the camera and mouse position	
				raycaster.setFromCamera( mouse, camera );	
				
				// calculate objects intersecting the picking ray
				var intersects = raycaster.intersectObjects( scene.children,true );
				if(intersects.length > 0){
						var intersects0 = intersects[0];
						var geometry0   = intersects0.object.geometry;
						var face = intersects0.face;
						var faceIndex = intersects0.faceIndex;
					//	face.color = new THREE.Color(0xff0000);
						
						var colors   = geometry0.attributes.color.array;
						var position = geometry0.attributes.position.array; 
						
						var faceIndices = [ face.a, face.b, face.c ];
						for (var i = 0 ; i < 3; i++) {
							var index = faceIndices[0] * 3;
							colors[index] 		= 255;
							colors[index + 1] 	= 0;
							colors[index + 2] 	= 0;							
						}	
						geometry0.attributes.color.needsUpdate = true;	
						console.log(intersects0.object.name, position[face.a * 3], position[face.a * 3 + 1], position[face.a * 3 + 2]);				
				}					
			}
			
			function onDocumentMousedbClick( event ){
				console.log("double click...");
				if(showGrid){
					return;// do nothing...
				}
				if(camera == camera_orth){
					camera = camera_pers;
				}
				else{
					camera = camera_orth;	
				}
				
				//renderer.setViewport(20, 0, windowHalfX * 2, windowHalfY * 2);
			}

			function onMouseDrag(event){ 
				console.log('drag...')
				var UpperGumMesh = meshes_container.getObjectByName('U0'),
					LowerGumMesh = meshes_container.getObjectByName('L0');
                var rotation = camera.rotation.clone();
				rotation.x = -rotation.x;
				rotation.y = -rotation.y;
				rotation.z = -rotation.z;
				
				var lines = UpperGumMesh.children;
				var direction;
				for(var i = 0; i < lines.length; ++i){
					var lineMesh = lines[i];
					var id = lineMesh.name;
					direction = new THREE.Vector3(ipr_info[ id + 2], ipr_info[ id + 3], ipr_info[ id + 4] );
					direction.applyEuler(rotation);	
					if(direction.x < 0){
						lineMesh.visible = false;
					} else{
						lineMesh.visible = true;
					}					
				}
			}
			
			function animate() 
			{	
				setTimeout(function() {
						requestAnimationFrame( animate );
						render();	
						}, 1000 / 10);	//fps == 10			
			}

			function render() {	
			
				var delta = clock.getDelta();
				trackballControls_orth.update(delta);
				trackballControls_pers.update(delta);
				/*var origin = new THREE.Vector3(0, 0, 0);
				origin.applyMatrix4(camera.matrixWorld);
				console.log(origin);
				trackballControls_orth.target.set( 0, origin.y, origin.z );
				trackballControls_pers.target.set( 0, origin.y, origin.z);*/
				
				//s = (s + 1) % 30;
				showStage(0);
				
				directionalLight.position.copy(camera.position);				
				renderer.render( scene, camera );	
						
				generateIPR(canvas2dIPR);		
			}

			function mousewheel( event ) {
				event.preventDefault();
				//event.stopPropagation();
				
				var delta = 0;
				if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9
					delta = event.wheelDelta / 40;
				} else if ( event.detail ) { // Firefox
					delta = - event.detail / 3;
				}
				
				var aspect = windowHalfX / windowHalfY;	
				/*original width and height*/
				var width  = 100 * aspect;
				var height = 100;         	

				var preZoomFactor = zoomFactor;
				zoomFactor -= delta * 0.001;	
							
				/*var _eye = new THREE.Vector3(0, 0, 1);
				_eye.applyMatrix4 (camera_pers.matrixWorldInverse);
				_eye.multiplyScalar(factor * zoomFactor / preZoomFactor);
				var eyeDis = Math.abs(_eye.z);*/ // 250 is the initial distance from camera to target.
												
				var tfactor = factor * zoomFactor/ preZoomFactor;
				if(tfactor > 0.15 && tfactor < 3.6){ // max zoom out factor 900/250 = 3.6  
					factor = tfactor;				 // max zoom in factor 37.5 / 250 = 0.15
				}
				else if(tfactor > 3.6){
					factor = 3.6;
					zoomFactor = preZoomFactor;
				}
				else{
					factor = 0.15;
					zoomFactor = preZoomFactor;
				}				
							
				camera_orth.left   = -factor * width;
				camera_orth.right  = factor  * width;
				camera_orth.top    = factor  * height;
				camera_orth.bottom = -factor * height;
				camera_orth.updateProjectionMatrix();
				
				camera_pers.position.normalize().multiplyScalar(factor * 250);
				camera_pers.updateProjectionMatrix();
				
				if(showGrid){
					generateGrid2D();				
				}				
			}