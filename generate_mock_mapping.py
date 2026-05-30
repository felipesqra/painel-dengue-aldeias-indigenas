import pandas as pd
import json
import random

print("Reading DENGBR26.csv to find municipalities with indigenous cases...")
chunksize = 500000
uf_to_municipios = {}

try:
    for chunk in pd.read_csv('DENGBR26.csv', chunksize=chunksize, usecols=['SG_UF_NOT', 'CS_RACA', 'ID_MUNICIP'], dtype=str, on_bad_lines='skip'):
        indigenas = chunk[chunk['CS_RACA'] == '5']
        
        # Group by UF and get unique municipalities
        for uf, df_uf in indigenas.groupby('SG_UF_NOT'):
            if uf not in uf_to_municipios:
                uf_to_municipios[uf] = set()
            uf_to_municipios[uf].update(df_uf['ID_MUNICIP'].dropna().unique().tolist())
except Exception as e:
    print(f"Error reading dengue: {e}")

# Convert sets to lists
for uf in uf_to_municipios:
    uf_to_municipios[uf] = list(uf_to_municipios[uf])

# Map DSEI to primarily overlapping UF codes
# UF codes: 11: RO, 12: AC, 13: AM, 14: RR, 15: PA, 16: AP, 17: TO, 21: MA, 23: CE, 25: PB, 26: PE, 27: AL, 28: SE, 29: BA, 31: MG, 32: ES, 33: RJ, 35: SP, 41: PR, 42: SC, 43: RS, 50: MS, 51: MT
dsei_uf_map = {
    'ALAGOAS E SERGIPE': ['27', '28'], 'ALTAMIRA': ['15'], 'ALTO RIO JURUÁ': ['12'],
    'ALTO RIO NEGRO': ['13'], 'ALTO RIO PURUS': ['12'], 'ALTO RIO SOLIMÕES': ['13'],
    'AMAPÁ E NORTE DO PARÁ': ['16', '15'], 'ARAGUAIA': ['51'], 'BAHIA': ['29'],
    'CEARÁ': ['23'], 'CUIABÁ': ['51'], 'GUAMÁ-TOCANTINS': ['15'],
    'INTERIOR SUL': ['41', '42', '43'], 'KAIAPÓ DO MATO GROSSO': ['51'], 'KAIAPÓ DO PARÁ': ['15'],
    'LESTE DE RORAIMA': ['14'], 'LITORAL SUL': ['35', '33', '41', '42', '43'], 'MANAUS': ['13'],
    'MARANHÃO': ['21'], 'MATO GROSSO DO SUL': ['50'], 'MÉDIO RIO PURUS': ['13'],
    'MÉDIO RIO SOLIMÕES E AFLUENTES': ['13'], 'MINAS GERAIS E ESPÍRITO SANTO': ['31', '32'],
    'PARINTINS': ['13'], 'PERNAMBUCO': ['26'], 'PORTO VELHO': ['11'],
    'POTIGUARA': ['25'], 'RIO TAPAJÓS': ['15'], 'TOCANTINS': ['17'],
    'VALE DO JAVARI': ['13'], 'VILHENA': ['11'], 'XAVANTE': ['51'],
    'XINGU': ['51', '15'], 'YANOMAMI': ['14', '13']
}

dsei_municipios = {}

for dsei, ufs in dsei_uf_map.items():
    munis_for_dsei = []
    for uf in ufs:
        if uf in uf_to_municipios and uf_to_municipios[uf]:
            # For hackathon mockup: assign half of the state's indigenous municipalities to each DSEI in that state
            # To ensure it works and distributes them, we just pick a random sample or assign all if small
            available = uf_to_municipios[uf]
            munis_for_dsei.extend(random.sample(available, max(1, len(available)//2)))
    dsei_municipios[dsei] = list(set(munis_for_dsei))

with open('dsei_municipios_mapping.json', 'w') as f:
    json.dump(dsei_municipios, f, indent=2)

print("dsei_municipios_mapping.json generated.")
