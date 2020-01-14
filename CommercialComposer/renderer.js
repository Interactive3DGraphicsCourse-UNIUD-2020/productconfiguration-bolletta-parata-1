

var scene, camera, renderer, stats, composer;
var OBJModel = { model: null, material: Array()
};
var textureCube;
var renderCanvas;
var updateProcess;

var textureIndex1 = 2,
    textureIndex2 = 1;
var TextureCopertura = new Array("Copertura_Tessuto1", "Copertura_Tessuto2", "Copertura_Tessuto3");
var TexturePlastica = new Array("Plastic", "Wood", "Iron");
var MaterialRoughness = new Array(new Array(0.05, 0.005, 0.1), new Array(0.025, 0.15, 0.1), new Array(0.05, 1.25,
    0.1));

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

var MaterialCopertura = {
    color: new THREE.Vector3(1.0, 1.0, 1.0),
    diffuseMap: loadTexture("Texture/" + textureParametersCopertura.material + "_Diffuse.jpg"),
    specularMap: loadTexture("Texture/" + textureParametersCopertura.material + "_Specular.jpg"),
    roughnessMap: loadTexture("Texture/" + textureParametersCopertura.material + "_Roughness.jpg"),
    normalMap: loadTexture("Texture/" + textureParametersCopertura.material + "_Normal.jpg"),
    emissionMap: loadTexture("Texture/" + textureParametersCopertura.material + "_Emission.jpg"),
    emission: 0.0,
    roughness: MaterialRoughness[textureIndex1][0],
    repeat: new THREE.Vector2(textureParametersCopertura.repeatS, textureParametersCopertura.repeatT),
    type: 1
}

var MaterialPlastica = {
    color: new THREE.Vector3(1.0, 1.0, 1.0),
    diffuseMap: loadTexture("Texture/" + textureParametersPlastica.material + "_Diffuse.jpg"),
    specularMap: loadTexture("Texture/" + textureParametersPlastica.material + "_Specular.jpg"),
    roughnessMap: loadTexture("Texture/" + textureParametersPlastica.material + "_Roughness.jpg"),
    normalMap: loadTexture("Texture/" + textureParametersPlastica.material + "_Normal.jpg"),
    emissionMap: loadTexture("Texture/" + textureParametersPlastica.material + "_Emission.jpg"),
    emission: 0.0,
    roughness: MaterialRoughness[textureIndex2][1],
    repeat: new THREE.Vector2(textureParametersPlastica.repeatS, textureParametersPlastica.repeatT),
    type: 0
}

var MaterialDisplay = {
    color: new THREE.Vector3(1.0, 1.0, 1.0),
    diffuseMap: loadTexture("Texture/" + textureParametersDisplay.material + "_Diffuse.jpg"),
    specularMap: loadTexture("Texture/" + textureParametersDisplay.material + "_Specular.jpg"),
    roughnessMap: loadTexture("Texture/" + textureParametersDisplay.material + "_Roughness.jpg"),
    normalMap: loadTexture("Texture/" + textureParametersDisplay.material + "_Normal.jpg"),
    emissionMap: loadTexture("Texture/" + textureParametersDisplay.material + "_Emission.jpg"),
    emission: 0.8,
    roughness: MaterialRoughness[textureIndex1][2],
    repeat: new THREE.Vector2(textureParametersDisplay.repeatS, textureParametersDisplay.repeatT),
    type: 0
}

var MaterialGomma = {
    color: new THREE.Vector3(0.0, 0.0, 0.0),
    diffuseMap: loadTexture("Texture/white.jpg"),
    specularMap: loadTexture("Texture/white.jpg"),
    roughnessMap: loadTexture("Texture/white.jpg"),
    normalMap: loadTexture("Texture/white.jpg"),
    emissionMap: loadTexture("Texture/white.jpg"),
    emission: 0.0,
    roughness: 0.0,
    repeat: new THREE.Vector2(1, 1),
    type: 0
}

var MaterialButton = {
    color: new THREE.Vector3(1.0, 0.03, 0.001),
    diffuseMap: loadTexture("Texture/white.jpg"),
    specularMap: loadTexture("Texture/white.jpg"),
    roughnessMap: loadTexture("Texture/white.jpg"),
    normalMap: loadTexture("Texture/white.jpg"),
    emissionMap: loadTexture("Texture/white.jpg"),
    emission: 1.0,
    roughness: 0.0,
    repeat: new THREE.Vector2(1, 1),
    type: 0
}



Start();

function isMobile() {
    if (navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i)
    ) {
        return true;
    } else {
        return false;
    }
}

function loadTexture(file) {
    var texture = new THREE.TextureLoader().load(file, function (texture) {
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.anisotropy = renderer.getMaxAnisotropy();
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set(0, 0);
        texture.needsUpdate = true;
        render();
    }, function () {
        console.log("ERRORRE");
    })
    return texture;
}

function MaterialValue(idx) {
    var Nome = new Array(MaterialPlastica, MaterialCopertura, MaterialDisplay, MaterialGomma, MaterialButton);
    return Nome[idx];
}

function scegli(idx, type) {
    var Nome = new Array(MaterialPlastica, MaterialCopertura, MaterialDisplay, MaterialGomma, MaterialButton);

    switch (type) {
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


function materiali() {
    cancelAnimationFrame(updateProcess);
    if (textureParametersCopertura.material != TextureCopertura[textureIndex1] || MaterialCopertura.color !=
        colore1) {
        textureParametersCopertura.material = TextureCopertura[textureIndex1];

        MaterialCopertura.diffuseMap = loadTexture("Texture/" + textureParametersCopertura.material + "_Diffuse.jpg"),
            MaterialCopertura.specularMap = loadTexture("Texture/" + textureParametersCopertura.material +
                "_Specular.jpg"),
            MaterialCopertura.roughnessMap = loadTexture("Texture/" + textureParametersCopertura.material +
                "_Roughness.jpg"),
            MaterialCopertura.normalMap = loadTexture("Texture/" + textureParametersCopertura.material +
                "_Normal.jpg"),
            MaterialCopertura.emissionMap = loadTexture("Texture/" + textureParametersCopertura.material +
                "_Emission.jpg"),
            MaterialCopertura.repeat = new THREE.Vector2(textureParametersCopertura.repeatS,
                textureParametersCopertura.repeatT)
        MaterialCopertura.roughness = MaterialRoughness[textureIndex1][0];
        MaterialCopertura.color = colore1;

        OBJModel.material[1].uniforms.FattBlend.value = MaterialValue(1).roughness;
        OBJModel.material[1].uniforms.FattEmiss.value = MaterialValue(1).emission;
        OBJModel.material[1].uniforms.normalMap.value = scegli(1, "Normal");
        OBJModel.material[1].uniforms.specularMap.value = scegli(1, "Specular");
        OBJModel.material[1].uniforms.diffuseMap.value = scegli(1, "Diffuse");
        OBJModel.material[1].uniforms.emissionMap.value = scegli(1, "Emission");
        OBJModel.material[1].uniforms.roughnessMap.value = scegli(1, "Roughness");
        OBJModel.material[1].uniforms.textureRepeat.value = MaterialValue(1).repeat;
        OBJModel.material[1].uniforms.Color.value = MaterialValue(1).color;

        document.getElementById("RivIma").src = "Texture/" + textureParametersCopertura.material + "_Diffuse.jpg";
    }
    if (textureParametersPlastica.material != TexturePlastica[textureIndex2] || MaterialPlastica.color != colore2) {
        textureParametersPlastica.material = TexturePlastica[textureIndex2];

        MaterialPlastica.diffuseMap = loadTexture("Texture/" + textureParametersPlastica.material + "_Diffuse.jpg"),
            MaterialPlastica.specularMap = loadTexture("Texture/" + textureParametersPlastica.material +
                "_Specular.jpg"),
            MaterialPlastica.roughnessMap = loadTexture("Texture/" + textureParametersPlastica.material +
                "_Roughness.jpg"),
            MaterialPlastica.normalMap = loadTexture("Texture/" + textureParametersPlastica.material + "_Normal.jpg"),
            MaterialPlastica.emissionMap = loadTexture("Texture/" + textureParametersPlastica.material +
                "_Emission.jpg"),
            MaterialPlastica.repeat = new THREE.Vector2(textureParametersPlastica.repeatS, textureParametersPlastica
                .repeatT)
        MaterialPlastica.roughness = MaterialRoughness[textureIndex2][1];
        MaterialPlastica.color = colore2;

        OBJModel.material[0].uniforms.FattBlend.value = MaterialValue(0).roughness;
        OBJModel.material[0].uniforms.FattEmiss.value = MaterialValue(0).emission;
        OBJModel.material[0].uniforms.normalMap.value = scegli(0, "Normal");
        OBJModel.material[0].uniforms.specularMap.value = scegli(0, "Specular");
        OBJModel.material[0].uniforms.diffuseMap.value = scegli(0, "Diffuse");
        OBJModel.material[0].uniforms.emissionMap.value = scegli(0, "Emission");
        OBJModel.material[0].uniforms.roughnessMap.value = scegli(0, "Roughness");
        OBJModel.material[0].uniforms.textureRepeat.value = MaterialValue(0).repeat;
        OBJModel.material[0].uniforms.Color.value = MaterialValue(0).color;


    }
    MaterialCopertura.diffuseMap.minFilter = THREE.LinearMipmapLinearFilter;
    MaterialCopertura.specularMap.minFilter = THREE.LinearMipmapLinearFilter;
    MaterialCopertura.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
    MaterialCopertura.normalMap.minFilter = THREE.LinearMipmapLinearFilter;

    updateProcess = requestAnimationFrame(Update);
}

function loading(prosegui) {
    var loader = new THREE.OBJLoader();

    loader.load("Model/SpeacherLamp.obj",
        function (obj) {
            OBJModel.model = obj;
            for (var i = 0; i < 5; i++) {
                OBJModel.material[i] = (new THREE.ShaderMaterial({
                    uniforms: {
                        type: {
                            type: "i",
                            value: MaterialValue(i).type
                        },
                        MAX_LIGHT: {
                            type: "f",
                            value: 4.0
                        },
                        FattBlend: {
                            type: "f",
                            value: MaterialValue(i).roughness
                        },
                        FattEmiss: {
                            type: "f",
                            value: MaterialValue(i).emission
                        },
                        lightPosition: {
                            type: "v3v",
                            value: [new THREE.Vector3(10.0, 3.0, 0.0), new THREE.Vector3(-5.0, 3.0,
                                    8.660), new THREE.Vector3(0.0, 11.4017, 0.0), new THREE
                                .Vector3(0.0, -1000.0, 0.0), new THREE.Vector3(-5.0, 2.5, -8.660)
                            ]
                        },
                        Clight: {
                            type: "v3",
                            value: new THREE.Vector3(1.0, 0.95, 0.8)
                        },
                        Color: {
                            type: "v3",
                            value: MaterialValue(i).color
                        },
                        normalMap: {
                            type: "t",
                            value: scegli(i, "Normal")
                        },
                        specularMap: {
                            type: "t",
                            value: scegli(i, "Specular")
                        },
                        diffuseMap: {
                            type: "t",
                            value: scegli(i, "Diffuse")
                        },
                        emissionMap: {
                            type: "t",
                            value: scegli(i, "Emission")
                        },
                        roughnessMap: {
                            type: "t",
                            value: scegli(i, "Roughness")
                        },
                        normalScale: {
                            type: "v2",
                            value: new THREE.Vector2(1, 1)
                        },
                        envMap: {
                            type: "t",
                            value: textureCube
                        },
                        displacementScale: {
                            type: "f",
                            value: 0.00
                        },
                        textureRepeat: {
                            type: "v2",
                            value: MaterialValue(i).repeat
                        }
                    },
                    vertexShader: document.getElementById("vertex").innerHTML,
                    fragmentShader: document.getElementById("fragment").innerHTML
                }));
                OBJModel.model.children[i].material = OBJModel.material[i];
                OBJModel.material[i].normalScale = {
                    x: 0.5,
                    y: 0.5
                };
            }
            materiali();
            scene.add(OBJModel.model);
            prosegui;
        }, undefined,
        function (error) {
            console.error(error);
        });
}

function Start() {

    renderCanvas = document.getElementById("canvasRender");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, renderCanvas.offsetWidth / (renderCanvas.offsetWidth * 0.75), 0.01, 10);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio * 2);

    stats = new Stats();

    controls = new THREE.OrbitControls(camera);


    controls.minDistance = 0.4;
    controls.maxDistance = 1.5;
    controls.enablePan = false;
    controls.target = new THREE.Vector3(0, 0.08, 0);


    renderer.setSize(renderCanvas.offsetWidth, (renderCanvas.offsetWidth * 0.75));
    renderer.physicallyCorrectLights = true;

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';


    camera.position.set(0, 0.25, 1);
    camera.rotation.x = -0.25



    renderCanvas.appendChild(renderer.domElement);
    renderCanvas.appendChild(stats.domElement);



    var loader = new THREE.CubeTextureLoader();

    var textureCube2 = loader.load(['Texture/cubemap/px.jpg', 'Texture/cubemap/nx.jpg', 'Texture/cubemap/py.jpg',
        'Texture/cubemap/ny.jpg', 'Texture/cubemap/pz.jpg', 'Texture/cubemap/nz.jpg'
    ]);
    scene.background = textureCube2;

    textureCube = loader.load(['Texture/cubemap/px2.jpg', 'Texture/cubemap/nx2.jpg', 'Texture/cubemap/py2.jpg',
        'Texture/cubemap/ny2.jpg', 'Texture/cubemap/pz2.jpg', 'Texture/cubemap/nz2.jpg'
    ]);


    composer = new THREE.EffectComposer(renderer);

    var renderPass = new THREE.RenderPass(scene, camera);
    renderPass.enabled = true;
    composer.addPass(renderPass);


    var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (renderer.domElement.offsetWidth * renderer
        .getPixelRatio());
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (renderer.domElement.offsetHeight * renderer
        .getPixelRatio());

    composer.addPass(fxaaPass);


    passthrough = new THREE.ShaderPass(THREE.GammaCorrectionShader);
    passthrough.renderToScreen = true;
    composer.addPass(passthrough);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener("orientationchange", onWindowResize, false);

    onWindowResize();

    loading(Update());

}
var c = 0;

function Update() {
    updateProcess = requestAnimationFrame(Update);
    controls.update();
    stats.update();
    render();
}

function render() {
    composer.render();
}

function onWindowResize() {
    camera.aspect = renderCanvas.offsetWidth / (renderCanvas.offsetWidth * 0.75);
    camera.updateProjectionMatrix();
    renderer.setSize(renderCanvas.offsetWidth, (renderCanvas.offsetWidth * 0.75));
    renderer.setPixelRatio(window.devicePixelRatio);

    document.getElementById("composerRenderer").style.height = (renderCanvas.offsetWidth * 0.75) + "px";
    document.getElementById("menu").style.top = (document.getElementById("canvasRender").offsetTop + document
        .getElementById("canvasRender").offsetHeight - document.getElementById("menu").offsetHeight - 10) + "px";
    document.getElementById("menu").style.left = document.getElementById("canvasRender").offsetLeft + "px";
    document.getElementById("menu").style.width = document.getElementById("canvasRender").offsetWidth + "px";

} 