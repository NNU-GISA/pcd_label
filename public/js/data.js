

import * as THREE from './lib/three.module.js';
import { PCDLoader } from './lib/PCDLoader.js';
//import { GeometryUtils } from './examples/jsm/utils/GeometryUtils.js';

var data = {
    
    // point_size: 1.5,

    // increase_point_size: function(){
    //     this.point_size*= 1.2;
    //     if (this.world)
    //         this.world.points.material.size = this.point_size;
    // },
    
    // decrease_point_size: function(){
    //     this.point_size/=1.2;
    //     if (this.world)
    //         this.world.points.material.size = this.point_size;
    // },


    make_new_world: function(scene_name, frame, on_preload_finished){
        

        var scene_meta = this.get_meta_by_scene_name(scene_name);
        var transform_matrix = scene_meta.point_transform_matrix;
        var annotation_format = scene_meta.boxtype;
        var frame_index = scene_meta.frames.findIndex(function(x){return x==frame;});


        var world = {
            file_info: {
                dir: "",
                scene: "",
                frame: "",
                frame_index: 0,
                transform_matrix: null,
                annotation_format: "psr", //xyz(24 number), csr(center, scale, rotation, 9 number)
        
        
                set: function(scene, frame_index, frame, transform_matrix, annotation_format){
                    this.scene = scene;
                    this.frame = frame;
                    this.frame_index = frame_index;
                    this.transform_matrix = transform_matrix;
                    this.annotation_format = annotation_format;
                },
        
                
                get_pcd_path: function(){
                    return 'static/data/'+ this.scene + "/pcd/" + this.frame+".pcd";
                },
            
                get_anno_path: function(){
                    if (this.annotation_format=="psr"){
                        return 'data/'+this.scene + "/bbox.json/" + this.frame + ".bbox.json";
                    }
                    else{
                        return 'data/'+this.scene + "/bbox.xyz/" + this.frame + ".bbox.txt";
                    }
                    
                },
            
                anno_to_boxes: function(text){
                    if (this.annotation_format == "psr")
                        return JSON.parse(text);
                    else
                        return this.xyz_to_psr(text);
            
                },
                transform_point: function(m, x,y, z){
                    var rx = x*m[0]+y*m[1]+z*m[2];
                    var ry = x*m[3]+y*m[4]+z*m[5];
                    var rz = x*m[6]+y*m[7]+z*m[8];
            
                    return [rx, ry, rz];
                },
            
                xyz_to_psr: function(text){
                    var _self = this;
            
                    var points_array = text.split('\n').filter(function(x){return x;}).map(function(x){return x.split(' ').map(function(x){return parseFloat(x);})})
                    
            
                    var boxes = points_array.map(function(ps){
                        for (var i=0; i<8; i++){
                            var p = _self.transform_point(_self.transform_matrix, ps[3*i+0],ps[3*i+1],ps[3*i+2]);
                            ps[i*3+0] = p[0];
                            ps[i*3+1] = p[1];
                            ps[i*3+2] = p[2];                
                        }
                        return ps;
                    });
                    
                    var boxes_ann = boxes.map(function(ann){
                        var pos={x:0,y:0,z:0};
                        for (var i=0; i<8; i++){
                            pos.x+=ann[i*3];
                            pos.y+=ann[i*3+1];
                            pos.z+=ann[i*3+2];
                        }
                        pos.x /=8;
                        pos.y /=8;
                        pos.z /=8;
            
                        var scale={
                            x: Math.sqrt((ann[0]-ann[3])*(ann[0]-ann[3])+(ann[1]-ann[4])*(ann[1]-ann[4])),
                            y: Math.sqrt((ann[0]-ann[9])*(ann[0]-ann[9])+(ann[1]-ann[10])*(ann[1]-ann[10])),
                            z: ann[14]-ann[2],
                        };
                        
                        /*
                        1. atan2(y,x), not x,y
                        2. point order in xy plane
                            0   1
                            3   2
                        */
            
                        var angle = Math.atan2(ann[4]+ann[7]-2*pos.y, ann[3]+ann[6]-2*pos.x);
            
                        return {
                            position: pos,
                            scale:scale,
                            rotation:{x:0,y:0,z:angle},
                        }
                    });
            
                    return boxes_ann; //, boxes];
                },
            }, //end of file_info

            points: null,
            boxes: null,
            image: null,
            image_loaded: false,

            complete: function(){
                return this.points && this.boxes && this.image_loaded;
            },

            reset: function(){this.points=null; this.boxes=null;},

            sort_boxes:function(){
                this.boxes = this.boxes.sort(function(x,y){
                    return x.position.y - y.position.y;
                });
            },

            create_time: 0,
            points_load_time:0,
            boxes_load_time:0,
            finish_time: 0,

            on_preload_finished: null,
            preload: function(on_preload_finished){
                
                this.create_time = new Date().getTime();
                console.log(this.create_time, scene_name, frame, "start");

                this.on_preload_finished = on_preload_finished;
                this.load_points();
                this.load_annotation();

                this.image = new Image();
                
                var _self = this;
                this.image.onload= function(){ _self.on_image_loaded();};
                this.image.onerror=function(){ _self.on_image_error();}
                this.image.src = '/static/data/'+scene_name+'/image/'+ frame+'.jpg';
            },

            on_image_error: function(){
                this.image_loaded = true;

                if (this.complete()){
                    if (this.on_preload_finished)
                    this.on_preload_finished(this);
                }

                if (this.active){
                    this.go();
                }  
                
            },
            on_image_loaded: function(){
                this.image_loaded = true;

                if (this.complete()){
                    if (this.on_preload_finished)
                    this.on_preload_finished(this);
                }

                if (this.active){
                    this.go();
                }  
            },
            
            load_points: function(){
                var loader = new PCDLoader();

                var _self = this;
                loader.load( this.file_info.get_pcd_path(), 
                    function ( pcd ) {
                        var position = pcd.position;
                        var color = pcd.color;
                        var normal = pcd.normal;


                        if (_self.file_info.transform_matrix){

                            var arr = position;
                            var num = position.length;
                            var ni = 3;

                            for (var i=0; i<num/ni; i++){
                                var np = _self.file_info.transform_point(_self.file_info.transform_matrix, arr[i*ni+0], arr[i*ni+1], arr[i*ni+2]);
                                arr[i*ni+0]=np[0];
                                arr[i*ni+1]=np[1];
                                arr[i*ni+2]=np[2];
                            }

                            //points.geometry.computeBoundingSphere();
                        }


                        // build geometry
                        var geometry = new THREE.BufferGeometry();
                        if ( position.length > 0 ) geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
                        if ( normal.length > 0 ) geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normal, 3 ) );
                        if ( color.length > 0 ) geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( color, 3 ) );

                        geometry.computeBoundingSphere();
                        // build material

                        var material = new THREE.PointsMaterial( { size: 0.005 } );

                        if ( color.length > 0 ) {
                            material.vertexColors = VertexColors;
                        } else {
                            material.color.setHex(0xffffff );
                        }

                        // build mesh

                        var mesh = new THREE.Points( geometry, material );                        
                        mesh.name = "pcd";

                        //return mesh;

                        
                        _self.points = mesh;
                        _self.points_load_time = new Date().getTime();
                        console.log(_self.points_load_time, _self.file_info.scene, _self.file_info.frame, "loaded pionts ", _self.points_load_time - _self.create_time, "ms");

                        if (_self.complete()){
                            if (_self.on_preload_finished)
                                _self.on_preload_finished(_self);
                        }

                        if (_self.active){
                            _self.go();
                        }                       
                        
                        //var center = points.geometry.boundingSphere.center;
                        //controls.target.set( center.x, center.y, center.z );
                        //controls.update();
                    },
                );
            },

            load_annotation: function(){
                var xhr = new XMLHttpRequest();
                // we defined the xhr
                var _self = this;
                xhr.onreadystatechange = function () {
                    if (this.readyState != 4) return;
                
                    if (this.status == 200) {

                        if (this.responseText.length == 0){
                            _self.boxes = []; // no file
                        }else {
                            var ret = _self.file_info.anno_to_boxes(this.responseText);

                            //var boxes = JSON.parse(this.responseText);
                            //console.log(ret);

                            _self.boxes = create_bboxs(ret);  //create in future world
                        }
                        _self.boxes_load_time = new Date().getTime();
                        console.log(_self.boxes_load_time, _self.file_info.scene, _self.file_info.frame, "loaded boxes ", _self.boxes_load_time - _self.create_time, "ms");
                        
                        _self.sort_boxes();

                        if (_self.complete()){
                            if (_self.on_preload_finished)
                                _self.on_preload_finished(_self);
                        }

                        if (_self.active){
                            _self.go();
                        }
                        //add_raw_boxes(ret[1]);            
                    }
                
                    // end of state change: it can be after some time (async)
                };
                
                xhr.open('GET', "/load"+"?frame="+this.file_info.get_anno_path(), true);
                xhr.send();

                function create_bboxs(annotations){
                    
                    return annotations.map(function(b){
                        var mesh = _self.new_bbox_cube();
                        mesh.position.x = b.position.x;
                        mesh.position.y = b.position.y;
                        mesh.position.z = b.position.z;

                        mesh.scale.x = b.scale.x;
                        mesh.scale.y = b.scale.y;
                        mesh.scale.z = b.scale.z;

                        mesh.rotation.x = b.rotation.x;
                        mesh.rotation.y = b.rotation.y;
                        mesh.rotation.z = b.rotation.z;    
                        return mesh;  
                    });
                }

            },

            scene: null,
            destroy_old_world: null,
            on_finished: null,
            activate: function(scene, destroy_old_world, on_finished){
                this.scene = scene;
                this.active = true;
                this.destroy_old_world = destroy_old_world;
                this.on_finished = on_finished;
                if (this.complete()){
                    this.go();
                }
            },

            active: false,
            
            go: function(){
                if (this.complete()){

                    //this.points.material.size = data.point_size;
                    
                    if (this.destroy_old_world){
                        this.destroy_old_world();
                    }

                    if (this.destroyed){
                        console.log("go after destroyed.");
                        this.destroy();
                        return;
                    }

                    this.scene.add( this.points );
    
                    
                    var _self=this;
                    this.boxes.forEach(function(b){
                        _self.scene.add(b);
                    })

                    if (this.on_finished){
                        _self.finish_time = new Date().getTime();
                        console.log(_self.finish_time, scene_name, frame, "loaded in ", _self.finish_time - _self.create_time, "ms");
                        this.on_finished();
                    }
                    
                }
            },

            add_box: function(x,y,z){

                var mesh = this.new_bbox_cube();
                mesh.position.x = x;
                mesh.position.y = y;
                mesh.position.z = z;

                this.boxes.push(mesh);
                this.sort_boxes();
                return mesh;
            },


            new_bbox_cube: function(){

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
            },

            destroyed: false,
            destroy: function(){
                var _self= this;

                if (this.destroyed){
                    console.log("destroy destroyed world!");
                }

                this.destroyed = true;
                remove_all_boxes();
                remove_all_points();
                console.log(this.file_info.scene, this.file_info.frame, "destroyed");
                
                // remove me from buffer
                

                function remove_all_points(){
                    if (_self.points){
                        _self.scene.remove(_self.points);
                        _self.points.geometry.dispose();
                        _self.points.material.dispose();
                        _self.points = null;
                    }
                    else{
                        console.error("destroy empty world!")
                    }
                }

                function remove_all_boxes(){
                    if (_self.boxes){
                        _self.boxes.forEach(function(b){
                            _self.scene.remove(b);
                            b.geometry.dispose();
                            b.material.dispose();
                        });

                        _self.boxes = [];
                    }
                    else{
                        console.error("destroy empty world!")
                    }
                }

            },

        };  // end of world

        world.file_info.set(scene_name, frame_index, frame, transform_matrix, annotation_format);


        world.preload(on_preload_finished);  

        return world;

    },
    
    world: null,

    future_world_buffer: [],
    put_world_into_buffer: function(world){
        this.future_world_buffer.push(world);
    },

    reset_world_buffer: function(){
        this.future_world_buffer=[];
    },

    activate_world: function(scene, world, on_finished){
        var old_world = this.world;   // current world, should we get current world later?
        var _self= this;
        _self.world = world;  // swich when everything is ready. otherwise data.world is half-baked, causing mysterious problems.

        world.activate(scene, 
            function(){
                
                if (old_world)
                    old_world.destroy();
            },
            on_finished);
    },




    meta: null,  //meta data

    get_meta_by_scene_name: function(scene_name){

        var scene_meta = data.meta.find(function(x){
            return x.scene == scene_name;
        });

        return scene_meta;
    },

    get_current_world_scene_meta(){
        return this.get_meta_by_scene_name(this.world.file_info.scene);
    }
};

export {data};

