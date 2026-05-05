import os

import psycopg
from psycopg import OperationalError


HOST = "aws-1-eu-north-1.pooler.supabase.com"
PORTS = [6543, 5432]
DB = "postgres"
USER = "postgres.hcrhjflpkyevjgkwiybi"
PASSWORD = os.environ.get("SUPA_DB_PASS", "")

SQL = """
DROP POLICY IF EXISTS "offers_read_participant" ON public.offers;
DROP POLICY IF EXISTS "master_insert_own_offers" ON public.offers;
DROP POLICY IF EXISTS "master_update_own_offers" ON public.offers;

CREATE POLICY "offers_read_participant"
ON public.offers FOR SELECT
TO authenticated
USING (
  master_id = auth.uid()
  OR exists (
    select 1
    from public.requests r
    where r.id = request_id and r.client_id = auth.uid()
  )
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "master_insert_own_offers"
ON public.offers FOR INSERT
TO authenticated
WITH CHECK (
  master_id = auth.uid()
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'master'
);

CREATE POLICY "master_update_own_offers"
ON public.offers FOR UPDATE
TO authenticated
USING (
  master_id = auth.uid()
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  master_id = auth.uid()
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
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

