import * as THREE from './build/three.module.js';
//import Stats from './build/stats.module.js';
//import { TrackballControls } from './TrackballControls.js';
import { PCDLoader } from './examples/jsm/loaders/PCDLoader.js';
import { GeometryUtils } from './examples/jsm/utils/GeometryUtils.js';
//import {BBoxBufferGeometry } from './BBoxGeometry.js';
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { TransformControls } from './examples/jsm/controls/TransformControls.js';
import { ShadowMapViewer } from './examples/jsm/utils/ShadowMapViewer.js';
import { GUI } from './examples/jsm/libs/dat.gui.module.js';
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
var sideview_mesh=null;

var bboxes=[];
var views;
var mouseX = 0, mouseY = 0;
var windowWidth, windowHeight;


var params = {
    uniform: true,
    tension: 0.5,
    centripetal: true,
    chordal: true,
};


var views = [
    {
        left: 0,
        bottom: 0,
        width: 1.0,
        height: 1.0,
        background: new THREE.Color( 0.0, 0.0, 0.0 ),
        eye: [ 0, 0, 50 ],
        up: [ 0, 0, 1 ],
        fov: 65,
    },
    {
        left: 0,
        bottom: 0.7,
        width: 0.2,
        height: 0.3,
        background: new THREE.Color( 0.1, 0.1, 0.2 ),
        eye: [ 0, 1800, 0 ],
        up: [ 0, 0, 1 ],
        fov: 45
    },
    {
        left: 0,
        bottom: 0.4,
        width: 0.2,
        height: 0.3,
        background: new THREE.Color( 0.1, 0.2, 0.1 ),
        eye: [ 1400, 800, 1400 ],
        up: [ 0, 1, 0 ],
        fov: 60
    },

    {
        left: 0,
        bottom: 0.1,
        width: 0.2,
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
    document.body.addEventListener('keydown', event => {
        if (event.ctrlKey && 'asdv'.indexOf(event.key) !== -1) {
          event.preventDefault()
        }
    })


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
        camera.lookAt( 0, 0, 0 );
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
        cameraOrthoHelper.visible=false;
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
        cameraOrthoHelper.visible=false;
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
        cameraOrthoHelper.visible=false;
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

    init_gui();
    init_gui2();

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
    
    // mesh = new_bbox();
    // mesh.castShadow=true;
    // bboxes.push(mesh);
    // scene.add(mesh);


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
     


    onWindowResize();

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', keydown );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}



function init_gui(){
    var gui = new GUI();
    gui.add( params, 'uniform' );
    gui.add( params, 'tension', 0, 1 ).step( 0.01 ).onChange( function ( value ) {
        splines.uniform.tension = value;
        updateSplineOutline();
    } );
    gui.add( params, 'centripetal' );
    gui.add( params, 'chordal' );
    gui.open();
}
function init_gui2(){
    var gui = new GUI();
    gui.add( params, 'uniform' );
    
    gui.add( params, 'chordal' );
    gui.open();
}

function update_mainview(){
    views[0].camera.aspect = window.innerWidth / window.innerHeight;
    views[0].camera.updateProjectionMatrix();
}

function update_subview_by_windowsize(){

    if (sideview_mesh === null)
        return;

    // side views
    var exp_camera_width, exp_camera_height, exp_camera_clip;

    for ( var ii = 1; ii < views.length; ++ ii ) {
        var view = views[ ii ];
        var camera = view.camera;

        var view_width = Math.floor( window.innerWidth * view.width );
        var view_height = Math.floor( window.innerHeight * view.height );

        if (ii==1){
            exp_camera_width = sideview_mesh.scale.x*1.5;
            exp_camera_height = sideview_mesh.scale.y*1.5;
            exp_camera_clip = sideview_mesh.scale.z+0.6;
        } else if (ii==2){
            exp_camera_width = sideview_mesh.scale.x*1.5;
            exp_camera_height = sideview_mesh.scale.z*1.5;
            exp_camera_clip = sideview_mesh.scale.y+0.6;
        }else if (ii==3){
            exp_camera_width = sideview_mesh.scale.y*1.5;
            exp_camera_height = sideview_mesh.scale.z*1.5;
            exp_camera_clip = sideview_mesh.scale.x+0.6;
        }


        if (exp_camera_width/exp_camera_height > view_width/view_height){
            //increase height
            exp_camera_height = exp_camera_width * view_height/view_width;
        }
        else
        {
            exp_camera_width = exp_camera_height * view_width/view_height;
        }

        camera.top = exp_camera_height/2;
        camera.bottom = exp_camera_height/-2;
        camera.right = exp_camera_width/2;
        camera.left = exp_camera_width/-2;
        camera.near = exp_camera_clip/2;
        camera.far = exp_camera_clip/-2;

        camera.aspect = view_width / view_height;
        camera.updateProjectionMatrix();
        if (ii>0)
            view.cameraHelper.update();
    }
}

function update_subview_by_bbox(mesh){
    var p = mesh.position;
    var r = mesh.rotation;

    sideview_mesh = mesh;

    update_subview_by_windowsize();

    views[1].camera.rotation.z= r.z;
    views[2].camera.rotation.y= -r.z;
    views[3].camera.rotation.y= Math.PI/2 + r.z;

    for (var i=1; i<views.length; ++i){
        views[i].camera.position.x= p.x;
        views[i].camera.position.y= p.y;
        views[i].camera.position.z= p.z;

        views[i].camera.updateProjectionMatrix();
        views[i].cameraHelper.update();
    }

    update_box_info_text(sideview_mesh);
}

function on_transform_change(event){
    console.log("transform changed");
    var mesh = event.target.object;
    update_subview_by_bbox(mesh);    
}


function render(){
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
        //camera.updateProjectionMatrix();
        renderer.render( scene, camera );
    }

}



function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
   
    //console.log(mouse, x, y);   
}

function get_current_mouse_location_in_world(){
    raycaster.setFromCamera( mouse, views[0].camera );
    var o = raycaster.ray.origin;
    var d = raycaster.ray.direction;

    var alpha = - o.z/d.z;
    var x = o.x + d.x*alpha;
    var y = o.y + d.y*alpha;
    return {x:x, y:y, z:0};
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

        update_mainview();
        update_subview_by_windowsize();

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
        case 'r': // Q
            //transform_control.setSpace( transform_control.space === "local" ? "world" : "local" );
            if (selected_box){
                selected_box.rotation.x=0;
                selected_box.rotation.y=0;
                selected_box.rotation.z=0;
                update_subview_by_bbox(selected_box);
            }
            break;
        
        case '1': 
            transform_control.setSpace( transform_control.space === "local" ? "world" : "local" );
            break;
        case '2':
            transform_control.setMode( "translate" );
            transform_control.showY=true;
            transform_control.showX=true;
            transform_control.showz=true;
            break;
        case '3': 
            transform_control.setMode( "rotate" );
            transform_control.showY=false;
            transform_control.showX=false;
            transform_control.showz=true;
            break;
        case '4': 
            transform_control.setMode( "scale" );
            transform_control.showY=true;
            transform_control.showX=true;
            transform_control.showz=true;
            break;


        case 'b':
            {
            mesh = new_bbox();
            bboxes.push(mesh);
            
            var pos = get_current_mouse_location_in_world();

            mesh.position.x = pos.x;
            mesh.position.y = pos.y;
            mesh.position.z = pos.z;
            scene.add(mesh);
            sideview_mesh=mesh;
            //update_subview_by_windowsize();
            }
            break;
        
        case '+':
        case '=': // +, =, num+
        transform_control.setSize( transform_control.size + 0.1 );
            break;
        case '-':
        //case 109: // -, _, num-
        transform_control.setSize( Math.max( transform_control.size - 0.1, 0.1 ) );
            break;
        case 'z': // X
            transform_control.showX = ! transform_control.showX;
            break;
        case 'x': // Y
            transform_control.showY = ! transform_control.showY;
            break;
        case 'c': // Z
            transform_control.showZ = ! transform_control.showZ;
            break;
        case ' ': // Spacebar
            transform_control.enabled = ! transform_control.enabled;
            break;
        case '5':            
        case '6':
        case '7':
            views[ev.key-'4'].cameraHelper.visible = !views[ev.key-'4'].cameraHelper.visible;
            break;

        case 'a':
            if (selected_box){
                selected_box.position.x -= 0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'A':
            if (selected_box){
                selected_box.position.x += 0.05;
                update_subview_by_bbox(selected_box);
            }            
            break;
        case 's':
            if (selected_box){
                selected_box.position.y -= 0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'S':
            if (selected_box){
                selected_box.position.y += 0.05;
                update_subview_by_bbox(selected_box);
            }            
            break;
        case 'd':
            if (selected_box){
                selected_box.position.z -= 0.05;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'D':
            if (selected_box){
                selected_box.position.z += 0.05;
                update_subview_by_bbox(selected_box);
            }            
            break;        
        
        case 'f':
            if (selected_box){
                selected_box.rotation.z -= 0.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'F':
            if (selected_box){
                selected_box.rotation.z += 0.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        
        case 'q':
            if (selected_box){
                selected_box.scale.x /= 1.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'Q':
            if (selected_box){
                selected_box.scale.x *= 1.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'w':
            if (selected_box){
                selected_box.scale.y /= 1.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'W':
            if (selected_box){
                selected_box.scale.y *= 1.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'e':
            if (selected_box){
                selected_box.scale.z /= 1.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'E':
            if (selected_box){
                selected_box.scale.z *= 1.01;
                update_subview_by_bbox(selected_box);
            }
            break;
        case 'Delete':
            if (selected_box){
                transform_control.detach();
                scene.remove(selected_box);
                selected_box.geometry.dispose();
                selected_box.material.dispose();
                //selected_box.dispose();

                selected_box = null;
                sideview_mesh = null;
            }
    
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


function update_box_info_text(mesh){
    var scale = mesh.scale;
    var pos = mesh.position;

    document.getElementById("info").innerHTML = "w "+scale.x.toFixed(2) +" l "+scale.y.toFixed(2) + " h " + scale.z.toFixed(2) +
                                                 " x "+pos.x.toFixed(2) +" y "+pos.y.toFixed(2) + " z " + pos.z.toFixed(2);
}