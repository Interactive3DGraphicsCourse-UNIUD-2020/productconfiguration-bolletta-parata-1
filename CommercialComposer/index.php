<!DOCTYPE html>
<html lang="it">

<head>
	<meta charset="UTF-8">
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0" />

	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>CommerciaComposer Bolletta & Parata</title>
	<link rel="stylesheet" href="master.css">
	<script src="lib/three.min.js"></script>
	<script src='lib/BufferGeometryUtils.js'></script>
	<script src="fragment.js"></script>
	<script src="vertex.js"></script>
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

<?php 
	include("navbar.html") ;
	?>
	 


	<!-- Canvas di rendering -->
	<div id="composerRenderer">
		<div id="canvasRender"></div>
	</div>
	<!--MENU --->
	<?php 
	include("menu.html") ;
	?>


<script type="text/javascript" src="renderer.js"></script>

	</div>
	<br>

	<?php 
	include("composerInfo.html") ;
	echo "<div id=\"footerF\">";
	include("footer.html") ;
	echo "<div>";
	?>

	
</body>

</html>