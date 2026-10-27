"""Exercise real game review, keyboard navigation, best-move preview and audio."""
import functools, http.server, shutil, threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[2]
PGN = '[White "Sanekmix"]\n[Black "Opponent"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1'
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'))
            context = browser.new_context(viewport={'width': 1915, 'height': 884})
            page = context.new_page(); errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/chess-academy/')
            expect(page.locator('#home-stats article')).to_have_count(3, timeout=20000)
            page.locator('nav [data-page=games]').click()
            page.locator('#pgn').fill(PGN); page.locator('#import-pgn').click()
            expect(page.locator('#game-title')).to_contain_text('Sanekmix')
            page.locator('#game-replay').click()
            expect(page.locator('#review-counter')).to_have_text('0 / 4')
            expect(page.locator('#review-progress')).to_have_text('Все ходы оценены', timeout=60000)
            box = page.locator('#board-wrap').bounding_box()
            assert box['width'] >= 700 and box['y'] + box['height'] < 884, box
            assert page.locator('.coordinate').count() == 16
            assert not page.locator('#study-tree').is_visible()
            page.keyboard.press('ArrowRight'); expect(page.locator('#review-counter')).to_have_text('1 / 4')
            page.keyboard.press('ArrowRight'); page.keyboard.press('ArrowRight')
            expect(page.locator('#review-counter')).to_have_text('3 / 4')
            expect(page.locator('#review-verdict')).to_contain_text('Грубый зевок')
            expect(page.locator('#review-show-best')).to_be_visible()
            expect(page.locator('[data-square=g4] .move-badge')).to_have_text('??')
            assert page.locator('#sound-toggle').evaluate('(e)=>Number(e.dataset.played)') >= 3
            after_fen = page.locator('#fen').input_value()
            page.locator('#review-show-best').click()
            expect(page.locator('#review-return')).to_be_visible()
            expect(page.locator('[data-square=g2] img')).to_be_visible()
            assert page.locator('#arrow-lines line').count() > 0
            page.locator('#review-return').click()
            expect(page.locator('[data-square=g4] img')).to_be_visible()
            assert page.locator('#fen').input_value() == after_fen
            page.keyboard.press('End'); expect(page.locator('#review-counter')).to_have_text('4 / 4')
            expect(page.locator('#review-verdict')).to_contain_text('Лучший ход')
            expect(page.locator('#review-history button small')).to_have_count(4)
            page.screenshot(path='/tmp/academy-review-desktop.png')
            page.keyboard.press('Home'); expect(page.locator('#review-counter')).to_have_text('0 / 4')
            page.locator('#last-move').click(); expect(page.locator('#review-counter')).to_have_text('4 / 4')
            page.locator('#review-history [data-review-ply="2"]').click()
            expect(page.locator('#review-counter')).to_have_text('2 / 4')
            page.locator('#sound-toggle').click()
            played = page.locator('#sound-toggle').get_attribute('data-played')
            page.keyboard.press('ArrowRight'); expect(page.locator('#review-counter')).to_have_text('3 / 4')
            assert page.locator('#sound-toggle').get_attribute('data-played') == played
            page.locator('.board-extras > summary').click()
            page.locator('.board-extras details').filter(has=page.locator('#fen')).locator('summary').click()
            page.locator('#fen').focus(); page.keyboard.press('ArrowLeft')
            expect(page.locator('#review-counter')).to_have_text('3 / 4')
            page.set_viewport_size({'width':390, 'height':844})
            page.screenshot(path='/tmp/academy-review-mobile.png', full_page=True)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            browser.close()
            print('PASS: 720px board, 16 edge coordinates; real WASM per-move grades; fast arrows/Home/End/list; best-move preview/restore; sound and mute; mobile; no JS errors.')
    finally:
        server.shutdown()
if __name__ == '__main__': main()
