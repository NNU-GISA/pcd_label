import random
import string

import cherrypy
import os

from jinja2 import Environment, FileSystemLoader
env = Environment(loader=FileSystemLoader('./'))




class Root(object):
    @cherrypy.expose
    def index(self):
      tmpl = env.get_template('index.html')
      return tmpl.render()
    
    @cherrypy.expose
    def save(self, scene, frame):
      cl = cherrypy.request.headers['Content-Length']
      rawbody = cherrypy.request.body.read(int(cl))
      print(rawbody)
      with open("./public/data/"+scene +"/bbox.json/"+frame+".bbox.json",'w') as f:
        f.write(rawbody)
      
      return "ok"

    @cherrypy.expose    
    def load(self, frame):
      if (os.path.isfile("./public/"+frame)):
        with open("./public/"+frame,"r") as f:
          y=f.read()
          return y
      else:
        return ""

    @cherrypy.expose    
    @cherrypy.tools.json_out()
    def datameta(self):
      data = []

      scenes = os.listdir("public/data")
      print(scenes)

      for s in scenes:
        scene = {
          "scene": s,
          "frames": []
        }

        data.append(scene)

        frames = os.listdir("public/data/"+s+"/pcd")
        frames.sort()
        for f in frames:
          filename, fileext = os.path.splitext(f)
          scene["frames"].append(filename)

        point_transform_matrix=[]

        if os.path.isfile("public/data/"+s+"/point_transform.txt"):
          with open("public/data/"+s+"/point_transform.txt")  as f:
            point_transform_matrix=f.read()
            point_transform_matrix = point_transform_matrix.split(",")

        if not os.path.isdir("public/data/"+s+"/bbox.xyz"):
          scene["boxtype"] = "psr"
          if point_transform_matrix:
            scene["point_transform_matrix"] = point_transform_matrix
        else:
          scene["boxtype"] = "xyz"
          if point_transform_matrix:
            scene["point_transform_matrix"] = point_transform_matrix
          

      print(data)
      return data
      # return [
      #         {
      #           "scene":"liuxian1",
      #           "frames": [
      #             "000242","000441"
      #           ],
      #           "boxtype":"xyz",
      #           "point_transform_matrix": [
      #             1, 0, 0, 
      #             0, 0, 1, 
      #             0, -1, 0,
      #           ]
      #         },
      #         {
      #           "scene":"liuxian2",
      #           "frames": [
      #             "test"
      #           ],
      #           "boxtype":"psr",
      #         },
      #        ]

if __name__ == '__main__':
  cherrypy.quickstart(Root(), '/', config="server.conf")

