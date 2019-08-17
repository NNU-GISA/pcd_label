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

import {data} from './data.js'


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
var box_navigate_index=0;

var sideview_mesh=null;

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
        bottom: 0.6,
        width: 0.2,
        height: 0.4,
        background: new THREE.Color( 0.1, 0.1, 0.2 ),
        eye: [ 0, 1800, 0 ],
        up: [ 0, 0, 1 ],
        fov: 45
    },
    {
        left: 0,
        bottom: 0.3,
        width: 0.2,
        height: 0.3,
        background: new THREE.Color( 0.1, 0.2, 0.1 ),
        eye: [ 1400, 800, 1400 ],
        up: [ 0, 1, 0 ],
        fov: 60
    },

    {
        left: 0,
        bottom: 0,
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

        /*
        var width = window.innerWidth;
        var height = window.innerHeight;
        var asp = width/height;

        var camera = new THREE.OrthographicCamera(-400*asp,400*asp, 400, -400, -20, 20);       
        camera.position.x = 0;
        camera.position.z = 0;
        camera.position.y = 0;
        camera.up.set( 1, 0, 0);
        camera.lookAt( 0, 0, -3 );
        view.camera = camera;
        */
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


    orbit = new OrbitControls( views[0].camera, renderer.domElement );
    orbit.update();
    orbit.addEventListener( 'change', render );


    transform_control = new TransformControls( views[0].camera, renderer.domElement );
    transform_control.setSpace("local");
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



    scene.add( new THREE.AxesHelper( 2 ) );
    scene.add( transform_control );


    //stats = new Stats();
    //container.appendChild( stats.dom );
     


    onWindowResize();

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', keydown );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function save_annotation(){
    var bbox_annotations=[];
    console.log(data.bboxes.length, "boxes");
    data.bboxes.forEach(function(b){
        var b = {
            position:{
                x: b.position.x,
                y: b.position.y,
                z: b.position.z,
            },
            scale:{
                x: b.scale.x,
                y: b.scale.y,
                z: b.scale.z,                
            },
            rotation:{                
                x: b.rotation.x,
                y: b.rotation.y,
                z: b.rotation.z,                
            },
        };


        bbox_annotations.push(b);
        
    });

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/save" +"?frame="+data.file_info.frame, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    var b = JSON.stringify(bbox_annotations);
    console.log(b);
    xhr.send(b);
}

function create_bboxs(annotations){
    annotations.forEach(function(b){
        mesh = new_bbox_cube();
        mesh.position.x = b.position.x;
        mesh.position.y = b.position.y;
        mesh.position.z = b.position.z;

        mesh.scale.x = b.scale.x;
        mesh.scale.y = b.scale.y;
        mesh.scale.z = b.scale.z;

        mesh.rotation.x = b.rotation.x;
        mesh.rotation.y = b.rotation.y;
        mesh.rotation.z = b.rotation.z;

        data.bboxes.push(mesh);
        scene.add(mesh);        
    });
}



function load_annotation(){
    var xhr = new XMLHttpRequest();
    // we defined the xhr
    
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;
    
        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data);

            remove_all_boxes();

            create_bboxs(data);
        }
    
        // end of state change: it can be after some time (async)
    };
    
    xhr.open('GET', "/load"+"?frame="+data.file_info.frame, true);
    xhr.send();

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


    var saveFolder = gui.addFolder( 'File' );
    params['save'] = function () {
        save_annotation();
    };
    saveFolder.add( params, 'save');

    
    params['load'] = function () {
        load_annotation();
    };
    saveFolder.add( params, 'load');


    params['clear'] = function () {
        remove_all_boxes();
    };
    saveFolder.add( params, 'clear');


    saveFolder.open();
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

            exp_camera_clip = sideview_mesh.scale.z+0.8;
        } else if (ii==2){
            exp_camera_width = sideview_mesh.scale.x*1.5;
            exp_camera_height = sideview_mesh.scale.z*1.5;

            exp_camera_clip = sideview_mesh.scale.y*1.2;
        }else if (ii==3){
            exp_camera_width = sideview_mesh.scale.y*1.5;
            exp_camera_height = sideview_mesh.scale.z*1.5;

            exp_camera_clip = sideview_mesh.scale.x*1.2;
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

        camera.near = exp_camera_clip/-2;
        camera.far = exp_camera_clip/2;

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
    
    var mesh = event.target.object;
    //console.log("bbox rotation z", mesh.rotation.z);
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

function get_mouse_location_in_world(mouse){
    raycaster.setFromCamera( mouse, views[0].camera );
    var o = raycaster.ray.origin;
    var d = raycaster.ray.direction;

    var alpha = - o.z/d.z;
    var x = o.x + d.x*alpha;
    var y = o.y + d.y*alpha;
    return {x:x, y:y, z:0};
}

var mouse_right_down = false;

function onDocumentMouseDown( event ) {

    if (event.which==3){
        mouse_right_down = true;
    }
    else{
        var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
        onDownPosition.fromArray( array );
    }
    document.addEventListener( 'mouseup', onMouseUp, false );

}

function onMouseUp( event ) {

    if (event.which==3){
        mouse_right_down = false;
    }
    else{
        var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
        onUpPosition.fromArray( array );

        handleClick();
    }

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

        var intersects = getIntersects( onUpPosition, data.bboxes );

        if ( intersects.length > 0 ) {

            //var object = intersects[ 0 ].object;
            var object = intersects[ 0 ].object;

            if ( object.userData.object !== undefined ) {
                // helper
                select_bbox( object.userData.object );

            } else {

                select_bbox( object );
            }
        } else {

                unselect_bbox(null);
        }

        render();

    }

}

// new_object
function unselect_bbox(new_object){

    if (new_object==null){
        if (transform_control.visible)
        {
            //unselect first time
            transform_control.detach();
        }else{
            //unselect second time
            if (selected_box){
                selected_box.material.color.r=0;
                selected_box.material.color.g=1;
                selected_box.material.color.b=0;
            }
            selected_box = null;
        }
    }
    else{
        //unselect all
        transform_control.detach();
        if (selected_box){
            selected_box.material.color.r=0;
            selected_box.material.color.g=1;
            selected_box.material.color.b=0;
        }
        selected_box = null;
    }

}

function select_bbox(object){

    if (selected_box != object){
        // unselect old bbox
        unselect_bbox(object);

        // select me, the first time
        selected_box = object;

        selected_box.material.color.r=1;
        selected_box.material.color.g=0;
        selected_box.material.color.b=1;

        update_subview_by_bbox(object);  
    }
    else {
        //reselect the same box
        if (transform_control.visible){

        }
        else{
            //select me the second time
            transform_control.attach( object );
        }
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

function change_transform_control_view(){
    if (transform_control.mode=="scale"){
        transform_control.setMode( "translate" );
        transform_control.showY=true;
        transform_control.showX=true;
        transform_control.showz=true;
    }else if (transform_control.mode=="translate"){
        transform_control.setMode( "rotate" );
        transform_control.showY=false;
        transform_control.showX=false;
        transform_control.showz=true;
    }else if (transform_control.mode=="rotate"){
        transform_control.setMode( "scale" );
        transform_control.showY=true;
        transform_control.showX=true;
        transform_control.showz=true;
    }
}



function add_bbox(){
    //mesh = ev.key=='b'?new_bbox(): new_bbox_cube();
    mesh = new_bbox_cube();

    data.bboxes.push(mesh);

    var pos = get_mouse_location_in_world(mouse);

    mesh.position.x = pos.x;
    mesh.position.y = pos.y;
    mesh.position.z = pos.z;
    scene.add(mesh);
    sideview_mesh=mesh;
    //unselect_bbox(mesh);
    select_bbox(mesh);
    //update_subview_by_windowsize();
}

// axix, xyz, action: scale, move, direction, up/down
function transform_bbox(command){
    if (!select_bbox)
        return;

    switch (command){
        case 'x_move_up':
            selected_box.position.x += 0.05*Math.cos(selected_box.rotation.z);
            selected_box.position.y += 0.05*Math.sin(selected_box.rotation.z);
            break;
        case 'x_move_down':
            selected_box.position.x -= 0.05*Math.cos(selected_box.rotation.z);
            selected_box.position.y -= 0.05*Math.sin(selected_box.rotation.z);
            break;
        case 'x_scale_up':
            selected_box.scale.x *= 1.01;    
            break;
        case 'x_scale_down':
            selected_box.scale.x /= 1.01;
            break;
        
        case 'y_move_up':
            selected_box.position.x += 0.05*Math.cos(Math.PI/2 + selected_box.rotation.z);
            selected_box.position.y += 0.05*Math.sin(Math.PI/2 + selected_box.rotation.z);    
            break;
        case 'y_move_down':        
            selected_box.position.x -= 0.05*Math.cos(Math.PI/2 + selected_box.rotation.z);
            selected_box.position.y -= 0.05*Math.sin(Math.PI/2 + selected_box.rotation.z);
            break;
        case 'y_scale_up':
            selected_box.scale.y *= 1.01;    
            break;
        case 'y_scale_down':
            selected_box.scale.y /= 1.01;
            break;
        
        case 'z_move_up':
            selected_box.position.z += 0.05;
            break;
        case 'z_move_down':        
            selected_box.position.z -= 0.05;
            break;
        case 'z_scale_up':
            selected_box.scale.z *= 1.01;    
            break;
        case 'z_scale_down':
            selected_box.scale.z /= 1.01;
            break;
        
        case 'z_rotate_left':
            selected_box.rotation.z += 0.01;
            break;
        case 'z_rotate_right':
            selected_box.rotation.z -= 0.01;
            break;
        
        case 'z_rotate_reverse':        
            if (selected_box.rotation.z > 0){
                selected_box.rotation.z -= Math.PI;
            }else{
                selected_box.rotation.z += Math.PI;
            }    
            break;
        case 'reset':
            selected_box.rotation.x = 0;
            selected_box.rotation.y = 0;
            selected_box.rotation.z = 0;
            selected_box.position.z = 0;
            break;

    }

    update_subview_by_bbox(selected_box);
}


function switch_bbox_type(){
    if (!selected_box)
        return;

    switch (selected_box.obj_type){
        case "car":
            selected_box.obj_type = "bus";
            selected_box.scale.x=2.8;
            selected_box.scale.y=10;
            selected_box.scale.z=3.0;
            break;
        case "bus":
            selected_box.obj_type = "pedestrian";
            selected_box.scale.x=0.5;
            selected_box.scale.y=0.4;
            selected_box.scale.z=1.7;
            break;
        case "pedestrian":
            selected_box.obj_type = "car";
            selected_box.scale.x=1.8;
            selected_box.scale.y=4.5;
            selected_box.scale.z=1.5;
            break;
    }
    
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
        case '1': 
        case '2':
            {
                //transform_control.setSpace( transform_control.space === "local" ? "world" : "local" );

                //select current index
                if (data.bboxes[box_navigate_index]!= selected_box){

                }
                else {
                    if (ev.key== '1')
                        box_navigate_index += 1;
                    else 
                        box_navigate_index += (data.bboxes.length-1);
                    
                    box_navigate_index %= data.bboxes.length;
                }
                console.log(box_navigate_index);
                select_bbox(data.bboxes[box_navigate_index]);
                //views[0].camera.position.x = data.bboxes[box_navigate_index].position.x;
                //views[0].camera.position.y = data.bboxes[box_navigate_index].position.y;
                //views[0].camera.lookAt(data.bboxes[box_navigate_index].position.x, data.bboxes[box_navigate_index].position.y, data.bboxes[box_navigate_index].position.z);
                //views[0].camera.updateProjectionMatrix();
                
                // var lookat = get_mouse_location_in_world({x:0, y:0});
                
                // views[0].camera.position.x += data.bboxes[box_navigate_index].position.x - lookat.x;
                // views[0].camera.position.y += data.bboxes[box_navigate_index].position.y - lookat.y;
                // views[0].camera.updateProjectionMatrix();
                var p = data.bboxes[box_navigate_index].position;
                orbit.target.x=p.x;
                orbit.target.y=p.y;
                orbit.target.z=p.z;
                orbit.update();
                
                
                
            }
            break;
        case 'v':
            change_transform_control_view();
            break;
        case 'N':    
        case 'n':
            add_bbox();
            break;        
        case 'B':
        case 'b':
            switch_bbox_type();
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
                if (!mouse_right_down){
                    transform_bbox("x_move_down");
                }
                else{
                    transform_bbox("x_scale_down");
                }
            }
            break;
        case 'A':
            transform_bbox("x_scale_down");
            break;
        case 'q':
            if (selected_box){
                if (!mouse_right_down){
                    transform_bbox("x_move_up");
                }
                else{
                    transform_bbox("x_scale_up");
                }                
            }            
            break;        
        case 'Q':
            transform_bbox("x_scale_up");
            break;
            
        case 's':
            if (selected_box){
                if (!mouse_right_down){
                    transform_bbox("y_move_down");
                }else{
                    transform_bbox("y_scale_down");
                }
            }
            break;
        case 'S':
            if (selected_box){
                transform_bbox("y_scale_down");
            }            
            break;
        case 'w':
            if (selected_box){
                if (!mouse_right_down)
                    transform_bbox("y_move_up");
                else
                    transform_bbox("y_scale_up");                
            }
            break;
        case 'W':
            if (selected_box){
                transform_bbox("y_scale_up");
            }
            break;


        case 'd':
            if (selected_box){
                if (!mouse_right_down)
                    transform_bbox("z_move_down");
                else
                    transform_bbox("z_scale_down");
                
            }
            break;
        case 'D':
            if (selected_box){
                transform_bbox("z_scale_down");
            }            
            break;        
        case 'e':
                if (selected_box){
                    if (!mouse_right_down)
                        transform_bbox("z_move_up");
                    else
                        transform_bbox("z_scale_up");                    
                }
                break;
        case 'E':
            if (selected_box){
                transform_bbox("z_scale_up");
            }
            break;

        case 'f':
            if (selected_box){                
                transform_bbox("z_rotate_right");                
            }
            break;
        case 'r':
            if (selected_box){
                transform_bbox("z_rotate_left");
            }
            break;
        
        case 'g':
            transform_bbox("z_rotate_reverse");
            break;
        case 't':
            transform_bbox("reset");
            break;
        
        case 'Delete':
            remove_selected_box();
            break;
    
    }
}

function remove_selected_box(){
    if (selected_box){
        unselect_bbox(null);
        unselect_bbox(null); //twice to safely unselect.
        //transform_control.detach();


        scene.remove(selected_box);
        selected_box.geometry.dispose();
        selected_box.material.dispose();
        //selected_box.dispose();
        data.bboxes = data.bboxes.filter(function(x){return x !=selected_box;});
        selected_box = null;
        sideview_mesh = null;
    }
}

function remove_all_boxes(){
    data.bboxes.forEach(function(b){
        scene.remove(b);
        b.geometry.dispose();
        b.material.dispose();
    });

    data.bboxes = [];
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
    
    mesh.type = "car";

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


function new_bbox_cube(){

    var h = 0.5;
    
    var body = [
        //top
        -h,h,h,  h,h,h,
        h,h,h,   h,-h,h,
        h,-h,h,  -h,-h,h,
        -h,-h,h, -h, h, h, 

        //botom
        -h,h,-h,  h,h,-h,
        h,h,-h,   h,-h,-h,
        h,-h,-h,  -h,-h,-h,
        -h,-h,-h, -h, h, -h, 

        // vertical lines
        -h,h,h, -h,h,-h,
        h,h,h,   h,h,-h,
        h,-h,h,  h,-h,-h,
        -h,-h,h, -h,-h,-h,

        //direction
        0, 0, h+0.1, 0, h, h+0.1,
        -h,h/2,h+0.1, 0, h, h+0.1,
        h,h/2,h+0.1, 0, h, h+0.1,

        //side direction
        // h, h/2, h,  h, h, 0,
        // h, h/2, -h,  h, h, 0,
        // h, 0, 0,  h, h, 0,
        
    ];
    

    var bbox = new THREE.BufferGeometry();
    bbox.addAttribute( 'position', new THREE.Float32BufferAttribute(body, 3 ) );
    
    var box = new THREE.LineSegments( bbox, new THREE.LineBasicMaterial( { color: 0x00ff00 } ) );    
    
    box.scale.x=1.8;
    box.scale.y=4.5;
    box.scale.z=1.5;
    box.name="bbox";
    box.obj_type="car";
    box.obj_id="1";

    box.computeLineDistances();

    return box;
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
    var rotation = mesh.rotation;

    // document.getElementById("info").innerHTML = "w "+scale.x.toFixed(2) +" l "+scale.y.toFixed(2) + " h " + scale.z.toFixed(2) +
    //                                              " x "+pos.x.toFixed(2) +" y "+pos.y.toFixed(2) + " z " + pos.z.toFixed(2);

    document.getElementById("info").innerHTML = pos.x.toFixed(2) +" "+pos.y.toFixed(2) + " " + pos.z.toFixed(2) + " | "+
                                                scale.x.toFixed(2) +" "+scale.y.toFixed(2) + " " + scale.z.toFixed(2) + " | " + 
                                                (rotation.z*180/Math.PI).toFixed(2);
}

