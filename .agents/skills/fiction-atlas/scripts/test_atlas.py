import copy
import json
import re
from pathlib import Path
import subprocess
import tempfile
import unittest
from atlas import build, sample, validate


class AtlasTests(unittest.TestCase):
    def test_sample_build_and_script_escape(self):
        data = sample('</script><script>alert("fiction")</script>')
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'map.html'
            build(data, output)
            text = output.read_text(encoding='utf-8')
            payload = text.split('<script id="atlas-data" type="application/json">')[1].split('</script>')[0]
            self.assertNotIn('<', payload)
            self.assertEqual(json.loads(payload), data)
            js = text.split('<script>')[1].split('</script>')[0]
            script = Path(folder) / 'app.js'
            script.write_text(js, encoding='utf-8')
            subprocess.run(['node', '--check', str(script)], check=True, capture_output=True)

    def test_invalid_worlds_fail_before_build(self):
        for change in (
            lambda d: d['places'].append(copy.deepcopy(d['places'][0])),
            lambda d: d['maps'][0].update(parent='region'),
            lambda d: d['maps'][1].update(bounds=[0,0,9000,650]),
            lambda d: d['places'][0].update(x=float('nan')),
            lambda d: d['places'][0].update(x=100000),
            lambda d: d['routes'].append(dict(id='bad-road',name='Road',stops=['first-town','missing'],level=0,status='proposal',note='',sources=[])),
            lambda d: d['places'][0].update(status='certain-ish'),
            lambda d: d['places'][0].update(labelOffset=[1]),
        ):
            data = sample('Test')
            change(data)
            with self.assertRaises(ValueError):
                validate(data)

    def test_browser_validator_agrees(self):
        text = (Path(__file__).resolve().parents[1] / 'assets' / 'atlas.html').read_text(encoding='utf-8')
        body = re.search(r'function validate\(data\) \{([\s\S]*?)\n\s*function initialize', text).group(1)
        prefix = 'const stateNames={established:1,proposal:1,unknown:1};const kinds={town:1,village:1,tower:1,site:1,junction:1,bridge:1};function inside(p,b){return p.x>=b[0]&&p.y>=b[1]&&p.x<=b[0]+b[2]&&p.y<=b[1]+b[3];}\n'
        cases = [sample('Test')]
        for key, value in [('placement','invalid'),('x',100000),('sources',[{}]),('level',6),('labelAnchor','invalid')]:
            data = sample('Test'); data['places'][0][key] = value; cases.append(data)
        code = prefix + 'function validate(data) {' + body + '\n'
        code += 'const results='+json.dumps(cases)+';console.log(JSON.stringify(results.map(d=>{try{validate(d);return true;}catch{return false;}})));'
        result = subprocess.run(['node','-e',code],check=True,capture_output=True,text=True)
        self.assertEqual(json.loads(result.stdout), [True,False,False,False,False,False])


if __name__ == '__main__':
    unittest.main()
