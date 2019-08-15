import * as THREE from './build/three.module.js';
//import Stats from './build/stats.module.js';
//import { TrackballControls } from './TrackballControls.js';
import { PCDLoader } from './examples/jsm/loaders/PCDLoader.js';
import { GeometryUtils } from './examples/jsm/utils/GeometryUtils.js';
//import {BBoxBufferGeometry } from './BBoxGeometry.js';
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { TransformControls } from './examples/jsm/controls/TransformControls.js';
import { ShadowMapViewer } from './examples/jsm/utils/ShadowMapViewer.js';

var container;
//var stats;
//var camera, 
var controls, scene, renderer, transform_control, orbit;
var mesh;
var raycaster;
var mouse, INTERSECTED;
var onDownPosition = new THREE.Vector2();
var onUpPosition = new THREE.Vector2();
var mouseX = 0, mouseY = 0;
var windowWidth, windowHeight;

var selected_box;

var bboxes=[];
var views;
var mouseX = 0, mouseY = 0;
var windowWidth, windowHeight;
var views = [
    {
        left: 0,
        bottom: 0,
        width: 1.0,
        height: 1.0,
        background: new THREE.Color( 0.0, 0.0, 0.0 ),
        eye: [ 0, 0, 50 ],
        up: [ 0, 0, 1 ],
        fov: 65
    },
    {
        left: 0.7,
        bottom: 0.7,
        width: 0.3,
        height: 0.3,
        background: new THREE.Color( 0.1, 0.1, 0.2 ),
        eye: [ 0, 1800, 0 ],
        up: [ 0, 0, 1 ],
        fov: 45
    },
    {
        left: 0.7,
        bottom: 0.4,
        width: 0.3,
        height: 0.3,
        background: new THREE.Color( 0.1, 0.2, 0.1 ),
        eye: [ 1400, 800, 1400 ],
        up: [ 0, 1, 0 ],
        fov: 60
    },

    {
        left: 0.7,
        bottom: 0.1,
        width: 0.3,
        height: 0.3,
        background: new THREE.Color( 0.2, 0.1, 0.1 ),
        eye: [ 1400, 800, 1400 ],
        up: [ 0, 1, 0 ],
        fov: 60
    }
];


var dirLight, spotLight;
var dirLightShadowMapViewer, spotLightShadowMapViewer;

init();
animate();
render();

function init() {
    scene = new THREE.Scene();
    //scene.background = new THREE.Color( 0x000033 );
    // camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 800 );
    // camera.position.x = 0;
    // camera.position.z = 50;
    // camera.position.y = 0;
    // camera.up.set( 0, 0, 1);
    // camera.lookAt( 1, 10, 0 );

    //scene.add( new THREE.CameraHelper( camera ) );

    if (true){
        var view = views[ 0 ];
        var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 800 );
        camera.position.x = 0;
        camera.position.z = 50;
        camera.position.y = 0;
        camera.up.set( 0, 0, 1);
        camera.lookAt( 1, 10, 0 );
        view.camera = camera;
    }

    if (true){
        var view = views[ 1];
        //var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 800 );
        var width = window.innerWidth;
        var height = window.innerHeight;
        var asp = width/height;

        var camera = new THREE.OrthographicCamera( -3*asp, 3*asp, 3, -3, -3, 3 );

        var cameraOrthoHelper = new THREE.CameraHelper( camera );
        scene.add( cameraOrthoHelper );
        view["cameraHelper"] = cameraOrthoHelper;
                
        camera.position.x = 0;
        camera.position.z = 0;
        camera.position.y = 0;
        camera.up.set( 0, 1, 0);
        camera.lookAt( 0, 0, -3 );
        view.camera = camera;
    }

    if (true){
        var view = views[ 2];
        //var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 800 );
        var width = window.innerWidth;
        var height = window.innerHeight;
        var asp = width/height;

        var camera = new THREE.OrthographicCamera( -3*asp, 3*asp, 3, -3, -3, 3 );

        var cameraOrthoHelper = new THREE.CameraHelper( camera );
        scene.add( cameraOrthoHelper );
        view["cameraHelper"] = cameraOrthoHelper;
                
        camera.position.x = 0;
        camera.position.z = 0;
        camera.position.y = 0;
        camera.up.set( 0, 0, 1);
        camera.lookAt( 0, -3, 0 );
        view.camera = camera;
    }

    if (true){
        var view = views[ 3];
        //var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 800 );
        var width = window.innerWidth;
        var height = window.innerHeight;
        var asp = width/height;

        var camera = new THREE.OrthographicCamera( -3*asp, 3*asp, 3, -3, -3, 3 );

        var cameraOrthoHelper = new THREE.CameraHelper( camera );
        scene.add( cameraOrthoHelper );
        view["cameraHelper"] = cameraOrthoHelper;
                
        camera.position.x = 0;
        camera.position.z = 0;
        camera.position.y = 0;
        camera.up.set( 0, 0, 1);
        camera.lookAt( -3, 0, 0 );
        view.camera = camera;
    }

    
    //camera = views[0].camera;
   

    // var camera2 = new THREE.PerspectiveCamera( 40, 1, 1, 1000 );
    // camera2.position.copy( camera.position );

    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;


    renderer.setClearColor( 0x000000, 0 );
    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    // renderer will set this eventually
    //matLine.resolution.set( window.innerWidth, window.innerHeight ); // resolution of the viewport
    

    container = document.createElement( 'container' );
    

     document.body.appendChild( container );
    container.appendChild( renderer.domElement );
    
    // controls = new TrackballControls( camera, renderer.domElement );
    // controls.rotateSpeed = 2.0;
    // controls.zoomSpeed = 5;
    // controls.panSpeed = 2;
    // controls.noZoom = false;
    // controls.noPan = false;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;
    // controls.minDistance = 3;
    // controls.maxDistance = 3 * 100;

    orbit = new OrbitControls( views[0].camera, renderer.domElement );
    orbit.update();
    orbit.addEventListener( 'change', render );


    transform_control = new TransformControls( views[0].camera, renderer.domElement );
    transform_control.addEventListener( 'change', render );
    transform_control.addEventListener( 'objectChange', on_transform_change );
    
    transform_control.addEventListener( 'dragging-changed', function ( event ) {
        orbit.enabled = ! event.value;
    } );

   
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
        //points.castShadow = true;
        points.material.color.setHex( 0xffffff );
        scene.add( points );
        var center = points.geometry.boundingSphere.center;
        //controls.target.set( center.x, center.y, center.z );
        //controls.update();
    });



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
    
    mesh = new_bbox();
    mesh.castShadow=true;
    bboxes.push(mesh);
    scene.add(mesh);

//    var geometry = new THREE.BoxBufferGeometry( 2, 4, 3 );
//    var material = new THREE.MeshBasicMaterial({
//          color: 0x00ff00,
//          opacity: 0.3,
//          wireframe: true,
//          transparent: true});// { map: texture, transparent: true } );
//    mesh = new THREE.Mesh( geometry, material );

    
   
    
   scene.add( new THREE.AxesHelper( 2 ) );

    
    scene.add( transform_control );


    // stats = new Stats();
    
     //container.appendChild( stats.dom );
     



    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', keydown );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function update_subview_by_bbox(mesh){
    var p = mesh.position;
    var r = mesh.rotation;

    views[1].camera.position.x= p.x;
    views[1].camera.position.y= p.y;
    views[1].camera.position.z= p.z;

    //views[1].camera.rotation.x= r.x;
    //views[1].camera.rotation.y= r.y;
    views[1].camera.rotation.z= r.z;


    views[2].camera.position.x= p.x;
    views[2].camera.position.y= p.y;
    views[2].camera.position.z= p.z;

    //views[2].camera.rotation.x= r.x;
    views[2].camera.rotation.y= -r.z;
    //views[2].camera.rotation.z= r.z;


    views[3].camera.position.x= p.x;
    views[3].camera.position.y= p.y;
    views[3].camera.position.z= p.z;

    //views[2].camera.rotation.x= r.x;
    views[3].camera.rotation.y= Math.PI/2 + r.z;
    //views[2].camera.rotation.z= r.z;
    views[3].camera.far = mesh.scale.x/2 + 0.2;
    views[3].camera.near = - mesh.scale.x/2 - 0.2;
    views[3].cameraHelper.update();
}

function on_transform_change(event){
    console.log("transform changed");
    var mesh = event.target.object;
    update_subview_by_bbox(mesh);    
}


function render(){
    //renderer.render( scene, views[0].camera );
    for ( var ii = 0; ii < views.length; ++ ii ) {
        var view = views[ ii ];
        var camera = view.camera;
        //view.updateCamera( camera, scene, mouseX, mouseY );
        var left = Math.floor( window.innerWidth * view.left );
        var bottom = Math.floor( window.innerHeight * view.bottom );
        var width = Math.floor( window.innerWidth * view.width );
        var height = Math.floor( window.innerHeight * view.height );
        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setClearColor(view.background );
        renderer.setScissorTest( true );
        
        //renderer.clearColor(0x000000,1); // clear color buffer

        //camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render( scene, camera );
    }



    // var left = Math.floor( window.innerWidth);
    // var bottom = Math.floor( window.innerHeight);
    // var width = Math.floor( window.innerWidth);
    // var height = Math.floor( window.innerHeight);
    // renderer.setViewport( left, bottom, width, height );
    //renderer.setScissor( left, bottom, width, height );
    //renderer.setScissorTest( true );
    
    //renderer.render( scene, camera );
    //dirLightShadowMapViewer.render( renderer );

    // if (view){
    //     var vcamera = view.camera;
    //     //view.updateCamera( camera, scene, mouseX, mouseY );
    //     var left = Math.floor( window.innerWidth * view.left );
    //     var bottom = Math.floor( window.innerHeight * view.bottom );
    //     var width = Math.floor( window.innerWidth * view.width );
    //     var height = Math.floor( window.innerHeight * view.height );
    //     // renderer.setViewport( left, bottom, width, height );
    //     // renderer.setScissor( left, bottom, width, height );
    //     // renderer.setScissorTest( true );
    //     // renderer.setClearColor( view.background );
    //     // vcamera.aspect = width / height;
    //     // vcamera.updateProjectionMatrix();
    //     //renderer.render( scene, vcamera );
    // }
}



function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
   //console.log(mouse);

    
}


function onDocumentMouseDown( event ) {

    var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
    onDownPosition.fromArray( array );

    document.addEventListener( 'mouseup', onMouseUp, false );

}

function onMouseUp( event ) {

    var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
    onUpPosition.fromArray( array );

    handleClick();

    document.removeEventListener( 'mouseup', onMouseUp, false );

}


function getMousePosition( dom, x, y ) {

    var rect = dom.getBoundingClientRect();
    return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

}


function getIntersects( point, objects ) {

    mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

    raycaster.setFromCamera( mouse, views[0].camera );

    return raycaster.intersectObjects( objects, false );  // 2nd argument: recursive.

}


function handleClick() {

    if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

        var intersects = getIntersects( onUpPosition, bboxes );

        if ( intersects.length > 0 ) {

            //var object = intersects[ 0 ].object;
            var object = intersects[ 0 ].object;

            if ( object.userData.object !== undefined ) {

                // helper

                transform_control.attach( object.userData.object );
                update_subview_by_bbox(object.userData.object);
                selected_box = object.userData.object;

            } else {

                transform_control.attach( object );
                update_subview_by_bbox(object);
                selected_box = object;

            }

        } else {

            transform_control.detach();
            selected_box = null;

        }

        render();

    }

}


function onWindowResize() {
    //camera.aspect = window.innerWidth / window.innerHeight;
    //camera.updateProjectionMatrix();
    //renderer.setSize( window.innerWidth, window.innerHeight );

    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        renderer.setSize( windowWidth, windowHeight );
    }
                    
    //controls.handleResize();

    //dirLightShadowMapViewer.updateForWindowResize();

}

function keydown( ev ) {
    var points = scene.getObjectByName( 'test.pcd' );
    switch ( ev.key) {
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
            //points.material.transparent = true;
            //points.material.opacity = 0.8;
            points.material.needsUpdate = true;
            break;
        
        case 'q': // Q
            transform_control.setSpace( transform_control.space === "local" ? "world" : "local" );
            break;
        case 17: // Ctrl
            transform_control.setTranslationSnap( 100 );
            transform_control.setRotationSnap( Math.degToRad( 15 ) );
            break;
        case 'w': // W
            transform_control.setMode( "translate" );
            break;
        case 'e': // E
            transform_control.setMode( "rotate" );
            break;
        case 'r': // R
            transform_control.setMode( "scale" );
            break;

        case 'b':
            mesh = new_bbox();
            bboxes.push(mesh);
            scene.add(mesh);
            break;
        
        case '+':
        case '=': // +, =, num+
        transform_control.setSize( transform_control.size + 0.1 );
            break;
        case '-':
        //case 109: // -, _, num-
        transform_control.setSize( Math.max( transform_control.size - 0.1, 0.1 ) );
            break;
        case 'x': // X
        transform_control.showX = ! transform_control.showX;
            break;
        case 'y': // Y
        transform_control.showY = ! transform_control.showY;
            break;
        case 'z': // Z
        transform_control.showZ = ! transform_control.showZ;
            break;
        case ' ': // Spacebar
            transform_control.enabled = ! transform_control.enabled;
            break;
        case '1':            
        case '2':
        case '3':
            views[ev.key].cameraHelper.visible = !views[ev.key].cameraHelper.visible;
            break;
        case 'a':
            if (selected_box){
                selected_box.position.x+=0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'A':
            if (selected_box){
                selected_box.position.x-=0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 's':
            if (selected_box){
                selected_box.position.y+=0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'S':
            if (selected_box){
                selected_box.position.y-=0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'd':
            if (selected_box){
                selected_box.position.z+=0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'D':
            if (selected_box){
                selected_box.position.z-=0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'f':
            if (selected_box){
                selected_box.rotation.z+=0.02;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'F':
            if (selected_box){
                selected_box.rotation.z-=0.02;
                update_subview_by_bbox(selected_box);
            }
            break;
    }
}


function animate() {
    requestAnimationFrame( animate );
    //controls.update();
    render();
    //stats.update();
}

function new_bbox(){
    var geometry = new THREE.BoxBufferGeometry(1, 1, 1);    
    var material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    opacity: 0.4,
    wireframe: true,
    transparent: true});// { map: texture, transparent: true } );

    mesh = new THREE.Mesh( geometry, material );
    mesh.scale.x=1.8;
    mesh.scale.y=4.5;
    mesh.scale.z=1.5;
    return mesh;
}

function new_bbox_group(){
    var bbox = cube( 5 );
    var body = new THREE.LineSegments( bbox.body, new THREE.LineBasicMaterial( { color: 0xffffff } ) );    
    var head = new THREE.LineSegments( bbox.head, new THREE.LineBasicMaterial( { color: 0x00ff00 } ) );    
    
    
    var group = new THREE.Group();
    
    group.add(body);
    group.add(head);

    group.userData={object: null};
    group.raycast = function( raycaster, intersects ){
        
        var temp_intersects=[];
        body.raycast(raycaster, temp_intersects);
        head.raycast(raycaster, temp_intersects);

        if (temp_intersects.length>0)
            intersects.push(group);
    };

    return group;
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
    
    var head=[
        - h, - h, - h, 
        - h, h, - h,
        - h, - h, - h,
        - h, - h, h,
        - h, - h, h,
        - h, h, h,

        - h, h, - h,
        - h, h, h,
        
    ];
    

    var gbody = new THREE.BufferGeometry();
    gbody.addAttribute( 'position', new THREE.Float32BufferAttribute(body, 3 ) );
    var ghead = new THREE.BufferGeometry();
    ghead.addAttribute( 'position', new THREE.Float32BufferAttribute(head, 3 ) );

    return {body: gbody, head: ghead};
}



function cube2( size ) {
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
        h, - h, h
    
        - h, - h, - h, 
        - h, h, - h,

        - h, - h, - h,
        - h, - h, h,
        
        - h, - h, h,
        - h, h, h,

        - h, h, - h,
        - h, h, h,
        
    ];
    

    var gbody = new THREE.BufferGeometry();
    gbody.addAttribute( 'position', new THREE.Float32BufferAttribute(body, 3 ) );
    return gbody;
}