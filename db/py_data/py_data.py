import sqlite3
import pandas as pd 

DB_PATH = '../plastic_database.db' 
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

global_year_df = pd.read_csv('../data/global-plastics-production.csv')
global_year_df.to_sql('global_production_by_year', conn, if_exists='append', index=False)

global_polymer_df = pd.read_csv('../data/global-polymer.csv') 
global_polymer_df.to_sql('global_production_by_polymer', conn, if_exists='append', index=False)

global_sector_df = pd.read_csv('../data/global-sector.csv')
global_sector_df.to_sql('global_production_by_industrial_sector', conn, if_exists='append', index=False)

waste_fate_df = pd.read_csv('../data/plastic-fate.csv')
waste_fate_df.to_sql('plastic_waste_by_disp_method', conn, if_exists='append', index=False)

waste_sector_df = pd.read_csv('../data/plastics-waste-sector.csv')
waste_sector_df.to_sql('plastic_waste_by_industrial_sector', conn, if_exists='append', index=False)

waste_polymer_df = pd.read_csv('../data/plastic-waste-polymer.csv')
waste_polymer_df.to_sql('plastic_waste_by_polymer', conn, if_exists='append', index=False)
conn.commit()

cursor.execute("""
        SELECT year, annual_value, cummulative_value, source
        FROM global_production_by_year
        ORDER BY year DESC
        LIMIT 1
    """)

print(cursor.fetchone())
conn.close()