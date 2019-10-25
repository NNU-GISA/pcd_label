

import {vector4to3, vector3_nomalize, psr_to_xyz, matmul, matmul2, euler_angle_to_rotate_matrix, rotation_matrix_to_euler_angle, obj_type_color_map} from "./util.js"
import {
	Vector3
} from "./lib/three.module.js";


function createFloatLabelManager(view) {

    var manager = 
    {
        view : view,  //access camera by view, since camera is dynamic
        enabled: function(){return this.id_enabled || this.category_enabled;},

        id_enabled: true,
        category_enabled: true,
        html_labels: document.getElementById("2Dlabels"),


        remove_all_labels: function(){
            
            var _self = this;

            if (this.html_labels.children.length>0){
                for (var c=this.html_labels.children.length-1; c >= 0; c--){
                    this.html_labels.children[c].remove();                    
                }
            }
        },

        update_all_position: function(){
            if (this.html_labels.children.length>0){
                for (var c=0; c < this.html_labels.children.length; c++){
                    var element = this.html_labels.children[c];
                    
                    var best_pos = this.compute_best_position(element.vertices);
                    var pos = this.coord_to_pixel(best_pos);

                    element.style.top = Math.round(pos.y) + 'px';
                    element.style.left = Math.round(pos.x) + 'px';

                    element.hidden = pos.out_view;

                }
            }
        },
        select_box: function(local_id){
            var label = document.getElementById("obj-local-"+local_id);
            if (label){                
                label.className = "selected-float-label";
                label.hidden = true;
                document.getElementById("obj-editor").style.top = label.style.top;
                document.getElementById("obj-editor").style.left = label.style.left;
                document.getElementById("obj-editor").style.display = "inline-block";
            }
        },

        unselect_box: function(local_id){
            var label = document.getElementById("obj-local-"+local_id);
            if (label){                
                label.className = "float-label" + " " + label.obj_type;
                label.hidden = false;
                document.getElementById("obj-editor").style.display = "none";
            }
        },

        set_object_type: function(local_id, obj_type){
            //if (!this.enabled())
            //    return;
                
            var label = document.getElementById("obj-local-"+local_id);
            if (label){
                label.obj_type = obj_type;
                label.update_text();
            }
        },

        
        set_object_track_id: function(local_id, track_id){
            //if (!this.enabled())
            //    return;
                
            var label = document.getElementById("obj-local-"+local_id);

            if (label){
                label.obj_track_id = track_id;
                label.update_text();
            }
        },

        update_position: function(box, refresh){
            //if (!this.enabled())
            //    return;
                
            var label = document.getElementById("obj-local-"+box.obj_local_id);
            
            if (label){
                /*
                label.pos = box.position.clone();
                label.pos.z += box.scale.z + 2;

                var pos = this.toXYCoords(label.pos);
                */

               label.vertices = psr_to_xyz(box.position, box.scale, box.rotation);  //vector 4

               if (refresh){
                    var best_pos = this.compute_best_position(label.vertices);
                    var pos = this.coord_to_pixel(best_pos);

                    label.style.top = Math.round(pos.y) + 'px';
                    label.style.left = Math.round(pos.x) + 'px';
                    label.hidden = pos.out_view;
               }
            }
        },

        remove_box: function(box){
            //if (!this.enabled())
            //    return;
                
            var label = document.getElementById("obj-local-"+box.obj_local_id);

            if (label)
                label.remove();
        },

        add_label: function(box, on_click){
            if (!this.enabled())
                return;
            
            var label = document.createElement('div');
            label.className = "float-label "+box.obj_type;
            label.id = "obj-local-"+box.obj_local_id;
            //label.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
            //label.style.width = 100;
            //label.style.height = 100;
            //label.style.backgroundColor = "blue";
            
            var _self =this;

            label.update_text = function(){
                var label_text = "";
                if (_self.category_enabled){
                    label_text += this.obj_type;
                }
                
                if (_self.id_enabled){
                    if (_self.category_enabled){
                        label_text += "-";
                    }
                    label_text += this.obj_track_id;
                }
                this.innerText = label_text; 
            }
            
            label.obj_type = box.obj_type;
            label.obj_local_id = box.obj_local_id;
            label.obj_track_id = box.obj_track_id;
            label.update_text();

            label.vertices = psr_to_xyz(box.position, box.scale, box.rotation);  //vector 4

            var best_pos = this.compute_best_position(label.vertices);
            best_pos = this.coord_to_pixel(best_pos);
            
            /*
            label.pos = box.position.clone();
            label.pos.z += box.scale.z + 2;
            
            //var pos = this.toXYCoords(label.pos);
            */
            var pos = best_pos;
            
            label.style.top = Math.round(pos.y) + 'px';
            label.style.left = Math.round(pos.x) + 'px';

            label.hidden = pos.out_view;
            
            document.getElementById("2Dlabels").appendChild(label);
            label.onclick = function(){
                on_click();
            };
        },



        toXYCoords: function(pos) {
            var width = window.innerWidth, height = window.innerHeight;
            var widthHalf = width / 2, heightHalf = height / 2;

            var p = pos.clone().project(this.view.camera);
            //p.x = p.x/p.z;
            //p.y = p.y/p.z;
            var ret={
                x: ( p.x * widthHalf ) + widthHalf,
                y: - ( p.y * heightHalf ) + heightHalf,
                out_view: p.x>0.9 || p.x<-0.9 || p.y<-0.9 || p.y>0.9 || p.z< 0,
            }

            return ret;
        },


        coord_to_pixel: function(p){
            var width = window.innerWidth, height = window.innerHeight;
            var widthHalf = width / 2, heightHalf = height / 2;

            var ret={
                x: ( p.x * widthHalf ) + widthHalf + 5,
                y: - ( p.y * heightHalf ) + heightHalf - 5,
                out_view: p.x>0.9 || p.x<-0.9 || p.y<-0.9 || p.y>0.9 || p.z< -1 || p.z > 1,
            }

            return ret;
        },

        compute_best_position: function(vertices){
            var _self = this;
            var camera_p = [0,1,2,3,4,5,6,7].map(function(i){
                return new Vector3(vertices[i*4+0], vertices[i*4+1], vertices[i*4+2]);
            });
            
            camera_p.forEach(function(x){
                x.project(_self.view.camera);
            });
            
            /*
            var visible_p = camera_p.filter(function(p){
                return !(p.x>0.9 || p.x<-0.9 || p.y<-0.9 || p.y>0.9 || p.z< 0);
            });

            if (visible_p.length==0){
                return null;
            } 
            */
            var visible_p = camera_p;

            var best_p = {x:-1, y: -1, z: -2};

            visible_p.forEach(function(p){
                if (p.x > best_p.x){
                    best_p.x = p.x;
                }

                if (p.y > best_p.y){
                    best_p.y = p.y;
                }

                if (p.z > best_p.z){
                    best_p.z = p.z;
                }
            })

            return best_p;
        },

    };

    return manager;


}


export {createFloatLabelManager};