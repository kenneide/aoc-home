"""Serve a loopback preview, or reuse a server with matching generated content."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
import errno


def serve(directory, port=4174):
    directory = Path(directory).resolve()
    route = '/projects/what-becomes-worth-building/'
    url = f'http://127.0.0.1:{port}{route}'
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', port), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise
        try:
            with urlopen(url, timeout=2) as response:
                matches = response.read() == (directory / route.strip('/') / 'index.html').read_bytes()
        except OSError:
            matches = False
        if matches:
            print(f'Presentation ready: {url} (existing server reused)', flush=True)
            return
        raise SystemExit(f'Port {port} is used by another server. Stop that server or change its port, then launch again.') from None
    with server:
        print(f'Presentation ready: {url}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
