import os

import psycopg
from psycopg import OperationalError


HOST = "aws-1-eu-north-1.pooler.supabase.com"
PORTS = [6543, 5432]  # transaction pooler first, fallback to session pooler
DB = "postgres"
USER = "postgres.hcrhjflpkyevjgkwiybi"
PASSWORD = os.environ.get("SUPA_DB_PASS", "")

SQL = """
DROP POLICY IF EXISTS "profiles_read_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_read_self_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (auth.jwt() ->> 'role') = 'admin'
);

CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR (auth.jwt() ->> 'role') = 'admin'
)
WITH CHECK (
  id = auth.uid()
  OR (auth.jwt() ->> 'role') = 'admin'
);
"""


def connect() -> psycopg.Connection:
    last: Exception | None = None
    for port in PORTS:
        try:
            return psycopg.connect(
                host=HOST,
                port=port,
                dbname=DB,
                user=USER,
                password=PASSWORD,
                connect_timeout=20,
            )
        except Exception as e:  # noqa: BLE001
            last = e
    assert last is not None
    raise last


def main() -> None:
    if not PASSWORD:
        raise SystemExit("SUPA_DB_PASS env var is required")

    # Pooler connections may drop; retry a few times.
    last: Exception | None = None
    for attempt in range(1, 6):
        conn = connect()
        try:
            with conn.cursor() as cur:
                cur.execute(SQL)
            conn.commit()
            print("applied")
            return
        except OperationalError as e:
            last = e
            try:
                conn.close()
            except Exception:
                pass
            if attempt < 5:
                continue
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass
    if last:
        raise last


if __name__ == "__main__":
    main()

