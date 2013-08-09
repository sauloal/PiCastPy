import os, sys
from pprint import pprint
import urllib2
import socket

sys.path.insert(0, '.')

from pytube import YouTube

from flask       import json

REQ_TIMEOUT=10

def rpcurl( xbmc_url, url ):
	mp4    = getvideo( url )
	return xbmc_rpc( xbmc_url, mp4.url )

def getvideo( url ):
        yt     = YouTube()
        yt.url = url

        pprint(yt.videos)

        sys.stderr.write( yt.filename )

        mp4   = yt.filter('mp4')[-1]
        fmt   = mp4.video_codec
        ext   = mp4.extension
        res   = mp4.resolution
        addr  = mp4.url

        print "highest %s: %s = res %s; url %s" % ( fmt, ext, str(res), addr )

	return mp4

def xbmc_rpc( xbmc_url, url ):
        #http://192.168.1.113:5151/stream?url=http://www.youtube.com/watch%3Fv=_-6hJ8sltdI
        #url='http://r18---sn-5hn7sner.c.youtube.com/videoplayback?ratebypass=yes&expire=1376066979&mt=1376043762&ipbits=8&fexp=931318%2C916903%2C920508%2C904448%2C926103%2C916625%2C919515%2C909546%2C906397%2C916914%2C929117%2C929121%2C929906%2C929907%2C929127%2C929129%2C929131%2C929930%2C925720%2C925722%2C925718%2C925714%2C929917%2C929919%2C912521%2C925302%2C932306%2C920605%2C904830%2C919373%2C904122%2C929609%2C911423%2C909549%2C900816%2C912711%2C935802%2C904494%2C906001&id=ffeea127cb25b5d2&key=yt1&source=youtube&mv=m&ms=au&itag=22&upn=tCcuU6PLA_w&ip=95.96.159.83&sparams=cp%2Cid%2Cip%2Cipbits%2Citag%2Cratebypass%2Csource%2Cupn%2Cexpire&cp=U0hWS1BRVF9MU0NONl9IS1hKOm1feE43cEhDeFZs&sver=3&signature=36C9035D814C99EC06B0791DD89C7A9FE005DB70.7497782C3084DF60B76C5E1292D468B3D714DFBC'
        # payload='{ "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "'${url}'" }}, "id": 1 }'
        #curl -v -d "$payload" -H "Content-type:application/json" -X POST "127.0.0.1:8080/jsonrpc"

        rpcurl   = 'http://%s/jsonrpc' % xbmc_url
        sys.stderr.write( "LOG: RPC URL " + str( rpcurl ) + "\n" )

        data     = '{ "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "%s" }}, "id": 1 }' % url
        sys.stderr.write( "LOG: DATA    " + str( data ) + "\n" )

        headers  = {'Accept' : 'application/json', "Content-type" : 'application/json'}
        sys.stderr.write( "LOG: HEADERS " + str( headers ) + "\n" )

        req      = urllib2.Request(rpcurl, data, headers = headers)
        sys.stderr.write( "LOG: REQ     " + str( req ) + "\n" )

	try:
	        response = urllib2.urlopen(req, None, REQ_TIMEOUT)
        	sys.stderr.write( "LOG: RESPONSE" + str( response ) + "\n" )
	except socket.timeout:
        	sys.stderr.write( "LOG: RPC TIMED OUT\n" )
		return False

        the_page = response.read()
        sys.stderr.write( "LOG: PAGE    " + str( the_page ) + "\n" )

        resp     = json.loads( the_page )
        sys.stderr.write( "LOG: RESP    " + str( resp ) + "\n" )

        status   = resp['result']
        sys.stderr.write( "LOG: STATUS  " + str( status ) + "\n" )

        if status == 'OK':
                return True
        else:
                return False

