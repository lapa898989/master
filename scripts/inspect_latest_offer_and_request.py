import os

import psycopg
from psycopg import OperationalError


HOST = "aws-1-eu-north-1.pooler.supabase.com"
PORTS = [6543, 5432]
DB = "postgres"
USER = "postgres.hcrhjflpkyevjgkwiybi"
PASSWORD = os.environ.get("SUPA_DB_PASS", "")

def connect() -> psycopg.Connection:
    last: Exception | None = None
    for port in PORTS:
        try:
            return psycopg.connect(host=HOST, port=port, dbname=DB, user=USER, password=PASSWORD, connect_timeout=20)
        except Exception as e:  # noqa: BLE001
            last = e
    assert last is not None
    raise last


def main() -> None:
    if not PASSWORD:
        raise SystemExit("SUPA_DB_PASS env var is required")

    last: Exception | None = None
    for attempt in range(1, 6):
        conn = connect()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select id, request_id, master_id, status, price, created_at
                    from public.offers
                    order by id desc
                    limit 10;
                    """
                )
                offers = cur.fetchall()
                print("offers:")
                for o in offers:
                    print(" ", o)

                req_ids = [o[1] for o in offers]
                if req_ids:
                    cur.execute(
                        """
                        select id, client_id, status, title, city, created_at
                        from public.requests
                        where id = any(%s)
                        order by id desc;
                        """,
                        (req_ids,),
                    )
                    requests = cur.fetchall()
                    print("requests:")
                    for r in requests:
                        print(" ", r)
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

