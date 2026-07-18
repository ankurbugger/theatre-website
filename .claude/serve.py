import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from http.server import HTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


print("serving on http://127.0.0.1:4173", flush=True)
HTTPServer(("127.0.0.1", 4173), Handler).serve_forever()
