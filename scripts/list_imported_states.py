import os, psycopg2
from dotenv import load_dotenv
load_dotenv()
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    cur.execute('SELECT name FROM "State"')
    states = [r[0] for r in cur.fetchall()]
    print(f"Imported states: {', '.join(states)}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
