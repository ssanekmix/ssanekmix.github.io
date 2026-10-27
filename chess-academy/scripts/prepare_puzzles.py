"""Extract a small validated CC0 offline sample, stopping the upstream stream early.
Never downloads the complete 300+ MB database. Runtime requests one new puzzle
per user action through the official public API, rather than enumerating it.
"""
import csv,io,json,hashlib
from pathlib import Path
import chess,httpx,zstandard
ROOT=Path(__file__).resolve().parents[1]
URL='https://database.lichess.org/lichess_db_puzzle.csv.zst'
class Stream(io.RawIOBase):
    def __init__(self,chunks): self.chunks=iter(chunks);self.buffer=b'';self.count=0
    def readable(self):return True
    def readinto(self,out):
        if not self.buffer:
            try:self.buffer=next(self.chunks);self.count+=len(self.buffer)
            except StopIteration:return 0
            if self.count>8_000_000:raise RuntimeError('Sample compressed byte budget exceeded')
        n=min(len(out),len(self.buffer));out[:n]=self.buffer[:n];self.buffer=self.buffer[n:];return n

def main():
    target=ROOT/'web/puzzles';target.mkdir(exist_ok=True);puzzles=[]
    with httpx.stream('GET',URL,timeout=60,follow_redirects=True) as response:
        response.raise_for_status();stream=Stream(response.iter_bytes(chunk_size=65536))
        with zstandard.ZstdDecompressor().stream_reader(stream) as decompressed:
            reader=csv.DictReader(io.TextIOWrapper(decompressed,encoding='utf-8'))
            for row in reader:
                if int(row['Popularity'])<60 or int(row['NbPlays'])<50:continue
                b=chess.Board(row['FEN']);moves=row['Moves'].split()
                if not b.is_valid() or len(moves)<2:continue
                try:
                    b.push_uci(moves[0]);start=b.fen()
                    for move in moves[1:]:b.push_uci(move)
                except ValueError:continue
                puzzles.append({'id':row['PuzzleId'],'fen':start,'line':moves[1:],'rating':int(row['Rating']),'themes':row['Themes'].split(),'gameUrl':row['GameUrl'],'source':'Lichess CC0'})
                if len(puzzles)>=4096:break
        transferred=stream.count
    packs=[]
    # Mix all ratings in each small pack so the client can filter without loading all.
    for i in range(8):
        rows=puzzles[i::8];name=f'offline-{i+1}.json';raw=json.dumps(rows,separators=(',',':')).encode();(target/name).write_bytes(raw)
        packs.append({'file':name,'count':len(rows),'sha256':hashlib.sha256(raw).hexdigest()})
    manifest={'version':1,'source':URL,'license':'CC0-1.0','prepared':'2026-10-27','count':len(puzzles),'compressed_bytes_read':transferred,'packs':packs}
    (target/'manifest.json').write_text(json.dumps(manifest,indent=2));print('Validated offline puzzles:',len(puzzles),'compressed bytes read:',transferred)
if __name__=='__main__':main()
