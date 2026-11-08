import os
import struct
import json
import io
from PIL import Image

def analyze_glb_images(glb_path):
    print(f"\n--- Analyzing Images in {os.path.basename(glb_path)} ---")
    with open(glb_path, 'rb') as f:
        magic = f.read(4)
        version, length = struct.unpack('<II', f.read(8))
        json_len, json_type = struct.unpack('<II', f.read(8))
        json_data = json.loads(f.read(json_len).decode('utf-8'))
        
        # Read binary chunk
        bin_len, bin_type = struct.unpack('<II', f.read(8))
        bin_data = f.read(bin_len)
        
        images = json_data.get('images', [])
        buffer_views = json_data.get('bufferViews', [])
        
        total_img_bytes = 0
        for i, img in enumerate(images):
            bv_idx = img.get('bufferView')
            if bv_idx is not None:
                bv = buffer_views[bv_idx]
                byte_offset = bv.get('byteOffset', 0)
                byte_length = bv['byteLength']
                img_bytes = bin_data[byte_offset:byte_offset + byte_length]
                total_img_bytes += byte_length
                try:
                    im = Image.open(io.BytesIO(img_bytes))
                    print(f"  Image #{i} ({img.get('name', 'unnamed')}): {im.format} {im.size[0]}x{im.size[1]} ({byte_length/1024:.1f} KB)")
                except Exception as e:
                    print(f"  Image #{i}: Error opening: {e}")
            elif 'uri' in img:
                print(f"  Image #{i}: URI reference: {img['uri']}")
        print(f"Total Embedded Image Payload: {total_img_bytes / (1024*1024):.2f} MB")

for model in ['real_carl_manfred.glb', 'real_fullbody_male.glb', 'real_freefire_pace.glb', 'real_undead_wizard.glb']:
    analyze_glb_images(os.path.join('public/models/council', model))

