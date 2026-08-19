import urllib.request, re

try:
    html = urllib.request.urlopen('https://main.d3fo8eux1sdcow.amplifyapp.com').read().decode()
    js_files = re.findall(r'src="(/assets/[^"]+\.js)"', html)
    print('Current JS file on Amplify:', js_files)
    for js in js_files:
        content = urllib.request.urlopen('https://main.d3fo8eux1sdcow.amplifyapp.com' + js).read().decode()
        has_cf = 'd26lomwkk2xl9h.cloudfront.net' in content
        print('Has CloudFront URL in live JS:', has_cf)
        if has_cf:
            print('SUCCESS - New build is LIVE!')
        else:
            print('Still serving OLD build')
except Exception as e:
    print('Error:', e)
