"""Real Chromium checks with isolated SQLite storage. Run with optional Playwright.
The server port 8765 must be free. No user databases are changed.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
import httpx
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]
PYTHON=ROOT/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
URL='http://127.0.0.1:8765'
PGN='[White "Sanekmix"]\n[Black "Opponent"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1'

def wait_server():
    deadline=time.monotonic()+20
    while time.monotonic()<deadline:
        try:
            if httpx.get(URL+'/api/health',timeout=1).status_code==200: return
        except httpx.HTTPError: pass
        time.sleep(.15)
    raise AssertionError('Server did not start')

def start(data,log):
    env=os.environ.copy();env['ACADEMY_DATA']=data
    proc=subprocess.Popen([str(PYTHON),'-m','uvicorn','academy.main:app','--host','127.0.0.1','--port','8765'],cwd=ROOT,env=env,stdout=log,stderr=log)
    wait_server();assert proc.poll() is None;return proc

def stop(proc):
    proc.terminate();proc.wait(timeout=15)

def main():
    try:
        httpx.get(URL+'/api/health',timeout=.5)
    except httpx.HTTPError: pass
    else: raise SystemExit('Port 8765 is in use; stop the existing academy first.')
    with tempfile.TemporaryDirectory() as data, tempfile.TemporaryFile() as log:
        proc=start(data,log)
        try:
            with sync_playwright() as p:
                binary=os.environ.get('ACADEMY_BROWSER') or shutil.which('chromium')
                kwargs={'headless':True}
                if binary: kwargs['executable_path']=binary
                browser=p.chromium.launch(**kwargs)
                page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(URL);expect(page.locator('#home-stats article')).to_have_count(3)
                page.get_by_role('button',name='Продолжить обучение →').click()
                page.locator('[data-square="e2"]').click();page.locator('[data-square="e4"]').click()
                expect(page.locator('#history')).to_contain_text('e5',timeout=15000)
                expect(page.locator('#explanation')).to_contain_text('Пешка с e2 идёт на e4')
                page.locator('[data-square="g1"]').click();page.locator('[data-square="f3"]').click()
                expect(page.locator('#history')).to_contain_text('Nc6',timeout=15000)
                page.locator('#back').click();expect(page.locator('#turn')).to_contain_text('чёрных')
                page.locator('#forward').click();expect(page.locator('#turn')).to_contain_text('белых')
                # A legal move outside the selected Italian line must remain playable.
                page.select_option('#mode','Свободное исследование')
                page.locator('[data-square="a2"]').click();page.locator('[data-square="a3"]').click()
                expect(page.locator('#history')).to_contain_text('a3')
                # Explicit API contract fixture: never a claim of live network success.
                page.route('**/api/explorer/masters',lambda route:route.fulfill(json={'data':{'white':10,'draws':5,'black':5,'moves':[{'uci':'a7a6','san':'a6','white':10,'draws':5,'black':5}]},'cached':True,'stale':False,'at':1,'sample_note':'Контрактная фикстура браузерного теста'}))
                page.locator('[data-pool="masters"]').click()
                expect(page.locator('#explorer-masters')).to_contain_text('100.0%')
                expect(page.locator('#explorer-masters')).to_contain_text('10 / 5 / 5')
                page.locator('.board-extras > summary').click()
                page.locator('#idea').click()
                expect(page.locator('#task')).to_contain_text('Идея предложенного хода',timeout=15000)
                # Persist a note, then restart the server and verify it below.
                page.locator('summary').filter(has_text='Позиция и личные заметки').click()
                page.locator('#note').fill('Мой тестовый план');page.locator('#save-note').click()
                expect(page.locator('#saved-notes')).to_contain_text('Мой тестовый план')
                # Training for Black begins with White's move and an appropriately flipped board.
                page.locator('nav [data-page="openings"]').click()
                page.locator('[data-course="caro"]').click()
                expect(page.locator('#history')).to_contain_text('e4')
                expect(page.locator('#play-color')).to_have_value('black')
                page.locator('[data-square="c7"]').click();page.locator('[data-square="c6"]').click()
                expect(page.locator('#history')).to_contain_text('d4',timeout=15000)
                # Completed PGN: real UCI job, graph, critical decision and generated exercises.
                page.locator('nav [data-page="games"]').click();page.locator('#pgn').fill(PGN)
                page.locator('#import-pgn').click();expect(page.locator('#game-title')).to_contain_text('Sanekmix')
                page.locator('#game-analyze').click()
                expect(page.locator('#game-errors')).to_contain_text('Грубый зевок',timeout=30000)
                assert page.locator('#game-errors .error-card').count()>0
                page.locator('nav [data-page="reviews"]').click()
                expect(page.locator('#exercise-list article').nth(3)).to_be_visible(timeout=10000)
                page.locator('#exercise-list [data-exercise]').first.click()
                # First seed is a verified mate; solve by interacting with the board.
                page.locator('[data-square="g6"]').click();page.locator('[data-square="g7"]').click()
                expect(page.locator('#turn')).to_contain_text('CHECKMATE',timeout=15000)
                page.locator('nav [data-page="progress"]').click()
                expect(page.locator('#progress-data')).to_contain_text('Ответов:')
                # Mobile layout and keyboard-accessible 64 square buttons.
                page.set_viewport_size({'width':390,'height':844})
                page.locator('nav [data-page="study"]').click()
                expect(page.locator('#board button')).to_have_count(64)
                assert page.locator('body').evaluate('(e)=>e.scrollWidth<=innerWidth')
                out=ROOT/'ui-artifacts';out.mkdir(exist_ok=True)
                page.screenshot(path=str(out/'mobile.png'),full_page=True)
                assert not errors,errors
                browser.close()
            stop(proc);proc=None
            # Real process restart must retain notes, games, attempts and review schedule.
            proc=start(data,log)
            assert len(httpx.get(URL+'/api/games').json())==1
            assert httpx.get(URL+'/api/notes').json()[0]['text']=='Мой тестовый план'
            assert httpx.get(URL+'/api/progress').json()['attempts']>=4
            assert any(e['repetitions']==1 for e in httpx.get(URL+'/api/exercises?due=false').json())
            print('PASS: browser moves, explanations, arbitrary branch, both colors, notes, PGN, UCI analysis, exercises, mobile layout and restart persistence; no JavaScript errors.')
        finally:
            if proc: stop(proc)

if __name__=='__main__': main()
