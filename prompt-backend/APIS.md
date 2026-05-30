# Dados sanitários das aldeias indígenas
Essas são as APIs que trazem dados sanitários das aldeias indígenas, tu irá fazer as chamadas e selecionar as colunas desejadas para o output final.

A entrada será o DSEI alvo.

https://apidadosabertos.saude.gov.br/saude-indigena/sasisus-esgotamento-sanitario

https://apidadosabertos.saude.gov.br/saude-indigena/sasi-sus-gerenciamento-de-residuos-solidos

https://apidadosabertos.saude.gov.br/saude-indigena/planilha-de-fornecimento-e-monitoramento-da-qualidade-da-agua-acesso-a-agua


# Dengue
https://apidadosabertos.saude.gov.br/arboviroses/dengue

Você terá como entrada duas coisas: DSEI (distrito de saneamento espacial indigena), Intervalo de tempo entre duas datas, no formato YYYY-MM-DD até YYYY-MM-DD

antes de consumir a api, você deve pesquisar num dicionário de constantes os municípios que esse DSEI atende e traduzir estas para código IBGE que está disponível na API

ao consumir essa API você receberá dados granulados, de casos de dengue no país, você irá filtrar pelas regiões, pelo periodo de tempo e coluna "cs_raca"=5

no final, o unico resultado que preciso é uma contagem de casos dentro desse filtro