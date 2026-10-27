#!/usr/bin/env python3
"""Rebuild the standalone JavaScript catalog from data/projects.json (no dependencies)."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=root/'data'/'projects.json'
projects=json.loads(p.read_text(encoding='utf-8'))
(root/'data'/'projects.js').write_text('window.MAX_PROJECTS = '+json.dumps(projects,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print(f'Built {len(projects)} projects in data/projects.js')
