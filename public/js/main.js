import * as THREE from './three.module.js';
import Stats from './stats.module.js';
import { TrackballControls } from './TrackballControls.js';
import { PCDLoader } from './PCDLoader.js';
import { GeometryUtils } from './GeometryUtils.js';

var container, stats;
var camera, controls, scene, renderer;

init();
animate();


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 800 );
    camera.position.x = -50;
    camera.position.z = 50;
    camera.position.y = 5;
    camera.up.set( 0, 0, 1);
    camera.lookAt( 0, 0, 0 );

    var camera2 = new THREE.PerspectiveCamera( 40, 1, 1, 1000 );
    camera2.position.copy( camera.position );



    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );



    renderer.setClearColor( 0x000000, 0 );
    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    // renderer will set this eventually
    //matLine.resolution.set( window.innerWidth, window.innerHeight ); // resolution of the viewport
    renderer.render( scene, camera );


    // renderer.setClearColor( 0x222222, 1 );
    // renderer.clearDepth(); // important!
    // renderer.setScissorTest( true );
    // renderer.setScissor( 20, 20, 300, 300 );
    // renderer.setViewport( 20, 20, 300, 300 );
    // camera2.position.copy( camera.position );
    // camera2.quaternion.copy( camera.quaternion );
    // // renderer will set this eventually
    // //matLine.resolution.set( insetWidth, insetHeight ); // resolution of the inset viewport
    // //renderer.render( scene, camera2 );
                


    document.body.appendChild( renderer.domElement );
    var loader = new PCDLoader();
    loader.load( 'static/pcd/test.pcd', function ( points ) {
        scene.add( points );
        var center = points.geometry.boundingSphere.center;
        controls.target.set( center.x, center.y, center.z );
        controls.update();
    } );



    // var objects = [];
    // var subdivisions = 6;
    // var recursion = 1;
    // var points = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 25.0, recursion, 0, 1, 2, 3, 4, 5, 6, 7 );
    // var spline = new THREE.CatmullRomCurve3( points );
    // var samples = spline.getPoints( points.length * subdivisions );
    // var geometrySpline = new THREE.BufferGeometry().setFromPoints( samples );
    //var line = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ) );
    //line.computeLineDistances();
    //objects.push( line );
    //scene.add( line );

    var geometryCube = cube( 5 );
    var lineSegments = new THREE.LineSegments( geometryCube.body, new THREE.LineBasicMaterial( { color: 0xffaa00 } ) );    
    //lineSegments.computeLineDistances();
    //objects.push( lineSegments );
    scene.add( lineSegments );

    lineSegments = new THREE.LineSegments( geometryCube.head, new THREE.LineBasicMaterial( { color: 0x00ff00 } ) );
    scene.add( lineSegments );




    container = document.createElement( 'div' );
    document.body.appendChild( container );
    container.appendChild( renderer.domElement );
    controls = new TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 5;
    controls.panSpeed = 2;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.minDistance = 3;
    controls.maxDistance = 3 * 100;
    stats = new Stats();
    container.appendChild( stats.dom );
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keypress', keyboard );
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
}
function keyboard( ev ) {
    var points = scene.getObjectByName( 'test.pcd' );
    switch ( ev.key || String.fromCharCode( ev.keyCode || ev.charCode ) ) {
        case '+':
            points.material.size *= 1.2;
            points.material.needsUpdate = true;
            break;
        case '-':
            points.material.size /= 1.2;
            points.material.needsUpdate = true;
            break;
        case 'c':
            points.material.color.setHex( Math.random() * 0xffffff );
            points.material.needsUpdate = true;
            break;
    }
}


function animate() {
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
    stats.update();
}


function cube( size ) {
    var h = size * 0.5;
    
    var body = [
        
        - h, h, - h,
        h, h, - h,
        h, h, - h,
        h, - h, - h,
        h, - h, - h,
        - h, - h, - h,
        
        
        - h, h, h,
        h, h, h,
        h, h, h,
        h, - h, h,
        h, - h, h,
        - h, - h, h,

        
        
        h, h, - h,
        h, h, h,
        h, - h, - h,
        h, - h, h];
    
    var head= [
        - h, - h, - h, 
        - h, h, - h,
        - h, - h, - h,
        - h, - h, h,
        - h, - h, h,
        - h, h, h,

        - h, h, - h,
        - h, h, h,
        
    ];
    

    var body_geometry = new THREE.BufferGeometry();
    body_geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(body, 3 ) );

    var head_geometry = new THREE.BufferGeometry();
    head_geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(head, 3 ) );

    return {
        head: head_geometry,
        body: body_geometry,
    };
}