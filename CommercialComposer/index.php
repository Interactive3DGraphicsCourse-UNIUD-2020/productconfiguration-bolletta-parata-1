<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
	<meta name="apple-mobile-web-app-capable" content="yes" /> 
	<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
		
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>CommerciaComposer Bolletta & Parata</title>
    <link rel="stylesheet" href="master.css">
    <script src="lib/three.min.js"></script>
	<script src='lib/BufferGeometryUtils.js'></script>
	<script type="text/x-glsl"  id="fragment">
		
		varying vec3 vPosition;
		varying vec3 wPosition;
					
		varying vec3 vNormal;
		varying vec2 vUv;
		uniform float MAX_LIGHT;
		uniform vec3 lightPosition[5];
		uniform vec3 Clight;
		uniform vec3 Color;
		uniform float FattBlend;
		uniform float FattEmiss;
		uniform sampler2D specularMap;
		uniform sampler2D diffuseMap;
		uniform sampler2D roughnessMap;
		uniform sampler2D normalMap;
		uniform sampler2D emissionMap;
		uniform samplerCube envMap;
		uniform vec2 normalScale;
		uniform vec2 textureRepeat;
		uniform int type;
		
		
		const float PI = 3.14159;
		
		vec3 cdiff;
		vec3 cspec;
		vec3 cAO;
		vec3 emiss;
		float roughness;
		
		vec3 SchlickFresnelCustom(vec3 specular, float VdotH)
		{
			float sphericalGaussian = pow(2.0, (-5.55473 * VdotH - 6.98316) * VdotH);
			return specular + (vec3(1.0, 1.0, 1.0) - specular) * sphericalGaussian;
		}

		vec3 Fresnel(vec3 specular, float VdotH)
		{
			return SchlickFresnelCustom(specular, VdotH);
		}
		
		float D_Charlie(float roughness, float NoH) {
			// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
			float invAlpha  = 1.0 / max(roughness, 0.0000001);
			float cos2h = NoH * NoH;
			float sin2h = max(1.0 - cos2h, 0.007874); // 2^(-14/2), so sin2h^2 > 0 in fp16
			return (4.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);
		}
		
		float distributionCloth(float roughness, float NoH) {
			return D_Charlie(roughness, NoH);
		}
		
		float SmithGGXSchlickVisibility(float NdotL, float NdotV, float roughness)
		{
			float rough2 = roughness * roughness;
			float lambdaV = NdotL  * sqrt((-NdotV * rough2 + NdotV) * NdotV + rough2);   
			float lambdaL = NdotV  * sqrt((-NdotL * rough2 + NdotL) * NdotL + rough2);
		
			return 0.5 / (lambdaV + lambdaL);
		}
		
		vec3 LambertianDiffuse(vec3 diffuseColor)
		{
			return diffuseColor * (1.0 / PI);
		}
		
		// Custom Lambertian Diffuse
		// diffuseColor : il colore
		// roughness    : roughness
		// NdotV        : dot(Normale e Camera dirView)
		// NdotL        = dot(Normale e posLuce)
		// VdotH        = dot(Camera dirView e half Vector)
		vec3 CustomLambertianDiffuse(vec3 diffuseColor, float NdotV, float roughness)
		{
			return diffuseColor * (1.0 / PI) * pow(NdotV, 0.5 + 0.3 * roughness);
		}
		
		// Burley Diffuse
		// diffuseColor : il colore
		// roughness    : roughness
		// NdotV        : dot(Normale e Camera dirView)
		// NdotL        = dot(Normale e posLuce)
		// VdotH        = dot(Camera dirView e half Vector)
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
		
		vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
			return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
		}
		
		
		vec3 environment(){
			vec3 n = perturbNormal2Arb( vPosition, normalize( vNormal ));  // interpolation destroys normalization, so we have to normalize
			vec3 worldN = inverseTransformDirection( n, viewMatrix );
			vec3 worldV = cameraPosition - wPosition ;
			vec3 r =normalize( reflect(-worldV,worldN));
			return pow( textureCube( envMap, vec3(-r.x, r.yz)).rgb, vec3(2.2));
			
		}
		
				
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
			
			vec3 reFlect = environment();
			
			vec3 fresnel = Fresnel(cspec, vDoth);
			vec3 BRDF = ((vec3(FattBlend)*fresnel)*((reFlect*SmithGGXSchlickVisibility(nDotl,nDotv, roughness))));
			vec3 Burley = (BurleyDiffuse(cdiff,roughness,nDotv,nDotl, nDoth));
			//vec3 Lambertian = LambertianDiffuse(cdiff);
			//vec3 LambertianD = CustomLambertianDiffuse(cdiff,nDotv,roughness);
			float cloth = distributionCloth((roughness), (nDoth));
			cloth = max(cloth, 0.025);
			if(type==1){
				BRDF = BRDF*(1.0-min(max(0.0, length(vPosition)), 1.0))+((vec3(1.0-FattBlend))*Burley * (cloth))+cloth*0.05;
			}else{
				BRDF += 1.0/length(lPosition)*Burley;
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

			vec3 BRDFTot = vec3(0.0);
			for(int i=0; i<5; i++){
					BRDFTot += BRDFNorm(lightPosition[i]);
			}
			BRDFTot =  BRDFTot/MAX_LIGHT ;
			
			cAO = texture2D(emissionMap, vUv*textureRepeat).rgb;
			cAO = pow( cAO, vec3(3.5));
			vec3 outRadiance = (max((1.0-FattEmiss),0.0)*(PI* Clight * BRDFTot)*(1.0-cAO)+ (FattEmiss*cAO*cdiff*PI))*Color;
			// gamma encode the final value
			gl_FragColor = vec4(pow( outRadiance, vec3(1.0/2.2)), 1.0);
		}				
		
	</script>
	<script type="text/x-glsl" id="vertex">
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
	</script>
	<script src="scripts.js"></script>
	
	<script src="lib/OBJLoader.js"></script>
	<script src="lib/stats.min.js"></script>
	<script src="lib/CopyShader.js"></script>
	<script src="lib/OrbitControls.js"></script>
	<script src="lib/EffectComposer.js"></script>
	<script src="lib/ShaderPass.js"></script>
	<script src="lib/RenderPass.js"></script>
	<script src="lib/GammaCorrectionShader.js"></script>
	<script src="lib/FXAAShader.js"></script>
    <link rel="stylesheet" href="bootstrap-4_3_1/css/bootstrap.min.css">
</head>

<body>
	<<div id="composerRenderer">
		<div id="canvasRender"></div>
		<!--<div id="side-bar">
			<div id="side-bar-zona" onclick="replace_side('material', 'color','material_copertura','zone')"> ZONA </div>
			<div id="side-bar-materiale" onclick="replace_side('color','zone','material_copertura','material')">MATERIALE </div>
			<div id="side-bar-colore" onclick="replace_side('zone','material','material_copertura','color')"> COLORE</div>
		</div>-->
	</div>
	<!--MENU --->
	<div id="menu" class="container">
		<!-- Zone -->
		<div class="row" id="zone" style="display: flex;">
			<div class=" col-sm" id="zona_1" onclick="getValue(this.id); replace('zone','material')">
				<div class="selected">Rivestimento<br><img id="RivIma" src=""></div>
			</div>
			<div class="col-sm" id="zona_2" onclick="getValue(this.id); replace('zone','material_copertura')">
				<div class="selected">Copertura<br><img id="CopIma" src=""></div>
			</div>
		</div>
		<!-- Materiali del rivestimento -->
		<div class="row" id="material" style="display:none;" onclick="replace('material','color')">
			<div class="col-sm" id="material_1" onclick="getValue(this.id)">
				<div class="selected">Carbonio<br><img src="img/materials/material_1.jpg"></div>
			</div>
			<div class="col-sm" id="material_2" onclick="getValue(this.id)">
				<div class="selected">Metallo<br><img src="img/materials/material_6.jpg"></div>
			</div>
			<div class="col-sm" id="material_3" onclick="getValue(this.id)">
				<div class="selected">Tessuto<br><img src="img/materials/material_3.jpg"></div>
			</div>
		</div>
		<!-- Materiali della copertura-->
		<div class="row" id="material_copertura" style="display:none;" onclick="replace('material_copertura','color')">
			<div class="col-sm" id="material_1" onclick="getValue(this.id)">
				<div class="selected">Plastica<br><img src="img/materials/material_4.jpg"></div>
			</div>
			<div class="col-sm" id="material_2" onclick="getValue(this.id)">
				<div class="selected">Legno<br><img src="img/materials/material_5.jpg"></div>
			</div>
			<div class="col-sm" id="material_3" onclick="getValue(this.id)">
				<div class="selected">Ceramica<br><img src="img/materials/material_2.jpg"></div>
			</div>
		</div>
		<!--Colore-->
		<div class="row" id="color" style="display:none;" onclick="replace('color','zone')">
			<div class="col-sm" id="color_1" onclick="getValue(this.id)">
				<div class="selected"> Rosso <br><img src="img/colors/color_1.png">
				</div>
			</div>
			<div class="col-sm" id="color_2" onclick="getValue(this.id)">
				<div class="selected">Verde <br><img src="img/colors/color_3.png">
				</div>
			</div>
			<div class="col-sm" id="color_3" onclick="getValue(this.id)">
				<div class="selected">Blu <br><img src="img/colors/color_2.png"> </div>
			</div>
			<div class="col-sm" id="color_4" onclick="getValue(this.id)">
				<div class="selected">Default <br><img id="defaultColor" src=""> </div>
			</div>
		</div>
		
<script>
		
		
			var scene, camera, renderer, stats, composer;
			var OBJModel = {model:null, material:Array()};
			var textureCube;
			var renderCanvas;
			var updateProcess;
			
			var textureIndex1 = 2, textureIndex2 = 1;
			var TextureCopertura = new Array("Copertura_Tessuto1","Copertura_Tessuto2","Copertura_Tessuto3");
			var TexturePlastica = new Array("Plastic","Wood","Iron");
			var MaterialRoughness = new Array(new Array(0.05, 0.05, 0.1), new Array(0.025, 0.15, 0.1), new Array(0.05, 1.25, 0.1));
			
			var textureParametersCopertura = {
				material: TextureCopertura[textureIndex1],
				repeatS: 0.9945,
				repeatT: 1.0,
			}
			var textureParametersPlastica = {
				material: TexturePlastica[textureIndex2],
				repeatS: 1.0,
				repeatT: 1.0,
			}
			var textureParametersDisplay = {
				material: "Display_Image",
				repeatS: 1.0,
				repeatT: 1.0,
			}
						
			var MaterialCopertura={
				color : new THREE.Vector3(1.0,1.0,1.0),
				diffuseMap : 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Diffuse.jpg" ),
				specularMap : 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Specular.jpg" ),
				roughnessMap : 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Roughness.jpg" ),
				normalMap :	 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Normal.jpg" ),
				emissionMap : 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Emission.jpg" ),
				emission : 0.0,
				roughness : MaterialRoughness[textureIndex1][0],
				repeat : new THREE.Vector2(textureParametersCopertura.repeatS, textureParametersCopertura.repeatT),
				type : 1
			}
			
			var MaterialPlastica={
				color : new THREE.Vector3(1.0,1.0,1.0),
				diffuseMap : 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Diffuse.jpg" ),
				specularMap : 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Specular.jpg" ),
				roughnessMap : 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Roughness.jpg" ),
				normalMap :	 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Normal.jpg" ),
				emissionMap:	loadTexture( "Texture/" + textureParametersPlastica.material + "_Emission.jpg" ),
				emission : 0.0,
				roughness : MaterialRoughness[textureIndex2][1],
				repeat : new THREE.Vector2(textureParametersPlastica.repeatS, textureParametersPlastica.repeatT),
				type : 0
			}
			
			var MaterialDisplay={
				color : new THREE.Vector3(1.0,1.0,1.0),
				diffuseMap : 	loadTexture( "Texture/" + textureParametersDisplay.material + "_Diffuse.jpg" ),
				specularMap : 	loadTexture( "Texture/" + textureParametersDisplay.material + "_Specular.jpg" ),
				roughnessMap : 	loadTexture( "Texture/" + textureParametersDisplay.material + "_Roughness.jpg" ),
				normalMap :	 	loadTexture( "Texture/" + textureParametersDisplay.material + "_Normal.jpg" ),
				emissionMap :	loadTexture( "Texture/" + textureParametersDisplay.material + "_Emission.jpg" ),
				emission : 0.8,
				roughness : MaterialRoughness[textureIndex1][2],
				repeat : new THREE.Vector2(textureParametersDisplay.repeatS, textureParametersDisplay.repeatT),
				type : 0
			}
			
			var MaterialGomma={
				color : new THREE.Vector3(0.0,0.0,0.0),
				diffuseMap : 	loadTexture( "Texture/white.jpg"),
				specularMap : 	loadTexture( "Texture/white.jpg"),
				roughnessMap :  loadTexture( "Texture/white.jpg"),
				normalMap :	 	loadTexture( "Texture/white.jpg"),
				emissionMap :	loadTexture( "Texture/white.jpg"),
				emission : 0.0,
				roughness : 0.0,
				repeat : new THREE.Vector2(1,1),
				type : 0
			}
			
			var MaterialButton={
				color : new THREE.Vector3(1.0,0.03,0.001),
				diffuseMap : 	loadTexture( "Texture/white.jpg"),
				specularMap : 	loadTexture( "Texture/white.jpg"),
				roughnessMap :  loadTexture( "Texture/white.jpg"),
				normalMap :	 	loadTexture( "Texture/white.jpg"),
				emissionMap :	loadTexture( "Texture/white.jpg"),
				emission : 1.0,
				roughness : 0.0,
				repeat : new THREE.Vector2(1,1),
				type : 0
			}
			
			
			
			Start();	
			
			function isMobile() { 
			 if( navigator.userAgent.match(/Android/i)
			 || navigator.userAgent.match(/webOS/i)
			 || navigator.userAgent.match(/iPhone/i)
			 || navigator.userAgent.match(/iPad/i)
			 || navigator.userAgent.match(/iPod/i)
			 || navigator.userAgent.match(/BlackBerry/i)
			 || navigator.userAgent.match(/Windows Phone/i)
			 ){
				return true;
			  }
			 else {
				return false;
			  }
			}
			
			function loadTexture(file) {
					var texture = new THREE.TextureLoader().load( file , function ( texture ) {
						texture.minFilter = THREE.LinearMipMapLinearFilter;
						texture.anisotropy = renderer.getMaxAnisotropy();
						texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
						texture.offset.set( 0, 0 );
						texture.needsUpdate = true;
						render();
					},function(){console.log("ERRORRE");} )
					return texture;
			}
			
			function MaterialValue(idx){
				var Nome=new Array(MaterialPlastica, MaterialCopertura, MaterialDisplay,  MaterialGomma, MaterialButton);
				return Nome[idx];
			}				
			
			function scegli(idx, type){
				var Nome=new Array(MaterialPlastica, MaterialCopertura, MaterialDisplay, MaterialGomma, MaterialButton);
				
				switch(type){
					case "Diffuse":
						return Nome[idx].diffuseMap;
					break;
					case "Specular":
						return Nome[idx].specularMap;
					break;
					case "Normal":
						return Nome[idx].normalMap;
					break;
					case "Roughness":
						return Nome[idx].roughnessMap;
					break;
					case "Emission":
						return Nome[idx].emissionMap;
					break;
				}
			}
			
			
			function materiali(){
				cancelAnimationFrame(updateProcess);
				if(textureParametersCopertura.material!=TextureCopertura[textureIndex1] || MaterialCopertura.color!=colore1){
					textureParametersCopertura.material	= TextureCopertura[textureIndex1];
					
					MaterialCopertura.diffuseMap   =	loadTexture( "Texture/" + textureParametersCopertura.material + "_Diffuse.jpg" ),
					MaterialCopertura.specularMap  = 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Specular.jpg" ),
					MaterialCopertura.roughnessMap = 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Roughness.jpg" ),
					MaterialCopertura.normalMap    =	loadTexture( "Texture/" + textureParametersCopertura.material + "_Normal.jpg" ),
					MaterialCopertura.emissionMap  = 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Emission.jpg" ),
					MaterialCopertura.repeat 	   =	new THREE.Vector2(textureParametersCopertura.repeatS, textureParametersCopertura.repeatT)
					MaterialCopertura.roughness	   =	MaterialRoughness[textureIndex1][0];
					MaterialCopertura.color 	   = 	colore1;
					
					OBJModel.material[1].uniforms.FattBlend.value = MaterialValue(1).roughness;
					OBJModel.material[1].uniforms.FattEmiss.value = MaterialValue(1).emission;
					OBJModel.material[1].uniforms.normalMap.value = scegli(1,"Normal");
					OBJModel.material[1].uniforms.specularMap.value = scegli(1,"Specular");
					OBJModel.material[1].uniforms.diffuseMap.value = scegli(1,"Diffuse");
					OBJModel.material[1].uniforms.emissionMap.value = scegli(1,"Emission");
					OBJModel.material[1].uniforms.roughnessMap.value = scegli(1,"Roughness");
					OBJModel.material[1].uniforms.textureRepeat.value = MaterialValue(1).repeat;
					OBJModel.material[1].uniforms.Color.value = MaterialValue(1).color;
					
					document.getElementById("RivIma").src = "Texture/" + textureParametersCopertura.material + "_Diffuse.jpg";
				}
				if(textureParametersPlastica.material!=TexturePlastica[textureIndex2] || MaterialPlastica.color!=colore2){
					textureParametersPlastica.material	= TexturePlastica[textureIndex2];
					
					MaterialPlastica.diffuseMap 	= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Diffuse.jpg" ),
					MaterialPlastica.specularMap 	= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Specular.jpg" ),
					MaterialPlastica.roughnessMap 	= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Roughness.jpg" ),
					MaterialPlastica.normalMap 		= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Normal.jpg" ),
					MaterialPlastica.emissionMap	=	loadTexture( "Texture/" + textureParametersPlastica.material + "_Emission.jpg" ),
					MaterialPlastica.repeat 		=	new THREE.Vector2(textureParametersPlastica.repeatS, textureParametersPlastica.repeatT)
					MaterialPlastica.roughness 		=	MaterialRoughness[textureIndex2][1];
					MaterialPlastica.color 	        = 	colore2;
					
					OBJModel.material[0].uniforms.FattBlend.value = MaterialValue(0).roughness;
					OBJModel.material[0].uniforms.FattEmiss.value = MaterialValue(0).emission;
					OBJModel.material[0].uniforms.normalMap.value = scegli(0,"Normal");
					OBJModel.material[0].uniforms.specularMap.value = scegli(0,"Specular");
					OBJModel.material[0].uniforms.diffuseMap.value = scegli(0,"Diffuse");
					OBJModel.material[0].uniforms.emissionMap.value = scegli(0,"Emission");
					OBJModel.material[0].uniforms.roughnessMap.value = scegli(0,"Roughness");
					OBJModel.material[0].uniforms.textureRepeat.value = MaterialValue(0).repeat;
					OBJModel.material[0].uniforms.Color.value = MaterialValue(0).color;
					
					document.getElementById("CopIma").src = "Texture/" + textureParametersPlastica.material + "_Diffuse.jpg";
				}
				MaterialCopertura.diffuseMap.minFilter = THREE.LinearMipmapLinearFilter;
				MaterialCopertura.specularMap.minFilter = THREE.LinearMipmapLinearFilter;
				MaterialCopertura.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
				MaterialCopertura.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
				
				updateProcess=requestAnimationFrame(Update);
			}
			
			function loading(prosegui){
				var loader = new THREE.OBJLoader(); 
				
				loader.load("Model/SpeacherLamp.obj",
					function (obj){
						OBJModel.model = obj;
						for(var i=0; i<5; i++){
							OBJModel.material[i] = (new THREE.ShaderMaterial({ uniforms : {
								type : {type: "i", value: MaterialValue(i).type},
								MAX_LIGHT : {type: "f", value: 5.0},
								FattBlend : {type: "f", value: MaterialValue(i).roughness},
								FattEmiss : {type: "f", value: MaterialValue(i).emission},
								lightPosition  : { type:"v3v", value: [ new THREE.Vector3(7.5,2.5,0.0),new THREE.Vector3(-3.75,2.5,6.499),new THREE.Vector3(0.0,-500.0,0.0),new THREE.Vector3(0.0,7.5,0.0),new THREE.Vector3(-3.75,2.5,-6.499)]},
								Clight    : { type:"v3", value: new THREE.Vector3(1.0,0.95,0.8)},
								Color    : { type:"v3", value: MaterialValue(i).color},
								normalMap: {type: "t", value: scegli(i,"Normal")},
								specularMap: { type: "t", value: scegli(i,"Specular")},
								diffuseMap:	{ type: "t", value: scegli(i,"Diffuse")},
								emissionMap:	{ type: "t", value: scegli(i,"Emission")},
								roughnessMap:	{ type: "t", value: scegli(i,"Roughness")},
								normalScale: {type: "v2", value: new THREE.Vector2(1,1)},
								envMap:	{ type: "t", value: textureCube},
								displacementScale: {type: "f", value: 0.00},
								textureRepeat: { type: "v2", value: MaterialValue(i).repeat }
							}, vertexShader:document.getElementById("vertex").innerHTML, fragmentShader:document.getElementById("fragment").innerHTML}));
							OBJModel.model.children[i].material=OBJModel.material[i];
							OBJModel.material[i].normalScale = {x:0.5, y:0.5};
						}
						materiali();
						scene.add(OBJModel.model);
						prosegui;
					}, undefined, function (error){
						console.error(error);
				});
			}
			
			function Start(){
				
				renderCanvas = document.getElementById("canvasRender");
				
				scene  		 = new THREE.Scene();		
				camera 		 = new THREE.PerspectiveCamera( 60, renderCanvas.offsetWidth / (renderCanvas.offsetWidth*0.75), 0.01, 10);	
				
				renderer	 = new THREE.WebGLRenderer({antialias:true});	
				renderer.setPixelRatio(  window.devicePixelRatio*2);					
				
				stats 		 = new Stats();
												
				controls 	 = new THREE.OrbitControls( camera );
				
				
				controls.minDistance = 0.4;					
				controls.maxDistance = 1.5;					
				controls.enablePan = false;					
				controls.target = new THREE.Vector3(0,0.08, 0);					
				
				
				renderer.setSize( renderCanvas.offsetWidth, (renderCanvas.offsetWidth*0.75) );
				renderer.physicallyCorrectLights = true;
								
				stats.domElement.style.position  = 'absolute';																
				stats.domElement.style.top 	     = '0px';
							
							
				camera.position.set( 0, 0.25,  1 );		
				camera.rotation.x = -0.25
								
				

				renderCanvas.appendChild( renderer.domElement );															
				renderCanvas.appendChild( stats.domElement    );
							
				
				
				var loader = new THREE.CubeTextureLoader();
				
				var textureCube2 = loader.load(['Texture/cubemap/px.jpg','Texture/cubemap/nx.jpg','Texture/cubemap/py.jpg','Texture/cubemap/ny.jpg','Texture/cubemap/pz.jpg','Texture/cubemap/nz.jpg']);
				scene.background = textureCube2;
				
				textureCube = loader.load(['Texture/cubemap/px2.jpg','Texture/cubemap/nx2.jpg','Texture/cubemap/py2.jpg','Texture/cubemap/ny2.jpg','Texture/cubemap/pz2.jpg','Texture/cubemap/nz2.jpg']);
				
				
				composer = new THREE.EffectComposer( renderer );
				
				var renderPass = new THREE.RenderPass( scene, camera );
				renderPass.enabled = true;
				composer.addPass( renderPass );
				
				
				var fxaaPass = new THREE.ShaderPass( THREE.FXAAShader );
				fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( renderer.domElement.offsetWidth * renderer.getPixelRatio());
				fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( renderer.domElement.offsetHeight * renderer.getPixelRatio());
			
				composer.addPass( fxaaPass );
				
								
				passthrough = new THREE.ShaderPass( THREE.GammaCorrectionShader);
				passthrough.renderToScreen = true;
				composer.addPass( passthrough );
				
				window.addEventListener( 'resize', onWindowResize, false );
				window.addEventListener("orientationchange", onWindowResize, false);
				
				onWindowResize();
				
				loading(Update());
				
			}
			var c=0;
			function Update(){
				updateProcess=requestAnimationFrame(Update);
				controls.update();
				stats.update();
				render();
			}
			
			function render(){
				composer.render();	
			}
			
			function onWindowResize(){
				camera.aspect = renderCanvas.offsetWidth/(renderCanvas.offsetWidth*0.75);
				camera.updateProjectionMatrix();
				renderer.setSize( renderCanvas.offsetWidth, (renderCanvas.offsetWidth*0.75) );
				renderer.setPixelRatio(window.devicePixelRatio);					
				
				document.getElementById("composerRenderer").style.height = (renderCanvas.offsetWidth*0.75)+"px";
				document.getElementById("menu").style.top   = (document.getElementById("canvasRender").offsetTop+document.getElementById("canvasRender").offsetHeight-document.getElementById("menu").offsetHeight-10)+"px";
				document.getElementById("menu").style.left  = document.getElementById("canvasRender").offsetLeft+"px";
				document.getElementById("menu").style.width = document.getElementById("canvasRender").offsetWidth+"px";
				
			}
				
			
			
			
		</script>

    </div>
</body>

</html>