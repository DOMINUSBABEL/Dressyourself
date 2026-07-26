import sys
import os

# Set up python path for cPanel Phusion Passenger / WSGI
sys.path.insert(0, os.path.dirname(__file__))

from app import app as application
