
import {transform_bbox, selected_box, translate_box, on_box_changed} from "./main.js"
import {data} from "./data.js"
import {views} from "./view.js"

var mouse_pos;

var top_view_handle = {
    width: 0,
    height: 0,
}

function update_top_view_handle(){
    var viewport = views[1].viewport;
    var viewport_ratio = viewport.width/viewport.height;
    var box_ratio = selected_box.scale.x/selected_box.scale.y;

    var width=0;
    var height=0;

    if (box_ratio > viewport_ratio){
        //handle width is viewport.width*2/3
        width = viewport.width*2/3;
        height = width/box_ratio;
    }
    else{
        //handle height is viewport.height*2/3
        height = viewport.height*2/3;
        width = height*box_ratio;
    }

    top_view_handle.width = width;
    top_view_handle.height = height;

    var x = viewport.left + viewport.width/2;
    var y = viewport.bottom - viewport.height/2;

    var left = x-width/2;
    var right = x+width/2;
    var top = y-height/2;
    var bottom = y+height/2;

    var de = document.getElementById("line-top");
    de.setAttribute('x1', Math.ceil(left));
    de.setAttribute('y1', Math.ceil(top));
    de.setAttribute('x2', Math.ceil(left));
    de.setAttribute('y2', Math.ceil(bottom));

    de = document.getElementById("line-top-handle");
    de.setAttribute('x', Math.ceil(left-10));
    de.setAttribute('y', Math.ceil(top+height/2-10));
}


function init_side_view_operation(){
    document.getElementById("z-v-up").onclick = function(){
        transform_bbox("y_move_up");
    };

    document.getElementById("z-v-down").onclick = function(){
        transform_bbox("y_move_down");
    };

    document.getElementById("z-v-left").onclick = function(){
        transform_bbox("x_move_down");
    };

    document.getElementById("z-v-right").onclick = function(){
        transform_bbox("x_move_up");
    };



    document.getElementById("z-v-t-up").onclick = function(){
        transform_bbox("y_scale_up");
    };

    document.getElementById("z-v-t-down").onclick = function(){
        transform_bbox("y_scale_down");
    };

    document.getElementById("z-v-t-left").onclick = function(){
        transform_bbox("x_scale_down");
    };

    document.getElementById("z-v-t-right").onclick = function(){
        transform_bbox("x_scale_up");
    };

    document.getElementById("line-top-handle").onmouseenter = function(event){
        document.getElementById("line-top").style.stroke="#ffff00";
    };

    document.getElementById("line-top-handle").onmouseleave = hide;

    
    function hide(event){
            document.getElementById("line-top").style.stroke="#00000000";
    };

    document.getElementById("line-top-handle").onmouseup = function(event){
        //document.getElementById("line-top").style["stroke-dasharray"]="none";
        document.getElementById("line-top").style.stroke="#00000000";
        document.getElementById("line-top-handle").onmouseleave = hide;
    };


    document.getElementById("line-top-handle").onmousedown = function(event){
        document.getElementById("line-top").style.stroke="red";
        document.getElementById("line-top").style["stroke-dasharray"]="3,3";
        document.getElementById("line-top-handle").onmouseleave = null;


        mouse_pos={x: event.clientX,y:event.clientY,};
        var mouse_cur_pos;

        console.log(mouse_pos);
        var line_pos = {
            x: parseInt(document.getElementById("line-top").getAttribute('x1'))
        }

        document.getElementById("top-view-svg").onmouseup = function(event){
            document.getElementById("top-view-svg").onmousemove = null;
            document.getElementById("top-view-svg").onmouseup=null;

            var delta = mouse_cur_pos.x - mouse_pos.x;
            var ratio = delta/top_view_handle.width;

            var delta = selected_box.scale.x*ratio;
            console.log(delta);
            translate_box(selected_box, 'x', delta/2 );
            selected_box.scale.x -= delta;
            on_box_changed(selected_box);
        }

        document.getElementById("top-view-svg").onmousemove = function(event){
            
            mouse_cur_pos={x: event.clientX,y:event.clientY,};
            
            var pos = mouse_cur_pos.x - mouse_pos.x + line_pos.x;
            //console.log(mouse_cur_pos, pos);
            document.getElementById("line-top").setAttribute('x1', pos);
            document.getElementById("line-top").setAttribute('x2', pos);

            document.getElementById("line-top-handle").setAttribute("x", pos-10);
        }
    };


    /*
    document.getElementById("z-view-manipulator").onmouseenter = function(){
        document.getElementById("z-v-table-translate").style.display="inherit";
        document.getElementById("z-v-table-scale").style.display="inherit";
        document.getElementById("z-v-table-shrink").style.display="inherit";
    };

    document.getElementById("z-view-manipulator").onmouseleave = function(){
        document.getElementById("z-v-table-translate").style.display="none";
        document.getElementById("z-v-table-scale").style.display="none";
        document.getElementById("z-v-table-shrink").style.display="none";
    };
    */

    document.getElementById("z-v-shrink-left").onclick = function(event){
        var points = data.world.get_points_of_box_in_box_coord(selected_box);

        if (points.length == 0){
            return;
        }

        var minx = 0;
        for (var i in points){
            if (points[i][0] < minx){
                minx = points[i][0];
            }
        }

        
        var delta = minx + selected_box.scale.x/2;
        console.log(minx, delta);
        translate_box(selected_box, 'x', delta/2 );
        selected_box.scale.x -= delta;
        on_box_changed(selected_box);
    };

    document.getElementById("z-v-shrink-right").onclick = function(event){
        var points = data.world.get_points_of_box_in_box_coord(selected_box);

        if (points.length == 0){
            return;
        }

        var maxx = 0;
        for (var i in points){
            if (points[i][0] > maxx){
                maxx = points[i][0];
            }
        }

        
        var delta = selected_box.scale.x/2 - maxx;
        console.log(maxx, delta);
        translate_box(selected_box, 'x', -delta/2 );
        selected_box.scale.x -= delta;
        on_box_changed(selected_box);
    }
    
}


export {init_side_view_operation, update_top_view_handle} 