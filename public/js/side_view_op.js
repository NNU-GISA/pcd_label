
import {transform_bbox} from "./main.js"

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


    document.getElementById("z-view-manipulator").onmouseenter = function(){
        document.getElementById("z-v-table-t").style.display="inherit";
        document.getElementById("z-v-table-s").style.display="inherit";
    }

    document.getElementById("z-view-manipulator").onmouseleave = function(){
        document.getElementById("z-v-table-t").style.display="none";
        document.getElementById("z-v-table-s").style.display="none";
    }
}


export {init_side_view_operation} 