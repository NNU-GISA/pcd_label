
import * as THREE from './lib/three.module.js';
import {operation_state}  from "./main.js";
import {views} from "./view.js";

var mouse = new THREE.Vector2();

var raycaster;
var onDownPosition;
var onUpPosition;

var handleLeftClick;
var handleRightClick;

var dom_element;

function init_mouse(container, on_left_click, on_right_click){
    raycaster = new THREE.Raycaster();
    onDownPosition = new THREE.Vector2();
    onUpPosition = new THREE.Vector2();


    container.addEventListener( 'mousemove', onMouseMove, false );
    container.addEventListener( 'mousedown', onMouseDown, true );
    set_mouse_handler(on_left_click, on_right_click);
    dom_element = container;
}

function set_mouse_handler(on_left_click, on_right_click){
    handleLeftClick = on_left_click;
    handleRightClick = on_right_click;
}


function onMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
   
    //console.log(mouse, x, y);   
}

function get_mouse_location_in_world(){
    raycaster.setFromCamera( mouse, views[0].camera );
    var o = raycaster.ray.origin;
    var d = raycaster.ray.direction;

    var alpha = - o.z/d.z;
    var x = o.x + d.x*alpha;
    var y = o.y + d.y*alpha;
    return {x:x, y:y, z:0};
}



function onMouseDown( event ) {    

    if (event.which==3){
        operation_state.mouse_right_down = true;
        operation_state.key_pressed = false;
    }
    

    var array = getMousePosition(dom_element, event.clientX, event.clientY );
    onDownPosition.fromArray( array );        
    

    this.addEventListener( 'mouseup', onMouseUp, false );

}

function onMouseUp( event ) {

    if (event.which==3){
        operation_state.mouse_right_down = false;
    }
    
    var array = getMousePosition(dom_element, event.clientX, event.clientY );
    onUpPosition.fromArray( array );

    if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {
        if (event.which == 3){
            //right click
            // if no other key pressed, we consider this as a right click
            if (!operation_state.key_pressed){
                console.log("right clicked.");
                handleRightClick(event);
            }
        }
        else{
            // left click
            handleLeftClick(event);
        }
    }
    
    this.removeEventListener( 'mouseup', onMouseUp, false );

}


function getMousePosition( dom, x, y ) {

    var rect = dom.getBoundingClientRect();
    return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

}

function getIntersects( point, objects ) {

    mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

    raycaster.setFromCamera( mouse, views[0].camera );

    return raycaster.intersectObjects( objects, false );  // 2nd argument: recursive.

}


export{getMousePosition, onMouseDown, onMouseMove,set_mouse_handler, get_mouse_location_in_world, init_mouse, onUpPosition, getIntersects}