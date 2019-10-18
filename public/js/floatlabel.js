function createFloatLabelManager(view) {

    var manager = 
    {
        view : view,  //access camera by view, since camera is dynamic
        enabled: true,
        html_labels: document.getElementById("2Dlabels"),

        remove_all_labels: function(){
            if (!this.enabled)
                return;
                

            var _self = this;

            if (this.html_labels.children.length>0){
                for (var c=this.html_labels.children.length-1; c >= 0; c--){
                    this.html_labels.children[c].remove();                    
                }
            }
        },

        update_all_position: function(){
            if (!this.enabled)
                return;

            if (this.html_labels.children.length>0){
                for (var c=0; c < this.html_labels.children.length; c++){
                    var element = this.html_labels.children[c];
                    var pos = this.toXYCoords(element.pos);
                    element.style.top = Math.round(pos.y) + 'px';
                    element.style.left = Math.round(pos.x) + 'px';

                    element.hidden = pos.out_view;

                }
            }
        },
        select_box: function(local_id){
            if (!this.enabled)
                return;
                
            document.getElementById("obj-local-"+local_id).className = "selected-float-label";
        },

        unselect_box: function(local_id){
            if (!this.enabled)
                return;
                
            document.getElementById("obj-local-"+local_id).className = "float-label";
        },

        set_object_type: function(local_id, obj_type){
            if (!this.enabled)
                return;
                
            var label = document.getElementById("obj-local-"+local_id);
            label.obj_type = obj_type;
            label.update_text();
        },

        
        set_object_track_id: function(local_id, track_id){
            if (!this.enabled)
                return;
                
            var label = document.getElementById("obj-local-"+local_id);
            label.obj_track_id = track_id;
            label.update_text();
        },

        update_position: function(box){
            if (!this.enabled)
                return;
                
            var label = document.getElementById("obj-local-"+box.obj_local_id);
            
            label.pos = box.position.clone();
            label.pos.z += box.scale.z + 2;

            var pos = this.toXYCoords(label.pos);
            label.style.top = Math.round(pos.y) + 'px';
            label.style.left = Math.round(pos.x) + 'px';
            label.hidden = pos.out_view;
        },

        remove_box: function(box){
            if (!this.enabled)
                return;
                
            var label = document.getElementById("obj-local-"+box.obj_local_id);
            label.remove();
        },

        add_label: function(box){
            if (!this.enabled)
                return;
                
            var label = document.createElement('div');
            label.className = "float-label";
            label.id = "obj-local-"+box.obj_local_id;
            //label.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
            //label.style.width = 100;
            //label.style.height = 100;
            //label.style.backgroundColor = "blue";
            
            label.update_text = function(){this.innerHTML = /*this.obj_type +"-"+*/ this.obj_track_id; }
            
            label.obj_type = box.obj_type;
            label.obj_local_id = box.obj_local_id;
            label.obj_track_id = box.obj_track_id;
            label.update_text();

            label.pos = box.position.clone();
            label.pos.z += box.scale.z + 2;
            
            var pos = this.toXYCoords(label.pos);
            
            label.style.top = Math.round(pos.y) + 'px';
            label.style.left = Math.round(pos.x) + 'px';

            label.hidden = pos.out_view;
            
            document.getElementById("2Dlabels").appendChild(label);

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

    };

    return manager;


}


export {createFloatLabelManager};