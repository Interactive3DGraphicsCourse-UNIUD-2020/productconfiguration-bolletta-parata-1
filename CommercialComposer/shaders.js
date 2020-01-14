
		//variabili provenienti dal Vertex 
		varying vec3 vPosition;
		varying vec3 wPosition;
					
		varying vec3 vNormal;
		varying vec2 vUv;
		
		uniform float MAX_LIGHT;				//Numero di luci
		uniform vec3 lightPosition[5];			//Array di luci
		uniform vec3 Clight;					//Colore di tutte le luci
		uniform vec3 Color;						//Colore moltiplicativo della BRDF
		uniform float FattBlend;				//valore di scelta Glossy<-->Diffuse
		uniform float FattEmiss;				//valore di scelta BRDF<-->Emission
		uniform sampler2D specularMap;			//Immmagine Specular
		uniform sampler2D diffuseMap;			//Immagine Diffuse
		uniform sampler2D roughnessMap;			//Immagine Rugosità
		uniform sampler2D normalMap;			//Immagine Normale
		uniform sampler2D emissionMap;			//Immagine Emission
		uniform samplerCube envMap;				//Immagine Cubica d'Ambiente
		uniform vec2 normalScale;				//valore moltiplicativo sulla normale
		uniform vec2 textureRepeat;				//numero duplicazioni (x,y) delle immagini
		uniform int type;						//Tipo miscelamento (0:Diffuse, 1:tessuto)
		
		
		const float PI = 3.14159;
		
		vec3 cdiff;
		vec3 cspec;
		vec3 cEm;
		vec3 emiss;
		float roughness;
		
		//Schlick Frensel con con riflessione sphericalGaussiana 
		//specular	: mappa speculare
		//VdotH		: dot(Camera dirView e half Vector)
		vec3 SchlickFresnelCustom(vec3 specular, float VdotH)
		{
			float sphericalGaussian = pow(2.0, (-5.55473 * VdotH - 6.98316) * VdotH);
			return specular + (vec3(1.0, 1.0, 1.0) - specular) * sphericalGaussian;
		}
			
		//Valore di Frensel
		//specular	: mappa speculare
		//VdotH		: dot(Camera dirView e half Vector)
		vec3 Fresnel(vec3 specular, float VdotH)
		{
			return SchlickFresnelCustom(specular, VdotH);
		}
		
		/*
			
			D_Charlie per la distribuzione del colore per simulare i tessuti/velvet
			roughness	: mappa ruvidezza
			NoH			: dot(Normale e half Vector)
			
			Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
		*/
		float D_Charlie(float roughness, float NoH) {
			float invAlpha  = 1.0 / max(roughness, 0.0000001);
			float cos2h = NoH * NoH;
			float sin2h = max(1.0 - cos2h, 0.007874); // 2^(-14/2): sin2h^2 > 0
			return (4.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);
		}
		
		//Valore di distribuzione del colore per simulare i tessuti/velvet
		//roughness	: mappa ruvidezza
		//NoH		: dot(Normale e half Vector)
		float distributionCloth(float roughness, float NoH) {
			return D_Charlie(roughness, NoH);
		}
		
		
		//Glossy function SmithGGXSchlick 
		//NdotL		: dot(Normale e lightPos)
		//NdotV		: dot(Normale e Camera dirView)
		//roughness	: mappa ruvidezza
		float SmithGGXSchlickVisibility(float NdotL, float NdotV, float roughness)
		{
			float rough2 = roughness * roughness;
			float lambdaV = NdotL  * sqrt((-NdotV * rough2 + NdotV) * NdotV + rough2);   
			float lambdaL = NdotV  * sqrt((-NdotL * rough2 + NdotL) * NdotL + rough2);
		
			return 0.5 / (lambdaV + lambdaL);
		}
		
		//funzione di Diffuse:lambertian
		//diffuseColor : colore
		vec3 LambertianDiffuse(vec3 diffuseColor)
		{
			return diffuseColor * (1.0 / PI);
		}
		
		// funzione Diffuse: Lambertian modificata con valori di ruvidezza
		// diffuseColor : il colore
		// roughness    : roughness
		// NdotV        : dot(Normale e Camera dirView)
		// NdotL        : dot(Normale e posLuce)
		// VdotH        : dot(Camera dirView e half Vector)
		vec3 CustomLambertianDiffuse(vec3 diffuseColor, float NdotV, float roughness)
		{
			return diffuseColor * (1.0 / PI) * pow(NdotV, 0.5 + 0.3 * roughness);
		}
		
		// funzione Diffuse: Burley(Disney) Diffuse
		// diffuseColor : il colore
		// roughness    : roughness
		// NdotV        : dot(Normale e Camera dirView)
		// NdotL        : dot(Normale e posLuce)
		// VdotH        : dot(Camera dirView e half Vector)
		vec3 BurleyDiffuse(vec3 diffuseColor, float roughness, float NdotV, float NdotL, float VdotH)
		{
			float energyBias = mix(roughness, 0.0, 0.5);
			float energyFactor = mix(roughness, 1.0, 1.0 / 1.51);
			float fd90 = energyBias + 2.0 * VdotH * VdotH * roughness;
			float f0 = 1.0;
			float lightScatter = f0 + (fd90 - f0) * pow(1.0 - NdotL, 5.0);
			float viewScatter = f0 + (fd90 - f0) * pow(1.0 - NdotV, 5.0);

			return diffuseColor * lightScatter * viewScatter * energyFactor;
		}
		
		#extension GL_OES_standard_derivatives : enable
		
		//funzione per normale delle mcrofacce
		//eye_pos		: Camera Position)
		//surf_norm		: Normale
		vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {
			vec3 q0 = dFdx( eye_pos.xyz );
			vec3 q1 = dFdy( eye_pos.xyz );
			vec2 st0 = dFdx( vUv.st );
			vec2 st1 = dFdy( vUv.st );
			vec3 S = normalize(  q0 * st1.s - q1 * st0.t );
			vec3 T = normalize( -q0 * st1.s + q1 * st0.t );
			vec3 N =  surf_norm ;
			vec3 mapN = normalize(texture2D( normalMap, vUv*textureRepeat ).xyz * 2.0 - 1.0);
			mapN.xy = normalScale * mapN.xy;
			mat3 tsn = mat3( S, T, N );
			return normalize( tsn * mapN );
		}
		
		//inversione di direzione
		//dir		: direzione
		//matrix	: matrice con cui invertire
		vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
			return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
		}
		
		//colore di riflessione della skybox
		vec3 environment(){
			vec3 n = perturbNormal2Arb( vPosition, normalize( vNormal ));  // interpolation destroys normalization, so we have to normalize
			vec3 worldN = inverseTransformDirection( n, viewMatrix );
			vec3 worldV = cameraPosition - wPosition ;
			vec3 r =normalize( reflect(-worldV,worldN));
			return pow( textureCube( envMap, vec3(-r.x, r.yz)).rgb, vec3(2.2));
			
		}
		
		//BRDF modificata data la posizione della luce
		//lightPos	: posizione luce
		vec3 BRDFNorm(vec3 lightPos){
			
			vec4 lPosition = viewMatrix * vec4( lightPos, 1.0 );
			
			vec3 l = normalize(lPosition.xyz - vPosition.xyz);
			vec3 n = perturbNormal2Arb( vPosition, normalize( vNormal ));;
			vec3 v = normalize( -vPosition);
			vec3 h = normalize( v + l);
			// small quantity to prevent divisions by 0
			float nDotl = min(max(dot( n, l ),0.0000001),1.0);
			float lDoth = min(max(dot( l, h ),0.0000001),1.0);
			float nDoth = min(max(dot( n, h ),0.0000001),1.0);
			float vDoth = min(max(dot( v, h ),0.0000001),1.0);
			float nDotv = min(max(dot( n, v ),0.0000001),1.0);
			
			vec3 reFlect = environment();																							//colore di riflessione del skybox
			
			vec3 fresnel = Fresnel(cspec, vDoth);
			vec3 BRDF = ((vec3(FattBlend)*fresnel)*((reFlect*SmithGGXSchlickVisibility(nDotl,nDotv, roughness))));					//Glossy part
			BRDF *=(min(max(0.0, 1.0/length(vPosition)), 1.0));
			vec3 Burley = (BurleyDiffuse(cdiff,roughness,nDotv,nDotl, nDoth));														//Burley color
			//vec3 Lambertian = LambertianDiffuse(cdiff);
			//vec3 LambertianD = CustomLambertianDiffuse(cdiff,nDotv,roughness);
			if(type==1){
				float cloth = distributionCloth((roughness), sqrt(nDotv)*0.8+nDoth*0.2);											//cloth distribution
				cloth = max(cloth, 0.0025);																							//rimuove colore troppo scuro
			
				BRDF += ((vec3(1.0-FattBlend))*Burley * (cloth))*(min(max(0.0, 1.0/length(vPosition)), 1.0));						//Diffuse part con tessuto							
			}else{
				BRDF += 1.0/length(lPosition)*Burley;																				//Diffuse part
			}
			
			return nDotl*BRDF/2.0;
			
		}
		
		
		
		
		
		void main(){
			cdiff = texture2D( diffuseMap, vUv*textureRepeat ).rgb;
			// texture in sRGB, linearize
			cdiff = pow( cdiff, vec3(2.2));
			cspec = texture2D( specularMap, vUv*textureRepeat ).rgb;
			// texture in sRGB, linearize
			cspec = pow( cspec, vec3(2.2));
			roughness = texture2D( roughnessMap, vUv*textureRepeat).r; // no need to linearize roughness map

			//BRDF una per ogni luce
			vec3 BRDFTot = vec3(0.0);
			for(int i=0; i<5; i++){
					BRDFTot += BRDFNorm(lightPosition[i]);
			}
			BRDFTot =  BRDFTot/MAX_LIGHT ;
			
			//coeff emission
			cEm = texture2D(emissionMap, vUv*textureRepeat).rgb;
			cEm = pow( cEm, vec3(3.5));
			
			vec3 outRadiance = (max((1.0-FattEmiss),0.0)*(PI* Clight * BRDFTot)*(1.0-cEm)+ (FattEmiss*cEm*cdiff*PI))*Color;			//Mix tra BRDF e emission
			// gamma encode the final value
			gl_FragColor = vec4(pow( outRadiance, vec3(1.0/2.2)), 1.0);
		}				
		


		attribute vec4 tangent;
	
		uniform sampler2D displacementMap;
		uniform float displacementScale;
		uniform vec2 textureRepeat;
		
		varying vec3 vNormal;
		varying vec3 vPosition;
		varying vec3 wPosition;
		varying vec2 vUv;
		
		void main() {
			
			vec4 displacementMapN = texture2D(displacementMap, uv*textureRepeat);
			vec4 vPos = modelViewMatrix * vec4( displacementScale*displacementMapN.xyz*normal+position, 1.0 );
			vPosition = vPos.xyz;
			wPosition = (modelMatrix *vec4( position, 1.0 )).xyz;
			vNormal = normalize(normalMatrix * normal);
			vec3 objectTangent = vec3( tangent.xyz );
			vec3 transformedTangent = normalMatrix * objectTangent;
			vUv = uv;
			gl_Position = projectionMatrix * vPos;
		}
	