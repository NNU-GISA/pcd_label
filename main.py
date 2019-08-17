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
    def save(self):
      cl = cherrypy.request.headers['Content-Length']
      rawbody = cherrypy.request.body.read(int(cl))
      print(rawbody)
      with open('annotations.txt','w') as f:
        f.write(rawbody)
      
      return "ok"

    @cherrypy.expose    
    def load(self):
      with open("annotations.txt","r") as f:
        y=f.read()
        return y
    

if __name__ == '__main__':
  cherrypy.quickstart(Root(), '/', config="server.conf")

