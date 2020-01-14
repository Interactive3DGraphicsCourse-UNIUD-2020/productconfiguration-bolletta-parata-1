var VertexShaderText = "attribute vec4 tangent;\n"+	
"uniform vec2 textureRepeat;\n"+
"varying vec3 vNormal;\n"+
"varying vec3 vPosition;\n"+
"varying vec3 wPosition;\n"+
"varying vec3 vTangent;\n"+
"varying vec3 vBitangent;\n"+
"varying vec2 vUv;\n"+
"void main() {\n"+
"	vec4 vPos   = modelViewMatrix * vec4( position, 1.0 );\n"+
"	vPosition   = vPos.xyz;\n"+
"	wPosition   = (modelMatrix *vec4( position, 1.0 )).xyz;\n"+
"	vNormal     = normalize(normalMatrix * normal);\n"+
"	vec3 objectTangent 		= vec3( tangent.xyz );\n"+
"	vec3 transformedTangent = normalMatrix * objectTangent;\n"+
"	vTangent    = normalize( transformedTangent );\n"+
"	vBitangent  = normalize( cross( vNormal, vTangent ) * tangent.w );\n"+
"	vUv 	    = uv;\n"+
"	gl_Position = projectionMatrix * vPos;\n"+
"}";