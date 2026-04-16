import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import time

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
DATASET_DIR = "d:/study/Projects/Bluestock_Data_Analyst/all-india-villages-master-list-excel/dataset"

def get_connection():
    return psycopg2.connect(DB_URL)

def process_file(filename, country_id):
    file_path = os.path.join(DATASET_DIR, filename)
    file_start_time = time.time()
    
    # 1. Load data logic (Sheet selection & Header management)
    try:
        if filename.endswith('.ods'):
            df = pd.read_excel(file_path, engine='odf')
        else:
            xl = pd.ExcelFile(file_path)
            # Pick 'Village Directory' if it exists (usually has the data), else use the first sheet
            sheet_name = 'Village Directory' if 'Village Directory' in xl.sheet_names else xl.sheet_names[0]
            df = xl.parse(sheet_name)
            
            # Specialized fallback for Madhya Pradesh or other files with unnamed/missing headers
            if 'MDDS STC' not in [str(c).strip() for c in df.columns]:
                # Try reading with no header if the standard one is missing
                df_raw = xl.parse(sheet_name, header=None)
                # MP logic: Row 3 ("Madhya Pradesh") indicates data starts at row 4
                if "Madhya Pradesh" in str(df_raw.iloc[3, 4]) or "Madhya Pradesh" in str(df_raw.iloc[2, 4]):
                    start_row = 4 if "Madhya Pradesh" in str(df_raw.iloc[3, 4]) else 3
                    df = df_raw.iloc[start_row:].copy()
                    df.columns = ['MDDS STC', 'MDDS DTC', 'MDDS Sub_DT', 'MDDS PLCN', 'Area Name', 'Extra']
                    df['STATE NAME'] = 'MADHYA PRADESH'
                else:
                    # If it's still missing, try to find a row that looks like a header
                    df.columns = [str(c).strip() for c in df.columns]
        
        df.columns = [str(c).strip() for c in df.columns]
    except Exception as e:
        print(f"  - Error reading {filename}: {str(e)}")
        return False

    # 2. Resilient Database operations
    max_retries = 3
    for attempt in range(max_retries):
        conn = None
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            # Ensure STC exists
            state_row = df.iloc[0]
            state_code = str(state_row['MDDS STC'])
            state_name = state_row.get('STATE NAME', 'MADHYA PRADESH' if 'MADHYA PRADESH' in filename.upper() else 'UNKNOWN')
            
            cur.execute(
                "INSERT INTO \"State\" (code, name, \"countryId\") VALUES (%s, %s, %s) ON CONFLICT (code) DO UPDATE SET name = %s RETURNING id;",
                (state_code, state_name, country_id, state_name)
            )
            state_id = cur.fetchone()[0]

            # Districts
            districts = df[['MDDS DTC', 'DISTRICT NAME']].drop_duplicates()
            for _, d_row in districts.iterrows():
                d_code = str(d_row['MDDS DTC'])
                d_name = d_row['DISTRICT NAME']
                if d_code == '0' or pd.isna(d_name): continue
                cur.execute(
                    "INSERT INTO \"District\" (code, name, \"stateId\") VALUES (%s, %s, %s) ON CONFLICT (code) DO UPDATE SET name = %s RETURNING id;",
                    (d_code, d_name, state_id, d_name)
                )

            # Sub-Districts
            sub_districts = df[['MDDS DTC', 'MDDS Sub_DT', 'SUB-DISTRICT NAME']].drop_duplicates()
            for _, sd_row in sub_districts.iterrows():
                sd_code = str(sd_row['MDDS Sub_DT'])
                sd_name = sd_row['SUB-DISTRICT NAME']
                if sd_code == '0' or pd.isna(sd_name): continue
                
                cur.execute("SELECT id FROM \"District\" WHERE code = %s AND \"stateId\" = %s;", (str(sd_row['MDDS DTC']), state_id))
                res = cur.fetchone()
                if not res: continue
                
                cur.execute(
                    "INSERT INTO \"SubDistrict\" (code, name, \"districtId\") VALUES (%s, %s, %s) ON CONFLICT (code) DO UPDATE SET name = %s RETURNING id;",
                    (sd_code, sd_name, res[0], sd_name)
                )

            # Villages (Batch)
            villages_df = df[df['MDDS PLCN'] != 0]
            cur.execute("SELECT id, code FROM \"SubDistrict\" WHERE \"districtId\" IN (SELECT id FROM \"District\" WHERE \"stateId\" = %s);", (state_id,))
            sd_map = {code: id for id, code in cur.fetchall()}

            village_records = []
            for _, v_row in villages_df.iterrows():
                sd_code = str(v_row['MDDS Sub_DT'])
                if sd_code in sd_map:
                    village_records.append((str(v_row['MDDS PLCN']), str(v_row['Area Name']), sd_map[sd_code]))

            if village_records:
                execute_values(cur, "INSERT INTO \"Village\" (code, name, \"subDistrictId\") VALUES %s ON CONFLICT (code) DO NOTHING;", village_records)
            
            conn.commit()
            print(f"  - Success! Finished {filename} ({len(village_records)} villages) in {time.time() - file_start_time:.1f}s")
            return True

        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            print(f"  - Connection failure on {filename} (Attempt {attempt+1}): {str(e)}")
            time.sleep(10)
        except Exception as e:
            print(f"  - Error in {filename}: {str(e)}")
            if conn: conn.rollback()
            return False
        finally:
            if conn: conn.close()
    
    return False

def import_data():
    start_time = time.time()
    
    # Init Country
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO \"Country\" (code, name) VALUES ('IN', 'India') ON CONFLICT (code) DO UPDATE SET name = 'India' RETURNING id;")
    country_id = cur.fetchone()[0]
    conn.commit()
    conn.close()

    all_files = [f for f in os.listdir(DATASET_DIR) if f.endswith(('.xls', '.ods', '.xlsx'))]
    # Sort files by size
    files = sorted(all_files, key=lambda x: os.path.getsize(os.path.join(DATASET_DIR, x)))
    
    for idx, filename in enumerate(files):
        print(f"\n[{idx+1}/{len(files)}] Syncing {filename}...")
        process_file(filename, country_id)

    print(f"\nFinal Global Dataset Sync Complete in {(time.time() - start_time)/60:.1f} minutes")

if __name__ == "__main__":
    import_data()
