"""GitHub Pages acceptance: serve only static files, no Python application/API.
Run with system Python containing Playwright, or the optional UI venv.
"""
import functools
import http.server
import json
import os
import shutil
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[2]
PGN='[White "Sanekmix"]\n[Black "Opponent"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1'

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass


def main():
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/chess-academy/'
    try:
        with sync_playwright() as p:
            binary=os.environ.get('ACADEMY_BROWSER') or shutil.which('chromium')
            browser=p.chromium.launch(headless=True,**({'executable_path':binary} if binary else {}))
            context=browser.new_context(viewport={'width':1440,'height':1000})
            page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(base);expect(page.locator('#home-stats article')).to_have_count(3,timeout=15000)
            assert page.locator('#health').inner_text().startswith('● В браузере')
            # Browser rules use actual chess.js, not the server or mocked endpoints.
            result=page.evaluate('''async()=>{
              const api=window.academyAPI;
              const p=await api('/position',{});if(p.legal.length!==20)throw Error('initial legal moves');
              for(const fen of ['garbage','8/8/8/8/8/8/8/8 w - - 0 1','8/8/8/8/8/8/4k3/4K3 w - - 0 1']){let rejected=false;try{await api('/position',{fen})}catch{rejected=true}if(!rejected)throw Error('invalid fen accepted')}
              const castle=await api('/move',{fen:'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',uci:'e1g1'});if(castle.position.pieces.f1!=='R')throw Error('castling');
              const ep=await api('/move',{moves:['e2e4','a7a6','e4e5','d7d5'],uci:'e5d6'});if(ep.position.pieces.d5||ep.position.pieces.d6!=='P')throw Error('ep');
              const promo=await api('/move',{fen:'7k/P7/8/8/8/8/8/4K3 w - - 0 1',uci:'a7a8n'});if(promo.position.pieces.a8!=='N')throw Error('promotion');
              const rep=await api('/position',{moves:['g1f3','g8f6','f3g1','f6g8','g1f3','g8f6','f3g1','f6g8']});if(rep.terminal!=='THREEFOLD_REPETITION')throw Error('repetition');
              const a=await api('/position',{moves:['g1f3','g8f6','d2d4','d7d5']}),b=await api('/position',{moves:['d2d4','d7d5','g1f3','g8f6']});if(a.key!==b.key)throw Error('transposition');
              return 'rules passed';
            }''');print(result)
            page.get_by_role('button',name='Продолжить обучение →').click()
            page.locator('[data-square="e2"]').click();page.locator('[data-square="e4"]').click()
            expect(page.locator('#history')).to_contain_text('e5',timeout=30000)
            expect(page.locator('#explanation')).to_contain_text('Пешка с e2 идёт на e4')
            page.locator('[data-square="g1"]').click();page.locator('[data-square="f3"]').click()
            expect(page.locator('#history')).to_contain_text('Nc6',timeout=15000)
            page.locator('#back').click();expect(page.locator('#turn')).to_contain_text('чёрных')
            page.locator('#forward').click();page.select_option('#mode','Свободное исследование')
            page.locator('[data-square="a2"]').click();page.locator('[data-square="a3"]').click()
            expect(page.locator('#history')).to_contain_text('a3')
            page.locator('summary').filter(has_text='Позиция и личные заметки').click()
            page.locator('#note').fill('Мой браузерный план');page.locator('#save-note').click()
            expect(page.locator('#saved-notes')).to_contain_text('Мой браузерный план')
            page.locator('nav [data-page="openings"]').click();page.locator('[data-course="caro"]').click()
            expect(page.locator('#history')).to_contain_text('e4');expect(page.locator('#play-color')).to_have_value('black')
            page.locator('[data-square="c7"]').click();page.locator('[data-square="c6"]').click()
            expect(page.locator('#history')).to_contain_text('d4',timeout=15000)
            # No setup, server endpoint, cross-origin isolation or external engine.
            page.locator('nav [data-page="games"]').click();page.locator('#pgn').fill(PGN);page.locator('#import-pgn').click()
            expect(page.locator('#game-title')).to_contain_text('Sanekmix')
            page.locator('#game-analyze').click()
            expect(page.locator('#game-errors')).to_contain_text('Грубый зевок',timeout=30000)
            page.locator('nav [data-page="reviews"]').click()
            expect(page.locator('#exercise-list article').nth(10)).to_be_visible(timeout=10000)
            page.locator('#exercise-list [data-exercise]').first.click()
            page.locator('[data-square="g6"]').click();page.locator('[data-square="g7"]').click()
            expect(page.locator('#turn')).to_contain_text('CHECKMATE',timeout=15000)
            # Verify all shipped puzzle solutions with the actual WASM engine.
            print(page.evaluate('''async()=>{
              const api=window.academyAPI;
              const finish=async(id)=>{for(let i=0;i<300;i++){const j=await api('/jobs/'+id);if(j.status==='done')return j.result;if(j.status==='failed')throw Error(j.error);await new Promise(r=>setTimeout(r,50))}throw Error('timeout')};
              const tasks=(await api('/exercises?due=false')).filter(e=>!e.game_id);
              for(const e of tasks){const j=await api('/analyze',{fen:e.fen,uci:e.solution,seconds:.2,depth:18,multipv:3});const r=await finish(j.job_id);if(!r.verdict.accepted)throw Error('Bad shipped solution: '+e.source)}
              return '10 puzzle solutions verified by Stockfish WASM';
            }'''))
            # Strict PGN and data integrity: rejection never mutates stored records.
            print(page.evaluate('''async()=>{
              const api=window.academyAPI;
              for(const text of ['[Result "1-0"]\\n\\n1. e4 blah e5 1-0','[Result "1-0"]\\n\\n1. e4 e5 *','[Result "1-0"]\\n\\n1. e4 e5']){let rejected=false;try{await api('/games/import',{text})}catch{rejected=true}if(!rejected)throw Error('unfinished or corrupt PGN accepted')}
              const backup=await api('/export'),bad=structuredClone(backup);bad.state.exercises[0].solution='e2e5';let rejected=false;try{await api('/restore',bad)}catch{rejected=true}if(!rejected)throw Error('corrupt restore accepted');
              await api('/preferences',{rating:800,username:'Sanekmix'});await api('/restore',backup);if((await api('/preferences')).rating!==355)throw Error('restore failed');
              const previous=await api('/export-previous');if(previous.state.preferences.rating!==800)throw Error('pre-restore backup missing');
              const a=await api('/repertoire',{name:'Мой вариант',color:'white',pgn:'1. Nf3 Nf6 2. d4 d5 *'}),b=await api('/repertoire',{name:'Мой вариант',color:'white',pgn:'1. d4 d5 2. Nf3 Nf6 *'});if(a.id!==b.id||(await api('/openings/'+a.id)).variations.length!==2)throw Error('repertoire');
              const j=await api('/analyze',{fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',seconds:5,depth:40});await api('/jobs/'+j.job_id+'/cancel',{});for(let i=0;i<100;i++){const r=await api('/jobs/'+j.job_id);if(r.status==='cancelled')return 'PGN, transactional backup, personal repertoire and cancellation passed';await new Promise(r=>setTimeout(r,100))}throw Error('cancellation failed');
            }'''))
            page.reload();expect(page.locator('#home-stats article')).to_have_count(3,timeout=15000)
            assert page.evaluate('async()=> (await academyAPI("/games")).length')==1
            assert page.evaluate('async()=> (await academyAPI("/notes"))[0].text')=='Мой браузерный план'
            assert page.evaluate('async()=> (await academyAPI("/exercises?due=false")).some(e=>e.repetitions===1)')
            assert page.evaluate('async()=> (await academyAPI("/export-previous")).state.preferences.rating')==800
            page.locator('nav [data-page="progress"]').click()
            with page.expect_download() as info: page.locator('a[href="#export"]').click()
            assert json.loads(Path(info.value.path()).read_text())['format']=='personal-chess-academy-browser'
            # Once SW is activated, even engine and curriculum must work offline.
            expect(page.locator('#offline-status')).to_contain_text('сохранено',timeout=30000)
            context.set_offline(True);page.reload();expect(page.locator('#home-stats article')).to_have_count(3,timeout=15000)
            page.locator('nav [data-page="study"]').click();page.select_option('#mode','Свободное исследование');page.locator('#engine-panel summary').click();page.locator('#seconds').fill('0.27');page.locator('#analyze').click()
            expect(page.locator('#analysis')).to_contain_text('Stockfish',timeout=20000)
            page.set_viewport_size({'width':390,'height':844});assert page.locator('body').evaluate('(e)=>e.scrollWidth<=innerWidth')
            out=ROOT/'chess-academy/ui-artifacts';out.mkdir(exist_ok=True);page.screenshot(path=str(out/'github-pages-mobile.png'),full_page=True)
            assert not errors,errors
            browser.close();print('PASS: static-only browser app, real WASM analysis, PGN, training, backups, reload persistence and offline launch.')
    finally:server.shutdown();server.server_close()

if __name__=='__main__':main()
