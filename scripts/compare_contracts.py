#!/usr/bin/env python3
import json
import re

with open('docs/contract/backend_contract.json', 'r') as f:
    backend_contract = json.load(f)

with open('docs/contract/frontend_calls.json', 'r') as f:
    frontend_calls = json.load(f)

backend_paths = backend_contract.get('openapi', {}).get('paths', {})
# Build normalized backend routes: e.g. /api/v1/... or /...
backend_routes = {}
for path, methods in backend_paths.items():
    for m, details in methods.items():
        if m.lower() in ['get', 'post', 'put', 'patch', 'delete']:
            norm_path = re.sub(r'\{[^}]+\}', '{param}', path)
            backend_routes[(m.upper(), norm_path)] = {
                'original_path': path,
                'operation_id': details.get('operationId', ''),
                'summary': details.get('summary', ''),
                'security': details.get('security', [])
            }

audit_rows = []
matched_routes = set()

for call in frontend_calls['api_calls']:
    method = call['method']
    raw_url = call['url']
    file_src = call['file']
    
    # Normalize URL: strip base path if present
    clean_url = raw_url
    if clean_url.startswith('/api/v1'):
        clean_url = clean_url[7:]
    elif clean_url.startswith('${baseUrl}'):
        clean_url = '/auth' + clean_url[10:]
    elif clean_url.startswith('http'):
        parts = clean_url.split('/api/v1')
        if len(parts) > 1:
            clean_url = parts[1]
            
    # Normalize parameters like ${civId} or ${worldId} -> {param}
    norm_url = re.sub(r'\$\{[^}]+\}', '{param}', clean_url)
    if not norm_url.startswith('/'):
        norm_url = '/' + norm_url
        
    # Check if (method, norm_url) exists in backend
    # Try exact match or with /api/v1 prefix
    found = False
    matched_backend_route = None
    for (bm, bp), details in backend_routes.items():
        # bp could be /api/v1/worlds/{param} or /worlds/{param}
        bp_clean = bp[7:] if bp.startswith('/api/v1') else bp
        if bm == method and (bp == norm_url or bp_clean == norm_url or ('/api/v1' + norm_url) == bp):
            found = True
            matched_backend_route = bp
            matched_routes.add((bm, bp))
            break
            
    if found:
        # Check casing / contract details
        audit_rows.append({
            'frontend_call': f"{method} {raw_url} ({file_src})",
            'backend_route': matched_backend_route,
            'mismatch_type': 'None (Contract Matched)',
            'evidence': f"Route matches backend {matched_backend_route}",
            'fix': 'Integrate with typed API client and runtime Zod validation'
        })
    else:
        # Check if route exists under different method
        method_mismatch = False
        alt_methods = []
        for (bm, bp), details in backend_routes.items():
            bp_clean = bp[7:] if bp.startswith('/api/v1') else bp
            if bp == norm_url or bp_clean == norm_url:
                alt_methods.append(bm)
        if alt_methods:
            audit_rows.append({
                'frontend_call': f"{method} {raw_url} ({file_src})",
                'backend_route': f"{','.join(alt_methods)} {norm_url}",
                'mismatch_type': 'HTTP Method Mismatch',
                'evidence': f"Frontend uses {method}, backend expects {alt_methods}",
                'fix': f"Align frontend to use {alt_methods[0]}"
            })
        else:
            # Check if route exists with different naming
            audit_rows.append({
                'frontend_call': f"{method} {raw_url} ({file_src})",
                'backend_route': 'NONE',
                'mismatch_type': 'Missing Backend Route or URL Drift',
                'evidence': f"No route matching {norm_url} in backend OpenAPI schema",
                'fix': 'Add additive alias route in backend or route through generated typed client'
            })

# WebSocket audit
ws_audit = []
ws_audit.append({
    'component': 'CivoraEventClient.ts',
    'url': '/ws/world/{world_id}',
    'status': 'Active',
    'features': 'Exponential backoff, token auth query param, heartbeat, auto-resync',
    'needs': 'Connection status UI indicator & TS discriminated union payload typing'
})
ws_audit.append({
    'component': 'worldStore.ts',
    'url': '/ws/world/{world_id}',
    'status': 'Duplicate WebSocket implementation',
    'features': 'Ad-hoc reconnect with fixed timeout',
    'needs': 'Unify into central CivoraEventClient single source of truth'
})

# Generate markdown report
md = ['# Frontend <-> Backend Connection & Contract Audit', '']
md.append('Generated automatically by `scripts/compare_contracts.py`.')
md.append(f"- **Total Backend Routes in OpenAPI:** {len(backend_routes)}")
md.append(f"- **Total Frontend Calls Extracted:** {len(frontend_calls['api_calls'])}")
md.append(f"- **Contract Matched Routes:** {len([r for r in audit_rows if r['mismatch_type'] == 'None (Contract Matched)'])}")
md.append(f"- **Mismatches / Unmatched Calls:** {len([r for r in audit_rows if r['mismatch_type'] != 'None (Contract Matched)'])}")
md.append('')
md.append('## 1. API Call Audit Matrix')
md.append('')
md.append('| Frontend Call | Backend Route | Mismatch Type | Evidence | Fix |')
md.append('|---|---|---|---|---|')

for row in audit_rows:
    fc = row['frontend_call'].replace('|', '\\|')
    br = row['backend_route'].replace('|', '\\|')
    mt = row['mismatch_type'].replace('|', '\\|')
    ev = row['evidence'].replace('|', '\\|')
    fx = row['fix'].replace('|', '\\|')
    md.append(f"| `{fc}` | `{br}` | {mt} | {ev} | {fx} |")

md.append('')
md.append('## 2. WebSocket Connection Audit')
md.append('')
md.append('| Component | Endpoint | Status | Features | Planned Fix |')
md.append('|---|---|---|---|---|')
for w in ws_audit:
    md.append(f"| `{w['component']}` | `{w['url']}` | {w['status']} | {w['features']} | {w['needs']} |")

md.append('')
md.append('## 3. High-Priority Connection Findings')
md.append('')
md.append('1. **Duplicate WebSocket Implementations**: `CivoraEventClient.ts` and `worldStore.ts` both maintain separate WebSockets to `/ws/world/{id}`. They must be consolidated so all real-time events flow through `CivoraEventClient`.')
md.append('2. **Missing UI Connection Status Indicator**: While `CivoraEventClient` sets status in `performanceMonitor`, the top navigation bar lacks a persistent, styled connection status pill (Connected / Reconnecting / Offline).')
md.append('3. **Missing Typed Boundary Validation**: API responses are cast directly to interfaces without schema validation. Any schema drift silently produces undefined/NaN values.')
md.append('4. **Base URL Normalization**: Production runs on same origin `/api/v1` while dev runs on `http://127.0.0.1:8000/api/v1`. Unified API client standardizes this transparently.')

with open('docs/connection_audit.md', 'w') as f:
    f.write('\n'.join(md))

print('Saved docs/connection_audit.md successfully!')

