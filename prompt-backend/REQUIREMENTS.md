# Dados e APIs
Responsabilidade

Ficar responsável por obter, organizar e entregar os dados para o dashboard.

O que essa pessoa deve fazer
Selecionar um DSEI ou um conjunto pequeno de municípios para o MVP.
Criar uma base consolidada com os dados principais.
Padronizar os campos de município, estado, DSEI e, quando possível, aldeia.

DSEI que serão utilizadas e cidades que atendem:
```
ALTO DO RIO NEGRO
- São Gabriel da Cachoeira, código 1303809
- Santa Isabel do Rio Negro, código 1303601
- Barcelos, código IBGE 1300409
KAIAPÓ DO MATO GROSSO
- Alta Floresta, código IBGE 5100250
- Apiacás, código IBGE 5100805
- Colíder, código IBGE 5103205
- Guarantã do Norte, código IBGE 5104104
- Juara, código IBGE 5105101
- Matupá, código IBGE 5105606
- Nova Bandeirantes, código IBGE 5106158
- Peixoto de Azevedo, código IBGE 5106422
- São José do Xingu, código IBGE 5107354
KAIAPÓ DO PARÁ
- Cumaru do Norte, código IBGE 1502764
- Bannach, código IBGE 1501253
- Pau D'arco, código IBGE 1505551
- São Félix do Xingu, código IBGE 1507300
- Ourilândia do Norte, código IBGE 1505437
- Redenção, código IBGE 1506138
- Santana do Araguaia, código IBGE 1506708
- Altamira, código IBGE 1500602
VALE DO JAVARI
- Atalaia do Norte, código IBGE 1300201
- Benjamin Constant, código IBGE 1300607
- São Paulo de Olivença, código IBGE 1303908
- Jutaí, código IBGE 1302306
XINGU
- Canarana, código IBGE 5102504
- Gaúcha do Norte, código IBGE 5103858
- Querência, código IBGE 5107040
- Marcelândia, código IBGE 5105580
- Feliz Natal, código IBGE 5103742
- São José do Xingu, código IBGE 5107578
- São Félix do Araguaia, código IBGE 5107404
- Paranatinga, código IBGE 5106240
- Peixoto de Azevedo, código IBGE 5106422
YANOMANI
- Alto Alegre, código IBGE 1400055
- Amajari, código IBGE 1400022
- Caracaraí, código IBGE 1400204
- Iracema, código IBGE 1400287
- Mucajaí, código IBGE 1400303
- Barcelos, código IBGE 1300409
- Santa Isabel do Rio Negro, código IBGE 1303601
- São Gabriel da Cachoeira, código IBGE 1303809
```

Transformar os percentuais em números utilizáveis pelo painel.
Entregar os dados em JSON, CSV ou diretamente via endpoint simples.
Dados mínimos para o MVP
A base final pode ter uma estrutura como:

```
{
    "dsei": "YANOMAMI",
    "casos_dengue": 123,
    "data_init": "2024-01-01",
    "data_end": "2024-01-31",
    "qualidade_agua": {
      "populacao_total": "28229",
      "_de_aldeias_monitoradas_em_relacao_ao_total": "5%",
      "sem_info_pop": "273",
      "_aldeia_sem_fornecimento": "87%",
      "pop_total_com_infraestrutura_de_abastecimento": "8475",
      "n_aldeias_pmqai": "44",
      "requer_substituicao_pop": null,
      "_aldeias_com_infraestrutura": "13%",
      "numero_de_aldeias": "366",
      "satisfatorio_pop": "7201",
      "soma_de_infraestrutura_saasac": "48",
      "satisfatorio__aldeia": "12%",
      "dsei": "YANOMAMI",
      "_aldeia_abastecimento_caminhao_pipa": "0,0%",
      "pop_total_abastecimento_por_caminhao_pipa": null,
      "_de_aldeias_monitoradas_em_relacao_ao_pmqai_planejado": "38%",
      "requer_manutencao_pop": "1001",
      "media_do_numero_de_aldeias_monitoradas_no_mes_com_analise_dos_6": "17",
      "pop_sem_fornecimento": "19754",
      "requer_manutencao__aldeia": "1%",
      "requer_substituicao__aldeia": "0%",
      "sem_info__aldeia": "1%"
    },
    "residuos": {
      "coleta_e_destinacao_de_residuos_solidos_percentual_de_aldeias_onde_o_dsei_e_o_principal_responsavel": "0%",
      "coleta_e_destinacao_de_residuos_solidos_percentual_de_aldeias_onde_nao_ha_informacao_sobre_os_responsaveis": "100%",
      "coleta_e_destinacao_de_residuos_solidos_percentual_de_aldeias_onde_os_catadores_sao_os_principais_responsaveis": "0%",
      "coleta_e_destinacao_de_residuos_solidos_percentual_de_aldeias_onde_a_prefeitura_e_a_principal_responsavel": "0%",
      "coleta_e_destinacao_de_residuos_solidos_percentual_de_aldeias_onde_a_propria_aldeia_e_a_principal_responsavel": "0%",
      "destinacao_dos_residuos_organicos_percentual_de_aldeias_que_destinam_os_residuos_organicos_junto_com_os_residuos_comuns": "100%",
      "destinacao_dos_residuos_organicos_percentual_de_aldeias_que_destinam_os_residuos_organicos_no_lixao_da_aldeia": "0%",
      "destinacao_dos_residuos_organicos_percentual_de_aldeias_que_destinam_os_residuos_organicos_na_mata_longe_das_aldeias": "0%",
      "destinacao_dos_residuos_organicos_percentual_de_aldeias_que_utilizam_os_residuos_organicos_para_alimentacao_de_animais": "0%",
      "destinacao_dos_residuos_organicos_percentual_de_aldeias_que_utilizam_os_residuos_organicos_para_compostagem": "0%",
      "destinacao_dos_residuos_organicos_percentual_de_aldeias_sem_informacao_sobre_a_destinacao_dos_residuos_organicos": "0%",
      "distrito_sanitario_especial_indigena_dsei": "YANOMAMI",
      "logistica_reversa_percentual_de_aldeias_que_realizam_logistica_reserva": "0%",
      "possui_coleta_seletiva_implantada_percentual_de_aldeias_que_nao_possuem_coleta_seletiva": "100%",
      "possui_coleta_seletiva_implantada_percentual_de_aldeias_que_possuem_coleta_seletiva": "0%",
      "possui_coleta_seletiva_implantada_percentual_de_aldeias_sem_informacao_sobre_coleta_seletiva": "0%",
      "possui_vala_construida_pela_comunidade_percentual_de_aldeias_com_presenca_de_valas_construidas_pela_comunidade": "100%",
      "possui_vala_construida_pela_comunidade_percentual_de_aldeias_que_nao_possuem_valas_construidas_pela_comunidade": "0%",
      "possui_vala_construida_pela_comunidade_percentual_de_aldeias_sem_informacoes_sobre_valas_construidas_pela_comunidade": "0%",
      "pratica_de_queima_de_residuos_pela_comunidade_percentual_de_aldeias_que_possuem_a_pratica_de_queima_dos_residuos": "0%",
      "pratica_de_queima_de_residuos_pela_comunidade_percentual_de_aldeias_que_nao_possuem_a_pratica_de_queima_dos_residuos": "100%",
      "pratica_de_queima_de_residuos_pela_comunidade_percentual_de_aldeias_sem_informacao_sobre_a_pratica_de_queima_dos_residuos": "0%"
    },
    "esgotamento_sanitario": {
      "exist_estrut_perc_ald_sem_estrutura": "100%",
      "est_conserv_estrut_perc_ald_estrut_exist_regular": "0%",
      "tipo_trat_esgoto_perc_ald_tratamento_por_fossa_filtro_sumidouro": "0%",
      "est_conserv_estrut_perc_ald_estrut_exist_requer_interd_subst": "0%",
      "tipo_trat_esgoto_perc_ald_destinacao_nos_corpos_hidricos": "0%",
      "tipo_trat_esgoto_perc_ald_sem_informacao": "0%",
      "exist_estrut_perc_ald_melhorias_sanits_domic_mds_indiv_coletiv": "0%",
      "exist_estrut_perc_ald_coleta_pela_rede_publica": "0%",
      "est_conserv_estrut_perc_ald_onde_nao_existe_estrut_tratamento": "100%",
      "est_conserv_estrut_perc_ald_estrut_exist_satisfatoria": "0%",
      "exist_estrut_perc_ald_coleta_pela_rede_sesai": "0%",
      "exist_estrut_perc_ald_sem_informacao": "0%",
      "tipo_trat_esgoto_perc_ald_tratamento_por_fossa_seca": "0%",
      "est_conserv_estrut_perc_ald_sem_informacao_sobre_a_estrutura": "0%",
      "est_conserv_estrut_perc_ald_estrut_exist_insatisfatoria": "0%",
      "est_conserv_estrut_perc_ald_estrut_exist_requer_manutencao": "0%",
      "distrito_sanitario_especial_indigena": "YANOMAMI",
      "tipo_trat_esgoto_perc_ald_tratamento_por_fossa_rudimentar": "0%",
      "tipo_trat_esgoto_perc_ald_tratamento_por_fossa_sumidouro": "0%",
      "tipo_trat_esgoto_perc_ald_sem_tratamento": "100%",
      "tipo_trat_esgoto_perc_ald_atendidas_por_concessionaria": "0%",
      "exist_estrut_perc_ald_casinha_latrina": "0%",
      "exist_estrut_perc_ald_banheiro_particular": "0%"
    }
}
```

Entrega esperada

Essa pessoa deve entregar:
dados_dashboard.json
ou
dados_dashboard.csv
Mesmo que alguns dados estejam simulados no MVP, eles devem seguir a estrutura real que depois será alimentada por API.
