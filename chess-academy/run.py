"""One-command Windows/Linux launcher with persistent data and verified setup."""
import argparse
import hashlib
import os
import subprocess
import sys
import threading
import time
import urllib.request
import venv
import webbrowser
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def main():
    if sys.version_info<(3,12): raise SystemExit('Установите Python 3.12 или новее с python.org и включите Add Python to PATH.')
    os.chdir(ROOT)
    parser=argparse.ArgumentParser();parser.add_argument('--no-browser',action='store_true');parser.add_argument('--offline',action='store_true');args=parser.parse_args()
    interpreter=ROOT/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
    if not interpreter.exists():
        if args.offline: raise SystemExit('Для первой установки необходим интернет. Запустите без --offline.')
        venv.EnvBuilder(with_pip=True).create(ROOT/'.venv')
    lock_hash=hashlib.sha256((ROOT/'requirements.lock').read_bytes()).hexdigest()
    stamp=ROOT/'.venv'/'academy-installed'
    if not stamp.exists() or stamp.read_text()!=lock_hash:
        if args.offline: raise SystemExit('Зависимости ещё не установлены. Первый запуск требует интернет.')
        subprocess.run([str(interpreter),'-m','pip','install','-r','requirements.lock'],check=True)
        stamp.write_text(lock_hash)
    # Child inherits env and runs in the venv; setup refreshes data without resetting it.
    command=[str(interpreter),'setup_local.py']
    if args.offline: command.append('--offline')
    subprocess.run(command,check=True)
    url='http://127.0.0.1:8765'
    try:
        with urllib.request.urlopen(url+'/api/health',timeout=1) as r:
            if r.status==200:
                print('Академия уже запущена:',url)
                if not args.no_browser: webbrowser.open(url)
                return
    except OSError: pass
    if not args.no_browser:
        def open_when_ready():
            for _ in range(100):
                try:
                    with urllib.request.urlopen(url+'/api/health',timeout=.5) as r:
                        if r.status==200: webbrowser.open(url);return
                except OSError: time.sleep(.2)
        threading.Thread(target=open_when_ready,daemon=True).start()
    print('Академия:',url,'· для остановки нажмите Ctrl+C',flush=True)
    subprocess.run([str(interpreter),'-m','uvicorn','academy.main:app','--host','127.0.0.1','--port','8765'],check=True)

if __name__=='__main__':
    try: main()
    except KeyboardInterrupt: pass
    except subprocess.CalledProcessError as exc: raise SystemExit(exc.returncode)
