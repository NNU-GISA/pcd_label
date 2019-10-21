# Point Cloud 3D Bounding Box Annotation Tool


![screenshot](./pcd_label.png)

## Requirements

python2, cherrypy


## Start
python main.py


## Data preparation

````
public
   +- data
       +- scene1
             +- image
                  +- 0000.jpg
                  +- 0001.jpg
             +- pcd
                  +- 0000.pcd
                  +- 0001.pcd
             +- bbox.json
                  +- 0000.bbox.json
             +- calib.txt
       +- scene2
             
````

bbox.json is the directory to save the annotation result.

calib.txt is the calibration matrix from point cloud to image. it's optional, but if provided, the box is projected on the image so as to assist the annotation.

## Operations

```
mouse scroll up/down:  zoom in/out
mouse left key hold/move: rotate (change main view)
mouse right key hold/move: pan

left click on a box: select
left click on a selected box: show transform control
left click on non-box area: hide transform control if present, or unselect box

when transform control if present:
v: switch transform modes among resize/translate/rotate
z/x/c: turan on/off x/y/z axis
use mouse to adjust the box.



if one box is selected, the following key can be used to adjust it:

q w e r t
a s d f g
z x c v b n m

q: move box right (+x)
a: move box left  (-x)
w: move box forward    (+y)
s: move box backward  (-y)
e: move box up    (+z)
d: move box down  (-z)
r: rotate right (z-axis)
f: rotate left (z-axis)
g: rotate the box heading direction by 180 degree
t: reset the box

Q (or q + right-click-and-hold): scale up in x axis
A (or a + right-click-and-hold): scale down in x axis
W (or w + right-click-and-hold): scale up in y axis
S (or s + right-click-and-hold): scale down in y axis
E (or e + right-click-and-hold): scale up in z axis
D (or d + right-click-and-hold): scale down in z axis

z toggle x axis of box transform control
x toggle y axis of box transform control
c toggle z axis of box transform control

v switch transform control view: tranform/rotate/scale

b switch box between bus/perdestrian/car
n create new box at the position of mouse
m paste/auto-adjust a box from a ref-box

ctrl+s  save current frame
del/ctrl+d  remove selected box


1,2  select previous/next box
3,4  show previous/next frame in current scene
5,6,7  show camera helper box of sideviews.

```
