import os
import struct
import json
import io
from PIL import Image

def optimize_glb_file(input_path, output_path, max_texture_dim=1024, jpeg_quality=85):
    print(f"\nProcessing {os.path.basename(input_path)}...")
    in_size = os.path.getsize(input_path) / (1024 * 1024)

    with open(input_path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a glTF binary")
            return
        version, total_len = struct.unpack('<II', f.read(8))
        json_len, json_type = struct.unpack('<II', f.read(8))
        json_raw = f.read(json_len)
        gltf = json.loads(json_raw.decode('utf-8'))

        bin_len, bin_type = struct.unpack('<II', f.read(8))
        bin_data = bytearray(f.read(bin_len))

    images = gltf.get('images', [])
    buffer_views = gltf.get('bufferViews', [])

    if not images or not buffer_views:
        print("No images to optimize.")
        # Just copy if nothing to optimize
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as out_f:
            with open(input_path, 'rb') as in_f:
                out_f.write(in_f.read())
        return

    # To rebuild cleanly, we create a new binary buffer and update bufferView byte offsets
    # We sort bufferViews by byteOffset so we can slice and rebuild
    # Better approach: rebuild all bufferViews into a new binary buffer!
    new_bin = bytearray()
    new_buffer_views = []

    # Map old bufferView index to new bufferView dict
    for bv_idx, bv in enumerate(buffer_views):
        old_offset = bv.get('byteOffset', 0)
        old_length = bv['byteLength']
        chunk = bin_data[old_offset:old_offset + old_length]

        # Check if this bufferView is used by any image
        img_using = [img for img in images if img.get('bufferView') == bv_idx]

        if img_using:
            img_meta = img_using[0]
            try:
                im = Image.open(io.BytesIO(chunk))
                orig_format = im.format
                has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)

                # Resize if exceeding max_texture_dim
                w, h = im.size
                if max(w, h) > max_texture_dim:
                    scale = max_texture_dim / max(w, h)
                    new_w = max(1, int(w * scale))
                    new_h = max(1, int(h * scale))
                    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

                out_buf = io.BytesIO()
                if has_alpha:
                    # Save as optimized PNG with max compression
                    im.save(out_buf, format='PNG', optimize=True, compress_level=9)
                    img_meta['mimeType'] = 'image/png'
                else:
                    # Save as high-quality JPEG
                    if im.mode != 'RGB':
                        im = im.convert('RGB')
                    im.save(out_buf, format='JPEG', quality=jpeg_quality, optimize=True)
                    img_meta['mimeType'] = 'image/jpeg'

                chunk = out_buf.getvalue()
            except Exception as e:
                # If image processing fails, keep original chunk
                pass

        # 4-byte align the buffer offset
        while len(new_bin) % 4 != 0:
            new_bin.append(0)

        new_bv = dict(bv)
        new_bv['byteOffset'] = len(new_bin)
        new_bv['byteLength'] = len(chunk)
        new_buffer_views.append(new_bv)
        new_bin.extend(chunk)

    gltf['bufferViews'] = new_buffer_views
    if 'buffers' in gltf and len(gltf['buffers']) > 0:
        gltf['buffers'][0]['byteLength'] = len(new_bin)

    # Encode JSON chunk (4-byte aligned with spaces 0x20)
    json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    while len(json_bytes) % 4 != 0:
        json_bytes += b' '

    # 4-byte align binary chunk with zeroes
    while len(new_bin) % 4 != 0:
        new_bin.append(0)

    # Write new GLB
    total_file_len = 12 + 8 + len(json_bytes) + 8 + len(new_bin)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as out_f:
        # Header
        out_f.write(b'glTF')
        out_f.write(struct.pack('<II', 2, total_file_len))
        # JSON chunk
        out_f.write(struct.pack('<II', len(json_bytes), 0x4E4F534A))
        out_f.write(json_bytes)
        # BIN chunk
        out_f.write(struct.pack('<II', len(new_bin), 0x004E4942))
        out_f.write(new_bin)

    out_size = os.path.getsize(output_path) / (1024 * 1024)
    reduction = ((in_size - out_size) / in_size) * 100
    print(f"  Result: {in_size:.2f} MB -> {out_size:.2f} MB ({reduction:.1f}% reduction)")

if __name__ == '__main__':
    src_dir = 'public/models/council'
    dst_dir = 'public/models/council/optimized'
    
    models = [
        'real_carl_manfred.glb',
        'real_fullbody_male.glb',
        'real_freefire_pace.glb',
        'real_undead_wizard.glb',
        'adv_architect.glb',
        'adv_chancellor.glb',
        'adv_keeper.glb',
        'adv_physician.glb',
        'adv_scholar.glb',
        'adv_treasurer.glb',
    ]
    
    for m in models:
        src = os.path.join(src_dir, m)
        dst = os.path.join(dst_dir, m)
        if os.path.exists(src):
            optimize_glb_file(src, dst)
