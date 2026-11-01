"""Baut PartyMap als einzelne HTML-Datei (eingebaute Karte, alles inline).

Aufruf:  npx vite build --mode artifact && python3 scripts/build-artifact.py <ziel.html>
"""
import base64
import glob
import sys

out = sys.argv[1] if len(sys.argv) > 1 else 'partymap.html'
css = open(glob.glob('dist/assets/*.css')[0], encoding='utf-8').read()
js = open(glob.glob('dist/assets/*.js')[0], encoding='utf-8').read()
icon = 'data:image/svg+xml;base64,' + base64.b64encode(open('public/icon.svg', 'rb').read()).decode()
js = js.replace('"./icon.svg"', '"' + icon + '"')
assert '</script' not in js.lower()

html = f"""<title>PartyMap</title>
<meta name="theme-color" content="#0b0b14">
<link rel="icon" href="{icon}">
<style>
{css}
</style>
<div id="root"></div>
<script type="module">
{js}
</script>
"""
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html.encode()) // 1024, 'KB')
