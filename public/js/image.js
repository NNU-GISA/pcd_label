
import {data} from "./data.js"
import {params, selected_box } from "./main.js"
import {vector4to3, vector3_nomalize, psr_to_xyz, matmul} from "./util.js"
import {get_obj_cfg_by_type} from "./obj_cfg.js"

// all boxes
function clear_main_canvas(){
    var c = document.getElementById("maincanvas");
    var ctx = c.getContext("2d");
                
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function set_camera(name){
    data.set_active_image(camera_name);
}


function get_active_calib(){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});

        
    if (!scene_meta.calib){
        return null;
    }

    var active_image_name = data.world.images.active_name;
    var calib = scene_meta.calib[active_image_name];

    return calib;
}


function choose_best_camera_for_point(x,y,z){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});

        
    if (!scene_meta.calib){
        return null;
    }

    var proj_pos = [];
    for (var i in scene_meta.calib){
        var imgpos = matmul(scene_meta.calib[i].extrinsic, [x,y,z,1], 4);
        proj_pos.push({calib: i, pos: vector4to3(imgpos)});
    }

    var valid_proj_pos = proj_pos.filter(function(p){
        return all_points_in_image_range(p.pos);
    });
    
    valid_proj_pos.forEach(function(p){
        p.dist_to_center = p.pos[0]*p.pos[0] + p.pos[1]*p.pos[1];
    });

    valid_proj_pos.sort(function(x,y){
        return x.dist_to_center - y.dist_to_center;
    });

    console.log(valid_proj_pos);

    if (valid_proj_pos.length>0){
        return valid_proj_pos[0].calib;
    }

    return null;

}

function render_2d_image(){
    clear_main_canvas();

    if (params["hide image"]){
        hide_canvas();
        return;
    }

    draw_canvas();

    function hide_canvas(){
        document.getElementsByClassName("ui-wrapper")[0].style.display="none";
    }

    function show_canvas(){
        document.getElementsByClassName("ui-wrapper")[0].style.display="inherit";
    }



    function draw_canvas(){
        // draw picture
        var c = document.getElementById("maincanvas");
        var ctx = c.getContext("2d");

        var img = data.world.images.active_image();
       

        if (!img || img.width==0){
            hide_canvas();
            return;
        }

        show_canvas();

        var clientWidth, clientHeight;
        // adjust canvas width/height
        /*
        if (img.naturalWidth / img.naturalHeight > ctx.canvas.width, ctx.canvas.height){
            clientWidth = ctx.canvas.width;
            clientHeight = ctx.canvas.width * img.naturalHeight/img.naturalWidth;
        }else{
            clientHeight = ctx.canvas.height;
            clientWidth = ctx.canvas.height * img.naturalWidth/img.naturalHeight;
        }

        
        */

        clientWidth = ctx.canvas.width;
        clientHeight = ctx.canvas.height;

        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, clientWidth, clientHeight);

        //var trans_ratio = ctx.canvas.width/img.naturalWidth;
        var trans_ratio ={
            x: clientWidth/img.naturalWidth,
            y: clientHeight/img.naturalHeight,
        };

        var calib = get_active_calib();
        if (!calib){
            return;
        }

        // draw boxes
        data.world.boxes.forEach(function(box){
            

            var scale = box.scale;
            var pos = box.position;
            var rotation = box.rotation;

            var box3d = psr_to_xyz(pos, scale, rotation);
            
            var imgpos = matmul(calib.extrinsic, box3d, 4);
            var imgpos3 = vector4to3(imgpos);
            var imgpos2 = matmul(calib.intrinsic, imgpos3, 3);

            if (!all_points_in_image_range(imgpos3)){
                return;
            }
            var imgfinal = vector3_nomalize(imgpos2);

            ctx.lineWidth = 2;
            // front 
            draw_box_on_image(ctx, box, imgfinal, trans_ratio, selected_box == box);

        });
    
    }


}

function draw_box_on_image(ctx, box, box_corners, trans_ratio, selected){
    var imgfinal = box_corners;

    if (!selected){
        ctx.strokeStyle = get_obj_cfg_by_type(box.obj_type).color;

        var c = get_obj_cfg_by_type(box.obj_type).color;
        var r ="0x"+c.slice(1,3);
        var g ="0x"+c.slice(3,5);
        var b ="0x"+c.slice(5,7);

        ctx.fillStyle="rgba("+parseInt(r)+","+parseInt(g)+","+parseInt(b)+",0.2)";
    }
    else{
        ctx.strokeStyle="#ff00ff";        
        ctx.fillStyle="rgba(255,0,255,0.2)";
    }

    // front panel
    ctx.beginPath();
    ctx.moveTo(imgfinal[3*2]*trans_ratio.x,imgfinal[3*2+1]*trans_ratio.y);

    for (var i=0; i < imgfinal.length/2/2; i++)
    {
        ctx.lineTo(imgfinal[i*2+0]*trans_ratio.x, imgfinal[i*2+1]*trans_ratio.y);
    }

    ctx.closePath();
    ctx.fill();
    
    // frame
    ctx.beginPath();

    ctx.moveTo(imgfinal[3*2]*trans_ratio.x,imgfinal[3*2+1]*trans_ratio.y);

    for (var i=0; i < imgfinal.length/2/2; i++)
    {
        ctx.lineTo(imgfinal[i*2+0]*trans_ratio.x, imgfinal[i*2+1]*trans_ratio.y);
    }
    //ctx.stroke();


    //ctx.strokeStyle="#ff00ff";
    //ctx.beginPath();

    ctx.moveTo(imgfinal[7*2]*trans_ratio.x,imgfinal[7*2+1]*trans_ratio.y);

    for (var i=4; i < imgfinal.length/2; i++)
    {
        ctx.lineTo(imgfinal[i*2+0]*trans_ratio.x, imgfinal[i*2+1]*trans_ratio.y);
    }
    
    ctx.moveTo(imgfinal[0*2]*trans_ratio.x,imgfinal[0*2+1]*trans_ratio.y);
    ctx.lineTo(imgfinal[4*2+0]*trans_ratio.x, imgfinal[4*2+1]*trans_ratio.y);
    ctx.moveTo(imgfinal[1*2]*trans_ratio.x,imgfinal[1*2+1]*trans_ratio.y);
    ctx.lineTo(imgfinal[5*2+0]*trans_ratio.x, imgfinal[5*2+1]*trans_ratio.y);
    ctx.moveTo(imgfinal[2*2]*trans_ratio.x,imgfinal[2*2+1]*trans_ratio.y);
    ctx.lineTo(imgfinal[6*2+0]*trans_ratio.x, imgfinal[6*2+1]*trans_ratio.y);
    ctx.moveTo(imgfinal[3*2]*trans_ratio.x,imgfinal[3*2+1]*trans_ratio.y);
    ctx.lineTo(imgfinal[7*2+0]*trans_ratio.x, imgfinal[7*2+1]*trans_ratio.y);


    ctx.stroke();
}


function clear_canvas(){
    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");
                
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}



function projected_3d_point_out_of_image_range(p){
    if (p[0]<0 || p[1]<0 || p[2]<0){
        return true;
    }
    else return false;
}

function all_points_in_image_range(p){
    for (var i = 0; i<p.length/3; i++){
        if (p[i*3+2]<0){
            return false;
        }
    }
    
    return true;
}


// draw highlighed box
function update_image_box_projection(box){
    var scene_meta = data.meta.find(function(x){return x.scene==data.world.file_info.scene;});

    var active_image_name = data.world.images.active_name;
    if (!scene_meta.calib){
        return;
    }
    
    var calib = scene_meta.calib[active_image_name]
    if (!calib){
        return;
    }
    
    if (calib){
        var scale = box.scale;
        var pos = box.position;
        var rotation = box.rotation;

        var img = data.world.images.active_image(); //document.getElementById("camera");
        if (img.naturalWidth > 0){

            clear_canvas();


            var box3d = psr_to_xyz(pos, scale, rotation);

            // project corners to image plane
            var imgpos = matmul(calib.extrinsic, box3d, 4);
            var imgpos3 = vector4to3(imgpos);            

            if (all_points_in_image_range(imgpos3)){  // if projection is out of range of the image, stop drawing.
                var imgpos2 = matmul(calib.intrinsic, imgpos3, 3);
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
                var trans_ratio = {
                    x: ctx.canvas.height/crop_area[3],
                    y: ctx.canvas.height/crop_area[3],
                }

                draw_box_on_image(ctx, box, imgfinal, trans_ratio, false);
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



export {render_2d_image, update_image_box_projection, clear_canvas, clear_main_canvas, choose_best_camera_for_point}