#!/usr/bin/python
import os, sys
from pprint import pprint

sys.path.insert(0, '.')

from pytube import YouTube

sys.stderr.write( 'ok' )

yt = YouTube()

# Set the video URL.
yt.url = "http://www.youtube.com/watch?v=Ik-RsDGPI5Y"
yt.url = sys.argv[1]

pprint(yt.videos)

print yt.filename

yt.filename = 'Dancing Scene from Pulp Fiction'

pprint(yt.filter('flv'))
pprint(yt.filter('mp4'))

print yt.filter('mp4')[-1]

video = yt.get('mp4', '720p')

video.download('/tmp/', fhd=sys.stdout)
