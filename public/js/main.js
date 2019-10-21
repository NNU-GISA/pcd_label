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
import {createFloatLabelManager} from "./floatlabel.js"
import {vector4to3, vector3_nomalize, psr_to_xyz, matmul, matmul2, euler_angle_to_rotate_matrix, rotation_matrix_to_euler_angle, obj_type_color_map} from "./util.js"
import {header} from "./header.js"

var sideview_enabled = true;
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

var g_text;
var g_pos;

var floatLabelManager;

var lock_obj_track_id;

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
    

    //container = document.createElement( 'container' );
    container = document.getElementById("container");
    

    //document.body.appendChild( container );
    container.appendChild( renderer.domElement );

    create_views(scene, renderer.domElement, render, on_box_changed);

    add_range_box();

    floatLabelManager = createFloatLabelManager(views[0]);

    init_gui();

    scene.add( new THREE.AxesHelper( 1 ) );

    onWindowResize();

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', keydown );

    //renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    container.addEventListener( 'mousemove', onDocumentMouseMove, false );
    container.addEventListener( 'mousedown', onDocumentMouseDown, false );
    
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
 
    document.getElementById("object-category-selector").onchange = object_category_changed;
    document.getElementById("object-track_id_editor").onchange = object_track_id_changed;
    document.getElementById("object-track_id_editor").addEventListener("keydown", function(e){
        e.stopPropagation();});
    
    document.getElementById("object-track_id_editor").addEventListener("keyup", function(e){
        e.stopPropagation();

        if (selected_box){
            selected_box.obj_track_id = this.value;
            floatLabelManager.set_object_track_id(selected_box.obj_local_id, selected_box.obj_track_id);
        }
    });
    //document.getElementById("header-row").addEventListener('mousedown', function(e){e.preventDefault();});
    //document.getElementById("header-row").addEventListener('mousemove', function(e){e.preventDefault();});
    
}


function add_range_box(){
    
    var h = 1;
    
                
    var body = [
        
        /*
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
        */
    ];
    
    var segments=64;
    for (var i = 0; i<segments; i++){
        var theta1 = (2*Math.PI/segments) * i;
        var x1 = Math.cos(theta1);
        var y1 = Math.sin(theta1);

        var theta2 = 2*Math.PI/segments * ((i+1)%segments);
        var x2 = Math.cos(theta2);
        var y2 = Math.sin(theta2);

        body.push(x1,y1,h,x2,y2,h);
    }

    var bbox = new THREE.BufferGeometry();
    bbox.addAttribute( 'position', new THREE.Float32BufferAttribute(body, 3 ) );
    
    var box = new THREE.LineSegments( bbox, new THREE.LineBasicMaterial( { color: 0x444444, linewidth: 1 } ) );    
    
    box.scale.x=100;
    box.scale.y=100;
    box.scale.z=-6;
    box.position.x=0;
    box.position.y=0;
    box.position.z=0;
    box.computeLineDistances();

    scene.add(box);
}

function animate() {
    requestAnimationFrame( animate );
    views[0].orbit_orth.update();
}



function render(){

    views[0].switch_camera(params["bird's eye view"]);
    
    for ( var ii = 0; ii < views.length; ++ ii ) {

        if ((ii > 0) && !sideview_enabled){
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

    floatLabelManager.update_all_position();
}

var marked_object = null;

// mark bbox, which will be used as reference-bbox of an object.
function mark_bbox(){
    if (selected_box){
        marked_object = {
            frame: data.world.file_info.frame,
            scene: data.world.file_info.scene,
            obj_type: selected_box.obj_type,
            obj_track_id: selected_box.obj_track_id,
            position: selected_box.position,  //todo, copy x,y,z, not object
            scale: selected_box.scale,
            rotation: selected_box.rotation,
        }

        console.log(marked_object);

        header.set_ref_obj(marked_object);
    }
}

function paste_bbox(pos){

    if (!pos)
       pos = marked_object.position;
    else
       pos.z = marked_object.position.z;

    var box = data.world.add_box(pos.x, pos.y, pos.z);

    box.obj_track_id = marked_object.obj_track_id;
    box.obj_type = marked_object.obj_type;


    box.scale.x = marked_object.scale.x;
    box.scale.y = marked_object.scale.y;
    box.scale.z = marked_object.scale.z;

    box.rotation.x = marked_object.rotation.x;
    box.rotation.y = marked_object.rotation.y;
    box.rotation.z = marked_object.rotation.z;


    scene.add(box);

    sideview_mesh=box;

    floatLabelManager.add_label(box);
    
    select_bbox(box);
    
    return box;
}

function auto_adjust_bbox(done){

    save_annotation(function(){
        do_adjust();
    });

    function do_adjust(){
        console.log("auto adjust highlighted bbox");

        var xhr = new XMLHttpRequest();
        // we defined the xhr
        var _self = this;
        xhr.onreadystatechange = function () {
            if (this.readyState != 4) return;
        
            if (this.status == 200) {
                console.log(this.responseText)
                console.log(selected_box.position);
                console.log(selected_box.rotation);


                var trans_mat = JSON.parse(this.responseText);

                var rotation = Math.atan2(trans_mat[4], trans_mat[0]) + selected_box.rotation.z;
                var transform = {
                    x: -trans_mat[3],
                    y: -trans_mat[7],
                    z: -trans_mat[11],
                }

                
                /*
                cos  sin    x 
                -sin cos    y 
                */
                var new_pos = {
                    x: Math.cos(-rotation) * transform.x + Math.sin(-rotation) * transform.y,
                    y: -Math.sin(-rotation) * transform.x + Math.cos(-rotation) * transform.y,
                    z: transform.z,
                };


                selected_box.position.x += new_pos.x;
                selected_box.position.y += new_pos.y;
                selected_box.position.z += new_pos.z;
                
                

                selected_box.scale.x = marked_object.scale.x;
                selected_box.scale.y = marked_object.scale.y;
                selected_box.scale.z = marked_object.scale.z;

                selected_box.rotation.z -= Math.atan2(trans_mat[4], trans_mat[0]);

                console.log(selected_box.position);
                console.log(selected_box.rotation);

                update_subview_by_bbox(selected_box);
        
                mark_changed_flag();

                if (done){
                    done();
                }
            }
        
            // end of state change: it can be after some time (async)
        };
        
        xhr.open('GET', 
                "/auto_adjust"+"?scene="+marked_object.scene + "&"+
                            "ref_frame=" + marked_object.frame + "&" +
                            "object_id=" + marked_object.obj_track_id + "&" +                           
                            "adj_frame=" + data.world.file_info.frame, 
                true);
        xhr.send();
    }


}

function save_annotation(done){
    var bbox_annotations=[];
    console.log(data.world.boxes.length, "boxes");
    data.world.boxes.forEach(function(b){
        var vertices = psr_to_xyz(b.position, b.scale, b.rotation);

        var b = {
            psr: {
                position:b.position,
                scale:b.scale,
                rotation:{
                    x:b.rotation.x,
                    y:b.rotation.y,
                    z:b.rotation.z,
                },
            },
            
            position:b.position,
            scale:b.scale,
            rotation:{
                x:b.rotation.x,
                y:b.rotation.y,
                z:b.rotation.z,
            },

            obj_type: b.obj_type,
            obj_id: b.obj_track_id,
            vertices: vertices,
        };

        bbox_annotations.push(b);
        
    });

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/save" +"?scene="+data.world.file_info.scene+"&frame="+data.world.file_info.frame, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;
    
        if (this.status == 200) {
            console.log("save annotation finished.");
            if(done){
                done();
            }
        }
    
        // end of state change: it can be after some time (async)
    };

    var b = JSON.stringify(bbox_annotations);
    //console.log(b);
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
                //console.log("clicked", c);

                //data.file_info.set(c.scene, f, c.point_transform_matrix, c.boxtype);
                //remove_all();  //remove before new data loaded.
                //load_all();

                //update_frame_info(c.scene, f);
                load_world(c.scene, f);
            };

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
            data.meta = ret;
                                
            //play_frame(scene_meta, frame);
            ret.forEach(function(c){
                add_one_scene(c);
            });
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

            if (world)  //found, data ready
            {
                data.activate_world(scene,  //this is webgl scene
                    world, 
                    function(){//on load finished
                        //views[0].detach_control();
                        unselect_bbox(null, true);
                        unselect_bbox(null, true);
                        render();
                        render_2d_image();
                        render_2d_labels();
                        update_frame_info(scene_meta.scene, frame);
                        select_locked_object();

                        next_frame();
                        
                        function next_frame(){
                            var frame_index = scene_meta.frames.findIndex(function(x){return x == frame;});
                            if (frame_index+1 < scene_meta.frames.length)
                            {
                                var next_frame = scene_meta.frames[frame_index+1];
                                setTimeout(
                                    function(){                    
                                        play_frame(scene_meta, next_frame);
                                    }, 
                                    500);
                            } 
                            else{
                                stop_play_flag = true;
                                pause_play_flag = false;
                            }
                        }
                });
           
            }
            else{
                //not ready.
                console.log("wait buffer!", frame);   

                setTimeout(
                    function(){                    
                        play_frame(scene_meta, frame);
                    }, 
                    100);
            } 
            
            
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

    // view
    var cfgFolder = gui.addFolder( 'View' );

    params["toggle side views"] = function(){
        sideview_enabled = !sideview_enabled;
        render();
    };  

    params["bird's eye view"] = false;
    params["hide image"] = false;
    params["toggle id"] = function(){
        floatLabelManager.id_enabled = !floatLabelManager.id_enabled;
        render_2d_labels();
    };
    params["toggle category"] = function(){
        floatLabelManager.category_enabled = !floatLabelManager.category_enabled;
        render_2d_labels();
    };

    
    params["reset main view"] = function(){
        views[0].reset_camera();
        views[0].reset_birdseye();
        //render();
    };

    params["rotate bird's eye view"] = function(){
        views[0].rotate_birdseye();
        render();
    };
    
    //params["side view width"] = 0.2;

    params["increase point size"] = function(){
        data.scale_point_size(1.2);
        render();
    };
    
    params["decrease point size"] = function(){
        data.scale_point_size(0.8);
        render();
    };

    params["point birghtness+"] = function(){
        data.scale_point_size(1.2);
        render();
    };
    
    params["point birghtness-"] = function(){
        data.scale_point_size(0.8);
        render();
    };

    cfgFolder.add( params, "increase point size");
    cfgFolder.add( params, "decrease point size");


    cfgFolder.add( params, "toggle side views");
    //cfgFolder.add( params, "side view width");
    cfgFolder.add( params, "bird's eye view");
    cfgFolder.add( params, "hide image");
    cfgFolder.add( params, "toggle id");
    cfgFolder.add( params, "toggle category");

    cfgFolder.add( params, "reset main view");
    cfgFolder.add( params, "rotate bird's eye view");


    params["play"] = play_current_scene_with_buffer;
    params["stop"] = stop_play;
    params["previous frame"] = previous_frame;
    params["next frame"] = next_frame;

    cfgFolder.add( params, "play");
    cfgFolder.add( params, "stop");
    cfgFolder.add( params, "previous frame");
    cfgFolder.add( params, "next frame");




    //edit
    var editFolder = gui.addFolder( 'Edit' );
    params['select-ref-bbox'] = function () {
        mark_bbox();
    };
    
    params['auto-adjust'] = function () {
        auto_adjust_bbox();
    };

    params['paste'] = function () {
        paste_bbox();
    };

    params['smart-paste'] = function () {
        if (!selected_box)
            paste_bbox();
        auto_adjust_bbox(function(){
            save_annotation();
        });
        
    };
    
    editFolder.add( params, 'select-ref-bbox');
    editFolder.add( params, 'paste');
    editFolder.add( params, 'auto-adjust');
    editFolder.add( params, 'smart-paste');


     //calibrate
     var calibrateFolder = gui.addFolder( 'Calibrate' );
     params['save cal'] = function () {
         save_calibration();
     };
     calibrateFolder.add( params, 'save cal');
 
     params['reset cal'] = function () {
        reset_calibration();
    };

    calibrateFolder.add(params, 'reset cal');

     [
         {name: "x", v: 0.002},
         {name: "x", v: -0.002},
         {name: "y", v: 0.002},
         {name: "y", v: -0.002},
         {name: "z", v: 0.002},
         {name: "z", v: -0.002},
         
         {name: "tx", v: 0.005},
         {name: "tx", v: -0.005},
         {name: "ty", v: 0.005},
         {name: "ty", v: -0.005},
         {name: "tz", v: 0.005},
         {name: "tz", v: -0.005},
     ].forEach(function(x){
         var item_name= x.name+","+x.v;
        params[item_name] = function () {
            calibrate(x.name, x.v);
         };
         calibrateFolder.add(params, item_name);
     });

     

    //file
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


    //fileFolder.open();

    var dataFolder = gui.addFolder( 'Data' );
    load_data_meta(dataFolder);

    gui.open();
}

function object_category_changed(event){
    if (selected_box){
        selected_box.obj_type = event.currentTarget.value;
        floatLabelManager.set_object_type(selected_box.obj_local_id, selected_box.obj_type);
    }
}
function object_track_id_changed(event){
    if (selected_box){
        selected_box.obj_track_id = event.currentTarget.value;
        floatLabelManager.set_object_track_id(selected_box.obj_local_id, selected_box.obj_track_id);
    }
}

function update_label_editor(obj_type, obj_track_id){
    document.getElementById("object-category-selector").value = obj_type;
    document.getElementById("object-track_id_editor").value = obj_track_id;
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

        view.width = 0.2;//params["side view width"];

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
    //console.log(r);
    sideview_mesh = mesh;

    //
    views[1].camera.rotation.x= r.x;
    views[1].camera.rotation.y= r.y;
    views[1].camera.rotation.z= r.z;

    views[1].camera.position.x= p.x;
    views[1].camera.position.y= p.y;
    views[1].camera.position.z= p.z;
    views[1].camera.updateProjectionMatrix();
    views[1].cameraHelper.update(); 
    

    var trans_matrix = euler_angle_to_rotate_matrix(r, p);
    //var rotate_x = euler_angle_to_rotate_matrix({x:Math.PI/2, y:0, z:0}, {x:0, y:0, z:0});
    //trans_matrix = matmul2(rotate_x, trans_matrix, 4);
    //var rotation_angle = rotation_matrix_to_euler_angle(trans_matrix)
    //var lookat2 = matmul(trans_matrix, [0, -1, 0, 1, 0, 0, 1, 1], 4);
    //views[2].camera.rotation.x= rotation_angle.x; //+Math.PI/2;
    //views[2].camera.rotation.y= rotation_angle.y;
    //views[2].camera.rotation.z= rotation_angle.z;
    //views[2].camera.updateProjectionMatrix();

    views[2].camera.position.x= p.x;
    views[2].camera.position.y= p.y;
    views[2].camera.position.z= p.z;

    var up = matmul2(trans_matrix, [0, 0, 1, 0], 4);
    views[2].camera.up.set( up[0], up[1], up[2]);
    var at = matmul2(trans_matrix, [0, 1, 0, 1], 4);
    views[2].camera.lookAt( at[0], at[1], at[2] );
    
    //views[2].camera.up.set(lookat2[4], lookat2[5], lookat2[6]);
    //views[2].camera.lookAt(lookat2[0], lookat2[1], lookat2[2]);


    
    
    views[2].camera.updateProjectionMatrix();
    views[2].cameraHelper.update();
    

    views[3].camera.position.x= p.x;
    views[3].camera.position.y= p.y;
    views[3].camera.position.z= p.z;

    var up3 = matmul2(trans_matrix, [0, 0, 1, 0], 4);
    views[3].camera.up.set( up3[0], up3[1], up3[2]);
    var at3 = matmul2(trans_matrix, [-1, 0, 0, 1], 4);
    views[3].camera.lookAt( at3[0], at3[1], at3[2] );
    

    //views[3].camera.rotation.x= Math.PI/2;
    //views[3].camera.rotation.y= Math.PI/2 + r.z;
   

    views[3].camera.updateProjectionMatrix();
    views[3].cameraHelper.update();        


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

    this.addEventListener( 'mouseup', onMouseUp, false );

}

function onMouseUp( event ) {

    if (event.which==3){
        mouse_right_down = false;
    }
    else{
        var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
        onUpPosition.fromArray( array );

        handleClick(event);
    }

    this.removeEventListener( 'mouseup', onMouseUp, false );

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


function handleClick(event) {

    
    if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

        if (event.ctrlKey){
            //Ctrl+left click to smart paste!

            smart_paste();
        }
        else{
            //select box /unselect box
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

}


function select_locked_object(){
    if (lock_obj_track_id != ""){
        var box = data.world.boxes.find(function(x){
            return x.obj_track_id == lock_obj_track_id;
        })

        if (box)
            select_bbox(box);            
    }
}

// new_object
function unselect_bbox(new_object, keep_lock){

    if (new_object==null){
        if (views[0].transform_control.visible)
        {
            //unselect first time
            views[0].transform_control.detach();
        }else{
            //unselect second time
            if (selected_box){
                selected_box.material.color = new THREE.Color(parseInt(obj_type_color_map[selected_box.obj_type]));
                floatLabelManager.unselect_box(selected_box.obj_local_id, selected_box.obj_type);
            }

            
            if (!keep_lock)
                lock_obj_track_id = "";

            selected_box = null;
            on_selected_box_changed(null);
        }
    }
    else{
        //unselect all
        views[0].transform_control.detach();

        
        if (selected_box){
            selected_box.material.color = new THREE.Color(parseInt(obj_type_color_map[selected_box.obj_type]));
            floatLabelManager.unselect_box(selected_box.obj_local_id);
        }
        
        selected_box = null;
        
        if (!keep_lock)
                lock_obj_track_id = "";

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
        lock_obj_track_id = object.obj_track_id;

        floatLabelManager.select_box(selected_box.obj_local_id);
        update_label_editor(object.obj_type, object.obj_track_id);

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


    // todo: move to data.world
    var pos = get_mouse_location_in_world(mouse);

    var box = data.world.add_box(pos.x, pos.y, pos.z);

    scene.add(box);

    sideview_mesh=box;

    floatLabelManager.add_label(box);
    
    select_bbox(box);
    
    return box;
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
        case "Car":
            selected_box.obj_type = "Bus";
            selected_box.scale.x=2.8;
            selected_box.scale.y=10;
            selected_box.scale.z=3.0;
            break;
        case "Bus":
            selected_box.obj_type = "Pedestrian";
            selected_box.scale.x=0.5;
            selected_box.scale.y=0.4;
            selected_box.scale.z=1.7;
            break;
        case "Pedestrian":
            selected_box.obj_type = "Car";
            selected_box.scale.x=1.8;
            selected_box.scale.y=4.5;
            selected_box.scale.z=1.5;
            break;
    }

    on_selected_box_changed(selected_box);
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
        case 'm':
        case 'M':
            smart_paste();
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

function smart_paste(){
    if (!selected_box){
        paste_bbox(get_mouse_location_in_world(mouse));
        auto_adjust_bbox(function(){
            save_annotation();
        });
    }
    else{
        auto_adjust_bbox(function(){
            save_annotation();
        });
    }

    mark_changed_flag();
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
            unselect_bbox(null, true);
            unselect_bbox(null, true);
            render();
            render_2d_image();
            render_2d_labels();
            update_frame_info(scene_name, frame);

            select_locked_object();
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
        var target_box = selected_box;
        unselect_bbox(null);
        unselect_bbox(null); //twice to safely unselect.
        //transform_control.detach();

        floatLabelManager.remove_box(target_box);
        scene.remove(target_box);        
        target_box.geometry.dispose();
        target_box.material.dispose();
        //selected_box.dispose();
        data.world.boxes = data.world.boxes.filter(function(x){return x !=target_box;});
        selected_box = null;
        sideview_mesh = null;

        render();
    }
}

function clear(){
    //remove boxinfo
    //remove frameinfo
    //remove image
    header.clear_box_info();
    document.getElementById("image").innerHTML = '';
    
    header.clear_frame_info();

    clear_image_box_projection();


    data.world.destroy();
    data.world= null; //dump it
    render();
}



function update_frame_info(scene, frame){
    header.set_frame_info(scene, frame);

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
    render_2d_image();
    mark_changed_flag();  
}

function on_selected_box_changed(box){

    if (box){
        
        header.update_box_info(box);
        update_image_box_projection(box)
        floatLabelManager.update_position(box);

    } else {
        header.clear_box_info();
        clear_image_box_projection();
    }

    render_2d_image();
}


function render_2d_labels(){
    floatLabelManager.remove_all_labels();

    data.world.boxes.forEach(function(b){
        floatLabelManager.add_label(b);
    })

    if (selected_box){
        floatLabelManager.select_box(selected_box.obj_local_id)
    }
}


// all boxes
function render_2d_image(){
    clear_canvas();

    if (params["hide image"])
        return;

    draw_canvas();

    function clear_canvas(){
        var c = document.getElementById("maincanvas");
        var ctx = c.getContext("2d");
                    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function draw_canvas(){
        // draw picture
        var c = document.getElementById("maincanvas");
        var ctx = c.getContext("2d");

        var img = data.world.image;

        if (img.width==0){
            return;
        }

        var clientWidth, clientHeight;
        // adjust canvas width/height
        if (img.naturalWidth / img.naturalHeight > ctx.canvas.width, ctx.canvas.height){
            clientWidth = ctx.canvas.width;
            clientHeight = ctx.canvas.width * img.naturalHeight/img.naturalWidth;
        }else{
            clientHeight = ctx.canvas.height;
            clientWidth = ctx.canvas.height * img.naturalWidth/img.naturalHeight;
        }

        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, clientWidth, clientHeight);

        var trans_ratio = ctx.canvas.width/img.naturalWidth;
        var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});

        if (scene_meta.calib){
            // draw boxes
            data.world.boxes.forEach(function(box){
                

                var scale = box.scale;
                var pos = box.position;
                var rotation = box.rotation;

                var box3d = psr_to_xyz(pos, scale, rotation);
                
                var imgpos = matmul(scene_meta.calib.extrinsic, box3d, 4);
                var imgpos3 = vector4to3(imgpos);
                var imgpos2 = matmul(scene_meta.calib.intrinsic, imgpos3, 3);

                var imgfinal = vector3_nomalize(imgpos2);

                ctx.lineWidth = 2;
                // front 
                draw_box_on_image(ctx, box, imgfinal, trans_ratio);

            });
        }
    }


}

function draw_box_on_image(ctx, box, box_corners, trans_ratio){
    var imgfinal = box_corners;

    function vtostyple(p){
        return "#"+p.slice(2);
    }


    if (selected_box != box){
        //ctx.strokeStyle="#00ff00";
        ctx.strokeStyle = vtostyple(obj_type_color_map[box.obj_type]);

        var c = obj_type_color_map[box.obj_type];
        var r ="0x"+c.slice(2,4);
        var g ="0x"+c.slice(4,6);
        var b ="0x"+c.slice(6,8);

        ctx.fillStyle="rgba("+parseInt(r)+","+parseInt(g)+","+parseInt(b)+",0.2)";
    }
    else{
        ctx.strokeStyle="#ff00ff";        
        ctx.fillStyle="rgba(255,0,255,0.2)";
    }

    // front panel
    ctx.beginPath();
    ctx.moveTo(imgfinal[3*2]*trans_ratio,imgfinal[3*2+1]*trans_ratio);

    for (var i=0; i < imgfinal.length/2/2; i++)
    {
        ctx.lineTo(imgfinal[i*2+0]*trans_ratio, imgfinal[i*2+1]*trans_ratio);
    }

    ctx.closePath();
    ctx.fill();
    
    // frame
    ctx.beginPath();

    ctx.moveTo(imgfinal[3*2]*trans_ratio,imgfinal[3*2+1]*trans_ratio);

    for (var i=0; i < imgfinal.length/2/2; i++)
    {
        ctx.lineTo(imgfinal[i*2+0]*trans_ratio, imgfinal[i*2+1]*trans_ratio);
    }
    //ctx.stroke();


    //ctx.strokeStyle="#ff00ff";
    //ctx.beginPath();

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

function clear_image_box_projection(){
    clear_canvas();

    function clear_canvas(){
        var c = document.getElementById("canvas");
        var ctx = c.getContext("2d");
                    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}


function projected_3d_point_out_of_image_range(p){
    if (p[0]<0 || p[1]<0 || p[2]<0){
        return true;
    }
    else return false;
}

function all_points_in_image_range(p){
    for (var i = 0; i<p.length/3; i++){
        if (p[i*3+0]<0 || p[i*3+1]<0 || p[i*3+2]<0){
            return false;
        }
    }
    
    return true;
}


// draw highlighed box
function update_image_box_projection(box){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});

    if (scene_meta.calib){

        var scale = box.scale;
        var pos = box.position;
        var rotation = box.rotation;

        var img = data.world.image; //document.getElementById("camera");
        if (img.naturalWidth > 0){

            clear_image_box_projection();


            var box3d = psr_to_xyz(pos, scale, rotation);

            // project corners to image plane
            var imgpos = matmul(scene_meta.calib.extrinsic, box3d, 4);
            var imgpos3 = vector4to3(imgpos);
            var imgpos2 = matmul(scene_meta.calib.intrinsic, imgpos3, 3);

            if (all_points_in_image_range(imgpos2)){  // if projection is out of range of the image, stop drawing.

                var imgfinal = vector3_nomalize(imgpos2);

                //console.log(imgfinal);
                
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.lineWidth = 0.5;

                // note: 320*240 should be adjustable
                var crop_area = crop_image(img.naturalWidth, img.naturalHeight, ctx.canvas.width, ctx.canvas.height, imgfinal);

                ctx.drawImage(img, crop_area[0], crop_area[1],crop_area[2], crop_area[3], 0, 0, ctx.canvas.width, ctx.canvas.height);// ctx.canvas.clientHeight);
                //ctx.drawImage(img, 0,0,img.naturalWidth, img.naturalHeight, 0, 0, 320, 180);// ctx.canvas.clientHeight);
                var imgfinal = vectorsub(imgfinal, [crop_area[0],crop_area[1]]);
                var trans_ratio = ctx.canvas.height/crop_area[3];

                draw_box_on_image(ctx, box, imgfinal, trans_ratio);
            }
        }
    }
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



var euler_angle={x:0, y:0, y:0};
var translate = {x:0, y:0, z:0};

function save_calibration(){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});
    var extrinsic = scene_meta.calib.extrinsic.map(function(x){return x*1.0;});

    euler_angle = rotation_matrix_to_euler_angle(extrinsic);
    translate = {
        x: extrinsic[3]*1.0,
        y: extrinsic[7]*1.0,
        z: extrinsic[11]*1.0,
    };


    console.log(extrinsic, euler_angle, translate);

    console.log("restoreed matrix", euler_angle_to_rotate_matrix(euler_angle, translate));

}

function reset_calibration(){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});
    scene_meta.calib.extrinsic = euler_angle_to_rotate_matrix(euler_angle, translate);
    render_2d_image();

    if (selected_box)
        update_image_box_projection(selected_box);
}


function calibrate(ax, value){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});
    var extrinsic = scene_meta.calib.extrinsic.map(function(x){return x*1.0;});

    var euler_angle = rotation_matrix_to_euler_angle(extrinsic);
    var translate = {
        x: extrinsic[3]*1.0,
        y: extrinsic[7]*1.0,
        z: extrinsic[11]*1.0,
    };

    if (ax == 'z'){
        euler_angle.z += value;
    }else if (ax == 'x'){
        euler_angle.x += value;
    }
    else if (ax == 'y'){
        euler_angle.y += value;
    }else if (ax == 'tz'){
        translate.z += value;
    }else if (ax == 'tx'){
        translate.x += value;
    }
    else if (ax == 'ty'){
        translate.y += value;
    }

    scene_meta.calib.extrinsic = euler_angle_to_rotate_matrix(euler_angle, translate);

    console.log("extrinsic", scene_meta.calib.extrinsic)
    console.log("euler", euler_angle, "translate", translate);    

    render_2d_image();

    if (selected_box)
        update_image_box_projection(selected_box);
}