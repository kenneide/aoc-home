"""Serve a loopback preview, or reuse a server with matching generated content."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
import errno
import webbrowser


def serve(directory, port=4174, *, open_browser=False):
    directory = Path(directory).resolve()
    route = '/projects/what-becomes-worth-building/'
    url = f'http://127.0.0.1:{port}{route}'
    def ready(reused=False):
        suffix = ' (existing server reused)' if reused else ''
        print(f'Presentation ready: {url}{suffix}', flush=True)
        if open_browser and not webbrowser.open(url):
            print('Open the preview URL above in your browser.', flush=True)

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
            ready(reused=True)
            return
        raise SystemExit(f'Port {port} is used by another server. Stop that server or change its port, then launch again.') from None
    with server:
        ready()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
