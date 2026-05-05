import os
import time
from pathlib import Path

import paramiko
from paramiko.ssh_exception import SSHException


HOST = os.environ["SSH_HOST"]
USERNAME = os.environ["SSH_USER"]
PASSWORD = os.environ["SSH_PASSWORD"]
REMOTE_DIR = os.environ.get("REMOTE_DIR", "/var/www/service-marketplace-mvp")
LOCAL_ROOT = Path(os.environ.get("LOCAL_ROOT", Path(__file__).resolve().parents[1]))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

EXCLUDE_DIRS = {".git", ".next", "node_modules", ".cursor", "__pycache__"}
EXCLUDE_FILES = {Path(__file__).name}


def should_skip(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts) or path.name in EXCLUDE_FILES


def sftp_mkdir_p(sftp: paramiko.SFTPClient, remote_path: str) -> None:
    parts = remote_path.strip("/").split("/")
    current = ""
    for part in parts:
        current += "/" + part
        try:
            sftp.stat(current)
        except FileNotFoundError:
            sftp.mkdir(current)


def upload_tree(sftp: paramiko.SFTPClient, local_root: Path, remote_root: str) -> None:
    sftp_mkdir_p(sftp, remote_root)
    for root, dirs, files in os.walk(local_root):
        root_path = Path(root)
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel_root = root_path.relative_to(local_root)
        if should_skip(rel_root):
            continue
        remote_current = remote_root if str(rel_root) == "." else f"{remote_root}/{rel_root.as_posix()}"
        sftp_mkdir_p(sftp, remote_current)
        for file_name in files:
            local_path = root_path / file_name
            rel_file = local_path.relative_to(local_root)
            if should_skip(rel_file):
                continue
            remote_path = f"{remote_root}/{rel_file.as_posix()}"
            sftp.put(str(local_path), remote_path)


def run(ssh: paramiko.SSHClient, command: str) -> tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
    channel = stdout.channel
    out_chunks: list[str] = []
    err_chunks: list[str] = []

    while True:
        while channel.recv_ready():
            chunk = channel.recv(4096).decode("utf-8", errors="replace")
            out_chunks.append(chunk)
            print(chunk, end="", flush=True)
        while channel.recv_stderr_ready():
            chunk = channel.recv_stderr(4096).decode("utf-8", errors="replace")
            err_chunks.append(chunk)
            print(chunk, end="", flush=True)
        if channel.exit_status_ready():
            break
        time.sleep(0.2)

    while channel.recv_ready():
        chunk = channel.recv(4096).decode("utf-8", errors="replace")
        out_chunks.append(chunk)
        print(chunk, end="", flush=True)
    while channel.recv_stderr_ready():
        chunk = channel.recv_stderr(4096).decode("utf-8", errors="replace")
        err_chunks.append(chunk)
        print(chunk, end="", flush=True)

    exit_code = channel.recv_exit_status()
    return exit_code, "".join(out_chunks), "".join(err_chunks)


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            print(f"== SSH connect attempt {attempt}/5 ==")
            ssh.connect(HOST, username=USERNAME, password=PASSWORD, timeout=20, banner_timeout=60, auth_timeout=30)
            last_error = None
            break
        except (SSHException, TimeoutError, OSError) as exc:
            last_error = exc
            print(f"SSH connect failed: {exc}")
            time.sleep(5)
    if last_error is not None:
        raise last_error

    print("== Inspecting server ==")
    for command in [
        "whoami && hostname",
        "systemctl is-active ssh || systemctl is-active sshd || true",
        "systemctl is-active nginx || true",
        "node -v || true",
        "npm -v || true",
        "pm2 -v || true",
    ]:
        code, _, _ = run(ssh, command)
        if code != 0:
            raise SystemExit(code)

    sftp = ssh.open_sftp()
    print("== Uploading project ==")
    upload_tree(sftp, LOCAL_ROOT, REMOTE_DIR)
    env_content = "\n".join(
        [
            f"NEXT_PUBLIC_SUPABASE_URL={SUPABASE_URL}",
            f"NEXT_PUBLIC_SUPABASE_ANON_KEY={SUPABASE_KEY}",
            f"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY={SUPABASE_KEY}",
            "PORT=3000",
            "",
        ]
    )
    with sftp.file(f"{REMOTE_DIR}/.env.local", "w") as env_file:
        env_file.write(env_content)
    sftp.close()

    print("== Building and starting app ==")
    commands = [
        f"cd {REMOTE_DIR} && npm install --no-audit --no-fund",
        f"cd {REMOTE_DIR} && npm run build",
        "pm2 delete servicedrive || true",
        f"cd {REMOTE_DIR} && pm2 start npm --name servicedrive -- start",
        "pm2 save",
        """cat > /etc/nginx/sites-available/servicedrive <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF""",
        "rm -f /etc/nginx/sites-enabled/default",
        "ln -sf /etc/nginx/sites-available/servicedrive /etc/nginx/sites-enabled/servicedrive",
        "nginx -t",
        "systemctl reload nginx",
        "pm2 status servicedrive",
        "curl -I http://127.0.0.1:3000 || true",
        "curl -I http://127.0.0.1 || true",
    ]
    for command in commands:
        print(f"\n== Running: {command} ==")
        code, _, _ = run(ssh, command)
        if code != 0:
            raise SystemExit(code)

    ssh.close()


if __name__ == "__main__":
    main()
