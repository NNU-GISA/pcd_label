import * as THREE from './lib/three.module.js';
//import Stats from './build/stats.module.js';
//import { TrackballControls } from './TrackballControls.js';
//import { PCDLoader } from './lib/PCDLoader.js';
//import { GeometryUtils } from './examples/jsm/utils/GeometryUtils.js';
//import {BBoxBufferGeometry } from './BBoxGeometry.js';
//import { ShadowMapViewer } from './examples/jsm/utils/ShadowMapViewer.js';
import { GUI } from './lib/dat.gui.module.js';

import {data} from './data.js'
import {create_views, views} from "./view.js"

var container;

var scene, renderer;

var raycaster;
var mouse;
var onDownPosition = new THREE.Vector2();
var onUpPosition = new THREE.Vector2();

var selected_box;
var box_navigate_index=0;

var sideview_mesh=null;


var windowWidth, windowHeight;

var params={};


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
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.BasicShadowMap;

    //renderer.setClearColor( 0x000000, 0 );
    //renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    // renderer will set this eventually
    //matLine.resolution.set( window.innerWidth, window.innerHeight ); // resolution of the viewport
    

    container = document.createElement( 'container' );
    

    document.body.appendChild( container );
    container.appendChild( renderer.domElement );

    create_views(scene, renderer.domElement, render, on_box_changed);

    init_gui();

    scene.add( new THREE.AxesHelper( 2 ) );

    onWindowResize();

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', keydown );

    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function animate() {
    requestAnimationFrame( animate );
    views[0].orbit_orth.update();
}



function render(){

    views[0].switch_camera(params["bird's eye view"]);
    
    for ( var ii = 0; ii < views.length; ++ ii ) {

        if ((ii > 0) && params["hide side views"]){
            break;
        }

        var view = views[ ii ];
        var camera = view.camera;
        //view.updateCamera( camera, scene, mouseX, mouseY );
        var left = Math.floor( window.innerWidth * view.left );
        var bottom = Math.floor( window.innerHeight * view.bottom );
        var width = Math.ceil( window.innerWidth * view.width );
        var height = Math.ceil( window.innerHeight * view.height );
        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setClearColor(view.background );
        renderer.setScissorTest( true );

        renderer.render( scene, camera );
    }   

}





function save_annotation(){
    var bbox_annotations=[];
    console.log(data.world.boxes.length, "boxes");
    data.world.boxes.forEach(function(b){
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
    xhr.open("POST", "/save" +"?scene="+data.world.file_info.scene+"&frame="+data.world.file_info.frame, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    var b = JSON.stringify(bbox_annotations);
    console.log(b);
    xhr.send(b);

    // unmark changed flag
    //document.getElementById("frame").innerHTML = data.world.file_info.scene+"/"+data.world.file_info.frame;
    unmark_changed_flag();
}




function load_data_meta(gui_folder){

    function add_one_scene(c){
        console.log("add scene", c);

        var folder = gui_folder.addFolder(c.scene);

        var thisscene={};

        c.frames.forEach(function(f){
            //var f = c.frames[frame_index];
            thisscene[f] = function(){
                console.log("clicked", c);

                //data.file_info.set(c.scene, f, c.point_transform_matrix, c.boxtype);
                //remove_all();  //remove before new data loaded.
                //load_all();

                //update_frame_info(c.scene, f);
                load_world(c.scene, f);
            }

            folder.add(thisscene, f);
        });

    }

    var xhr = new XMLHttpRequest();
    // we defined the xhr
    
    xhr.onreadystatechange = function () {
        if (this.readyState != 4) 
            return;
    
        if (this.status == 200) {
            var ret = JSON.parse(this.responseText);
            //console.log(ret);

            data.meta = ret;
            ret.forEach(function(c){
                add_one_scene(c);
            })
        }
    };
    
    xhr.open('GET', "/datameta", true);
    xhr.send();
}



var stop_play_flag=true;
var pause_play_flag=false;

function pause_resume_play(){
    pause_play_flag=!pause_play_flag;

    if (!pause_play_flag && !stop_play_flag){
        play_current_scene_with_buffer(true);
    }
}


function stop_play(){
    stop_play_flag=true;
    pause_play_flag=false;
}

function play_current_scene_with_buffer(resume){
    
    if (!data.meta){
        console.log("no meta data! cannot play");
        return;
    }

    if (stop_play_flag== false && !resume){
        return;
    }

    stop_play_flag = false;
    pause_play_flag = false;

    var scene_meta = data.get_current_world_scene_meta();

    var scene_name= scene_meta.scene;
    
    data.reset_world_buffer();

    //var start_frame_index = scene_meta.frames.findIndex(function(x){return x == data.world.file_info.frame;})

    preload_frame(scene_meta, data.world.file_info.frame);
    play_frame(scene_meta, data.world.file_info.frame);


    function preload_frame(meta, frame){
        //if (frame_index < scene_meta.frames.length && !stop_play_flag)
        {
            var new_world = data.make_new_world(meta.scene,
                frame, 
                function(world){
                    data.put_world_into_buffer(world);  //put new world into buffer.

                    // continue next frmae
                    if (!stop_play_flag && !pause_play_flag){
                        var frame_index = meta.frames.findIndex(function(x){return x == frame;});
                        if (frame_index+1 < meta.frames.length){
                            preload_frame(meta, meta.frames[frame_index+1]);
                        }
                    }
                });
            
        }
        
    };
    

    function play_frame(scene_meta, frame){
        if (!stop_play_flag && !pause_play_flag)
        {
            var world = data.future_world_buffer.find(function(w){return w.file_info.frame == frame; });
            
            var next_frame = frame;

            if (world)  //found
            {
                data.activate_world(scene,  //this is webgl scene
                    world, 
                    function(){//on load finished
                        views[0].detach_control();
                        render();
                        update_frame_info(scene_meta.scene, frame);
                });
           
                var frame_index = scene_meta.frames.findIndex(function(x){return x == frame;});
                if (frame_index+1 < scene_meta.frames.length)
                {
                    next_frame = scene_meta.frames[frame_index+1];
                } 
                else{
                    stop_play_flag = true;
                    pause_play_flag = false;
                }
            }
            else{
                //not ready.
                console.log("wait buffer!", frame);   
            } 
            
            setTimeout(
                function(){                    
                    play_frame(scene_meta, next_frame);
                }, 
                100);
        }
    };
}



function play_current_scene_without_buffer(){
    
    if (!data.meta){
        console.log("no meta data! cannot play");
        return;
    }

    if (stop_play_flag== false){
        return;
    }

    stop_play_flag = false;

    var scene_meta = data.get_current_world_scene_meta();
    var scene_name= scene_meta.scene;
    
    play_frame(scene_meta, data.world.file_info.frame);


    function play_frame(scene_meta, frame){
        load_world(scene_name, frame);


        if (!stop_play_flag)
        {   
            var frame_index = scene_meta.frames.findIndex(function(x){return x == frame;});
            if (frame_index+1 < scene_meta.frames.length)
            {
                next_frame = scene_meta.frames[frame_index+1];
                setTimeout(
                    function(){    
                        play_frame(scene_meta, next_frame);                       
                    }, 
                    100);                   
            } 
            else{
                stop_play_flag = true;
            } 
        
        }
    };
}


function init_gui(){
    var gui = new GUI();

    var cfgFolder = gui.addFolder( 'View' );

    params["hide side views"] = false;    
    params["bird's eye view"] = false;
    params["hide image"] = false;

    params["reset bird's eye view"] = function(){
        views[0].reset_birdseye();
    };
    params["rotate bird's eye view"] = function(){
        views[0].rotate_birdseye();
    };
    
    params["side view width"] = 0.2;

    cfgFolder.add( params, "hide side views");
    cfgFolder.add( params, "side view width");
    cfgFolder.add( params, "bird's eye view");
    cfgFolder.add( params, "hide image");
    cfgFolder.add( params, "reset bird's eye view");
    cfgFolder.add( params, "rotate bird's eye view");


    params["play"] = play_current_scene_with_buffer;
    params["stop"] = stop_play;
    params["previous frame"] = previous_frame;
    params["next frame"] = next_frame;

    cfgFolder.add( params, "play");
    cfgFolder.add( params, "stop");
    cfgFolder.add( params, "previous frame");
    cfgFolder.add( params, "next frame");


    var fileFolder = gui.addFolder( 'File' );
    params['save'] = function () {
        save_annotation();
    };
    fileFolder.add( params, 'save');

    
    params['reload'] = function () {
        load_world(data.world.file_info.scene, data.world.file_info.frame);
    };

    fileFolder.add( params, 'reload');

    params['clear'] = function () {
        clear();
    };
    fileFolder.add( params, 'clear');


    fileFolder.open();

    var dataFolder = gui.addFolder( 'Data' );
    load_data_meta(dataFolder);

    gui.open();
}



function update_subview_by_windowsize(){

    if (sideview_mesh === null)
        return;

    //update cfg
    

    // side views
    var exp_camera_width, exp_camera_height, exp_camera_clip;

    for ( var ii = 1; ii < views.length; ++ ii ) {
        var view = views[ ii ];
        var camera = view.camera;

        view.width = params["side view width"];

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
        
        //camera.aspect = view_width / view_height;
        camera.updateProjectionMatrix();
        view.cameraHelper.update();
        
        
    }

    render();
}

function update_subview_by_bbox(mesh){
    var p = mesh.position;
    var r = mesh.rotation;

    sideview_mesh = mesh;

    //

    views[1].camera.rotation.z= r.z;
    views[2].camera.rotation.y= Math.PI-r.z;
    views[3].camera.rotation.y= Math.PI/2 + r.z;

    for (var i=1; i<views.length; ++i){
        views[i].camera.position.x= p.x;
        views[i].camera.position.y= p.y;
        views[i].camera.position.z= p.z;
        views[i].camera.updateProjectionMatrix();
        views[i].cameraHelper.update();        
    }

    on_selected_box_changed(sideview_mesh);

    update_subview_by_windowsize();  // render() is called inside this func
}


function unmark_changed_flag(){

    var s = document.getElementById("frame").innerHTML
    document.getElementById("frame").innerHTML = s.split("*")[0];
}

function mark_changed_flag(){
    var s = document.getElementById("frame").innerHTML
    if (! s.endsWith("*"))
        document.getElementById("frame").innerHTML += "*"
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

        if (!data.world || !data.world.boxes){
            return;
        }
    
    
        var intersects = getIntersects( onUpPosition, data.world.boxes );

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

        //render();

    }

}

// new_object
function unselect_bbox(new_object){

    if (new_object==null){
        if (views[0].transform_control.visible)
        {
            //unselect first time
            views[0].transform_control.detach();
        }else{
            //unselect second time
            if (selected_box){
                selected_box.material.color.r=0;
                selected_box.material.color.g=1;
                selected_box.material.color.b=0;
            }
            selected_box = null;
            on_selected_box_changed(null);
        }
    }
    else{
        //unselect all
        views[0].transform_control.detach();
        if (selected_box){
            selected_box.material.color.r=0;
            selected_box.material.color.g=1;
            selected_box.material.color.b=0;
        }
        selected_box = null;
        on_selected_box_changed(null);

    }

    render();

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

          
    }
    else {
        //reselect the same box
        if (views[0].transform_control.visible){

        }
        else{
            //select me the second time
            views[0].transform_control.attach( object );
        }
    }

    update_subview_by_bbox(object);
    
}



function onWindowResize() {
    //camera.aspect = window.innerWidth / window.innerHeight;
    //camera.updateProjectionMatrix();
    //renderer.setSize( window.innerWidth, window.innerHeight );

    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        //update_mainview();
        views[0].onWindowResize();

        update_subview_by_windowsize();

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        renderer.setSize( windowWidth, windowHeight );

        
    }
    
    render();

    //controls.handleResize();

    //dirLightShadowMapViewer.updateForWindowResize();

}

function change_transform_control_view(){
    if (views[0].transform_control.mode=="scale"){
        views[0].transform_control.setMode( "translate" );
        views[0].transform_control.showY=true;
        views[0].transform_control.showX=true;
        views[0].transform_control.showz=true;
    }else if (views[0].transform_control.mode=="translate"){
        views[0].transform_control.setMode( "rotate" );
        views[0].transform_control.showY=false;
        views[0].transform_control.showX=false;
        views[0].transform_control.showz=true;
    }else if (views[0].transform_control.mode=="rotate"){
        views[0].transform_control.setMode( "scale" );
        views[0].transform_control.showY=true;
        views[0].transform_control.showX=true;
        views[0].transform_control.showz=true;
    }
}

function add_raw_boxes(boxes){
    boxes.forEach(function(b){
        var geo = new THREE.BufferGeometry();
        geo.addAttribute( 'position', new THREE.Float32BufferAttribute(b, 3 ) );
        
        var box = new THREE.LineSegments( geo, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );    
        scene.add(box);
    });
}

function add_bbox(){
    //mesh = ev.key=='b'?new_bbox(): new_bbox_cube();
    //mesh = new_bbox_cube();

    // todo: move to data.world
    var pos = get_mouse_location_in_world(mouse);

    var box = data.world.add_box(pos.x, pos.y, pos.z);

    scene.add(box);

    sideview_mesh=box;
    
    select_bbox(box);
    
}

// axix, xyz, action: scale, move, direction, up/down
function transform_bbox(command){
    if (!selected_box)
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
    
    mark_changed_flag();
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

    update_subview_by_windowsize();
}

function keydown( ev ) {
    
    switch ( ev.key) {
        case '+':
            //data.increase_point_size();
            break;
        case '-':
            //data.decrease_point_size();
            break;
        case '1': 
        case '2':
            {
                //transform_control.setSpace( transform_control.space === "local" ? "world" : "local" );

                //select current index
                if (data.world.boxes[box_navigate_index]!= selected_box){

                }
                else {
                    if (ev.key== '1')
                        box_navigate_index += 1;
                    else 
                        box_navigate_index += (data.world.boxes.length-1);
                    
                    box_navigate_index %= data.world.boxes.length;
                }
                console.log(box_navigate_index);
                select_bbox(data.world.boxes[box_navigate_index]);
                
                //views[0].look_at(data.world.boxes[box_navigate_index].position);
                
                
                
            }
            break;
        case '3':
            previous_frame();
            break;
        case '4':
            next_frame();
            break;

        case 'v':
            change_transform_control_view();
            break;
        case 'N':    
        case 'n':
            add_bbox();
            mark_changed_flag();
            break;        
        case 'B':
        case 'b':
            switch_bbox_type();
            mark_changed_flag();
            break;
        case '+':
        case '=': // +, =, num+
            //transform_control.setSize( transform_control.size + 0.1 );
            break;
        case '-':
            //case 109: // -, _, num-
            //transform_control.setSize( Math.max( transform_control.size - 0.1, 0.1 ) );
            break;
        case 'z': // X
            views[0].transform_control.showX = ! views[0].transform_control.showX;
            break;
        case 'x': // Y
            views[0].transform_control.showY = ! views[0].transform_control.showY;
            break;
        case 'c': // Z
            views[0].transform_control.showZ = ! views[0].transform_control.showZ;
            break;            
        case ' ': // Spacebar
            //views[0].transform_control.enabled = ! views[0].transform_control.enabled;
            pause_resume_play();
            break;
            
        case '5':            
        case '6':
        case '7':
            views[ev.key-'4'].cameraHelper.visible = !views[ev.key-'4'].cameraHelper.visible;
            render();
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
            if (ev.ctrlKey){
                save_annotation();
            }
            else if (selected_box){
                if (!mouse_right_down){
                    transform_bbox("y_move_down");
                }else{
                    transform_bbox("y_scale_down");
                }
            }
            break;
        case 'S':
            if (ev.ctrlKey){
                save_annotation();
            }
            else if (selected_box){
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
                if (mouse_right_down){
                    transform_bbox("z_scale_down");                    
                }
                else if (ev.ctrlKey){
                    remove_selected_box();
                    mark_changed_flag();
                }else{
                    transform_bbox("z_move_down");
                }
                
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
            mark_changed_flag();
            break;
    
    }
}


function previous_frame(){

    if (!data.meta)
        return;

    var scene_meta = data.meta.find(function(x){
        return x.scene == data.world.file_info.scene;
    });

    var num_frames = scene_meta.frames.length;

    var frame_index = (data.world.file_info.frame_index-1 + num_frames) % num_frames;

    load_world(scene_meta.scene, scene_meta.frames[frame_index]);

    

}

function load_world(scene_name, frame){

    //stop if current world is not ready!
    if (data.world && !data.world.complete()){
        console.log("current world is still loading.");
        return;
    }

    var world = data.make_new_world(
        scene_name, 
        frame);
    data.activate_world(scene, 
        world, 
        function(){
            //views[0].detach_control();
            unselect_bbox(null);
            unselect_bbox(null);
            render();
            update_frame_info(scene_name, frame);
        }
    );
}

function next_frame(){

    if (!data.meta)
        return;
        
    var scene_meta = data.get_current_world_scene_meta();

    var num_frames = scene_meta.frames.length;

    var frame_index = (data.world.file_info.frame_index +1) % num_frames;

    load_world(scene_meta.scene, scene_meta.frames[frame_index]);
}

function remove_selected_box(){
    if (selected_box){
        var targt_box = selected_box;
        unselect_bbox(null);
        unselect_bbox(null); //twice to safely unselect.
        //transform_control.detach();


        scene.remove(targt_box);
        targt_box.geometry.dispose();
        targt_box.material.dispose();
        //selected_box.dispose();
        data.world.boxes = data.world.boxes.filter(function(x){return x !=targt_box;});
        selected_box = null;
        sideview_mesh = null;

        render();
    }
}

function clear(){
    //remove boxinfo
    //remove frameinfo
    //remove image
    clear_box_info();
    document.getElementById("image").innerHTML = '';
    document.getElementById("frame").innerHTML = '';
    clear_image_box_projection();


    data.world.destroy();
    data.world= null; //dump it
    render();
}


function update_frame_info(scene, frame){
    document.getElementById("frame").innerHTML = scene+"/"+frame;

    if (params["hide image"]){
        document.getElementById("image").innerHTML = '';
        //document.getElementById("image").innerHTML = '<img id="camera" display="none" src="/static/data/'+data.world.file_info.scene+'/image/'+ data.world.file_info.frame+'.jpg" alt="img">';
    } else{
        if (data.world.image.naturalHeight){
            document.getElementById("image").innerHTML = '<img id="camera" src="/static/data/'+scene+'/image/'+ frame+'.jpg" alt="img">';
        }
        else{
            // image preload failed. don't try again.
            document.getElementById("image").innerHTML = 'no image';
        }
    }
}

function on_box_changed(event){
    
    var mesh = event.target.object;
    //console.log("bbox rotation z", mesh.rotation.z);
    update_subview_by_bbox(mesh);  
    mark_changed_flag();  
}

function on_selected_box_changed(box){

    if (box){
        
        update_box_info(box);
        update_image_box_projection(box)

    } else {
        clear_box_info();
        clear_image_box_projection();
    }
}

function clear_box_info(){
    document.getElementById("box").innerHTML = '';

}

function update_box_info(box){
    var scale = box.scale;
    var pos = box.position;
    var rotation = box.rotation;

    // document.getElementById("info").innerHTML = "w "+scale.x.toFixed(2) +" l "+scale.y.toFixed(2) + " h " + scale.z.toFixed(2) +
    //                                              " x "+pos.x.toFixed(2) +" y "+pos.y.toFixed(2) + " z " + pos.z.toFixed(2);

    document.getElementById("box").innerHTML = pos.x.toFixed(2) +" "+pos.y.toFixed(2) + " " + pos.z.toFixed(2) + " | "+
                                                scale.x.toFixed(2) +" "+scale.y.toFixed(2) + " " + scale.z.toFixed(2) + " | " + 
                                                (rotation.z*180/Math.PI).toFixed(2);
}

function clear_image_box_projection(){
    clear_canvas();

    function clear_canvas(){
        var c = document.getElementById("canvas");
        var ctx = c.getContext("2d");
                    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function update_image_box_projection(box){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});

    if (scene_meta.calib){

        var scale = box.scale;
        var pos = box.position;
        var rotation = box.rotation;

        var img = data.world.image; //document.getElementById("camera");
        if (img){

            clear_image_box_projection();


            var box3d = psr_to_xyz(pos, scale, rotation);

            // project corners to image plane
            var imgpos = matmul(scene_meta.calib.extrinsic, box3d, 4);
            var imgpos3 = vector4to3(imgpos);
            var imgpos2 = matmul(scene_meta.calib.intrinsic, imgpos3, 3);
            var imgfinal = vector3_nomalize(imgpos2);

            //console.log(imgfinal);
            
            var c = document.getElementById("canvas");
            var ctx = c.getContext("2d");
            
            // note: 320*240 should be adjustable
            var crop_area = crop_image(img.naturalWidth, img.naturalHeight, 320, 240, imgfinal);

            ctx.drawImage(img, crop_area[0], crop_area[1],crop_area[2], crop_area[3], 0, 0, 320, 240);// ctx.canvas.clientHeight);
            //ctx.drawImage(img, 0,0,img.naturalWidth, img.naturalHeight, 0, 0, 320, 180);// ctx.canvas.clientHeight);
            var imgfinal = vectorsub(imgfinal, [crop_area[0],crop_area[1]]);

            //ctx.lineWidth = 0.5;
            ctx.strokeStyle="#00ff00";
            ctx.beginPath();

            var trans_ratio = 240/crop_area[3];

            ctx.moveTo(imgfinal[3*2]*trans_ratio,imgfinal[3*2+1]*trans_ratio);

            for (var i=0; i < imgfinal.length/2/2; i++)
            {
                ctx.lineTo(imgfinal[i*2+0]*trans_ratio, imgfinal[i*2+1]*trans_ratio);
            }                

            ctx.stroke();

            ctx.strokeStyle="#ff00ff";
            ctx.beginPath();

            ctx.moveTo(imgfinal[7*2]*trans_ratio,imgfinal[7*2+1]*trans_ratio);

            for (var i=4; i < imgfinal.length/2; i++)
            {
                ctx.lineTo(imgfinal[i*2+0]*trans_ratio, imgfinal[i*2+1]*trans_ratio);
            }
            
            ctx.moveTo(imgfinal[0*2]*trans_ratio,imgfinal[0*2+1]*trans_ratio);
            ctx.lineTo(imgfinal[4*2+0]*trans_ratio, imgfinal[4*2+1]*trans_ratio);
            ctx.moveTo(imgfinal[1*2]*trans_ratio,imgfinal[1*2+1]*trans_ratio);
            ctx.lineTo(imgfinal[5*2+0]*trans_ratio, imgfinal[5*2+1]*trans_ratio);
            ctx.moveTo(imgfinal[2*2]*trans_ratio,imgfinal[2*2+1]*trans_ratio);
            ctx.lineTo(imgfinal[6*2+0]*trans_ratio, imgfinal[6*2+1]*trans_ratio);
            ctx.moveTo(imgfinal[3*2]*trans_ratio,imgfinal[3*2+1]*trans_ratio);
            ctx.lineTo(imgfinal[7*2+0]*trans_ratio, imgfinal[7*2+1]*trans_ratio);


            ctx.stroke();
            
        }
    }
}




// matrix (m*n), matrix(n*l), vl=n 
function matmul(m, x, vl)  //vl is vector length
{
    var ret=[];
    for (var vi =0; vi < x.length/vl; vi++){  //vector index
        for (var r = 0; r<m.length/vl; r++){  //row of matrix
            ret[vi*vl+r] = 0;
            for (var i = 0; i<vl; i++){
                ret[vi*vl+r] += m[r*vl+i]*x[vi*vl+i];
            }
        }
    }

    return ret;
}

// box(position, scale, rotation) to box corner corrdinates.
// return 8 points, represented as (x,y,z,1)
function psr_to_xyz(p,s,r){
    var trans_matrix=[
        Math.cos(r.z), -Math.sin(r.z), 0, p.x,
        Math.sin(r.z), Math.cos(r.z),  0, p.y,
        0,             0,              1, p.z,
        0,             0,              0, 1,
    ];

    var x=s.x/2;
    var y=s.y/2;
    var z=s.z/2;
    var local_coord = [
        -x, y, -z, 1,   x, y, -z, 1,  //front-left-bottom, front-right-bottom
        x, y, z, 1,    -x, y, z, 1,  //front-right-top,   front-left-top

        -x, -y, -z, 1,   x, -y, -z, 1,  
        x, -y, z, 1,   -x, -y, z, 1,        
        
    ];

    var world_coord = matmul(trans_matrix, local_coord, 4);
    var w = world_coord;
    return w;
}


function vector4to3(v)
{
    var ret=[];
    for (var i=0; i<v.length; i++){
        if ((i+1)% 4 != 0){
            ret.push(v[i]);
        }
    }

    return ret;
}

function vector3_nomalize(m){
    var ret=[];
    for (var i=0; i<m.length/3; i++){
        ret.push(m[i*3+0]/m[i*3+2]);
        ret.push(m[i*3+1]/m[i*3+2]);
    }

    return ret;
}

function crop_image(imgWidth, imgHeight, clientWidth, clientHeight, corners)
{
    var maxx=0, maxy=0, minx=imgWidth, miny=imgHeight;

    for (var i = 0; i < corners.length/2; i++){
        var x = corners[i*2];
        var y = corners[i*2+1];

        if (x>maxx) maxx=x;
        else if (x<minx) minx=x;

        if (y>maxy) maxy=y;
        else if (y<miny) miny=y;        
    }

    var targetWidth= (maxx-minx)*1.5;
    var targetHeight= (maxy-miny)*1.5;

    if (targetWidth/targetHeight > clientWidth/clientHeight){
        //increate height
        targetHeight = targetWidth*clientHeight/clientWidth;        
    }
    else{
        targetWidth = targetHeight*clientWidth/clientHeight;
    }

    var centerx = (maxx+minx)/2;
    var centery = (maxy+miny)/2;

    return [
        centerx - targetWidth/2,
        centery - targetHeight/2,
        targetWidth,
        targetHeight
    ];
}

function vectorsub(vs, v){
    var ret = [];
    var vl = v.length;

    for (var i = 0; i<vs.length/vl; i++){
        for (var j=0; j<vl; j++)
            ret[i*vl+j] = vs[i*vl+j]-v[j];
    }

    return ret;
}
