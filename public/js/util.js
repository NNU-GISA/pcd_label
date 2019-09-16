




// matrix (m*n), matrix(n*l), vl=n 
function matmul(m, x, vl)  //vl is vector length
{
    var ret=[];
    for (var vi =0; vi < x.length/vl; vi++){  //vector index
        for (var r = 0; r<m.length/vl; r++){  //row of matrix
            ret[vi*vl+r] = 0;
            for (var i = 0; i<vl; i++){
                ret[vi*vl+r] += m[r*vl+i]*x[vi*vl+i];
            }
        }
    }

    return ret;
}

// box(position, scale, rotation) to box corner corrdinates.
// return 8 points, represented as (x,y,z,1)
// note the vertices order cannot be changed, draw-box-on-image assumes
//  the first 4 vertex is the front plane, so it knows box direction.
function psr_to_xyz(p,s,r){
    var trans_matrix=[
        Math.cos(r.z), -Math.sin(r.z), 0, p.x,
        Math.sin(r.z), Math.cos(r.z),  0, p.y,
        0,             0,              1, p.z,
        0,             0,              0, 1,
    ];

    var x=s.x/2;
    var y=s.y/2;
    var z=s.z/2;
    var local_coord = [
        -x, y, -z, 1,   x, y, -z, 1,  //front-left-bottom, front-right-bottom
        x, y, z, 1,    -x, y, z, 1,  //front-right-top,   front-left-top

        -x, -y, -z, 1,   x, -y, -z, 1,  
        x, -y, z, 1,   -x, -y, z, 1,        
        
    ];

    var world_coord = matmul(trans_matrix, local_coord, 4);
    var w = world_coord;
    return w;
}

function xyz_to_psr(vertices){
    var ann = vertices;
    var ROW=4;
    var pos={x:0,y:0,z:0};
    for (var i=0; i<8; i++){
        pos.x+=ann[i*ROW];
        pos.y+=ann[i*ROW+1];
        pos.z+=ann[i*ROW+2];
    }
    pos.x /=8;
    pos.y /=8;
    pos.z /=8;



    var scale={
        x: Math.sqrt((ann[0]-ann[ROW])*(ann[0]-ann[ROW])+(ann[1]-ann[ROW+1])*(ann[1]-ann[ROW+1])),
        y: Math.sqrt((ann[0]-ann[ROW*3])*(ann[0]-ann[ROW*3])+(ann[1]-ann[ROW*3+1])*(ann[1]-ann[ROW*3+1])),
        z: ann[3*ROW+2]-ann[2],
    };
    
    /*
    1. atan2(y,x), not x,y
    2. point order in xy plane
        0   1
        3   2
    */

    var angle = Math.atan2(ann[1*ROW+1]+ann[5*ROW+1]-2*pos.y, ann[1*ROW]+ann[5*ROW]-2*pos.x);

    return {
        position: pos,
        scale:scale,
        rotation:{x:0,y:0,z:angle},
    }
    return w;
}


function vector4to3(v)
{
    var ret=[];
    for (var i=0; i<v.length; i++){
        if ((i+1)% 4 != 0){
            ret.push(v[i]);
        }
    }

    return ret;
}

function vector3_nomalize(m){
    var ret=[];
    for (var i=0; i<m.length/3; i++){
        ret.push(m[i*3+0]/m[i*3+2]);
        ret.push(m[i*3+1]/m[i*3+2]);
    }

    return ret;
}


export {vector4to3, vector3_nomalize, psr_to_xyz, matmul}