

var data = {
    bboxes: [],

    file_info: {
        dir: "",
        scene: "liuxian2",
        frame: "test",
        transform_matrix: null, /* [1, 0, 0, 
                           0, 0, 1, 
                           0, -1, 0], */
        annotation_format: "psr", //xyz(24 number), csr(center, scale, rotation, 9 number)
    },

    transform_point: function(m, x,y, z){
        var rx = x*m[0]+y*m[1]+z*m[2];
        var ry = x*m[3]+y*m[4]+z*m[5];
        var rz = x*m[6]+y*m[7]+z*m[8];

        return [rx, ry, rz];
    },

    transform_annotation: function(ann_array){

    },

    get_pcd_path: function(){
        return 'static/data/'+ this.file_info.scene + "/pcd/" + this.file_info.frame+".pcd";
    },

    get_anno_path: function(){
        if (this.file_info.annotation_format=="psr"){
            return 'data/'+this.file_info.scene + "/bbox.json/" + this.file_info.frame + ".bbox.json";
        }
        else{
            return 'data/'+this.file_info.scene + "/bbox.xyz/" + this.file_info.frame + ".bbox.txt";
        }
        
    },

    anno_to_boxes: function(text){
        if (this.file_info.annotation_format == "psr")
            return JSON.parse(text);
        else
            return this.xyz_to_psr(text);

    },

    xyz_to_psr: function(text){
        var _self = this;

        var points_array = text.split('\n').filter(function(x){return x;}).map(function(x){return x.split(' ').map(function(x){return parseFloat(x);})})
        

        var boxes = points_array.map(function(ps){
            for (var i=0; i<8; i++){
                var p = _self.transform_point(_self.file_info.transform_matrix, ps[3*i+0],ps[3*i+1],ps[3*i+2]);
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
};

export {data};

