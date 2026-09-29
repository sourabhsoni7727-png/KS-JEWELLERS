"""
KS JEWELLERS AND MAKERS - LIGHTWEIGHT LOCAL DEVELOPMENT SERVER
Business: KS Jewellers and Makers | Owner: Vinod Kumar Soni
Phone: 9413435295 | Mandawa Moad, Jhunjhunu, Rajasthan
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PREFERRED_PORTS = [5000, 8000, 8080, 5001, 3000]

class LuxuryJewelleryHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def start_server():
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)

    httpd = None
    active_port = None

    for port in PREFERRED_PORTS:
        try:
            httpd = socketserver.TCPServer(("", port), LuxuryJewelleryHandler)
            active_port = port
            break
        except OSError:
            continue

    if not httpd:
        httpd = socketserver.TCPServer(("", 0), LuxuryJewelleryHandler)
        active_port = httpd.socket.getsockname()[1]

    url = f"http://localhost:{active_port}"

    print("="*75)
    print("KS JEWELLERS AND MAKERS - LIVE BOUTIQUE SERVER ACTIVE")
    print(f"Owner: Vinod Kumar Soni | Phone: 9413435295")
    print(f"Address: B-171, Indira Nagar, Mandawa Moad, Jhunjhunu, Rajasthan")
    print(f"Website URL: {url}")
    print("="*75)

    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped gracefully.")
        sys.exit(0)

if __name__ == '__main__':
    start_server()
