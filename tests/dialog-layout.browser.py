"""Layout fixture using the built application CSS, not an iPhone hardware test.

npm run build
python -m pip install playwright
python -m playwright install chromium webkit
python tests/dialog-layout.browser.py --engine chromium
python tests/dialog-layout.browser.py --engine webkit

--css is only for isolated local fixtures when the full build is unavailable.
"""
import argparse
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--engine', choices=('chromium', 'webkit'), default='chromium')
parser.add_argument('--executable')
parser.add_argument('--css', type=Path)
args = parser.parse_args()
source = (ROOT / 'components/ui/dialog.tsx').read_text()
match = re.search(r'fullScreen \? "([^"]+)" : "([^"]+)"', source)
assert match, 'Read the actual DialogContent classes; do not substitute a positioning stub.'
full_classes, normal_classes = match.groups()
css_files = [args.css] if args.css else sorted((ROOT / 'dist/client').rglob('*.css'))
assert css_files, 'Build the application first, or explicitly pass --css for an isolated fixture.'
css = '\n'.join(path.read_text() for path in css_files)
assert '.story-conversation' in css and '.phone-dialog' in css


def fixture(kind, frame_height, frame_top=0, safe_top=0, safe_bottom=0):
    story = kind in ('opening', 'history', 'ending', 'art', 'banter')
    classes = full_classes if kind == 'viewer' else normal_classes
    classes += ' art-viewer' if kind == 'viewer' else ' save-dialog' if kind == 'save' else ' phone-dialog'
    if story and kind != 'banter':
        classes += ' story-dialog'
    header = '<div data-slot="dialog-header" class="flex flex-col gap-2 text-center sm:text-left"><h2 data-slot="dialog-title" class="text-lg leading-none font-semibold">会話の表示確認</h2><p data-slot="dialog-description" class="text-sm text-muted-foreground">道が合わさるところ</p></div>'
    if story:
        count = 1 if kind == 'opening' else 40
        lines = ''.join('<div class="story-line"><span class="face-portrait" style="width:72px;height:72px" aria-hidden="true"></span><div><b>話し手</b><p>長い会話も、画面の幅に合わせて折り返して読めることを確認します。</p></div></div>' for _ in range(count))
        cue = '冒険を始める' if kind == 'ending' else '▼'
        art = '<figure class="story-still"><button class="still-expand" aria-label="絵を見る"><img alt="表示確認用" width="800" height="600" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'%3E%3C/svg%3E"></button></figure>' if kind == 'art' else ''
        body = f'<div class="story-reader{" story-reader-art" if art else ""}">{art}<div class="story-conversation" role="button" tabindex="0"><div class="dialogue-page dialogue-history"><div class="story-lines">{lines}</div></div><div class="story-tap-hint"><span>1 / {count}</span><span>{cue}</span></div></div></div>'
    elif kind == 'viewer':
        body = '<button class="art-canvas" aria-label="戻る"></button><button class="art-return">戻る</button>'
    else:
        body = '<p>通常のダイアログは中央に表示します。</p><button>閉じる</button>'
    return f'<!doctype html><html lang="ja"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style><body style="--game-height:{frame_height}px;--game-top:{frame_top}px;--game-safe-bottom:{safe_bottom}px"><div role="dialog" data-slot="dialog-content" data-state="open" class="{classes}" style="--story-safe-top:{safe_top}px">{header}{body}</div></body></html>'


def measure(page):
    return page.evaluate('''() => {
      const rect = node => { if (!node) return null; const r=node.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
      const dialog=document.querySelector('[role="dialog"]');
      const history=document.querySelector('.dialogue-history');
      const style=getComputedStyle(dialog);
      return {dialog:rect(dialog),header:rect(document.querySelector('[data-slot="dialog-header"]')),cue:rect(document.querySelector('.story-tap-hint')),history:rect(history),art:rect(document.querySelector('.story-still')),transform:style.transform,translate:style.translate,overflow:dialog.scrollHeight-dialog.clientHeight,historyOverflow:history?history.scrollHeight-history.clientHeight:0,horizontalOverflow:history?history.scrollWidth-history.clientWidth:0,documentOverflow:document.documentElement.scrollWidth-innerWidth};
    }''')


def check(page, kind, width, height, frame_height, frame_top=0, safe_top=0, safe_bottom=0):
    result = measure(page)
    r = result['dialog']
    label = f'{args.engine} {width}x{height} {kind}: {result}'
    story = kind in ('opening', 'history', 'ending', 'art', 'banter')
    gutter = 0 if kind == 'viewer' else 12
    assert r['left'] >= gutter - 1 and r['right'] <= width - gutter + 1, label
    assert r['top'] >= -1 and r['bottom'] <= height + 1, label
    assert result['documentOverflow'] <= 1, label
    header = result['header']
    assert header['top'] >= r['top'] - 1 and header['bottom'] <= r['bottom'] + 1, label
    if story:
        assert result['transform'] == 'none' and result['translate'] == 'none', label
        assert r['top'] >= frame_top + safe_top + 16 - 1, label
        assert r['bottom'] <= frame_top + frame_height - safe_bottom - 16 + 1, label
        assert result['overflow'] <= 1 and result['horizontalOverflow'] <= 1, label
        cue, history = result['cue'], result['history']
        assert cue['left'] >= r['left'] and cue['right'] <= r['right'], label
        assert cue['top'] >= header['bottom'] and cue['bottom'] <= r['bottom'], label
        assert history['height'] > 0 and history['bottom'] <= cue['top'] + 1, label
        if kind != 'opening':
            assert result['historyOverflow'] > 0, label
            page.locator('.dialogue-history').evaluate('(el) => { el.scrollTop = el.scrollHeight; }')
            assert page.locator('.dialogue-history').evaluate('(el) => el.scrollTop > 0'), label
        if kind == 'art':
            assert result['art']['height'] > 0, label
    elif kind == 'viewer':
        assert abs(r['height'] - frame_height) <= 1 and abs(r['width'] - width) <= 1, label
    else:
        assert abs((r['left'] + r['right']) / 2 - width / 2) <= 1, label
        assert abs((r['top'] + r['bottom']) / 2 - height / 2) <= 1, label


checks = 0
with sync_playwright() as p:
    options = {'executable_path': args.executable} if args.executable else {}
    browser = getattr(p, args.engine).launch(**options)
    try:
        for width, height in [(320,568),(375,667),(390,844),(393,852),(430,932),(844,390),(1280,900)]:
            context = browser.new_context(viewport={'width':width,'height':height}, is_mobile=width<900, has_touch=width<900)
            page = context.new_page()
            # Keep test assets local; do not fetch the game's artwork or touch saves.
            page.route('http://**/*', lambda route: route.abort())
            page.route('https://**/*', lambda route: route.abort())
            for kind in ('opening','history','ending','art','banter','ordinary','save','viewer'):
                page.set_content(fixture(kind,height), wait_until='load')
                page.wait_for_timeout(300)
                check(page,kind,width,height,height)
                checks += 1
            # Resize an already-open dialogue, as browser chrome/rotation changes.
            page.set_content(fixture('history',height), wait_until='load')
            page.set_viewport_size({'width':height,'height':width})
            page.locator('body').evaluate('(el,h) => el.style.setProperty("--game-height",h+"px")', width)
            check(page,'history',height,width,width)
            checks += 1
            context.close()
        context = browser.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True)
        page = context.new_page()
        for frame_height, frame_top, safe_top, safe_bottom in [(852,0,44,34),(500,32,0,0)]:
            for kind in ('history','art'):
                page.set_content(fixture(kind,frame_height,frame_top,safe_top,safe_bottom),wait_until='load')
                page.wait_for_timeout(300)
                check(page,kind,393,852,frame_height,frame_top,safe_top,safe_bottom)
                checks += 1
        context.close()
    finally:
        browser.close()
print(f'PASS: {checks} layout cases in {args.engine}; CSS source: {"isolated fixture" if args.css else "production build"}.')
