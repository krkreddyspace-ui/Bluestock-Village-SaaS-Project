import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_count():
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM "Village"')
        count = cur.fetchone()[0]
        print(f"Village count: {count}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_count()
