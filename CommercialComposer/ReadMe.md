# Progetto Commercial Composer Bolletta & Parata
	
![Image Preview](/preview/preview.png)
	
## Goals 
The well-known ACME company has asked you to build a product  **Web visualizer / configurator**  for its new e-commerce site. Before giving you the job, ACME wants to evaluate how faithfully you can visualize and configure products. ACME sells everything, so you can choose whatever kind of product you want for the demonstration.

Your goal is to build a Web application (a HTML page) that:

-   visualizes a product in 3D using three.js, using PBR equations and materials;
-   allows the user to inspect the product (e.g. by orbiting the camera around it), and change some material on it by choosing from a few alternatives.

Try to make it look like a simple, but real portion of an e-commerce site, not a three.js example: choose carefully colors, fonts, images, and icons, also taking inspiration from real web sites. Before starting, search the web for existing 3D configurators. Note down what you like and don't like, and try to produce a result as professional as possible.

## Avvertenze
	
	
## Report

Il progetto propone un compositore online di un oggetto in vendita presso un e-commerce, con la possibilità di scelta dei vari materiali e dei relativi colori che comporranno l'oggetto in vendita.

#### Interfaccia

L' interfaccia si compone di un menu centrale che permetterà di scegliere :
* la parte di superficie dell'oggetto 
* il materiale del quale sarà composto
* il colore del relativo materiale della superficie
	
	![Image arrow](/textures/arrows.png)
	

Con il mouse è possibile ruotare intorno all'oggetto, mentre con il touchpad è possibile effettuare uno zoom dell'oggetto. 


#### BRDF Implementate:

* BRDF Lambertiana
	si può alzare o abassare il terreno andando a premere i bottoni adeguati e cliccando poi la mappa
* BRDF ...



#### journal

* 04/01/20:
	* Progettazione idea e disegno iniziale dell'oggetto da modellare con Blender;  
	* Inizio modellazione oggetto dell' e-commerce;
	
* 05/01/20:
	* Modellazione dell'oggetto e caricamento tramite OBJLoader;
	* Codifica Menu di interazione con l'oggetto con l'utilizzo del framework Bootstrap

* 07/01/20:
	* Implemetazione shader con l'utilizzo della BRDF di base 
	* Collegamento dell'interfaccia utente con l'oggetto modellato

* 08/01/20:
	* Implemetazione  BRDF secondaria  
		* aggiunta luci da set fotografico per l'illuminazione completa dell'oggetto 
	* Implementazione luce ambientale con l'utilizzo della Cubemap
	
 	
#### Programmi e tecnologie utilizzate 

* immagini e texture Paint.net ver: 4.205  
* Visual Studio Code	  
* editor di testo Notepad++ ver: 7.7.1  
* server Web Apache ver: 2.4  
* Modellazione 3D Blender ver: 2.8
* Bootstrap 4.3.1
* HTML 5
* CSS3
* PHP


#### Shader vari


