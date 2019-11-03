

import * as THREE from './lib/three.module.js';
import { PCDLoader } from './lib/PCDLoader.js';
import { get_obj_cfg_by_type } from './obj_cfg.js';
import {matmul, euler_angle_to_rotate_matrix, transpose} from "./util.js"
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

    point_size: 1,
    point_brightness: 0.6,
    box_opacity: 1,
    show_background: true,
    color_obj: true,
    
    scale_point_size: function(v){
        this.point_size *= v;
        if (this.world){
            this.world.set_point_size(this.point_size);
        }
    },

    scale_point_brightness: function(v){
        this.point_brightness *= v;        
    },

    toggle_box_opacity: function(){
        this.box_opacity = 1- this.box_opacity;
        this.world.set_box_opacity(this.box_opacity);
    },

    toggle_background: function(){
        this.show_background = !this.show_background;

        if (this.show_background){
            this.world.cancel_highlight();
        }
        else{
            this.world.hide_background();
        }
    },

    toggle_color_obj: function(){
        this.color_obj = !this.color_obj;
        if (this.color_obj){
            this.world.color_points();
        } else {
            this.world.set_points_color({
                x: this.point_brightness,
                y: this.point_brightness,
                z: this.point_brightness,
            });            
        }

        this.world.update_points_color();
    },

    active_image_name: "image",
    set_active_image: function(name){
        this.active_image_name = name;
        if (this.world){
            this.world.images.activate(name);
        }
    },

    make_new_world: function(scene_name, frame, on_preload_finished){
        
        
        var scene_meta = this.get_meta_by_scene_name(scene_name);
        var transform_matrix = scene_meta.point_transform_matrix;
        var annotation_format = scene_meta.boxtype;
        var frame_index = scene_meta.frames.findIndex(function(x){return x==frame;});


        var world = {
            data: this,

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
                    var _self = this;
                    if (this.annotation_format == "psr"){

                        var boxes = JSON.parse(text);
                        

                        return boxes;
                    }
                    else
                        return this.python_xyz_to_psr(text);
            
                },
                transform_point: function(m, x,y, z){
                    var rx = x*m[0]+y*m[1]+z*m[2];
                    var ry = x*m[3]+y*m[4]+z*m[5];
                    var rz = x*m[6]+y*m[7]+z*m[8];
            
                    return [rx, ry, rz];
                },
            
                /*
                input is coordinates of 8 vertices
                bottom-left-front, bottom-right-front, bottom-right-back, bottom-left-back
                top-left-front,    top-right-front,    top-right-back,    top-left-back

                this format is what SECOND/PointRcnn save their results.
                */
               python_xyz_to_psr: function(text){
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
                    
                    var boxes_ann = boxes.map(this.xyz_to_psr);
            
                    return boxes_ann; //, boxes];
                },

                xyz_to_psr: function(ann_input){
                    var ann = [];
                    if (ann_input.length==24)
                        ann = ann_input;
                    else
                        for (var i = 0; i<ann_input.length; i++){
                            if ((i+1) % 4 != 0){
                                ann.push(ann_input[i]);
                            }
                        }

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
                },
                
            }, //end of file_info


            points: null,
            //points_backup: null, //for restore from highlight
            boxes: null,
            
            images:{
                loaded: function(){
                    for (var n in this.names){
                        if (!this.loaded_flag[this.names[n]])
                            return false;
                    }

                    return true;
                },

                names: ["image","left","right"],
                loaded_flag: {},
                active_name: "image",
                active_image: function(){
                    return this.content[this.active_name];
                },
                activate: function(name){
                    this.active_name = name;
                },

                content:{},
                on_all_loaded: null,

                load: function(on_all_loaded){
                    this.on_all_loaded = on_all_loaded;
                    var _self = this;
                    this.names.forEach(function(img){
                        _self.content[img] = new Image();
                        _self.content[img].onload= function(){ 
                            _self.loaded_flag[img] = true;
                            _self.on_image_loaded();
                        };
                        _self.content[img].onerror=function(){ 
                            _self.loaded_flag[img] = true;
                            _self.on_image_loaded();
                        };

                        _self.content[img].src = '/static/data/'+scene_name+'/' + img + '/'+ frame+'.jpg';
                    })
                },

                on_image_loaded: function(){
                    if (this.loaded()){
                        this.on_all_loaded();
                    }
                }
            },

            image_front: null,
            image_left: null,
            image_right: null,
            image_loaded: false,
            image_left_loaded: false,
            image_right_loaded: false,
            pcd_loaded: false,

            complete: function(){
                return this.pcd_loaded && this.boxes && this.images.loaded();
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
            
            set_point_size: function(v){
                if (this.points){
                    this.points.material.size = v;
                }

                if (this.points.points_backup){
                    this.points.points_backup.material.size = v;

                    if (this.points.points_backup.points_backup){
                        this.points.points_backup.points_backup.material.size = v;
                    }
                }
            },

            preload: function(on_preload_finished){
                
                this.create_time = new Date().getTime();
                console.log(this.create_time, scene_name, frame, "start");

                this.on_preload_finished = on_preload_finished;
                this.load_points();
                this.load_annotation();
                var _self = this;

                this.images.load(function(){_self.on_image_loaded();});
                this.images.activate(this.data.active_image_name);

            },

            // color points according to object category
            color_points: function(){
                // color all points inside these boxes
                var _self = this;

                if (this.data.color_obj){
                    this.boxes.map(function(b){
                        _self.set_box_points_color(b);
                    })

                    this.update_points_color();
                }
            },

            on_image_loaded: function(){
                if (this.complete()){
                    this.color_points();
                    if (this.on_preload_finished){
                        this.on_preload_finished(this);
                    }
                }

                if (this.active){
                    this.go();
                }  
            },
            load_points: function(){
                var loader = new PCDLoader();

                var _self = this;
                loader.load( this.file_info.get_pcd_path(), 
                    //ok
                    function ( pcd ) {
                        var position = pcd.position;
                        var color = pcd.color;
                        var normal = pcd.normal;

                        _self.points_parse_time = new Date().getTime();
                        console.log(_self.points_load_time, _self.file_info.scene, _self.file_info.frame, "parse pionts ", _self.points_parse_time - _self.create_time, "ms");

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
                        if ( color.length > 0 ) {
                            geometry.addAttribute( 'color', new THREE.Float32BufferAttribute(color, 3 ) );
                        }
                        else {
                            color = []
                            for (var i =0; i< position.length; ++i){                                
                                color.push(_self.data.point_brightness);                                
                            }
                            geometry.addAttribute( 'color', new THREE.Float32BufferAttribute(color, 3 ) );
                        }

                        geometry.computeBoundingSphere();
                        // build material

                        var material = new THREE.PointsMaterial( { size: _self.data.point_size, vertexColors: THREE.VertexColors } );

                        /*
                        
                        if ( color.length > 0 ) {
                            material.vertexColors = color;
                        } else {
                            //material.color.setHex(0xffffff);
                            material.color.r = 0.6;
                            material.color.g = 0.6;
                            material.color.b = 0.6;
                        }
                        */

                        //material.size = 2;
                        material.sizeAttenuation = false;

                        // build mesh

                        var mesh = new THREE.Points( geometry, material );                        
                        mesh.name = "pcd";

                        //return mesh;

                        
                        _self.points = mesh;
                        //_self.points_backup = mesh;

                        _self.build_points_index();
                        _self.points_load_time = new Date().getTime();
                        _self.pcd_loaded = true;

                        console.log(_self.points_load_time, _self.file_info.scene, _self.file_info.frame, "loaded pionts ", _self.points_load_time - _self.create_time, "ms");

                        if (_self.complete()){
                            _self.color_points();
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

                    // on progress,
                    function(){

                    },

                    // on error
                    function(){
                        //error
                        console.log("load pcd failed.");

                        _self.pcd_loaded = true;
                        
                        //go ahead, may load picture
                        if (_self.complete()){
                            _self.color_points();
                            if (_self.on_preload_finished)
                                _self.on_preload_finished(_self);
                        }

                        if (_self.active){
                            _self.go();
                        }                       
                        

                    },

                    // on file loaded
                    function(){
                        _self.points_readfile_time = new Date().getTime();
                        console.log(_self.points_load_time, _self.file_info.scene, _self.file_info.frame, "read file ", _self.points_readfile_time - _self.create_time, "ms");
                    }
                );
            },

            box_local_id: 0,
            get_new_box_local_id: function(){
                var ret = this.box_local_id;
                this.box_local_id+=1;
                return ret;
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
                            _self.color_points();
                            if (_self.on_preload_finished)
                                _self.on_preload_finished(_self);
                        }

                        if (_self.active){
                            _self.go();
                        }
                        
                    }
                
                    // end of state change: it can be after some time (async)
                };
                
                xhr.open('GET', "/load_annotation"+"?scene="+this.file_info.scene+"&frame="+this.file_info.frame, true);
                xhr.send();

                
                function create_bboxs(annotations){
                    return annotations.map(function(b){
                        var mesh = _self.new_bbox_cube(parseInt("0x"+get_obj_cfg_by_type(b.obj_type).color.slice(1)));

                        mesh.position.x = b.position.x;
                        mesh.position.y = b.position.y;
                        mesh.position.z = b.position.z;

                        mesh.scale.x = b.scale.x;
                        mesh.scale.y = b.scale.y;
                        mesh.scale.z = b.scale.z;

                        mesh.rotation.x = b.rotation.x;
                        mesh.rotation.y = b.rotation.y;
                        mesh.rotation.z = b.rotation.z;    

                        mesh.obj_track_id = b.obj_id;  //tracking id
                        mesh.obj_local_id = _self.get_new_box_local_id();

                        mesh.obj_type = b.obj_type;
                        return mesh;  
                    });
                }

            },
            
            
            build_points_index: function(){
                var ps = this.points.geometry.getAttribute("position");
                var points_index = {};

                if (ps){ // points may be empty
                    for (var i = 0; i<ps.count; i++){
                        var k = this.get_position_key(ps.array[i*3], ps.array[i*3+1], ps.array[i*3+2]);
                        k = this.key_to_str(k);

                        if (points_index[k]){
                            points_index[k].push(i);
                        } else {
                            points_index[k]=[i];
                        }                    
                    }
                }

                this.points.points_index = points_index;
            },

            points_index_grid_size: 2,

            get_position_key:function(x,y,z){
                var grid_size = 2;
                return [Math.round(x/this.points_index_grid_size),
                        Math.round(y/this.points_index_grid_size),
                        Math.round(z/this.points_index_grid_size),];
            },
            key_to_str: function(k){
                return k[0]+","+k[1]+","+k[2];
            },

            // candidate pionts, covering the box(center, scale), but larger.
            get_covering_position_indices: function(points, center, scale){
                var ck = this.get_position_key(center.x, center.y, center.z);
                var radius = Math.sqrt(scale.x*scale.x + scale.y*scale.y + scale.z*scale.z)/2;
                var radius_grid = Math.ceil(radius/this.points_index_grid_size);// + 1;

                var indices = [];
                for(var x = -radius_grid; x <= radius_grid; x++){
                    for(var y = -radius_grid; y <= radius_grid; y++){
                        for(var z = -radius_grid; z <= radius_grid; z++){
                            var temp = points.points_index[this.key_to_str([ck[0]+x, ck[1]+y, ck[2]+z])];
                            if (temp)
                                indices = indices.concat(temp);
                        }
                    }
                }

                console.log("found indices: " + indices.length);
                return indices;
            },

            toggle_background: function(){
                if (this.points.points_backup){ // cannot differentiate highlighted-scene and no-background-whole-scene
                    this.cancel_highlight();
                    return;
                } 
                else{
                    this.hide_background();
                }
            },

            // hide all points not inside any box
            hide_background: function(){
                if (this.points.points_backup){
                    //already hidden, or in highlight mode
                    return;
                }

                var _self = this;
                var pos = this.points.geometry.getAttribute("position");
                var color = this.points.geometry.getAttribute("color");

                                


                var hl_point=[];
                var hl_color=[];
                var highlight_point_indices = [];
                this.boxes.forEach(function(box){
                    var indices= _self._get_points_of_box(_self.points, box, 1);

                    indices.forEach(function(i){
                        hl_point.push(pos.array[i*3]);
                        hl_point.push(pos.array[i*3+1]);
                        hl_point.push(pos.array[i*3+2]);

                        hl_color.push(color.array[i*3]);
                        hl_color.push(color.array[i*3+1]);
                        hl_color.push(color.array[i*3+2]);
                    })

                    highlight_point_indices = highlight_point_indices.concat(indices);
                });
                

                // build new geometry
                var geometry = new THREE.BufferGeometry();
                
                if (hl_point.length > 0 ) {
                    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(hl_point, 3 ) );
                    geometry.addAttribute( 'color', new THREE.Float32BufferAttribute(hl_color, 3 ) );
                }
                
                
                geometry.computeBoundingSphere();               

                var material = new THREE.PointsMaterial( { size: _self.data.point_size, vertexColors: THREE.VertexColors } );

                material.sizeAttenuation = false;

                var mesh = new THREE.Points( geometry, material );                        
                mesh.name = "pcd";
                mesh.points_backup = this.points;
                mesh.highlight_point_indices = highlight_point_indices;

                //swith geometry
                this.scene.remove(this.points);

                this.points = mesh;       
                this.build_points_index();         
                this.scene.add(mesh);
            },

            cancel_highlight: function(box){
                if (this.points.points_backup){
                    
                    this.set_box_opacity(this.data.box_opacity);

                    //copy colors, maybe changed.
                    if (this.data.color_obj){
                        var highlight_point_color = this.points.geometry.getAttribute("color");
                        var backup_point_color = this.points.points_backup.geometry.getAttribute("color");                    
                        
                        this.points.highlight_point_indices.forEach(function(n, i){
                            backup_point_color.array[n*3] = highlight_point_color.array[i*3];
                            backup_point_color.array[n*3+1] = highlight_point_color.array[i*3+1];
                            backup_point_color.array[n*3+2] = highlight_point_color.array[i*3+2];
                        });
                    }


                    //switch
                    var points_backup = this.points.points_backup;
                    this.remove_all_points(); //this.points is null now
                    this.points = points_backup;
                    
                    if (box){
                        // in highlighted mode, the box my be moved outof the highlighted area, so 
                        // we need to color them again.
                        if (this.data.color_obj)
                            this.set_box_points_color(box);
                    }

                    if (this.data.color_obj)
                        this.update_points_color();
                        
                    this.scene.add(this.points);
                }
            },

            highlight_box_points: function(box){
                if (this.points.highlighted_box){
                    //already highlighted.
                    return;
                }

                
                // hide all other boxes
                this.set_box_opacity(0);

                // keep myself
                box.material.opacity = 1;


                var _self = this;
                var pos = this.points.geometry.getAttribute("position");
                var color = this.points.geometry.getAttribute("color");

                                


                var hl_point=[];
                var hl_color=[];

                var highlight_point_indices= this._get_points_of_box(this.points, box, 3);

                highlight_point_indices.forEach(function(i){
                    hl_point.push(pos.array[i*3]);
                    hl_point.push(pos.array[i*3+1]);
                    hl_point.push(pos.array[i*3+2]);

                    hl_color.push(color.array[i*3]);
                    hl_color.push(color.array[i*3+1]);
                    hl_color.push(color.array[i*3+2]);
                })
                

                // build new geometry
                var geometry = new THREE.BufferGeometry();
                
                if (hl_point.length > 0 ) {
                    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(hl_point, 3 ) );
                    geometry.addAttribute( 'color', new THREE.Float32BufferAttribute(hl_color, 3 ) );
                }
                
                
                geometry.computeBoundingSphere();               

                var material = new THREE.PointsMaterial( { size: _self.data.point_size, vertexColors: THREE.VertexColors } );

                material.sizeAttenuation = false;

                var mesh = new THREE.Points( geometry, material );                        
                mesh.name = "pcd";

                //swith geometry
                this.scene.remove(this.points);

                mesh.points_backup = this.points;
                mesh.highlight_point_indices = highlight_point_indices;
                mesh.highlighted_box = box;

                this.points = mesh;
                this.build_points_index();
                this.scene.add(mesh);
            },

            _get_points_of_box: function(points, box, scale_ratio){

                if (!scale_ratio){
                    scale_ratio = 1;
                }
                var pos_array = points.geometry.getAttribute("position").array;
                var indices=[];
                var r = box.rotation;
                var trans = transpose(euler_angle_to_rotate_matrix(r, {x:0, y:0, z:0}), 4);

                var cand_point_indices = this.get_covering_position_indices(points, box.position, box.scale);
                cand_point_indices.forEach(function(i){
                //for (var i  = 0; i < pos.count; i++){
                    var x = pos_array[i*3];
                    var y = pos_array[i*3+1];
                    var z = pos_array[i*3+2];

                    var p = [x-box.position.x, y-box.position.y, z-box.position.z, 1];

                    var tp = matmul(trans, p, 4);

                    if ((Math.abs(tp[0]) > box.scale.x/2 * scale_ratio) 
                        || (Math.abs(tp[1]) > box.scale.y/2 * scale_ratio)
                        || (Math.abs(tp[2]) > box.scale.z/2 *scale_ratio) ){
                        return;
                    }
                    
                    indices.push(i);
                });

                return indices;
            },

            set_box_points_color: function(box, target_color){
                //var pos = this.points.geometry.getAttribute("position");
                var color = this.points.geometry.getAttribute("color");

                if (!target_color){
                    var target_color_hex = parseInt("0x"+get_obj_cfg_by_type(box.obj_type).color.slice(1));
                    target_color = {
                        x: (target_color_hex/256/256)/255.0,
                        y: (target_color_hex/256 % 256)/255.0,
                        z: (target_color_hex % 256)/255.0,
                    }
                }

                var indices = this._get_points_of_box(this.points, box, 1.0);
                indices.forEach(function(i){
                    color.array[i*3] = target_color.x;
                    color.array[i*3+1] = target_color.y;
                    color.array[i*3+2] = target_color.z;
                });
            },

            // set all points to specified color
            set_points_color: function(target_color){
                var color = this.points.geometry.getAttribute("color");
                for (var i = 0; i<color.count; i++){
                    color.array[i*3] = target_color.x;
                    color.array[i*3+1] = target_color.y;
                    color.array[i*3+2] = target_color.z;
                }
            },

            update_points_color: function(){
                if (this.points){ //some time points may fail to load.
                    var color = this.points.geometry.getAttribute("color");
                    this.points.geometry.removeAttribute("color");
                    this.points.geometry.addAttribute("color", new THREE.Float32BufferAttribute(color.array, 3 ));
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

                    if (this.points)
                        this.scene.add( this.points );
    
                    
                    var _self=this;
                    
                    this.boxes.forEach(function(b){
                        _self.scene.add(b);
                    })

                    if (!_self.data.show_background){
                        _self.hide_background();
                    }

                    // render is called in on_finished() callback
                    if (this.on_finished){
                        _self.finish_time = new Date().getTime();
                        console.log(_self.finish_time, scene_name, frame, "loaded in ", _self.finish_time - _self.create_time, "ms");
                        this.on_finished();
                    }
                    
                    
                }
            },

            set_box_opacity: function(box_opacity){
                this.boxes.forEach(function(x){
                    x.material.opacity = box_opacity;
                });
            },

            add_box: function(x,y,z){

                var mesh = this.new_bbox_cube();
                mesh.position.x = x;
                mesh.position.y = y;
                mesh.position.z = z;

                mesh.obj_track_id = "";  //tracking id
                mesh.obj_type = "Car";
                mesh.obj_local_id =  this.get_new_box_local_id();

                this.boxes.push(mesh);
                this.sort_boxes();
                return mesh;
            },

            remove_box: function(box){
                box.geometry.dispose();
                box.material.dispose();
                //selected_box.dispose();
                this.boxes = this.boxes.filter(function(x){return x !=box;});
            },

            new_bbox_cube: function(color){

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
                
                if (!color){
                    color = 0x00ff00;
                }

                /*
                https://threejs.org/docs/index.html#api/en/materials/LineBasicMaterial
                linewidth is 1, regardless of set value.
                */

                
                var material = new THREE.LineBasicMaterial( { color: color, linewidth: 1, opacity: this.data.box_opacity, transparent: true } );
                var box = new THREE.LineSegments( bbox, material );
                
                box.scale.x=1.8;
                box.scale.y=4.5;
                box.scale.z=1.5;
                box.name="bbox";
                box.obj_type="car";                

                box.computeLineDistances();

                return box;
            },

            destroyed: false,

            remove_all_points: function(){
                if (this.points){
                    this.scene.remove(this.points);
                    this.points.geometry.dispose();
                    this.points.material.dispose();
                    this.points = null;
                }
                else{
                    console.error("destroy empty world!")
                }
            },

            destroy: function(){
                var _self= this;

                if (this.destroyed){
                    console.log("destroy destroyed world!");
                }

                this.destroyed = true;
                remove_all_boxes();
                this.remove_all_points();
                console.log(this.file_info.scene, this.file_info.frame, "destroyed");
                
                // remove me from buffer
                

                

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

