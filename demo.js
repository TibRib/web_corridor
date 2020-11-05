var scene, camera, renderer, mesh, clock;
var meshFloor, ambientLight, light;
var raycaster;
var mouse = new THREE.Vector3(0,0,0.996);
function setMouseVector(event){
	mouse.x = (event.clientX / window.innerWidth) * 2-1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 -1;

	var direction = new THREE.Vector3().copy(mouse).unproject(camera).sub(camera.position).normalize();
	raycaster.set(camera.position, direction);
	var intersects = raycaster.intersectObjects(scene.children);
	intersects.forEach(element => {
		var obj = element.object;
		if(object instanceof THREE.Mesh){
			object.material.color.set(0xff0000);
		}
	});
	console.log(intersects);
}

let sphereCamera = new THREE.CubeCamera(1,1000,200);
let sea = [
    'cubemap_sea/px.png','cubemap_sea/nx.png',
    'cubemap_sea/py.png', 'cubemap_sea/ny.png',
    'cubemap_sea/pz.png', 'cubemap_sea/nz.png'
];

var crate, crateTexture, crateNormalMap, crateBumpMap;

var keyboard = {};
var player = { height:1.7, speed:0.15, turnSpeed:Math.PI*0.02 };
var USE_WIREFRAME = false;

var loadingScreen = {
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(90, 1280/720, 0.1, 100),
	box: new THREE.Mesh(
		new THREE.BoxGeometry(0.5,0.5,0.5),
		new THREE.MeshBasicMaterial({ color:0x4444ff })
	)
};
var loadingManager = null;
var RESOURCES_LOADED = false;

// Models index
var models = {
	door: {
		obj:"models/Structure_Exterior_Door.obj",
		mtl:"models/Structure_Exterior_Door.mtl",
		mesh: null
	}
};

// Meshes index
var meshes = {};


function init(){
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(70, 1280/720, 0.1, 1000);
	clock = new THREE.Clock();
	
	loadingScreen.box.position.set(0,0,5);
	loadingScreen.camera.lookAt(loadingScreen.box.position);
	loadingScreen.scene.add(loadingScreen.box);
	
	loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		console.log(item, loaded, total);
	};
	loadingManager.onLoad = function(){
		console.log("loaded all resources");
		RESOURCES_LOADED = true;
		onResourcesLoaded();
	};

	let cubeloader = new THREE.CubeTextureLoader();
    let bg = cubeloader.load(sea);
    scene.background = bg;
	
	/*
	meshFloor = new THREE.Mesh(
		new THREE.PlaneGeometry(200,200, 10,10),
		new THREE.MeshPhongMaterial({color:0xffffff, wireframe:USE_WIREFRAME})
	);
	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);
	*/

	
	ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);
	
	light = new THREE.PointLight(0xffffff, 0.5, 18);
	light.position.set(-3,6,-3);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 25;
	scene.add(light);
	
	// Load models
	for( var _key in models ){
		(function(key){
			
			var mtlLoader = new THREE.MTLLoader(loadingManager);
			mtlLoader.load(models[key].mtl, function(materials){
				materials.preload();
				
				var objLoader = new THREE.OBJLoader(loadingManager);
				
				objLoader.setMaterials(materials);
				objLoader.load(models[key].obj, function(mesh){
					
					mesh.traverse(function(node){
						if( node instanceof THREE.Mesh ){
							if('castShadow' in models[key])
								node.castShadow = models[key].castShadow;
							else
								node.castShadow = true;
							
							if('receiveShadow' in models[key])
								node.receiveShadow = models[key].receiveShadow;
							else
								node.receiveShadow = true;
						}
					});
					models[key].mesh = mesh;
					
				});
			});
			
		})(_key);
	}
	
	
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(1280, 720);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	
	document.body.appendChild(renderer.domElement);

	//Raycaster
	raycaster = new THREE.Raycaster();
	window.addEventListener("mousemove",setMouseVector);
	
	animate();
}

// Runs when all resources are loaded
function onResourcesLoaded(){
	
	// Clone models into meshes.
	meshes["door"] = models.door.mesh.clone();

	meshes["door"].position.set(0,0,0);
	(meshes["door"]).scale.x = 1.2;
	(meshes["door"]).scale.y = 1.2;
	(meshes["door"]).scale.z = 1.2;

	for(var i =0; i< aArr.length; i++){
		//Porte du lien
		var a = meshes["door"].clone();
		a.position.set(i*-3,0,0);
		scene.add(a);

		//texte du lien
		var spritetxt = makeTextSprite( aArr[i].label, 
		{ fontsize: 14} );
		spritetxt.position.set((i*-3)+aArr[i].label.length/2,3,0);
		scene.add( spritetxt );

		if(i%10 == 0){
			var newLight = light.clone();
			newLight.position.x = i*-3;
			scene.add(newLight);
		}
		
	}

}

function animate(){

	// Play the loading screen until resources are loaded.
	if( RESOURCES_LOADED == false ){
		requestAnimationFrame(animate);
		
		loadingScreen.box.position.x -= 0.05;
		if( loadingScreen.box.position.x < -10 ) loadingScreen.box.position.x = 10;
		loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);
		
		renderer.render(loadingScreen.scene, loadingScreen.camera);
		return;
	}

	requestAnimationFrame(animate);
	
	var time = Date.now() * 0.0005;
	var delta = clock.getDelta();
	
	if(keyboard[90]){ // Z key
		camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
		camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[83]){ // S key
		camera.position.x += Math.sin(camera.rotation.y) * player.speed;
		camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[81]){ // Q key
		camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	}
	if(keyboard[68]){ // D key
		camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
		camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
	}
	
	if(keyboard[37]){ // left arrow key
		camera.rotation.y -= player.turnSpeed;
	}
	if(keyboard[39]){ // right arrow key
		camera.rotation.y += player.turnSpeed;
	}
	

	renderer.render(scene, camera);
}

function keyDown(event){
	keyboard[event.keyCode] = true;
}

function keyUp(event){
	keyboard[event.keyCode] = false;
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

function makeTextSprite( message, parameters )
    {
        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
        var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };
        var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:0, g:0, b:0, a:1.0 };

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;
        roundRect(context, borderThickness/2, borderThickness/2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);

        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.fillText( message, borderThickness, fontsize + borderThickness);

        var texture = new THREE.Texture(canvas) 
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
        return sprite;  
    }

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}

