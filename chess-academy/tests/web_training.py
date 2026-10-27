"""Dark UI, retries, multi-move Lichess puzzles and public profile contracts.
Only explicit API fixtures are mocked; all moves and evaluations use real WASM.
"""
import functools,http.server,json,os,shutil,threading,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2]
FEN='rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2'
PGN='[White "Sanekmix"]\n[Black "Other"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1'
MATE_PGN='[SetUp "1"]\n[FEN "5r1k/6pp/7N/8/2Q5/8/8/6K1 w - - 0 1"]\n\n*'

class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass

def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=ROOT));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/chess-academy/'
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,**({'executable_path':os.environ.get('ACADEMY_BROWSER') or shutil.which('chromium')} if os.environ.get('ACADEMY_BROWSER') or shutil.which('chromium') else {}));ctx=browser.new_context(viewport={'width':1600,'height':1000});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def puzzle(route):route.fulfill(json={'game':{'id':'fixture1','pgn':MATE_PGN},'puzzle':{'id':'FIXT1','rating':1200,'solution':['c4g8','f8g8','h6f7'],'themes':['mateIn2']}})
   ctx.route('https://lichess.org/api/puzzle/next**',puzzle)
   def chesscom(route):
    url=route.request.url.split('?')[0]
    if url.endswith('/stats'):data={'chess_rapid':{'last':{'rating':700}},'chess_blitz':{'last':{'rating':650}}}
    elif url.endswith('/archives'):data={'archives':['https://api.chess.com/pub/player/sanekmix/games/2026/10']}
    elif '/games/2026/10' in url:data={'games':[{'rules':'chess','end_time':1,'pgn':PGN,'time_class':'rapid','white':{'rating':700},'black':{'rating':710}},{'rules':'chess','pgn':PGN},{'rules':'chess960','end_time':1,'pgn':PGN}]}
    else:data={'username':'Sanekmix','url':'https://www.chess.com/member/sanekmix'}
    route.fulfill(json=data)
   ctx.route('https://api.chess.com/**',chesscom)
   def lichess(route):
    if '/api/user/' in route.request.url:route.fulfill(json={'username':'TestLichess','perfs':{'rapid':{'games':10,'rating':1000}}})
    else:route.fulfill(content_type='application/x-ndjson',body=json.dumps({'id':'fixtureg','variant':'standard','status':'mate','pgn':PGN.replace('Sanekmix','TestLichess'),'createdAt':1000,'lastMoveAt':2000,'speed':'rapid','players':{'white':{'user':{'name':'TestLichess'},'rating':1000},'black':{'user':{'name':'Other'},'rating':1000}}})+'\n'+json.dumps({'id':'ongoing','variant':'standard','status':'started','pgn':PGN})+'\n')
   ctx.route('https://lichess.org/api/user/**',lichess);ctx.route('https://lichess.org/api/games/user/**',lichess)
   # Create the actual old IndexedDB version before loading the upgraded app.
   page.goto(base+'web/icon.svg')
   page.evaluate('''async()=>{const fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',key=fen.split(' ').slice(0,4).join(' ');await new Promise((ok,no)=>{const request=indexedDB.open('personal-chess-academy',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onsuccess=()=>{const db=request.result,tx=db.transaction('records','readwrite');tx.objectStore('records').put({version:1,preferences:{rating:355,username:'Sanekmix'},notes:{[key]:{fen,text:'Сохранено до обновления',saved:1}},games:[],exercises:[],reviews:[],attempts:[],personal:[],cache:{},next:{game:1,exercise:1}},'state');tx.oncomplete=()=>{db.close();ok()};tx.onerror=()=>no(tx.error)};request.onerror=()=>no(request.error)})}''')
   page.goto(base);expect(page.locator('#home-stats article')).to_have_count(3,timeout=20000)
   assert page.evaluate('async()=> (await academyAPI("/notes"))[0].text')=='Сохранено до обновления'
   other=ctx.new_page();other.goto(base);expect(other.locator('#home-stats article')).to_have_count(3,timeout=20000)
   page.evaluate('''()=>{window.tabTest=new BroadcastChannel('academy-test-race');window.tabTest.onmessage=e=>{if(e.data==='write')academyAPI('/notes',{moves:['e2e4'],text:'Первая вкладка'}).then(()=>window.tabTest.postMessage('done'));}}''')
   assert other.evaluate('''async()=>{const c=new BroadcastChannel('academy-test-race'),done=new Promise(ok=>c.onmessage=e=>{if(e.data==='done')ok()});c.postMessage('write');await academyAPI('/notes',{moves:['d2d4'],text:'Вторая вкладка'});await done;const rows=await academyAPI('/notes');c.close();return rows.some(n=>n.text==='Первая вкладка')&&rows.some(n=>n.text==='Вторая вкладка');}''')
   other.close();print('Old IndexedDB data retained; concurrent tabs preserve both writes')
   assert page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(23, 23, 21)'
   # All ten deep programs load and every supplied line is parsed by chess.js.
   print(page.evaluate('''async()=>{const api=academyAPI,courses=(await api('/openings')).filter(c=>c.deep);if(courses.length!==10)throw Error('ten deep courses required');let count=0;for(const c of courses){const deep=await api('/openings/'+c.id);if(!deep.guide.white||!deep.guide.black||deep.variations.length<50)throw Error('incomplete course');count+=deep.variations.length}return count+' real legal opening branches loaded across ten courses';}'''))
   page.get_by_role('button',name='Продолжить обучение →').click()
   assert page.locator('#board img.piece').count()==32
   expect(page.locator('#lesson-goal')).to_contain_text('e2 → e4')
   page.locator('[data-coach-tab=chapters]').click()
   page.locator('#more-variations').click();expect(page.locator('[data-variation]')).to_have_count(160)
   # Selecting a string variation id used to lose the chosen branch.
   page.locator('[data-variation="italian-1"]').click();expect(page.locator('[data-variation="italian-1"]')).to_have_class('active')
   page.locator('[data-coach-tab=coach]').click()
   # Real drag-and-drop, then autoplay the theoretical response.
   source=page.locator('[data-square="e2"]').bounding_box();target=page.locator('[data-square="e4"]').bounding_box();page.mouse.move(source['x']+source['width']/2,source['y']+source['height']/2);page.mouse.down();page.mouse.move(target['x']+target['width']/2,target['y']+target['height']/2,steps=10);page.mouse.up()
   expect(page.locator('#history')).to_contain_text('e5',timeout=20000)
   expect(page.locator('#lesson-goal')).to_contain_text('g1 → f3')
   expect(page.locator('#lesson-goal')).to_contain_text('e5')
   expect(page.locator('#lesson-goal')).to_contain_text('d4')
   # A bad move must never enter history and must return the same exercise position.
   page.locator('.board-extras > summary').click();page.locator('.board-extras details').filter(has=page.locator('#fen')).locator('summary').click()
   page.locator('#fen').fill(FEN);page.locator('#load-fen').click();page.select_option('#mode','Угадай лучший ход')
   page.locator('[data-square="g2"]').click();page.locator('[data-square="g4"]').click()
   expect(page.locator('#feedback-summary')).to_contain_text('Qh4#',timeout=20000);expect(page.locator('#feedback-summary')).to_contain_text('мат')
   expect(page.locator('[data-square="g2"] img')).to_be_visible(timeout=10000);assert page.locator('#history').inner_text()==''
   page.locator('#show-refutation').click();expect(page.locator('[data-square="h4"] img')).to_have_attribute('src',__import__('re').compile(r'bQ\.svg$'))
   page.locator('#retry-move').click();expect(page.locator('[data-square="d8"] img')).to_have_attribute('src',__import__('re').compile(r'bQ\.svg$'))
   # Every training mode follows the same retry path, with no unverified advances.
   for mode in ['Обучение','Тренировка по памяти','Случайный соперник']:
    page.select_option('#mode',mode);page.locator('[data-square="g2"]').click();page.locator('[data-square="g4"]').click();expect(page.locator('[data-square="g2"] img')).to_be_visible(timeout=15000);assert page.locator('#history').inner_text()==''
   print('Dark theme, vector pieces, drag, refutation and automatic rollback passed')
   # Correct three-ply line: first correct move must NOT schedule or complete it.
   page.locator('nav [data-page="puzzles"]').click();page.select_option('#puzzle-theme','mateIn2');page.locator('#new-puzzle').click();expect(page.locator('#study-title')).to_contain_text('1200',timeout=15000)
   page.locator('[data-square="c4"]').click();page.locator('[data-square="g8"]').click();expect(page.locator('#history')).to_contain_text('Rxg8',timeout=20000)
   assert page.evaluate('async()=> (await academyAPI("/puzzles/stats")).solved')==0
   page.locator('[data-square="h6"]').click();page.locator('[data-square="f7"]').click();expect(page.locator('#task')).to_contain_text('Задача решена',timeout=20000)
   assert page.evaluate('async()=> (await academyAPI("/puzzles/stats")).solved')==1
   page.locator('nav [data-page="profile"]').click();page.locator('#connect-chesscom').click();expect(page.locator('#chesscom-profile')).to_contain_text('700',timeout=15000);expect(page.locator('#profile-rating')).to_contain_text('700')
   page.locator('#sync-chesscom').click();expect(page.locator('#game-list article')).to_have_count(1,timeout=20000)
   page.locator('nav [data-page="profile"]').click();page.locator('#connect-lichess-name').fill('TestLichess');page.locator('#connect-lichess').click();expect(page.locator('#lichess-profile')).to_contain_text('1000',timeout=15000);page.locator('#sync-lichess').click();expect(page.locator('#game-list article')).to_have_count(2,timeout=20000)
   assert page.evaluate('async()=> (await academyAPI("/games")).every(g=>["0-1","1-0","1/2-1/2"].includes(g.result))')
   # Static app is cached, including all 4096 fallback puzzles and deep chapters.
   expect(page.locator('#offline-status')).to_contain_text('сохранено',timeout=30000);ctx.set_offline(True);page.reload();expect(page.locator('#home-stats article')).to_have_count(3,timeout=20000)
   assert page.evaluate('async()=> (await academyAPI("/profiles")).chesscom.ratings.Rapid')==700
   page.locator('nav [data-page="puzzles"]').click();page.locator('#new-puzzle').click();expect(page.locator('#study-kind')).to_contain_text('ЛОКАЛЬНЫЙ НАБОР',timeout=15000)
   # Phone layout must not overflow horizontally; promotion uses a real dialog.
   page.set_viewport_size({'width':390,'height':844});assert page.locator('body').evaluate('(e)=>e.scrollWidth<=innerWidth')
   page.locator('.board-extras > summary').click();page.locator('.board-extras details').filter(has=page.locator('#fen')).locator('summary').click()
   page.locator('#fen').fill('7k/P7/8/8/8/8/8/4K3 w - - 0 1');page.locator('#load-fen').click()
   page.locator('[data-square="a7"]').click();page.locator('[data-square="a8"]').click();expect(page.locator('#promotion-dialog')).to_be_visible();expect(page.locator('#promotion-options button')).to_have_count(4);page.locator('[data-promotion="n"]').click();expect(page.locator('[data-square="a8"] img')).to_have_attribute('src',__import__('re').compile(r'wN\.svg$'))
   out=ROOT/'chess-academy/ui-artifacts' ;out.mkdir(exist_ok=True);page.screenshot(path=str(out/'dark-training-mobile.png'),full_page=True)
   assert not errors,errors;browser.close();print('PASS: multi-move puzzles, public profile contracts, completed-only imports, persisted profiles and offline puzzle fallback.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':main()
