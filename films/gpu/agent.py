"""Minimal remote worker that runs inside a rented GPU pod (stdlib only).

Started by the pod's start command. Every request must carry the X-Token header (a random per-pod secret set at
creation). Endpoints: GET /ping, POST /upload (tar.gz -> /work), POST /run {"cmd": ...} -> job id,
GET /job?id=&tail=, GET /file?path=, GET /tar?path= (tar.gz of a /work subpath), GET /ls?path=.
The pod never holds the RunPod API key; it is stopped and terminated from outside by runpod_client.py.
"""
import http.server, io, json, os, subprocess, tarfile, urllib.parse, uuid

TOKEN = os.environ['AGENT_TOKEN']
WORK = '/work'
os.makedirs(WORK, exist_ok=True)
JOBS = {}


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def reply(self, code, body, ctype='application/json'):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def ok(self):
        if self.headers.get('X-Token') != TOKEN:
            self.reply(403, {'error': 'forbidden'})
            return False
        return True

    def safe(self, rel):
        p = os.path.realpath(os.path.join(WORK, rel))
        if not p.startswith(WORK):
            raise ValueError('path outside /work')
        return p

    def do_GET(self):
        if not self.ok():
            return
        u = urllib.parse.urlparse(self.path)
        q = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
        try:
            if u.path == '/ping':
                gpu = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total,driver_version', '--format=csv,noheader'],
                                     capture_output=True, text=True).stdout.strip()
                return self.reply(200, {'ok': True, 'gpu': gpu})
            if u.path == '/job':
                j = JOBS[q['id']]
                data = open(j['log'], 'rb').read()
                tail = int(q.get('tail', 6000))
                return self.reply(200, {'rc': j['p'].poll(), 'log': data[-tail:].decode('utf8', 'replace')})
            if u.path == '/file':
                return self.reply(200, open(self.safe(q['path']), 'rb').read(), 'application/octet-stream')
            if u.path == '/ls':
                p = self.safe(q.get('path', '.'))
                return self.reply(200, sorted(os.listdir(p)))
            if u.path == '/tar':
                p = self.safe(q['path'])
                buf = io.BytesIO()
                with tarfile.open(fileobj=buf, mode='w:gz', compresslevel=1) as t:
                    t.add(p, arcname=os.path.basename(p))
                return self.reply(200, buf.getvalue(), 'application/gzip')
        except Exception as e:
            return self.reply(500, {'error': repr(e)})
        self.reply(404, {'error': 'not found'})

    def do_POST(self):
        if not self.ok():
            return
        u = urllib.parse.urlparse(self.path)
        n = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(n)
        try:
            if u.path == '/upload':
                with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as t:
                    t.extractall(WORK, filter='data')
                return self.reply(200, {'ok': True})
            if u.path == '/run':
                cmd = json.loads(data)['cmd']
                jid = uuid.uuid4().hex[:8]
                log = f'/tmp/job_{jid}.log'
                p = subprocess.Popen(['bash', '-lc', cmd], cwd=WORK, stdout=open(log, 'wb'), stderr=subprocess.STDOUT)
                JOBS[jid] = {'p': p, 'log': log}
                return self.reply(200, {'id': jid})
        except Exception as e:
            return self.reply(500, {'error': repr(e)})
        self.reply(404, {'error': 'not found'})


http.server.ThreadingHTTPServer(('0.0.0.0', 8000), H).serve_forever()
