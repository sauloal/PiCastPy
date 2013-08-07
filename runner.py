#!/usr/bin/python

import sys, os
import time
import re

print "importing urllib"
import urllib

print "importing status"
sys.path.insert(0, '.')

print "importing PiCast db"
import PiCastDb

print "importing json"
from flask       import json

print "importing PiCast db"
import PiCastDb

print "reading config"
setupfile    = 'config.json'

config       = json.loads("".join(open(setupfile, 'r').readlines()))

print config

DEBUG = config['DEBUG']



def main():
	PiCastDb.load( config['dbname'] )
	#res = PiCastDb.get_last_and_mark_read()
	res = PiCastDb.get_last_raw()

	if res is None:
		print "nothing to run"
		sys.exit( 0 )
	
	print "something to run"
	print res
	
	service  = res['service']
	url      = res['url'    ]

	url      = urllib.quote( url )

	wrappers = config['wrappers']
	
	if service not in wrappers:
		print "service %s does not exists" % service
		sys.exit( 1 )
	
	service_info = wrappers[service]
	exe          = service_info['exe']
	print "exe ", exe
	
        print "replacing '\<%%url%%\>' for '%s'" % (url)
        exe          = re.sub("\<%url%\>", url, exe)

	print "exe ", exe
	


if __name__ == '__main__':
	main()
