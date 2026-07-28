import urllib.request, re
css=urllib.request.urlopen('https://www.georgjensen.com/on/demandware.static/Sites-GeorgJensen_DK-Site/-/da_DK/v1785215346453/css/style.css').read().decode('utf-8')
urls=re.findall(r'url\(\"([^"]+\.woff2)\"\)', css)
print('Found', len(urls), 'urls')
for u in urls:
  try:
    size=len(urllib.request.urlopen(u).read())
    print(u, size)
  except: pass
