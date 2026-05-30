import requests
import json
import unicodedata

def normalize_str(s):
    return unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('utf-8').upper()

# Fetch all municipalities from IBGE
print("Fetching IBGE municipalities...")
resp = requests.get("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
muns = resp.json()

mun_dict = {}
for m in muns:
    if not m.get('microrregiao'): continue
    name = normalize_str(m['nome'])
    uf = m['microrregiao']['mesorregiao']['UF']['sigla']
    # IBGE codes in SINAN are 6 digits (without the 7th check digit)
    code_6 = str(m['id'])[:6]
    mun_dict[f"{name}-{uf}"] = code_6

# Define obvious DSEIs and their known municipalities
target_dseis = {
    "YANOMAMI": [
        ("AMAJARI", "RR"), ("ALTO ALEGRE", "RR"), ("BOA VISTA", "RR"), 
        ("CARACARAI", "RR"), ("IRACEMA", "RR"), ("MUCAJAI", "RR"), ("NORMANDIA", "RR"),
        ("BARCELOS", "AM"), ("SANTA ISABEL DO RIO NEGRO", "AM"), ("SAO GABRIEL DA CACHOEIRA", "AM")
    ],
    "XINGU": [
        ("SAO FELIX DO ARAGUAIA", "MT"), ("MARCELANDIA", "MT"), ("PARANATINGA", "MT"), 
        ("CAMPINAPOLIS", "MT"), ("FELIZ NATAL", "MT"), ("GAUCHA DO NORTE", "MT"), 
        ("NOVA UBIRATA", "MT"), ("QUERENCIA", "MT"), ("SAO JOSE DO XINGU", "MT"), ("CANARANA", "MT")
    ],
    "VALE DO JAVARI": [
        ("ATALAIA DO NORTE", "AM"), ("BENJAMIN CONSTANT", "AM"), ("JUTAI", "AM"), ("SAO PAULO DE OLIVENCA", "AM")
    ],
    "XAVANTE": [
        ("AGUA BOA", "MT"), ("BARRA DO GARCAS", "MT"), ("CAMPINAPOLIS", "MT"), 
        ("CANARANA", "MT"), ("GENERAL CARNEIRO", "MT"), ("NOVA NAZARE", "MT"), 
        ("NOVO SAO JOAQUIM", "MT"), ("PARANATINGA", "MT"), ("POXOREU", "MT"), 
        ("RIBEIRAO CASCALHEIRA", "MT"), ("SANTO ANTONIO DO LESTE", "MT"), ("SAO FELIX DO ARAGUAIA", "MT")
    ],
    "ALTO RIO NEGRO": [
        ("SAO GABRIEL DA CACHOEIRA", "AM"), ("SANTA ISABEL DO RIO NEGRO", "AM"), ("BARCELOS", "AM")
    ],
    "KAIAPÓ DO MATO GROSSO": [
        ("COLIDER", "MT"), ("GUARANTA DO NORTE", "MT"), ("MATUPA", "MT"), ("PEIXOTO DE AZEVEDO", "MT")
    ],
    "KAIAPÓ DO PARÁ": [
        ("CUMARU DO NORTE", "PA"), ("OURILANDIA DO NORTE", "PA"), ("SAO FELIX DO XINGU", "PA"), ("BANNACH", "PA")
    ]
}

dsei_mapping = {}

for dsei, mun_list in target_dseis.items():
    codes = []
    for m, uf in mun_list:
        key = f"{m}-{uf}"
        if key in mun_dict:
            codes.append(mun_dict[key])
        else:
            print(f"Warning: Municipality {key} not found in IBGE API")
    dsei_mapping[dsei] = list(set(codes))

# Write the real mapping
with open('dsei_municipios_mapping.json', 'w') as f:
    json.dump(dsei_mapping, f, indent=2)

print("dsei_municipios_mapping.json updated with REAL IBGE codes!")
