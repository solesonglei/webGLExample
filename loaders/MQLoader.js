
THREE.MQLoader = function(manager){
	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
}

THREE.MQLoader.prototype = {
	constructor: THREE.MQLoader,
	
	load: function(url, onLoad, onProgress, onError){
		
		 var scope  = this;
		 
		 var loader = new THREE.XHRLoader(scope.manager);
		 loader.setResponseType('arraybuffer');
		 loader.load(url, function(data){
		 
			 onLoad(scope.parse(data));
						 
		 }, onProgress, onError);
	},
	
	parse: function(data)
	{		
		console.time( 'MQLoader' );
	
		var reader = new DataView(data);
		var cursor = 0;
		var pid =  reader.getInt32(0,true);//set true as 32bit is stored in little-edian format by us.
		cursor += 4;
					
		var modelNum = reader.getInt32(cursor, true);
		cursor += 4;
					
		var container = new THREE.Group();
		for (var i = 0 ; i < modelNum; ++i)
		{
			var geometry = new THREE.BufferGeometry();
			var normals,
				vertices,
				indices;
		
			var modelNameLen = reader.getInt32(cursor, true);
			cursor += 4;
						
			var modelName = '';
			for (var j = 0; j < modelNameLen; ++j){
				var character = reader.getInt8(cursor,true);
				character =  String.fromCharCode(character);
				cursor += 1;
				modelName += character;
			}
						
			var verticesNum = reader.getInt32(cursor,true);
			cursor += 4;
			var facesNum = reader.getInt32(cursor, true);
			cursor += 4;
			
			indices      = new Uint32Array(facesNum * 3);
			vertices     = new Float32Array(verticesNum * 3);
			colors       = new Uint8Array(verticesNum * 3);
								
			// Read Vertices
			for (var j = 0 ; j < verticesNum ; ++j){
				var x,y,z;
				x = reader.getFloat32(cursor, true);
				cursor += 4;
				y = reader.getFloat32(cursor, true);
				cursor += 4;
				z = reader.getFloat32(cursor, true);
				cursor += 4;
				vertices[j * 3]     = x;
				vertices[j * 3 + 1] = y;
				vertices[j * 3 + 2] = z;
			}
			// Read Faces
			for (var j = 0; j < facesNum;  ++j){
			    var a,b,c; // indices of one face's vertices
				a = reader.getInt32(cursor, true) - 1;
				cursor += 4;
				b = reader.getInt32(cursor, true) - 1;
				cursor += 4;
				c = reader.getInt32(cursor,true) - 1;
				cursor += 4;
				
				indices[j * 3]		= a;
				indices[j * 3 + 1]  = b;
				indices[j * 3 + 2]  = c;
			}
			
			var tooth_r = 222,
				tooth_g = 216,
				tooth_b = 196;
			var gum_r = 193,
				gum_g = 143,
				gum_b = 139;
				
			for(var j = 0; j < verticesNum * 3; j += 3){
				if(modelName[modelNameLen - 1] == '0'){
					colors[j]     = gum_r;
					colors[j + 1] = gum_g;
					colors[j + 2] = gum_b;			
				}
				else{
					colors[j]     = tooth_r;
					colors[j + 1] = tooth_g;
					colors[j + 2] = tooth_b;					
				}
			}			
			geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
			geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.addAttribute( 'color',    new THREE.BufferAttribute( colors, 3, true ) );
			var mesh = new THREE.Mesh(geometry);
			mesh.name = modelName;
			container.add(mesh);
		}	
		console.timeEnd( 'OBJLoader' );
		return container;
	}
}

// in case that some browser dont support DataView.
if ( typeof DataView === 'undefined' ) {

	DataView = function( buffer, byteOffset, byteLength ) {

		this.buffer = buffer;
		this.byteOffset = byteOffset || 0;
		this.byteLength = byteLength || buffer.byteLength || buffer.length;
		this._isString = typeof buffer === "string";

	};

	DataView.prototype = {

		_getCharCodes: function( buffer, start, length ) {

			start = start || 0;
			length = length || buffer.length;
			var end = start + length;
			var codes = [];
			for ( var i = start; i < end; i ++ ) {

				codes.push( buffer.charCodeAt( i ) & 0xff );

			}
			return codes;

		},

		_getBytes: function ( length, byteOffset, littleEndian ) {

			var result;

			// Handle the lack of endianness
			if ( littleEndian === undefined ) {

				littleEndian = this._littleEndian;

			}

			// Handle the lack of byteOffset
			if ( byteOffset === undefined ) {

				byteOffset = this.byteOffset;

			} else {

				byteOffset = this.byteOffset + byteOffset;

			}

			if ( length === undefined ) {

				length = this.byteLength - byteOffset;

			}

			// Error Checking
			if ( typeof byteOffset !== 'number' ) {

				throw new TypeError( 'DataView byteOffset is not a number' );

			}

			if ( length < 0 || byteOffset + length > this.byteLength ) {

				throw new Error( 'DataView length or (byteOffset+length) value is out of bounds' );

			}

			if ( this.isString ) {

				result = this._getCharCodes( this.buffer, byteOffset, byteOffset + length );

			} else {

				result = this.buffer.slice( byteOffset, byteOffset + length );

			}

			if ( ! littleEndian && length > 1 ) {

				if ( Array.isArray( result ) === false ) {

					result = Array.prototype.slice.call( result );

				}

				result.reverse();

			}

			return result;

		},

		// Compatibility functions on a String Buffer

		getFloat64: function ( byteOffset, littleEndian ) {

			var b = this._getBytes( 8, byteOffset, littleEndian ),

				sign = 1 - ( 2 * ( b[ 7 ] >> 7 ) ),
				exponent = ( ( ( ( b[ 7 ] << 1 ) & 0xff ) << 3 ) | ( b[ 6 ] >> 4 ) ) - ( ( 1 << 10 ) - 1 ),

			// Binary operators such as | and << operate on 32 bit values, using + and Math.pow(2) instead
				mantissa = ( ( b[ 6 ] & 0x0f ) * Math.pow( 2, 48 ) ) + ( b[ 5 ] * Math.pow( 2, 40 ) ) + ( b[ 4 ] * Math.pow( 2, 32 ) ) +
							( b[ 3 ] * Math.pow( 2, 24 ) ) + ( b[ 2 ] * Math.pow( 2, 16 ) ) + ( b[ 1 ] * Math.pow( 2, 8 ) ) + b[ 0 ];

			if ( exponent === 1024 ) {

				if ( mantissa !== 0 ) {

					return NaN;

				} else {

					return sign * Infinity;

				}

			}

			if ( exponent === - 1023 ) {

				// Denormalized
				return sign * mantissa * Math.pow( 2, - 1022 - 52 );

			}

			return sign * ( 1 + mantissa * Math.pow( 2, - 52 ) ) * Math.pow( 2, exponent );

		},

		getFloat32: function ( byteOffset, littleEndian ) {

			var b = this._getBytes( 4, byteOffset, littleEndian ),

				sign = 1 - ( 2 * ( b[ 3 ] >> 7 ) ),
				exponent = ( ( ( b[ 3 ] << 1 ) & 0xff ) | ( b[ 2 ] >> 7 ) ) - 127,
				mantissa = ( ( b[ 2 ] & 0x7f ) << 16 ) | ( b[ 1 ] << 8 ) | b[ 0 ];

			if ( exponent === 128 ) {

				if ( mantissa !== 0 ) {

					return NaN;

				} else {

					return sign * Infinity;

				}

			}

			if ( exponent === - 127 ) {

				// Denormalized
				return sign * mantissa * Math.pow( 2, - 126 - 23 );

			}

			return sign * ( 1 + mantissa * Math.pow( 2, - 23 ) ) * Math.pow( 2, exponent );

		},

		getInt32: function ( byteOffset, littleEndian ) {

			var b = this._getBytes( 4, byteOffset, littleEndian );
			return ( b[ 3 ] << 24 ) | ( b[ 2 ] << 16 ) | ( b[ 1 ] << 8 ) | b[ 0 ];

		},

		getUint32: function ( byteOffset, littleEndian ) {

			return this.getInt32( byteOffset, littleEndian ) >>> 0;

		},

		getInt16: function ( byteOffset, littleEndian ) {

			return ( this.getUint16( byteOffset, littleEndian ) << 16 ) >> 16;

		},

		getUint16: function ( byteOffset, littleEndian ) {

			var b = this._getBytes( 2, byteOffset, littleEndian );
			return ( b[ 1 ] << 8 ) | b[ 0 ];

		},

		getInt8: function ( byteOffset ) {

			return ( this.getUint8( byteOffset ) << 24 ) >> 24;

		},

		getUint8: function ( byteOffset ) {

			return this._getBytes( 1, byteOffset )[ 0 ];

		}

	 };

}


