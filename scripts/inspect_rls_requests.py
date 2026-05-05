import os

import psycopg


HOST = "aws-1-eu-north-1.pooler.supabase.com"
PORT = 6543
DB = "postgres"
USER = "postgres.hcrhjflpkyevjgkwiybi"
PASSWORD = os.environ.get("SUPA_DB_PASS", "")


def main() -> None:
    if not PASSWORD:
        raise SystemExit("SUPA_DB_PASS env var is required")

    conn = psycopg.connect(host=HOST, port=PORT, dbname=DB, user=USER, password=PASSWORD, connect_timeout=20)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                select polname, polcmd, polpermissive, polroles::text, pg_get_expr(polqual, polrelid) as using_expr,
                       pg_get_expr(polwithcheck, polrelid) as check_expr
                from pg_policy
                where polrelid = 'public.requests'::regclass
                order by polname;
                """
            )
            rows = cur.fetchall()

        print("Policies on public.requests:")
        for polname, polcmd, permissive, roles, using_expr, check_expr in rows:
            print("-", polname, "cmd=", polcmd, "permissive=", permissive, "roles=", roles)
            print("  using:", using_expr)
            if check_expr:
                print("  check:", check_expr)
    finally:
        conn.close()


if __name__ == "__main__":
    main()

