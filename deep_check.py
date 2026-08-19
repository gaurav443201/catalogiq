import urllib.request, re

base = 'https://main.d3fo8eux1sdcow.amplifyapp.com'

# Check index.html
html = urllib.request.urlopen(base).read().decode()
print('=== index.html content ===')
print(html[:500])

# Find all JS references
js_files = re.findall(r'(/assets/[^\s"\'<>]+\.js)', html)
print('\nJS files found:', js_files)

# Check if new bundle is accessible
for name in ['index-D4Mc2R2w.js', 'index-Cx0EXxeN.js']:
    try:
        r = urllib.request.urlopen(f'{base}/assets/{name}', timeout=5)
        print(f'{name}: EXISTS ({r.status})')
    except urllib.error.HTTPError as e:
        print(f'{name}: {e.code}')
    except Exception as ex:
        print(f'{name}: Error - {ex}')
