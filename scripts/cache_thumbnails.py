#!/usr/bin/env python3
"""Save imported Squarespace thumbnails locally before ending Squarespace hosting.
This script REQUIRES internet access; run on your own computer, not on a restricted preview environment.
Creates assets/thumbnails and updates data/projects.json (retains old URL in original_thumbnail_image_url).
No 3rd-party modules required.
"""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlparse
import json, re, subprocess, sys, time
root=Path(__file__).resolve().parent.parent
file=root/'data'/'projects.json'
projects=json.loads(file.read_text(encoding='utf-8'))
dest=root/'assets'/'thumbnails';dest.mkdir(parents=True,exist_ok=True)
failures=[]
for project in projects:
    url=project.get('original_thumbnail_image_url') or project.get('thumbnail_image_url') or ''
    if not url.startswith('https://images.squarespace-cdn.com/'):
        print('Skipping non-Squarespace URL:',project.get('title'));continue
    slug=re.sub(r'[^a-z0-9]+','-',project['title'].lower()).strip('-')
    ext=Path(urlparse(url).path).suffix.lower()
    if ext not in ('.png','.jpg','.jpeg','.webp'): ext='.jpg'
    target=dest/(slug+ext)
    try:
        request=Request(url,headers={'User-Agent':'Mozilla/5.0 (portfolio owner migration)'})
        with urlopen(request,timeout=25) as resp:
            content=resp.read(9_000_000)
            if not resp.headers.get('Content-Type','').lower().startswith('image/'):
                raise ValueError('URL did not return an image')
        target.write_bytes(content)
        project['original_thumbnail_image_url']=url
        project['thumbnail_image_url']='./assets/thumbnails/'+target.name
        print('Saved:',project['title'],len(content),'bytes')
    except Exception as exc:
        print('FAILED:',project['title'],exc)
        failures.append(project['title'])
file.write_text(json.dumps(projects,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
subprocess.run([sys.executable,str(root/'scripts'/'build_catalog.py')],check=True)
print(f'Done. {len(projects)-len(failures)} saved, {len(failures)} failed. Review ALL thumbnails in your browser before cancelling Squarespace.')
if failures: sys.exit(1)
