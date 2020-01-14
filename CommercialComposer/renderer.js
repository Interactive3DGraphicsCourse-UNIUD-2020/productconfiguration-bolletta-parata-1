

	var scene, camera, renderer, stats, composer;
	var OBJModel = {model:null, material:Array()};																				//variabile che conterrà l'oggetto 3d con i suoi materiali
	var textureCube;																											//mappa background
	var renderCanvas;																											//Parte di schermo du cui renderizzare 
	var updateProcess;																											//processo di update frame
	var numLoadTexture = new Array(-1,-1);																						//variabili per la gestione del caricamento texture
	
	//posizione delle luci
	var posizioniLuci = new Array(new THREE.Vector3(10.0,3.0,0.0),new THREE.Vector3(-5.0,3.0,8.660),new THREE.Vector3(0.0,11.4017,0.0),new THREE.Vector3(0.0,-1000.0,0.0),new THREE.Vector3(-5.0,2.5,-8.660));
	
	var textureIndex1 = 2, textureIndex2 = 1;																					//indice texture selezionata
	var TextureCopertura = new Array("Copertura_Tessuto1","Copertura_Tessuto2","Copertura_Tessuto3");							//nome texture del rivestimento
	var TexturePlastica = new Array("Plastic","Wood","Iron");																	//nome texture della copertura
	var MaterialRoughness = new Array(new Array(0.05, 0.005, 0.1), new Array(0.5, 0.2, 0.1), new Array(0.05, 0.5, 0.1));		//rughness dei materiali [tipoTexture] [ indice ] :: indice [ 0 =  Rivestimento, 1 = Copertura, 2 = Display ] , tipoTexture = [textureIndex1 per rivestimento, textureIndex2 per copertura]
	
	//Parametri per le texture
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
				
	//Parametri per i materiali
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
		type : 1
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
	
	//checked mobile
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
	
	//caricamento texture dato path
	function loadTexture(file, i) {
			var texture = new THREE.TextureLoader().load( file , function ( texture ) {
				texture.minFilter = THREE.LinearMipMapLinearFilter;
				texture.anisotropy = renderer.getMaxAnisotropy();
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				texture.offset.set( 0, 0 );
				texture.needsUpdate = true;
				numLoadTexture[i]=numLoadTexture[i]+1;
			},function(){console.log("ERRORRE");} )
			return texture;
	}
	
	//RETURN materiale dato un indice [0: MaterialPlastica, 1: MaterialCopertura, 2: MaterialDisplay, 3: MaterialGomma, 4: MaterialButton]
	function MaterialValue(idx){
		var Nome=new Array(MaterialPlastica, MaterialCopertura, MaterialDisplay,  MaterialGomma, MaterialButton);
		return Nome[idx];
	}				
	
	//RETURN texture dato l'indice dl materiale e il tipo di texture idx: [0: MaterialPlastica, 1: MaterialCopertura, 2: MaterialDisplay, 3: MaterialGomma, 4: MaterialButton], type: [Diffuse, Specular, Normal, Roughness, Emission]
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
	
	
	//Aggiorna materiali della copertura e del rivestimento solo se sono stati cambiati e attende che siano tutte le immagini caricate prima di modificarli
	function materiali(){
		cancelAnimationFrame(updateProcess);
		numLoadTexture = new Array(-1,-1);
		if(textureParametersCopertura.material!=TextureCopertura[textureIndex1] || MaterialCopertura.color!=colore1){
			textureParametersCopertura.material	= TextureCopertura[textureIndex1];
			numLoadTexture[0] = 0;
			MaterialCopertura.diffuseMap   =	loadTexture( "Texture/" + textureParametersCopertura.material + "_Diffuse.jpg"  ,0),
			MaterialCopertura.specularMap  = 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Specular.jpg" ,0),
			MaterialCopertura.roughnessMap = 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Roughness.jpg",0),
			MaterialCopertura.normalMap    =	loadTexture( "Texture/" + textureParametersCopertura.material + "_Normal.jpg"   ,0),
			MaterialCopertura.emissionMap  = 	loadTexture( "Texture/" + textureParametersCopertura.material + "_Emission.jpg" ,0),
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
			numLoadTexture[1] = 0;
			MaterialPlastica.diffuseMap 	= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Diffuse.jpg"  ,1),
			MaterialPlastica.specularMap 	= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Specular.jpg" ,1),
			MaterialPlastica.roughnessMap 	= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Roughness.jpg",1),
			MaterialPlastica.normalMap 		= 	loadTexture( "Texture/" + textureParametersPlastica.material + "_Normal.jpg"   ,1),
			MaterialPlastica.emissionMap	=	loadTexture( "Texture/" + textureParametersPlastica.material + "_Emission.jpg" ,1),
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
		var intervallo;
		clearInterval(intervallo);
		intervallo = setInterval(function(){
			if((numLoadTexture[1] >= 5 && numLoadTexture[0]==-1) || (numLoadTexture[1] == -1 && numLoadTexture[0]>=5) || (numLoadTexture[1] >= 5 && numLoadTexture[0]>=5)) {
				clearInterval(intervallo);
				updateProcess=requestAnimationFrame(Update);
			}
			console.log(numLoadTexture);
		},500);
	}
	
	//Loader del modello OBJ raggruppato per materiali con chiamata ad una funzione al termine
	function loading(prosegui){
		var loader     = new THREE.OBJLoader(); 
		loader.load("Model/SpeacherLamp.obj",
			function (obj){
				OBJModel.model = obj;
				for(var i=0; i<5; i++){
					OBJModel.material[i] = (new THREE.ShaderMaterial(
					{ 
						uniforms : {
							MAX_LIGHT 		: {type: "f", value: 4.0},
							lightPosition  	: { type:"v3v", value: posizioniLuci},
							Clight    		: { type:"v3", value: new THREE.Vector3(1.0,0.95,0.8)},
							Color    		: { type:"v3", value: MaterialValue(i).color},
							FattBlend 		: {type: "f", value: MaterialValue(i).roughness},
							FattEmiss 		: {type: "f", value: MaterialValue(i).emission},
							specularMap		: { type: "t", value: scegli(i,"Specular")},
							diffuseMap		: { type: "t", value: scegli(i,"Diffuse")},
							roughnessMap	: { type: "t", value: scegli(i,"Roughness")},
							normalMap		: {type: "t", value: scegli(i,"Normal")},
							emissionMap		: { type: "t", value: scegli(i,"Emission")},
							envMap			: { type: "t", value: textureCube},
							normalScale		: {type: "v2", value: new THREE.Vector2(1,1)},
							textureRepeat	: { type: "v2", value: MaterialValue(i).repeat },
							type			: {type: "i", value: MaterialValue(i).type}
						}, 
						vertexShader   : VertexShaderText,
						fragmentShader : FragmentShaderText
					}));
					OBJModel.model.children[i].material = OBJModel.material[i];
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
		
		numLoadTexture = new Array(-1,-1);
		
		renderer.setSize( renderCanvas.offsetWidth, (renderCanvas.offsetWidth*0.75) );
		renderer.physicallyCorrectLights = true;
						
		stats.domElement.style.position  = 'absolute';																
		stats.domElement.style.top 	     = '0px';
					
					
		camera.position.set( 0, 0.25,  1 );		
		camera.rotation.x = -0.25
						
		renderCanvas.appendChild( renderer.domElement );															
		renderCanvas.appendChild( stats.domElement    );
					
		var loader = new THREE.CubeTextureLoader();
		
		textureCube = loader.load(['Texture/cubemap/posx.jpg','Texture/cubemap/negx.jpg','Texture/cubemap/posy.jpg','Texture/cubemap/negy.jpg','Texture/cubemap/posz.jpg','Texture/cubemap/negz.jpg']);
		scene.background = textureCube;
		
		//POSTPROCESSING
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
		
		/*
		var light;
		
		for(var i=0; i<posizioniLuci.length; i++){
			light = new THREE.PointLight(0xffffff,1,100);
			light.position.set(posizioniLuci.x, posizioniLuci.y, posizioniLuci.z);
			scene.add(light);
		}
		*/
		
		onWindowResize();
		
		loading(Update());
		
	}
	
	
	function Update(){
		updateProcess=requestAnimationFrame(Update);
		controls.update();
		stats.update();
		
		
		render();
	}
	
	function render(){
		composer.render();	
	}
	
	//per la ridimensione della pagina
	function onWindowResize(){
		var WWidth  = window.innerWidth;
		var WHeight = window.innerHeight;
		
		var height,width;
		
		width  = WWidth - WWidth*3/10;
		height = width *0.75;
 		
		if(height>WHeight-100){
			height = WHeight-100;
			width  = height/0.75;
			
			
			
		}
		
		camera.aspect = width/height;
			
		renderer.setSize( width,height );
		renderer.setPixelRatio(window.devicePixelRatio);					
		camera.updateProjectionMatrix();
		
		renderCanvas.style.marginLeft = ((WWidth - width ) /2) + "px";
				
		document.getElementById("composerRenderer").style.height = height+"px";
		document.getElementById("composerRenderer").style.maxHeight = (window.innerHeight-100)+"px";
		
		
		document.getElementById("menu").style.top   = (document.getElementById("canvasRender").offsetTop+document.getElementById("canvasRender").offsetHeight-document.getElementById("menu").offsetHeight-10)+"px";
		document.getElementById("menu").style.left  = document.getElementById("canvasRender").offsetLeft+"px";
		document.getElementById("menu").style.width = width+"px";
		
		
	}
				
			
			
			