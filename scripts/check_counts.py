import os, psycopg2
from dotenv import load_dotenv
load_dotenv()
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM "Village"')
    print(f"Village count: {cur.fetchone()[0]}")
    cur.execute('SELECT COUNT(*) FROM "SubDistrict"')
    print(f"SubDistrict count: {cur.fetchone()[0]}")
    cur.execute('SELECT COUNT(*) FROM "District"')
    print(f"District count: {cur.fetchone()[0]}")
    cur.execute('SELECT COUNT(*) FROM "State"')
    print(f"State count: {cur.fetchone()[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
