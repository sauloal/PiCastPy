#!/usr/bin/python

import sys, os
import re
import time
from pprint import pprint

pidfile = sys.argv[0] + '.pid'
pid     = os.getpid()

print "import atexit"
import atexit

print "adding . to path"
sys.path.insert(0, '.')

from flask import Flask, json

print "reading config"
setupfile    = 'config.json'


sys.path.insert(0, 'python-youtube-download')

config       = json.loads("".join(open(setupfile, 'r').readlines()))

print config

DEBUG     = config['DEBUG'     ]
SECRETKEY = config['SECRET KEY']

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
	print "returning UI", url_for('static', filename='index.html' )
	#TODO: return UI
	return redirect ( url_for('static', filename='index.html' ) )

@app.route("/add/", methods=['GET'])
def add():
	service = request.args.get('service', None )
	url     = request.args.get('url'    , None )
	res     = PiCastDb.add(service, url)
	return jsonify( { 'time': time.time(), 'service': service, 'url': url, 'response': res } )


@app.route("/get/<req>", methods=['GET'])
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

@app.route('/mark_read/<pic_id>', methods=['GET'])
def mark_read(pic_id):
	try:
		pic_id = int(pic_id)
	except:
		return None

	res = PiCastDb.mark_read( pic_id )
	return jsonify( res )

@app.route('/flush', methods=['GET'])
def flush():
	res = PiCastDb.flush()
	return jsonify( res )

@app.route('/flush_all', methods=['GET'])
def flush_all():
	res = PiCastDb.flush_all()
	return jsonify( res )


@app.route('/serve/<wrapper>/', methods=['GET'])
def serve(wrapper):
	url     = request.args.get('url'    , None )

	if url is None:
		return "no url given"

	if wrapper not in config['wrappers']:
		return "wrapper %s does not exists" % wrapper

	wdata = config['wrappers'][wrapper]
	wfile = wdata['file'        ]
	wrerq = wdata['replace_req']
	wrest = wdata['replace_str']

	wpath = os.path.join( 'static', 'wrappers', wdata['file'] )

	if not os.path.exists( wpath ):
		return "wrapper %s has no file %s" % ( wrapper, wpath )

	wdata = "".join( open(wpath, 'r').readlines() )
	
	for src, dst in wrerq:
		dstval = request.args.get(dst, None)

		if dstval is None:
			return "no request %s" % dst

		print "replacing '\<%%%s%%\>' for '%s' = '%s'" % (src, dst, dstval)
		wdata = re.sub("\<%"+src+"%\>", dstval, wdata)

	for src, dst in wrest:
		print "replacing '%s' for '%s'" % (src, dst)
		wdata = re.sub(src, dst, wdata)

	return wdata

@app.route('/stream', methods=['GET'])
def stream():
	url = request.args.get('url', None)
	print "URL", url

	def content():
		yt = YouTube()

		# Set the video URL.
		yt.url = "http://www.youtube.com/watch?v=Ik-RsDGPI5Y"
		yt.url = url

		pprint(yt.videos)

		sys.stderr.write( yt.filename )

		#pprint(yt.filter('flv'))
		#pprint(yt.filter('mp4'))

		#print yt.filter('mp4')[-1]

		video = yt.get('mp4', '720p')
		for line in video.stream():
			yield line

	if url is None:
		abort( 404 )

	#wrt = writter( url )

	return Response( stream_with_context( content() ), mimetype='video/mp4' )

def rmpid():
	if os.path.exists( pidfile ):
		print "removing pid file", pidfile, "for pid", pid
		os.remove( pidfile )
	else:
		print "pid file", pidfile, "for pid", pid, "does not exists"
		sys.exit( 1 )

PiCastDb = None
Flask    = None
request  = None
session  = None
g        = None
redirect = None
url_for  = None
abort    = None
render_template     = None 
flash               = None
make_response       = None
jsonify             = None
Markup              = None
Response            = None
send_from_directory = None
Blueprint           = None
stream_with_context = None

TemplateNotFound    = None

YouTube             = None

def init_db():
	print "importing flask"
        global Flask
        global request 
        global session 
        global g 
        global redirect 
        global url_for 
        global abort 
        global render_template 
        global flash 
        global make_response 
        global jsonify 
        global Markup 
        global Response 
        global send_from_directory 
        global Blueprint
	global stream_with_context

	#from flask       import Flask, request, session, g, redirect, url_for, abort, render_template, flash, make_response, jsonify, Markup, Response, send_from_directory, Blueprint
	from flask       import Flask, request, jsonify, stream_with_context, Response, url_for, redirect, abort

	print "importing jinja"
        global TemplateNotFound
	#from jinja2      import TemplateNotFound

	print "importing youtube"
	global YouTube
	from pytube import YouTube

	print "importing PiCast db"
	global PiCastDb
	import PiCastDb

	PiCastDb.DEBUG = DEBUG

	if os.path.exists( pidfile ):
		print "server already running. delete pid file",pidfile,"if not\npid is", "".join( open(pidfile, 'r').readlines() )
		sys.exit(1)
	else:
		print "creating pid file", pidfile, "with pid", pid
		open(pidfile, 'w').write( str(pid) )

	atexit.register( rmpid )

	PiCastDb.load( config['dbname'] )

def main():
	app.debug      = DEBUG
	app.secret_key = SECRETKEY
	app.before_first_request( init_db )
	try:
		#app.run(port=config['port'], host='0.0.0.0', threaded=True)
		app.run(port=config['port'], host='0.0.0.0')
	except:
		print "server already running"
		sys.exit( 1 )


if __name__ == "__main__": main()

#url='http://r18---sn-5hn7sner.c.youtube.com/videoplayback?ratebypass=yes&expire=1376066979&mt=1376043762&ipbits=8&fexp=931318%2C916903%2C920508%2C904448%2C926103%2C916625%2C919515%2C909546%2C906397%2C916914%2C929117%2C929121%2C929906%2C929907%2C929127%2C929129%2C929131%2C929930%2C925720%2C925722%2C925718%2C925714%2C929917%2C929919%2C912521%2C925302%2C932306%2C920605%2C904830%2C919373%2C904122%2C929609%2C911423%2C909549%2C900816%2C912711%2C935802%2C904494%2C906001&id=ffeea127cb25b5d2&key=yt1&source=youtube&mv=m&ms=au&itag=22&upn=tCcuU6PLA_w&ip=95.96.159.83&sparams=cp%2Cid%2Cip%2Cipbits%2Citag%2Cratebypass%2Csource%2Cupn%2Cexpire&cp=U0hWS1BRVF9MU0NONl9IS1hKOm1feE43cEhDeFZs&sver=3&signature=36C9035D814C99EC06B0791DD89C7A9FE005DB70.7497782C3084DF60B76C5E1292D468B3D714DFBC'
# payload='{ "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "'${url}'" }}, "id": 1 }'
#curl -v -d "$payload" -H "Content-type:application/json" -X POST "127.0.0.1:8080/jsonrpc"
