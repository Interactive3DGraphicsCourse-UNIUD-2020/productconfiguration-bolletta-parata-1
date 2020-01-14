var FragmentShaderText=	"//variabili provenienti dal Vertex \n"+
		"varying vec3 vPosition;\n"+
		"varying vec3 wPosition;\n"+
		"varying vec3 vTangent;\n"+
		"varying vec3 vBitangent;\n"+
		"varying vec3 vNormal;\n"+
		"varying vec2 vUv;\n"+
		"uniform float MAX_LIGHT;				//Numero di luci\n"+
		"uniform vec3 lightPosition[5];			//Array di luci\n"+
		"uniform vec3 Clight;					//Colore di tutte le luci\n"+
		"uniform vec3 Color;					//Colore moltiplicativo della BRDF\n"+
		"uniform float FattBlend;				//valore di scelta Glossy<-->Diffuse\n"+
		"uniform float FattEmiss;				//valore di scelta BRDF<-->Emission\n"+
		"uniform sampler2D specularMap;			//Immmagine Specular\n"+
		"uniform sampler2D diffuseMap;			//Immagine Diffuse\n"+
		"uniform sampler2D roughnessMap;		//Immagine Rugosità\n"+
		"uniform sampler2D normalMap;			//Immagine Normale\n"+
		"uniform sampler2D emissionMap;			//Immagine Emission\n"+
		"uniform samplerCube envMap;			//Immagine Cubica d'Ambiente\n"+
		"uniform vec2 normalScale;				//valore moltiplicativo sulla normale\n"+
		"uniform vec2 textureRepeat;			//numero duplicazioni (x,y) delle immagini\n"+
		"uniform int type;						//Tipo miscelamento (0:Diffuse, 1:tessuto)\n"+
		"const float PI = 3.14159;\n"+
		"vec3 cdiff;\n"+
		"vec3 cspec;\n"+
		"vec3 cEm;\n"+
		"vec3 emiss;\n"+
		"float roughness;\n"+
		"//Schlick Frensel con con riflessione sphericalGaussiana \n"+
		"//specular	: mappa speculare\n"+
		"//VdotH		: dot(Camera dirView e half Vector)\n"+
		"vec3 SchlickFresnelCustom(vec3 specular, float VdotH)\n"+
		"{\n"+
		"	float sphericalGaussian = pow(2.0, (-5.55473 * VdotH - 6.98316) * VdotH);\n"+
		"	return specular + (vec3(1.0, 1.0, 1.0) - specular) * sphericalGaussian;\n"+
		"}\n"+
		"//Valore di Frensel\n"+
		"//specular	: mappa speculare\n"+
		"//VdotH		: dot(Camera dirView e half Vector)\n"+
		"vec3 Fresnel(vec3 specular, float VdotH)\n"+
		"{\n"+
		"	return SchlickFresnelCustom(specular, VdotH);\n"+
		"}\n"+
		"/*\n"+
		"	D_Charlie per la distribuzione del colore per simulare i tessuti/velvet\n"+
		"	roughness	: mappa ruvidezza\n"+
		"	NoH			: dot(Normale e half Vector)\n"+
		"	Estevez and Kulla 2017, Production Friendly Microfacet Sheen BRDF\n"+
		"*/\n"+
		"float D_Charlie(float roughness, float NoH) {\n"+
		"	float invAlpha  = 1.0 / max(roughness, 0.0000001);\n"+
		"	float cos2h = NoH * NoH;\n"+
		"	float sin2h = max(1.0 - cos2h, 0.007874); // 2^(-14/2): sin2h^2 > 0\n"+
		"	return (4.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);\n"+
		"}\n"+
		"//Valore di distribuzione del colore per simulare i tessuti/velvet\n"+
		"//roughness	: mappa ruvidezza\n"+
		"//NoH		: dot(Normale e half Vector)\n"+
		"float distributionCloth(float roughness, float NoH) {\n"+
		"	return D_Charlie(roughness, NoH);\n"+
		"}\n"+
		"//Glossy function SmithGGXSchlick \n"+
		"//NdotL		: dot(Normale e lightPos)\n"+
		"//NdotV		: dot(Normale e Camera dirView)\n"+
		"//roughness	: mappa ruvidezza\n"+
		"float SmithGGXSchlickVisibility(float NdotL, float NdotV, float roughness)\n"+
		"{\n"+
		"	float rough2 = roughness * roughness;\n"+
		"	float lambdaV = NdotL  * sqrt((-NdotV * rough2 + NdotV) * NdotV + rough2);   \n"+
		"	float lambdaL = NdotV  * sqrt((-NdotL * rough2 + NdotL) * NdotL + rough2);\n"+
		"	return 0.5 / max((lambdaV + lambdaL), 0.001);\n"+
		"}\n"+
		"//funzione di Diffuse:lambertian\n"+
		"//diffuseColor : colore\n"+
		"vec3 LambertianDiffuse(vec3 diffuseColor)\n"+
		"{\n"+
		"	return diffuseColor * (1.0 / PI);\n"+
		"}\n"+
		"// funzione Diffuse: Lambertian modificata con valori di ruvidezza\n"+
		"// diffuseColor : il colore\n"+
		"// roughness    : roughness\n"+
		"// NdotV        : dot(Normale e Camera dirView)\n"+
		"// NdotL        : dot(Normale e posLuce)\n"+
		"// VdotH        : dot(Camera dirView e half Vector)\n"+
		"vec3 CustomLambertianDiffuse(vec3 diffuseColor, float NdotV, float roughness)\n"+
		"{\n"+
		"	return diffuseColor * (1.0 / PI) * pow(NdotV, 0.5 + 0.3 * roughness);\n"+
		"}\n"+
		"// funzione Diffuse: Burley(Disney) Diffuse\n"+
		"// diffuseColor : il colore\n"+
		"// roughness    : roughness\n"+
		"// NdotV        : dot(Normale e Camera dirView)\n"+
		"// NdotL        : dot(Normale e posLuce)\n"+
		"// VdotH        : dot(Camera dirView e half Vector)\n"+
		"vec3 BurleyDiffuse(vec3 diffuseColor, float roughness, float NdotV, float NdotL, float VdotH)\n"+
		"{\n"+
		"	float energyBias = mix(roughness, 0.0, 0.5);\n"+
		"	float energyFactor = mix(roughness, 1.0, 1.0 / 1.51);\n"+
		"	float fd90 = energyBias + 2.0 * VdotH * VdotH * roughness;\n"+
		"	float f0 = 1.0;\n"+
		"	float lightScatter = f0 + (fd90 - f0) * pow(1.0 - NdotL, 5.0);\n"+
		"	float viewScatter = f0 + (fd90 - f0) * pow(1.0 - NdotV, 5.0);\n"+
		"	return diffuseColor * lightScatter * viewScatter * energyFactor;\n"+
		"}\n"+
		"#extension GL_OES_standard_derivatives : enable\n"+
		"//funzione per normale delle mcrofacce\n"+
		"//eye_pos		: Camera Position)\n"+
		"//surf_norm		: Normale\n"+
		"vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm) {\n"+
		"		vec3 q0 = dFdx( eye_pos.xyz );\n"+
		"		vec3 q1 = dFdy( eye_pos.xyz );\n"+
		"		vec2 st0 = dFdx( vUv.st );\n"+
		"		vec2 st1 = dFdy( vUv.st );\n"+
		"		vec3 S,T;\n"+
		"		if(type==1){\n"+
		"			S = normalize(  q0 * st1.t - q1 * st0.t );\n"+
		"			T = normalize( -q0 * st1.s + q1 * st0.s );\n"+
		"		}else{\n"+
		"			S = normalize(  q0 * st1.s - q1 * st0.t );\n"+
		"			T = normalize( -q0 * st1.s + q1 * st0.t );\n"+
		"		}\n"+
		"		vec3 N =  surf_norm ;\n"+
		"		vec3 mapN = normalize(texture2D( normalMap, vUv*textureRepeat ).xyz * 2.0 - 1.0);\n"+
		"		mapN.xy = normalScale * mapN.xy;\n"+
		"		mat3 tsn = mat3( S, T, N );\n"+
		"		return normalize( tsn * mapN );\n"+
		"}\n"+
		"//inversione di direzione\n"+
		"//dir		: direzione\n"+
		"//matrix	: matrice con cui invertire\n"+
		"vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {\n"+
		"	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );\n"+
		"}\n"+
		"//colore di riflessione della skybox\n"+
		"vec3 environment(){\n"+
		"	vec3 n = perturbNormal2Arb( vPosition, normalize( vNormal ));  // interpolation destroys normalization, so we have to normalize\n"+
		"	vec3 worldN = inverseTransformDirection( n, viewMatrix );\n"+
		"	vec3 worldV = cameraPosition - wPosition ;\n"+
		"	vec3 r =normalize( reflect(-worldV,worldN));\n"+
		"	return pow( textureCube( envMap, vec3(-r.x, r.yz)).rgb, vec3(2.2));\n"+
		"}\n"+
		"//BRDF modificata data la posizione della luce\n"+
		"//lightPos	: posizione luce\n"+
		"vec3 BRDFNorm(vec3 lightPos){\n"+
		"	vec4 lPosition = viewMatrix * vec4( lightPos, 1.0 );\n"+
		"	vec3 l = normalize(lPosition.xyz - vPosition.xyz);\n"+
		"	vec3 n = perturbNormal2Arb( vPosition, normalize( vNormal ));\n"+
		"	vec3 v = normalize( -vPosition);\n"+
		"	vec3 h = normalize( v + l);\n"+
		"	// small quantity to prevent divisions by 0\n"+
		"	float nDotl = min(max(dot( n, l ),0.0001),1.0);\n"+
		"	float lDoth = min(max(dot( l, h ),0.0001),1.0);\n"+
		"	float nDoth = min(max(dot( n, h ),0.0001),1.0);\n"+
		"	float vDoth = min(max(dot( v, h ),0.0001),1.0);\n"+
		"	float nDotv = min(max(dot( n, v ),0.0001),1.0);\n"+
		"	vec3 reFlect = environment();																							//colore di riflessione del skybox\n"+
		"	vec3 fresnel = Fresnel(cspec, vDoth);\n"+
		"	vec3 BRDF = ( ((vec3(FattBlend)*fresnel)*((reFlect*SmithGGXSchlickVisibility(nDotl,nDotv, roughness)))));				//Glossy part\n"+
		"	BRDF *=(min(max(0.0, 1.0/length(vPosition)), 1.0));\n"+
		"	vec3 Burley = (BurleyDiffuse(cdiff,roughness,nDotv,nDotl, nDoth));														//Burley color\n"+
		"	//vec3 Lambertian = LambertianDiffuse(cdiff);\n"+
		"	//vec3 LambertianD = CustomLambertianDiffuse(cdiff,nDotv,roughness);\n"+
		"	if(type==1){\n"+
		"		float cloth = distributionCloth((roughness), sqrt(nDotv)*0.8+nDoth*0.2);											//cloth distribution\n"+
		"		cloth = max(cloth, 0.0005);																							//rimuove colore troppo scuro\n"+
		"		BRDF += ((vec3(1.0-FattBlend))*Burley * (cloth))*(min(max(0.0, 1.0/length(vPosition)), 1.0));						//Diffuse part con tessuto\n"+
		"	}else{\n"+
		"		BRDF += 1.0/length(lPosition)*Burley;																				//Diffuse part\n"+
		"	}\n"+
		"	return (nDotl*BRDF/2.0);\n"+
		"}\n"+
		"void main(){\n"+
		"	cdiff = texture2D( diffuseMap, vUv*textureRepeat ).rgb;\n"+
		"	// texture in sRGB, linearize\n"+
		"	cdiff = pow( cdiff, vec3(2.2));\n"+
		"	cspec = texture2D( specularMap, vUv*textureRepeat ).rgb;\n"+
		"	// texture in sRGB, linearize\n"+
		"	cspec = pow( cspec, vec3(2.2));\n"+
		"	roughness = texture2D( roughnessMap, vUv*textureRepeat).r; // no need to linearize roughness map\n"+
		"	//BRDF una per ogni luce\n"+
		"	vec3 BRDFTot = vec3(0.0);\n"+
		"	for(int i=0; i<5; i++){\n"+
		"			BRDFTot += BRDFNorm(lightPosition[i]);\n"+
		"	}\n"+
		"	BRDFTot =  BRDFTot/MAX_LIGHT ;\n"+
		"	//coeff emission\n"+
		"	cEm = texture2D(emissionMap, vUv*textureRepeat).rgb;\n"+
		"	cEm = pow( cEm, vec3(3.5));\n"+
		"	vec3 outRadiance = (max((1.0-FattEmiss),0.0)*(PI* Clight * BRDFTot)*(1.0-cEm)+ (FattEmiss*cEm*cdiff*PI))*Color;			//Mix tra BRDF e emission\n"+
		"	// gamma encode the final value\n"+
		"	gl_FragColor = vec4(pow( outRadiance, vec3(1.0/2.2)), 1.0);\n"+
		"}";
		