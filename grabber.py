#!/usr/bin/python

import sys, os
import time

print "importing status"
sys.path.insert(0, '.')

print "importing flask"
from flask       import Flask, request, session, g, redirect, url_for, abort, render_template, flash, make_response, jsonify, json, Markup, Response, send_from_directory, Blueprint

print "importing jinja"
from jinja2      import TemplateNotFound

print "importing PiCast db"
import PiCastDb

print "reading config"
setupfile    = 'config.json'

config       = json.loads("".join(open(setupfile, 'r').readlines()))

print config

DEBUG = config['DEBUG']

#VARIABLES
app                = Flask(__name__)
app.config.from_object(__name__)
app.jinja_env.globals['trim_blocks'       ] = True
app.jinja_env.add_extension('jinja2.ext.do')


def before_request():
	"""
	before each request, add global variables to the global G variable.
	If using WSGI (eg. apache), this won't work
	"""
	#TODO: connect to database
	PiCastDb.load( config['dbname'] )
	pass

@app.route("/", methods=['GET'])
def base():
	#TODO: return UI
	return "OK"

@app.route("/add/", methods=['GET'])
def add():
	service = request.args.get('service', None )
	url     = request.args.get('url'    , None )
	res     = PiCastDb.add(service, url)
	return jsonify( { 'time': time.time(), 'service': service, 'url': url, 'response': res } )


@app.route("/get/<req>")
def get_list(req):
	res = None
	if   req == "last":
		res = PiCastDb.get_last_raw()
	elif req == "all":
		res = PiCastDb.get_all_raw()
	elif req == "fulfilled":
		res = PiCastDb.get_all_fulfilled_raw()
	elif req == "unfulfilled":
		res = PiCastDb.get_all_unfulfilled_raw()

	return jsonify( { 'req': req, 'res': res } )

@app.route('/mark_read/<pic_id>')
def mark_read(pic_id):
	try:
		pic_id = int(pic_id)
	except:
		return None

	res = PiCastDb.mark_read( pic_id )
	return jsonify( res )

@app.route('/flush')
def flush():
	res = PiCastDb.flush()
	return jsonify( res )

@app.route('/flush_all')
def flush_all():
	res = PiCastDb.flush_all()
	return jsonify( res )


def init_db():
	PiCastDb.load( config['dbname'] )

def main():
	app.debug = DEBUG
	app.before_first_request( init_db )
	app.run(port=config['port'], host='0.0.0.0')

print "GOT HERE"
if __name__ == "__main__": main()
