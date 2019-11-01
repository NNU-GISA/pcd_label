// size is the dimension of the object in x/y/z axis.
var obj_type_map = {
    Car:        {color: '#00ff00',  size:[1.8, 4.5, 1.5]},
    Bus:        {color: '#ffff00',  size:[2.8, 10, 3]},
    Pedestrian: {color: '#ff0000',  size:[0.5, 0.4, 1.7]},
    Rider:      {color: '#ff8800',  size:[0.6, 1.6, 1.6]},
    Bicycle:    {color: '#88ff00',  size:[0.6, 1.6, 1.2]},
    Motor:      {color: '#aaaa00',  size:[0.6, 1.6, 1.2]},
    Truck:      {color: '#00ffff',  size:[2.8, 10, 3]},
    Animal:     {color: '#00aaff',  size:[0.6, 1.6, 1.2]},
    Unknown:    {color: '#008888',  size:[1.8, 4.5, 1.5]},
}

export {obj_type_map}