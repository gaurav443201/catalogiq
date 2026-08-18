# AWS Elastic Beanstalk looks for 'application' as the WSGI callable.
# We import our FastAPI app here so EB can find it.
from main import app as application
