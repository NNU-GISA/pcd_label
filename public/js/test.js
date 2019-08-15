import * as THREE from './build/three.module.js';
import Stats from './examples/jsm/libs/stats.module.js';

			
//import Stats from './build/stats.module.js';
//import { TrackballControls } from './TrackballControls.js';
import { PCDLoader } from './examples/jsm/loaders/PCDLoader.js';
import { GeometryUtils } from './examples/jsm/utils/GeometryUtils.js';
//import {BBoxBufferGeometry } from './BBoxGeometry.js';
import { OrbitControls } from './examples/jsm/controls/OrbitControls.js';
import { TransformControls } from './examples/jsm/controls/TransformControls.js';
            



			var container, stats;
			var views, scene, renderer;
			var mouseX = 0, mouseY = 0;
			var windowWidth, windowHeight;
			var orbit;
			var views = [
				{
					left: 0,
					bottom: 0,
					width: 0.5,
					height: 1.0,
					background: new THREE.Color( 0.5, 0.5, 0.7 ),
					eye: [ 0, 300, 1800 ],
					up: [ 0, 1, 0 ],
					fov: 30,
					updateCamera: function ( camera, scene, mouseX ) {
					  camera.position.x += mouseX * 0.05;
					  camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
					  camera.lookAt( scene.position );
					}
				},
				{
					left: 0.5,
					bottom: 0,
					width: 0.5,
					height: 0.5,
					background: new THREE.Color( 0.7, 0.5, 0.5 ),
					eye: [ 0, 1800, 0 ],
					up: [ 0, 0, 1 ],
					fov: 45,
					updateCamera: function ( camera, scene, mouseX ) {
					  camera.position.x -= mouseX * 0.05;
					  camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
					  camera.lookAt( camera.position.clone().setY( 0 ) );
					}
				},
				{
					left: 0.5,
					bottom: 0.5,
					width: 0.5,
					height: 0.5,
					background: new THREE.Color( 0.5, 0.7, 0.7 ),
					eye: [ 1400, 800, 1400 ],
					up: [ 0, 1, 0 ],
					fov: 60,
					updateCamera: function ( camera, scene, mouseX ) {
					  camera.position.y -= mouseX * 0.05;
					  camera.position.y = Math.max( Math.min( camera.position.y, 1600 ), - 1600 );
					  camera.lookAt( scene.position );
					}
				}
			];
			init();
			animate();
			function init() {
				container = document.getElementById( 'container' );
				scene = new THREE.Scene();
				
				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.appendChild( renderer.domElement );
				stats = new Stats();
				container.appendChild( stats.dom );


				for ( var ii = 0; ii < views.length; ++ ii ) {
					var view = views[ ii ];
					var camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
					camera.position.fromArray( view.eye );
					camera.up.fromArray( view.up );
					view.camera = camera;

					

				}

				orbit = new OrbitControls( views[0].camera, renderer.domElement );
				orbit.update();
				orbit.addEventListener( 'change', render );
				//document.addEventListener( 'mousemove', onDocumentMouseMove, false );



				

				
				var loader = new PCDLoader();
				loader.load( 'static/pcd/test.pcd', function ( points ) {
					scene.add( points );
					var center = points.geometry.boundingSphere.center;
					//controls.target.set( center.x, center.y, center.z );
					//controls.update();
				});



			}
			
			function onDocumentMouseMove( event ) {
				mouseX = ( event.clientX - windowWidth / 2 );
				mouseY = ( event.clientY - windowHeight / 2 );
			}

			function updateSize() {
				if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
					windowWidth = window.innerWidth;
					windowHeight = window.innerHeight;
					renderer.setSize( windowWidth, windowHeight );
				}
			}
			function animate() {
				render();
				stats.update();
				requestAnimationFrame( animate );
			}
			function render() {
				updateSize();
				for ( var ii = 0; ii < views.length; ++ ii ) {
					var view = views[ ii ];
					var camera = view.camera;
					view.updateCamera( camera, scene, mouseX, mouseY );
					var left = Math.floor( windowWidth * view.left );
					var bottom = Math.floor( windowHeight * view.bottom );
					var width = Math.floor( windowWidth * view.width );
					var height = Math.floor( windowHeight * view.height );
					renderer.setViewport( left, bottom, width, height );
					renderer.setScissor( left, bottom, width, height );
					renderer.setScissorTest( true );
					renderer.setClearColor( view.background );
					camera.aspect = width / height;
					camera.updateProjectionMatrix();
					renderer.render( scene, camera );
				}
			}