var header={

    clear_box_info: function(){
        document.getElementById("box").innerHTML = '';
        document.getElementById("obj-editor").hidden=true;
        //document.getElementById("ref-obj").hidden=true;
    },
    
    update_box_info: function(box){
        var scale = box.scale;
        var pos = box.position;
        var rotation = box.rotation;
    
        // document.getElementById("info").innerHTML = "w "+scale.x.toFixed(2) +" l "+scale.y.toFixed(2) + " h " + scale.z.toFixed(2) +
        //                                              " x "+pos.x.toFixed(2) +" y "+pos.y.toFixed(2) + " z " + pos.z.toFixed(2);
    
        document.getElementById("box").innerHTML = "| "+pos.x.toFixed(2) +" "+pos.y.toFixed(2) + " " + pos.z.toFixed(2) + " | " +
                                                    scale.x.toFixed(2) +" "+scale.y.toFixed(2) + " " + scale.z.toFixed(2) + " | " +
                                                    (rotation.x*180/Math.PI).toFixed(2)+" "+(rotation.y*180/Math.PI).toFixed(2)+" "+(rotation.z*180/Math.PI).toFixed(2)+" ";
    
        document.getElementById("obj-editor").hidden=false;
        //document.getElementById("object-track-id-editor").hidden=false;
    },

    


    set_ref_obj: function(marked_object){
        document.getElementById("ref-obj").innerHTML="| BoxRef: "+marked_object.scene+"/"+marked_object.frame+": "+marked_object.obj_type+"-"+marked_object.obj_track_id;
    },

    set_frame_info: function(scene, frame, on_scene_changed){
        //document.getElementById("frame").innerHTML = scene+"/"+frame;

        var e = document.getElementById("scene-selector");

        if (e.value != scene){
            document.getElementById("scene-selector").value = scene;
            on_scene_changed(scene);
        }

        document.getElementById("frame-selector").value = frame;
    },

    clear_frame_info: function(scene, frame){
        //document.getElementById("frame").innerHTML = "";
    },
    
    unmark_changed_flag: function(){
        document.getElementById("changed-mark").innerText=" ";
        
    },
    
    mark_changed_flag: function(){
        document.getElementById("changed-mark").innerText="*";
    }
    
}


export {header}