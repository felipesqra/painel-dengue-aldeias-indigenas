import pandas as pd
import json

print("Loading DSEI -> Municipios mapping...")
with open('dsei_municipios_mapping.json', 'r') as f:
    dsei_map = json.load(f)

# Reverse mapping: ID_MUNICIP -> List of DSEIs
mun_to_dseis = {}
for dsei, muns in dsei_map.items():
    for m in muns:
        if m not in mun_to_dseis:
            mun_to_dseis[m] = []
        mun_to_dseis[m].append(dsei)

print("Reading Dengue data and aggregating by DSEI...")
chunksize = 500000
dengue_dsei = {dsei: 0 for dsei in dsei_map.keys()}

try:
    for chunk in pd.read_csv('DENGBR26.csv', chunksize=chunksize, usecols=['CS_RACA', 'ID_MUNICIP'], dtype=str, on_bad_lines='skip'):
        indigenas = chunk[chunk['CS_RACA'] == '5']
        
        # Count by ID_MUNICIP
        counts = indigenas['ID_MUNICIP'].value_counts()
        for mun, count in counts.items():
            if mun in mun_to_dseis:
                dseis = mun_to_dseis[mun]
                val = count / len(dseis)
                for d in dseis:
                    dengue_dsei[d] += val
except Exception as e:
    print(f"Error reading dengue: {e}")

print("Reading Sanitation data (Proxy for precariedade hídrica)...")
f1 = 'Esgotamento+sanitário+em+aldeias+no+ambito+do+SasiSUS.xlsx'
f2 = 'Gerenciamento+de+resíduos+sólidos+em+aldeias+no+âmbito+do+SASISUS.xlsx'

df1 = pd.read_excel(f1)
df2 = pd.read_excel(f2)

col_sem_estrutura = 'Existência de estrutura -Percentual de aldeias onde não há estrutura'
col_sem_tratamento = 'Tipo de tratamento de esgoto - Percentual de aldeias sem tratamento'
col_queima = 'Prática de queima de resíduos pela comunidade - Percentual de aldeias que possuem a prática de queima dos resíduos '

dseis = []

population_map = {
    'YANOMAMI': 31000,
    'ALTO RIO NEGRO': 29500,
    'XINGU': 8000,
    'VALE DO JAVARI': 6200,
    'XAVANTE': 25000,
    'KAIAPÓ DO MATO GROSSO': 4800,
    'KAIAPÓ DO PARÁ': 6700
}

for index, row in df1.iterrows():
    dsei = row['Distrito Sanitário Especial Indígena (DSEI)']
    if pd.isna(dsei) or dsei == 'Total Geral' or dsei not in dsei_map:
        continue
    
    row2 = df2[df2['Distrito Sanitário Especial Indígena (DSEI)'] == dsei]
    
    val_sem_estrutura = float(row.get(col_sem_estrutura, 0))
    val_sem_tratamento = float(row.get(col_sem_tratamento, 0))
    val_queima = float(row2[col_queima].values[0]) if not row2.empty else 0
    
    # "Precariedade Hídrica/Sanitária" proxy score 0-100
    vuln_score = (val_sem_estrutura + val_sem_tratamento + val_queima) / 3.0 * 100
    
    
    dengue_count = round(dengue_dsei.get(dsei, 0))
    pop = population_map.get(dsei, 0)
    incidence = round((dengue_count / pop) * 10000, 2) if pop > 0 else 0
    
    dseis.append({
        'dsei': dsei,
        'populacao': pop,
        'ceu_aberto': round(val_sem_tratamento * 100, 2),  # mapping proxy
        'sem_fossa': round(val_sem_estrutura * 100, 2),    # mapping proxy
        'queima_lixo': round(val_queima * 100, 2),
        'vulnerability_score': round(vuln_score, 2),
        'dengue_cases': dengue_count,
        'incidence': incidence
    })

final_data = {
    'dseis': dseis
}

with open('dashboard_data.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print("dashboard_data.json generated successfully.")
