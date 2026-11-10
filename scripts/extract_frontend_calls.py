#!/usr/bin/env python3
import os
import re
import json

src_dir = 'src'
api_calls = []
ws_calls = []

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.ts') or f.endswith('.tsx'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                content = fl.read()
                
                # Check apiClient
                for m in re.finditer(r'apiClient\.(get|post|put|patch|delete)\s*(?:<([^>]+)>)?\s*\(\s*([`\'\"][^`\'\"]+[`\'\"])', content):
                    method = m.group(1).upper()
                    ts_type = m.group(2) or 'any'
                    raw_url = m.group(3).strip('`\'\"')
                    api_calls.append({
                        'file': p,
                        'client': 'apiClient',
                        'method': method,
                        'url': raw_url,
                        'expected_type': ts_type.strip(),
                        'auth': 'Bearer civora_token/genesis_token'
                    })
                    
                # Check fetch
                for m in re.finditer(r'fetch\s*\(\s*([`\'\"][^`\'\"]+[`\'\"])', content):
                    raw_url = m.group(1).strip('`\'\"')
                    method = 'GET'
                    start = m.end()
                    chunk = content[start:start+250]
                    mm = re.search(r'method:\s*[\'\"]([A-Za-z]+)[\'\"]', chunk)
                    if mm:
                        method = mm.group(1).upper()
                    api_calls.append({
                        'file': p,
                        'client': 'fetch',
                        'method': method,
                        'url': raw_url,
                        'expected_type': 'any',
                        'auth': 'Bearer token if specified'
                    })
                    
                # Check WebSocket
                for m in re.finditer(r'new WebSocket\s*\(\s*([^)]+)\)', content):
                    ws_calls.append({
                        'file': p,
                        'url_expression': m.group(1).strip()
                    })

os.makedirs('docs/contract', exist_ok=True)
with open('docs/contract/frontend_calls.json', 'w') as out:
    json.dump({'api_calls': api_calls, 'websocket_calls': ws_calls}, out, indent=2)

print(f'Extracted {len(api_calls)} frontend API calls and {len(ws_calls)} WebSocket connections!')

