#!/usr/bin/python

import sys, os
import time

sys.stderr.write( "LOG: importing atexit\n" )
import atexit

pidfile = sys.argv[0] + '.pid'
pid     = os.getpid()

def rmpid():
    if os.path.exists( pidfile ):
            sys.stderr.write( "LOG: removing pid file " + pidfile + " for pid " + str(pid) + "\n" )
            os.remove( pidfile )
    else:
            sys.stderr.write(  "LOG: pid file " + pidfile + " for pid " + pid + " does not exists\n" )
            sys.exit( 1 )

if os.path.exists( pidfile ):
    sys.stderr.write( "LOG: runner already running. delete pid file " + pidfile + " if not\npid is " + "".join( open(pidfile, 'r').readlines() ) + "\n" )
    sys.exit(1)
else:
    sys.stderr.write( "LOG: creating pid file " + pidfile + " with pid " + str(pid) + "\n" )
    open(pidfile, 'w').write( str(pid) )

atexit.register( rmpid )





sys.stderr.write( "LOG: importing re\n" )
import re

sys.stderr.write( "LOG: importing urllib\n" )
import urllib
import urllib2
from pprint import pprint


sys.path.insert(0, '.')
sys.stderr.write( "LOG: importing pytube\n" )
from pytube import YouTube

import yrpc

sys.stderr.write( "LOG: importing PiCast db\n" )
import PiCastDb

sys.stderr.write( "LOG: importing json\n" )
from flask       import json

sys.stderr.write( "LOG: importing PiCast db\n" )
import PiCastDb

sys.stderr.write( "LOG: reading config\n" )
setupfile    = 'config.json'

config       = json.loads("".join(open(setupfile, 'r').readlines()))

DEBUG = config['DEBUG']

if DEBUG:
	print config

PiCastDb.DEBUG = DEBUG

def println( line ):
	if not DEBUG:
		sys.stderr.write( "LOG: " )
		sys.stderr.write( line )
		sys.stderr.write( "\n" )

def main():
	PiCastDb.load( config['dbname'] )
	#res = PiCastDb.get_last_and_mark_read()
	res = PiCastDb.get_last_raw()

	if res is None:
		print "nothing to run"
		sys.exit( 0 )
	
	println( "something to run" )
	println( str(res)           )
	
	if config['mode'] == 'X':
		service  = res['service']
		url      = res['url'    ]

		url      = urllib.quote( url )

		wrappers = config['wrappers']
	
		if service not in wrappers:
			println( "service %s does not exists" % service )
			sys.exit( 1 )
	
		service_info = wrappers[service]
		exe          = service_info['exe']
		println( "exe " + exe )
	
	        println( "replacing '\<%%url%%\>' for '%s'" % (url) )
        	exe          = re.sub("\<%url%\>", url, exe)

		println( "exe " + exe )
		print exe
	elif config['mode'] == 'xbmc':
		status = yrpc.rpcurl( config['xbmc_url'], res['url'] )
		#TODO: delete register if status is OK

if __name__ == '__main__':
	main()
