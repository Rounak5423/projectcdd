import os
import struct
import json

def parse_glb_header(file_path):
    with open(file_path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            return None
        version, length = struct.unpack('<II', f.read(8))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        if chunk_type != 0x4E4F534A: # 'JSON'
            return None
        json_data = f.read(chunk_length)
        return json.loads(json_data.decode('utf-8'))

def audit_models():
    models_dir = 'public/models/council'
    report = []
    for f in os.listdir(models_dir):
        if not f.endswith('.glb'):
            continue
        fp = os.path.join(models_dir, f)
        sz_mb = os.path.getsize(fp) / (1024 * 1024)
        gltf = parse_glb_header(fp)
        if not gltf:
            report.append({'name': f, 'size_mb': sz_mb, 'error': 'Not valid GLB'})
            continue
        
        meshes = gltf.get('meshes', [])
        materials = gltf.get('materials', [])
        textures = gltf.get('textures', [])
        images = gltf.get('images', [])
        animations = gltf.get('animations', [])
        nodes = gltf.get('nodes', [])
        skins = gltf.get('skins', [])
        extensions_used = gltf.get('extensionsUsed', [])
        extensions_required = gltf.get('extensionsRequired', [])
        
        # Count primitives & approximate triangles
        total_primitives = sum(len(m.get('primitives', [])) for m in meshes)
        accessors = gltf.get('accessors', [])
        total_indices = 0
        for m in meshes:
            for prim in m.get('primitives', []):
                idx = prim.get('indices')
                if idx is not None and idx < len(accessors):
                    total_indices += accessors[idx].get('count', 0)
        est_triangles = total_indices // 3
        
        report.append({
            'name': f,
            'size_mb': round(sz_mb, 2),
            'mesh_count': len(meshes),
            'primitive_count': total_primitives,
            'estimated_triangles': est_triangles,
            'materials_count': len(materials),
            'textures_count': len(textures),
            'images_count': len(images),
            'animations_count': len(animations),
            'animation_names': [a.get('name', f'anim_{i}') for i, a in enumerate(animations)],
            'skins_count': len(skins),
            'nodes_count': len(nodes),
            'extensions_used': extensions_used,
            'extensions_required': extensions_required
        })
    
    print(json.dumps(report, indent=2))
    return report

if __name__ == '__main__':
    print("=== ORIGINAL MODELS ===")
    audit_models()
    print("\n=== OPTIMIZED MODELS ===")
    models_dir = 'public/models/council/optimized'
    for f in os.listdir(models_dir):
        if f.endswith('.glb'):
            sz = os.path.getsize(os.path.join(models_dir, f)) / (1024*1024)
            print(f"{f}: {sz:.2f} MB")
