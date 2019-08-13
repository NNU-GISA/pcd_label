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
  

if __name__ == '__main__':
  cherrypy.quickstart(Root(), '/', config="server.conf")

