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
    def save(self, frame):
      cl = cherrypy.request.headers['Content-Length']
      rawbody = cherrypy.request.body.read(int(cl))
      print(rawbody)
      with open(frame+".anno.txt",'w') as f:
        f.write(rawbody)
      
      return "ok"

    @cherrypy.expose    
    def load(self, frame):
      with open("./public/"+frame,"r") as f:
        y=f.read()
        return y

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

        if os.path.isdir("public/data/"+s+"/bbox.json"):
          scene["boxtype"] = "psr"
        else:
          scene["boxtype"] = "xyz"
          scene["point_transform_matrix"] = [
                   1, 0,  0, 
                   0, 0,  1, 
                   0, -1, 0]
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

