function replace(hide, show) {
    document.getElementById(hide).style.display = "none";
    document.getElementById(show).style.display = "flex";
}

function replace_side(hide, hide_2,hide_3, show) {
    document.getElementById(hide).style.display = "none";
	document.getElementById(hide_2).style.display = "none";
	document.getElementById(hide_3).style.display = "none";
    document.getElementById(show).style.display = "flex";
}

var idx1=0; //0 : copertura ; 1 : plasticaccia sora e sotto
var material=0;
var colore1 = new THREE.Vector3(1.0,1.0,1.0), colore2 = new THREE.Vector3(1.0,1.0,1.0);

function getValue (id) {
	var file=document.getElementById("defaultColor");
    switch(id){
		case "zona_1":
			idx1=0;
			break;
		case "zona_2":
			idx1=1;
			break;
		
		case "color_1":
			if(idx1==0) colore1 = new THREE.Vector3(1.0,0.027,0.0001);
			else colore2 = new THREE.Vector3(1.0,0.005,0.0001);
			materiali();
			break;
		case "color_2":
			if(idx1==0)colore1 = new THREE.Vector3(0.005,1.0,0.0001);
			else colore2 = new THREE.Vector3(0.005,1.0,0.0001);
			materiali();
			break;
		case "color_3":
			if(idx1==0) colore1 = new THREE.Vector3(0.005,0.0001,1.0);
			else colore2 = new THREE.Vector3(0.005,0.0001,1.0);
			materiali();
			break;
		case "color_4":
			if(idx1==0) colore1 = new THREE.Vector3(1.0,1.0,1.0);
			else colore2 = new THREE.Vector3(1.0,1.0,1.0);
			materiali();
			break;
		case "material_1":
			if(idx1==0) {
				textureIndex1 = 0;
				file.src=("Texture/" +TextureCopertura[textureIndex1]+"_Diffuse.jpg");
			}else{
				textureIndex2=0;
				file.src=("Texture/" +TexturePlastica[textureIndex2]+"_Diffuse.jpg");
				document.getElementById("CopIma").src = "img/materials/material_4_cover.png";
			}
			break;
		case "material_2":
			if(idx1==0) {
				textureIndex1 = 1;
				file.src=("Texture/" +TextureCopertura[textureIndex1]+"_Diffuse.jpg");
			}else{
				textureIndex2=1;
				file.src=("Texture/" +TexturePlastica[textureIndex2]+"_Diffuse.jpg");
				document.getElementById("CopIma").src = "img/materials/material_5_cover.png";
			}
			break;
		case "material_3":
			if(idx1==0) {
				textureIndex1 = 2;
				file.src=("Texture/" +TextureCopertura[textureIndex1]+"_Diffuse.jpg");
			}else{
				textureIndex2=2;
				file.src=("Texture/" +TexturePlastica[textureIndex2]+"_Diffuse.jpg");
				document.getElementById("CopIma").src = "img/materials/material_2_cover.png";
			}
			break;
	}
    return false;
}

/*function selected(hide,show){
    document.getElementById(selected).style.backgroundColor ="background-color: rgba(83, 81, 81, 0.31)"
}
*/
