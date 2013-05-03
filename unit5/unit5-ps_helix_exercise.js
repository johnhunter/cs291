////////////////////////////////////////////////////////////////////////////////
// Helix: replace spheres with capsules (cheese logs)
////////////////////////////////////////////////////////////////////////////////

/*global THREE, Coordinates, $, document, window, dat*/

var camera, scene, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var gridX = true;
var gridY = false;
var gridZ = false;
var axes = true;
var ground = true;

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );

	var light = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light.position.set( 200, 400, 500 );

	var light2 = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light2.position.set( -500, 250, -200 );

	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);

	if (ground) {
		Coordinates.drawGround({size:10000});
	}
	if (gridX) {
		Coordinates.drawGrid({size:10000,scale:0.01});
	}
	if (gridY) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"y"});
	}
	if (gridZ) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"z"});
	}
	if (axes) {
		Coordinates.drawAllAxes({axisLength:200,axisRadius:1,axisTess:50});
	}

	var redMaterial = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
	var greenMaterial = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
	var blueMaterial = new THREE.MeshLambertMaterial( { color: 0x0000FF } );
	var grayMaterial = new THREE.MeshLambertMaterial( { color: 0x808080 } );

	var yellowMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFF00 } );
	var cyanMaterial = new THREE.MeshLambertMaterial( { color: 0x00FFFF } );
	var magentaMaterial = new THREE.MeshLambertMaterial( { color: 0xFF00FF } );

	var radius = 60;
	var tube = 10;
	var radialSegments = 24;
	var height = 300;
	var segmentsWidth = 12;
	var arc = 2;

	var helix;
	helix = createHelix( redMaterial, radius, tube, radialSegments, segmentsWidth, height, arc, true );
	helix.position.y = height/2;
	scene.add( helix );

	helix = createHelix( greenMaterial, radius/2, tube, radialSegments, segmentsWidth, height, arc, false );
	helix.position.y = height/2;
	scene.add( helix );

	// DNA
	helix = createHelix( blueMaterial, radius, tube/2, radialSegments, segmentsWidth, height, arc, false );
	helix.position.y = height/2;
	helix.position.z = 2.5 * radius;
	scene.add( helix );

	helix = createHelix( blueMaterial, radius, tube/2, radialSegments, segmentsWidth, height, arc, false );
	helix.rotation.y = 120 * Math.PI / 180;
	helix.position.y = height/2;
	helix.position.z = 2.5 * radius;
	scene.add( helix );

	helix = createHelix( grayMaterial, radius, tube/2, radialSegments, segmentsWidth, height/2, arc, true );
	helix.position.y = height/2;
	helix.position.x = 2.5 * radius;
	scene.add( helix );

	helix = createHelix( yellowMaterial, 0.75*radius, tube/2, radialSegments, segmentsWidth, height, 4*arc, false );
	helix.position.y = height/2;
	helix.position.x = 2.5 * radius;
	helix.position.z = -2.5 * radius;
	scene.add( helix );

	helix = createHelix( cyanMaterial, 0.75*radius, 4*tube, radialSegments, segmentsWidth, height, 2*arc, false );
	helix.position.y = height/2;
	helix.position.x = 2.5 * radius;
	helix.position.z = 2.5 * radius;
	scene.add( helix );

	helix = createHelix( magentaMaterial, radius, tube, radialSegments, segmentsWidth, height, arc, true );
	helix.rotation.x = 45 * Math.PI / 180;
	helix.position.y = height/2;
	helix.position.z = -2.5 * radius;
	scene.add( helix );
}

// Returns a THREE

// Returns a THREE.Object3D cone (CylinderGeometry) going from top to bottom positions
// Variables:
//   material - THREE.Material
//   radius - radius of helix itself
//   tube - radius of tube
//   radialSegments - number of capsules around a full circle
//   tubularSegments - tessellation around equator of each tube
//   height - height to extend, from *center* of tube ends along Y axis
//   arc - how many times to go around the Y axis; currently just an integer
//   clockwise - if true, go counterclockwise up the axis
function createHelix( material, radius, tube, radialSegments, tubularSegments, height, arc, clockwise )
{
	// defaults: if parameter is not passed in, "undefined",
	// then the value to the right is used instead.
	tubularSegments = tubularSegments || 32;
	arc = arc || 1;
	clockwise = clockwise || true;

	var helix = new THREE.Object3D();

	var top = new THREE.Vector3();

	var sine_sign = clockwise ? 1 : -1;

	///////////////
	// Student: remove spheres, use capsules instead, going from point to point.
	//
	var sphGeom = new THREE.SphereGeometry( tube, tubularSegments, tubularSegments/2 );
	for ( var i = 0; i <= arc*radialSegments ; i++ )
	{
		// going from X to Z axis
		top.set( radius * Math.cos( i * 2*Math.PI / radialSegments ),
			height * (i/(arc*radialSegments)) - height/2,
			sine_sign * radius * Math.sin( i * 2*Math.PI / radialSegments ) );

		var sphere = new THREE.Mesh( sphGeom, material );
		sphere.position.copy( top );

		helix.add( sphere );
	}
	///////////////

	return helix;
}

// Returns a THREE.Object3D cone (CylinderGeometry) going from top to bottom positions
// Variables:
//   material - THREE.Material
//   radiusTop, radiusBottom - same as CylinderGeometry, the top and bottom radii of the cone
//   top, bottom - THREE.Vector3, top and bottom positions of cone
//   segmentsWidth - tessellation around equator, like radiusSegments in CylinderGeometry
//   openTop, openBottom - whether the end is given a sphere; true means they are not
function createCapsule( material, radius, top, bottom, segmentsWidth, openTop, openBottom )
{
	// defaults
	segmentsWidth = (segmentsWidth === undefined) ? 32 : segmentsWidth;
	openTop = (openTop === undefined) ? false : openTop;
	openBottom = (openBottom === undefined) ? false : openBottom;

	// get cylinder height
	var cylAxis = new THREE.Vector3();
	cylAxis.subVectors( top, bottom );
	var length = cylAxis.length();

	// get cylinder center for translation
	var center = new THREE.Vector3();
	center.addVectors( top, bottom );
	center.divideScalar( 2.0 );

	// always open-ended
	var cylGeom = new THREE.CylinderGeometry( radius, radius, length, segmentsWidth, 1, 1 );
	var cyl = new THREE.Mesh( cylGeom, material );

	// pass in the cylinder itself, its desired axis, and the place to move the center.
	makeLengthAngleAxisTransform( cyl, cylAxis, center );

	var capsule = new THREE.Object3D();
	capsule.add( cyl );
	if ( !openTop || !openBottom ) {
		// instance geometry
		var sphGeom = new THREE.SphereGeometry( radius, segmentsWidth, segmentsWidth/2 );
		if ( !openTop ) {
			var sphTop = new THREE.Mesh( sphGeom, material );
			sphTop.position.set( top.x, top.y, top.z );
			capsule.add( sphTop );
		}
		if ( !openBottom ) {
			var sphBottom = new THREE.Mesh( sphGeom, material );
			sphBottom.position.set( bottom.x, bottom.y, bottom.z );
			capsule.add( sphBottom );
		}
	}

	return capsule;
}

function makeLengthAngleAxisTransform( cyl, cylAxis, center )
{
	cyl.matrixAutoUpdate = false;

	// From left to right using frames: translate, then rotate; TR.
	// So translate is first.
	cyl.matrix.makeTranslation( center.x, center.y, center.z );

	// take cross product of cylAxis and up vector to get axis of rotation
	var yAxis = new THREE.Vector3(0,1,0);
	// Needed later for dot product, just do it now;
	// a little lazy, should really copy it to a local Vector3.
	cylAxis.normalize();
	var rotationAxis = new THREE.Vector3();
	rotationAxis.crossVectors( cylAxis, yAxis );
	if ( rotationAxis.length() < 0.000001 )
	{
		// Special case: if rotationAxis is just about zero, set to X axis,
		// so that the angle can be given as 0 or PI. This works ONLY
		// because we know one of the two axes is +Y.
		rotationAxis.set( 1, 0, 0 );
	}
	rotationAxis.normalize();

	// take dot product of cylAxis and up vector to get cosine of angle of rotation
	var theta = -Math.acos( cylAxis.dot( yAxis ) );
	//cyl.matrix.makeRotationAxis( rotationAxis, theta );
	var rotMatrix = new THREE.Matrix4();
	rotMatrix.makeRotationAxis( rotationAxis, theta );
	cyl.matrix.multiply( rotMatrix );
}

function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColorHex( 0xAAAAAA, 1.0 );

	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 10000 );
	camera.position.set( -528, 513, 92 );
	// CONTROLS
	cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
	cameraControls.target.set(0,200,0);

	fillScene();

}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);

	if ( effectController.newGridX !== gridX || effectController.newGridY !== gridY || effectController.newGridZ !== gridZ || effectController.newGround !== ground || effectController.newAxes !== axes)
	{
		gridX = effectController.newGridX;
		gridY = effectController.newGridY;
		gridZ = effectController.newGridZ;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		fillScene();
	}

	renderer.render(scene, camera);
}



function setupGui() {

	effectController = {

		newGridX: gridX,
		newGridY: gridY,
		newGridZ: gridZ,
		newGround: ground,
		newAxes: axes
	};

	var gui = new dat.GUI();
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridX").name("Show XZ grid");
	h.add( effectController, "newGridY" ).name("Show YZ grid");
	h.add( effectController, "newGridZ" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");
}

function takeScreenshot() {
	effectController.newGround = true, effectController.newGridX = false, effectController.newGridY = false, effectController.newGridZ = false, effectController.newAxes = false;
	init();
	render();
	var img1 = renderer.domElement.toDataURL("image/png");
	camera.position.set( 400, 500, -800 );
	render();
	var img2 = renderer.domElement.toDataURL("image/png");
	var imgTarget = window.open('', 'For grading script');
	imgTarget.document.write('<img src="'+img1+'"/><img src="'+img2+'"/>');
}

init();
setupGui();
animate();
$("body").keydown(function(event) {
	if (event.which === 80) {
		takeScreenshot();
	}
});
