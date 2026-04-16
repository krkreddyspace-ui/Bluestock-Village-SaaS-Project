import pandas as pd

file_path = "d:/study/Projects/Bluestock_Data_Analyst/all-india-villages-master-list-excel/dataset/Rdir_2011_31_LAKSHADWEEP.xls"
print(f"Reading {file_path}...")
df = pd.read_excel(file_path)
print(f"Shape: {df.shape}")
print(df.head())
print("Done")
