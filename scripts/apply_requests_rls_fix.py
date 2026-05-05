import os

import psycopg
from psycopg import OperationalError


HOST = "aws-1-eu-north-1.pooler.supabase.com"
PORTS = [6543, 5432]
DB = "postgres"
USER = "postgres.hcrhjflpkyevjgkwiybi"
PASSWORD = os.environ.get("SUPA_DB_PASS", "")

SQL = """
DROP POLICY IF EXISTS "client_can_manage_own_requests" ON public.requests;

-- Minimal-safe policy: clients can insert/update/delete only their own rows.
-- (Ban/admin checks are handled at app layer to avoid fragile cross-table RLS.)
CREATE POLICY "client_can_manage_own_requests"
ON public.requests
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());
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

    last: Exception | None = None
    for attempt in range(1, 7):
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
            if attempt < 6:
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

