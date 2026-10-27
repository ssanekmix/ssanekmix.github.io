"""Fetch the exact public Neo/default media requested for this personal site."""
import hashlib
import json
import struct
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'academy/static/media'
ORIGIN = 'https://images.chesscomfiles.com/chess-themes/'
FILES = {f'neo/{color}{piece}.png': f'pieces/neo/150/{color}{piece}.png'
         for color in 'wb' for piece in 'kqrbnp'}
FILES.update({f'sounds/{name}.mp3': f'sounds/_MP3_/default/{name}.mp3'
              for name in ['move-self', 'move-opponent', 'capture', 'move-check', 'castle', 'promote', 'game-end']})

def main():
    records = {}
    for local, remote in FILES.items():
        url = ORIGIN + remote
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.chess.com/'})
        with urllib.request.urlopen(request, timeout=45) as response:
            data = response.read(2_000_001)
        if not 100 < len(data) < 2_000_000:
            raise ValueError(f'Invalid asset size: {local}')
        if local.endswith('.png'):
            if data[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', data[16:24]) != (150, 150):
                raise ValueError(f'Expected 150px transparent PNG: {local}')
        elif not (data.startswith(b'ID3') or (data[0] == 255 and data[1] & 224 == 224)):
            raise ValueError(f'Expected MP3: {local}')
        dest = ROOT / local
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        records[local] = {'url': url, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        print(f'{local}: {len(data)} bytes')
    (ROOT / 'manifest.json').write_text(json.dumps(records, indent=2) + '\n')

if __name__ == '__main__':
    main()
