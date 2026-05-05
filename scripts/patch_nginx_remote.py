import os
import re

import paramiko


HOST = "80.78.243.126"
REMOTE = "/etc/nginx/sites-available/masters-marketplace"


HEADERS_BLOCK = """
  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header X-XSS-Protection "0" always;
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';" always;
""".lstrip("\n")


FAVICON_LOCATION = """
  location = /favicon.ico {
    return 302 /icon.svg;
  }
""".lstrip("\n")


def main() -> None:
    password = os.environ.get("DEPLOY_PASS", "")
    if not password:
        raise SystemExit("DEPLOY_PASS env var is required")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60, banner_timeout=60, auth_timeout=60)

    sftp = c.open_sftp()
    try:
        raw = sftp.open(REMOTE, "r").read()
        text = raw.decode("utf-8", "replace")

        if "Content-Security-Policy" not in text:
            text = re.sub(r"(\n\s*server_name[^;]*;)", r"\1\n" + HEADERS_BLOCK, text, count=1)

        if "location = /favicon.ico" not in text:
            text = re.sub(r"(\n\s*location\s+/\s*\{)", "\n" + FAVICON_LOCATION + r"\1", text, count=1)

        sftp.open(REMOTE, "w").write(text.encode("utf-8"))
    finally:
        sftp.close()

    for cmd in [
        "nginx -t",
        "systemctl reload nginx",
        "curl -sS -I http://127.0.0.1/favicon.ico | head -6",
        "curl -sS -I http://127.0.0.1/robots.txt | head -6",
        "curl -sS -I http://127.0.0.1/sitemap.xml | head -6",
    ]:
        i, o, e = c.exec_command(cmd, get_pty=True)
        code = o.channel.recv_exit_status()
        out = o.read().decode(errors="replace")
        err = e.read().decode(errors="replace")
        print(f"\n=== {cmd} (exit {code}) ===")
        if out.strip():
            print(out)
        if err.strip():
            print("stderr:", err)

    c.close()


if __name__ == "__main__":
    main()

