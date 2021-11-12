/**
 * This contains all of the indicators that have to be requested from the eurostat API formatted as:
 * CATEGORY: {
 *  endpoint:string           If all the indicators of a certain categories have a common endpoint or at least the root of an endpoint it is here
 *  indicators: {             All the indicators of a certain category
 *    INDICATOR: {
 *      desc:string           A description of the indicator as written in the R script I got the indicators from
 *      endpoint:string       OPTIONAL: If the indicators don't have a common endpoint or if only the root is common this will contain
 *                            the entire endpoint or the suffix
 *      parameter:string      All of the parameters needed to get the right indicator are here (e.g. sex, age, unit, ...)
 *      composite:string      OPTIONAL: If this exists the indicator is a composite one and contains another parameter called additional_data
 *      additional_data: {    OPTIONAL: All the data needed for composite indicators (other endpoint with relative parameters, ...)
 *        endpoint:           The endpoint for the additional indicator
 *        parameter:string    All of the parameters needed to get the right indicator are here (e.g. sex, age, unit, ...)
 *        composition_operation:function  The function used to composite the main and additional indicators is here
 *      }
 *    }
 *  }
 * }
 */
module.exports = {
  eurostat_indicators: {
    GDP: {
      endpoint: 'nama_10r_3gdp',
      indicators: {
        GDP: {
          desc: 'GDP at current market prices - Million Euro - (NUTS2,NUTS3)',
          unit: 'MIO_EUR',
        },
        GDPpps: {
          desc: 'GDP purchasing power standards (PPS) - Million - (NUTS2,NUTS3)',
          unit: 'MIO_PPS_EU27_2020',
        },
        GDPpc: {
          desc: 'GDP per inhabitant - Euro per inhabitant (NUTS2,NUTS3)',
          unit: 'EUR_HAB',
        },
        GDPpps_pc: {
          desc: 'GDP Purchasing power standard (PPS) per inhabitant  - (NUTS2,NUTS3)',
          unit: 'PPS_EU27_2020_HAB',
        },
        GDPdens: {
          desc: 'GDP density - Million Euro per km2 - (NUTS2,NUTS3)',
          unit: 'MIO_EUR',
          composite: 'true',
          additional_data: {
            endpoint: 'reg_area3',
            landuse: 'TOTAL',
            unit: 'KM2',
            composition_operation: (main, additional) => main / additional,
          },
        },
      },
    },
    GVA: {
      endpoint: 'nama_10r_',
      indicators: {
        GVA: {
          desc: 'Gross Value added - Million Euro - (NUTS2, NUTS3)',
          endpoint: '3gva',
          unit: 'MIO_EUR',
          nace_r2: 'TOTAL',
        },
        GVApc: {
          desc: 'Gross Value added per capita - Euro per person - (NUTS2,NUTS3)',
          endpoint: '3gva',
          unit: 'MIO_EUR',
          nace_r2: 'TOTAL',
        },
        GVAagr: {
          desc: 'Gross Value added - Million Euro - (NUTS2, NUTS3 - Sector- Agriculture, forestry and fishing )',
          endpoint: '3gva',
          unit: 'MIO_EUR',
          nace_r2: 'A',
          composite: 'true',
          additional_data: {
            endpoint: 'nama_10r_3gva',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        GVAind: {
          desc: 'Gross Value added - Million Euro - (NUTS2, NUTS3 - Sector- Industry (except construction) )',
          endpoint: '3gva',
          unit: 'MIO_EUR',
          nace_r2: 'B-E',
          composite: 'true',
          additional_data: {
            endpoint: 'nama_10r_3gva',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        GVAmnf: {
          desc: 'Gross Value added - Million Euro - (NUTS2, NUTS3 - Sector - Manufacturing )',
          endpoint: '3gva',
          unit: 'MIO_EUR',
          nace_r2: 'C',
          composite: 'true',
          additional_data: {
            endpoint: 'nama_10r_3gva',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        GVAcnstr: {
          desc: 'Gross Value added - Million Euro - (NUTS2, NUTS3 - Sector - Construction )',
          endpoint: '3gva',
          unit: 'MIO_EUR',
          nace_r2: 'F',
          composite: 'true',
          additional_data: {
            endpoint: 'nama_10r_3gva',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        GVAgr: {
          desc: 'Real growth rate of regional gross value added (GVA) at basic prices - (NUTS2)',
          endpoint: '2gvagr',
          unit: 'I15',
        },
      },
    },
    HOUSEHOLDINCOME: {
      endpoint: 'nama_10r_2hhinc',
      indicators: {
        HHI: {
          desc: 'Household income - Million Euro - (NUTS2)',
          unit: 'MIO_EUR',
          direct: 'BAL',
          na_item: 'B5N',
        },
        HHIpc: {
          desc: 'Household income - Euro per inhabitant - (NUTS2)',
          unit: 'EUR_HAB',
          direct: 'BAL',
          na_item: 'B5N',
        },
        HHIpps: {
          desc: 'Household income purchasing power standards (PPS) - Million - (NUTS2)',
          unit: 'MIO_PPS_EU27_2020',
          direct: 'BAL',
          na_item: 'B5N',
        },
        HHIpps_pc: {
          desc: 'Household income purchasing power standards (PPS) per inhabitant - (NUTS2)',
          unit: 'PPS_EU27_2020_HAB',
          direct: 'BAL',
          na_item: 'B5N',
        },
      },
    },
    EMPLOYMENT: {
      endpoint: '',
      indicators: {
        EMPL: {
          desc: 'Employment - Thousand people - (NUTS2, NUTS3)',
          endpoint: 'nama_10r_3empers',
          nace_r2: 'TOTAL',
          wstatus: 'EMP',
        },
        EMPLeap: {
          desc: 'Employment - Thousand people - (NUTS2 - by age - 15-64)',
          endpoint: 'lfst_r_lfe2emp',
          age: 'Y15-64',
          sex: 'T',
        },
        EMPLf: {
          desc: 'Employment - Thousand people - (NUTS2 - by sex - Female)',
          endpoint: 'lfst_r_lfe2emp',
          age: 'Y15-64',
          sex: 'F',
        },
        EMPLagr: {
          desc: 'Employment - Thousand people - (NUTS2 - by sector - Agriculture, forestry and fishing)',
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'A',
          composite: 'true',
          additional_data: {
            endpoint: 'lfst_r_lfe2en2',
            age: 'Y15-64',
            sex: 'T',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        EMPLf: {
          desc: 'Employment - Thousand people - (NUTS2 - by sector - Industry (except construction))',
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'B-E',
          composite: 'true',
          additional_data: {
            endpoint: 'lfst_r_lfe2en2',
            age: 'Y15-64',
            sex: 'T',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        EMPLind: {
          desc: 'Employment - Thousand people - (NUTS2 - by sector - Industry (except construction))',
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'B-E',
          composite: 'true',
          additional_data: {
            endpoint: 'lfst_r_lfe2en2',
            age: 'Y15-64',
            sex: 'T',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        EMPLcnstr: {
          desc: 'Employment - Thousand people - (NUTS2 - by sector - Construction)',
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'F',
          composite: 'true',
          additional_data: {
            endpoint: 'lfst_r_lfe2en2',
            age: 'Y15-64',
            sex: 'T',
            nace_r2: 'TOTAL',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        EMPLr: {
          desc: 'Employment rate - percentage - (NUTS2 - by age - 15-64)',
          endpoint: 'lfst_r_lfe2emprt',
          age: 'Y15-64',
          sex: 'T',
        },
        EMPLrf: {
          desc: 'Employment rate - percentage - (NUTS2 - by sex - Female)',
          endpoint: 'lfst_r_lfe2emprt',
          age: 'Y15-64',
          sex: 'F',
        },
        EMPLkt: {
          desc: 'Employment in technology and knowledge-intensive sectors - Percentage of total employment (NUTS2)',
          endpoint: 'htec_emp_reg2',
          unit: 'PC_EMP',
          sex: 'T',
          nace_r2: 'HTC',
        },
        EMPLktf: {
          desc: 'Employment in technology and knowledge-intensive sectors-Percentage of total employment (NUTS2 by sex-Female)',
          endpoint: 'htec_emp_reg2',
          unit: 'PC_EMP',
          sex: 'F',
          nace_r2: 'HTC',
        },
        UEMPL: {
          desc: 'Unemployment - Thousand people - (NUTS2 - by age - 15-74)',
          endpoint: 'lfst_r_lfu3pers',
          age: 'Y15-74',
          sex: 'T',
          isced11: 'TOTAL',
        },
        UEMPLf: {
          desc: 'Unemployment - Thousand people - (NUTS2 - by sex - Female)',
          endpoint: 'lfst_r_lfu3pers',
          age: 'Y15-74',
          sex: 'F',
          isced11: 'TOTAL',
        },
        UEMPLr: {
          desc: 'Unemployment rate - Percentage - (NUTS2 - by age - 15-74)',
          endpoint: 'lfst_r_lfu3rt',
          age: 'Y15-74',
          sex: 'T',
          isced11: 'TOTAL',
        },
        UEMPLrf: {
          desc: 'Unemployment rate - Percentage - (NUTS2 - by sex - Female)',
          endpoint: 'lfst_r_lfu3rt',
          age: 'Y15-74',
          sex: 'F',
          isced11: 'TOTAL',
        },
        LUEMPLr: {
          desc: 'Long term unemployment rate - Percentage - (NUTS2)',
          endpoint: 'lfst_r_lfu2ltu',
          unit: 'PC_ACT',
          age: 'Y15-74',
          sex: 'T',
          isced11: 'TOTAL',
        },
        LUEMPLrf: {
          desc: 'Long term unemployment rate - Percentage - (NUTS2 - by sex = Female)',
          endpoint: 'lfst_r_lfu2ltu',
          unit: 'PC_ACT',
          age: 'Y15-74',
          sex: 'F',
          isced11: 'TOTAL',
        },
        AROPE: {
          desc: 'People at risk of poverty or social exclusion - Percentage - (NUTS2)',
          endpoint: 'ilc_peps11',
          unit: 'PC',
        },
        MatDep: {
          desc: 'Severe material deprivation rate - Percentage - (NUTS2)',
          endpoint: 'ilc_mddd21',
          unit: 'PC',
        },
        COMTr: {
          desc: 'Commuting rate - Percentage - Outside the region (NUTS2)',
          endpoint: 'lfst_r_lfe2ecomm',
          sex: 'T',
          age: 'Y15-64',
          c_work: 'OUTR',
          composite: 'true',
          additional_data: {
            endpoint: 'lfst_r_lfp2act',
            age: 'Y15-64',
            sex: 'T',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        COMTrf: {
          desc: 'Commuting rate - Percentage - Outside the region (NUTS2 - Female)',
          endpoint: 'lfst_r_lfe2ecomm',
          sex: 'F',
          age: 'Y15-64',
          c_work: 'OUTR',
          composite: 'true',
          additional_data: {
            endpoint: 'lfst_r_lfp2act',
            age: 'Y15-64',
            sex: 'F',
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
      },
    },
    DEPENDENCY: {
      // TO_ASK: ???????
      endpoint: 'demo_r_pjangrp3',
      indicators: {
        DPNDr: {
          desc: 'Age dependency ratio (% of working-age population)  (NUTS 3 by age - (0-14 & > 65)/ 15-64 )',
          unit: 'NR',
          sex: 'T',
          age: [
            'Y_LT5',
            'Y5-9',
            'Y10-14',
            'Y65-69',
            'Y70-74',
            'Y75-79',
            'Y80-84',
            'Y85-89',
            'Y_GE90',
          ],
          combined_parameter: 'age',
          combining_operation: (parameter_list) => {
            return parameter_list.reduce(
              (sum, currentValue) => (sum += currentValue)
            );
          },
          composite: 'true',
          additional_data: {
            endpoint: 'demo_r_pjangrp3',
            unit: 'NR',
            sex: 'T',
            age: [
              'Y15-19',
              'Y20-24',
              'Y25-29',
              'Y30-34',
              'Y35-39',
              'Y40-44',
              'Y45-49',
              'Y50-54',
              'Y55-59',
              'Y60-64',
            ],
            combined_parameter: 'age',
            combining_operation: (parameter_list) => {
              return parameter_list.reduce(
                (sum, currentValue) => (sum += currentValue)
              );
            },
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        OADr: {
          desc: 'Old age dependency  (NUTS 2 by age- 75 years or over / 15-64)', //TO_ASK: 75 or over? I assume it should be 65?
          unit: 'NR',
          sex: 'T',
          age: ['Y65-69', 'Y70-74', 'Y75-79', 'Y80-84', 'Y85-89', 'Y_GE90'],
          combined_parameter: 'age',
          combining_operation: (parameter_list) => {
            return parameter_list.reduce(
              (sum, currentValue) => (sum += currentValue)
            );
          },
          composite: 'true',
          additional_data: {
            endpoint: 'demo_r_pjangrp3',
            unit: 'NR',
            sex: 'T',
            age: [
              'Y15-19',
              'Y20-24',
              'Y25-29',
              'Y30-34',
              'Y35-39',
              'Y40-44',
              'Y45-49',
              'Y50-54',
              'Y55-59',
              'Y60-64',
            ],
            combined_parameter: 'age',
            combining_operation: (parameter_list) => {
              return parameter_list.reduce(
                (sum, currentValue) => (sum += currentValue)
              );
            },
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
        YADr: {
          desc: 'Young Age dependency ratio (% of working-age population)  (NUTS 3 by age - 0-14/ 15-64 )',
          unit: 'NR',
          sex: 'T',
          age: ['Y_LT5', 'Y5-9', 'Y10-14'],
          combined_parameter: 'age',
          combining_operation: (parameter_list) => {
            return parameter_list.reduce(
              (sum, currentValue) => (sum += currentValue)
            );
          },
          composite: 'true',
          additional_data: {
            endpoint: 'demo_r_pjangrp3',
            unit: 'NR',
            sex: 'T',
            age: [
              'Y15-19',
              'Y20-24',
              'Y25-29',
              'Y30-34',
              'Y35-39',
              'Y40-44',
              'Y45-49',
              'Y50-54',
              'Y55-59',
              'Y60-64',
            ],
            combined_parameter: 'age',
            combining_operation: (parameter_list) => {
              return parameter_list.reduce(
                (sum, currentValue) => (sum += currentValue)
              );
            },
            composition_operation: (main, additional) => (main / additional) * 100,
          },
        },
      },
    },
    DEMOGRAPHICS: {
      endpoint: 'demo_r_d3dens',
      indicators: {
        POPdens: {
          desc: 'Population density- Persons per square kilometer (NUTS3)',
          unit: 'PER_KM2',
        },
      },
    },
    MORTALITY: {
      endpoint: 'demo_r_minfind',
      indicators: {
        IMR: {
          desc: 'Infant mortality rate-Percentage(NUTS2-total)',
          unit: 'RT',
        },
      },
    },
    LIFEEXPECTANCY: {
      endpoint: 'demo_r_mlifexp',
      indicators: {
        LE: {
          desc: 'Life expectancy-Year(NUTS2-by age-Less than 1year)',
          age: 'Y_LT1',
          sex: 'T',
        },
        LEf: {
          desc: 'Life expectancy-Year(NUTS2-by sex-Female-Less than 1year)',
          age: 'Y_LT1',
          sex: 'F',
        },
        LEm: {
          desc: 'Life expectancy-Year(NUTS2-by sex-Male-Less than 1year)',
          age: 'Y_LT1',
          sex: 'M',
        },
      },
    },
    LIVESTOCK: {
      endpoint: 'ef_olslsureg',
      indicators: {
        LUS: {
          desc: 'Livestock- Total number of holdings (NUTS2-number of farms and heads of animals by livestock units (LSU) of farm)',
          lsu: 'TOTAL',
          indic_ef: 'HOLD_HOLD',
        },
        LUSh: {
          desc: 'Livestock- LSU of the holdings with livestock (NUTS2-number of farms and heads of animals by livestock units (LSU) of farm)',
          lsu: 'TOTAL',
          indic_ef: 'C_LIVESTOCK_LSU',
        },
      },
    },
    LANDCOVER: {
      endpoint: 'lan_lcv_ovw',
      indicators: {
        LC: {
          desc: 'Land cover overview-Square Km (NUTS 2-Total land cover)',
          landcover: 'LC',
          unit: 'KM2',
        },
        LCa: {
          desc: 'Land cover overview-Percentage (NUTS 2-Artificial land)',
          landcover: 'LCA',
          unit: 'PC',
        },
        LCc: {
          desc: 'Land cover overview-Percentage (NUTS 2-Cropland)',
          landcover: 'LCB',
          unit: 'PC',
        },
        LCw: {
          desc: 'Land cover overview-Percentage (NUTS 2- Woodland )',
          landcover: 'LCC',
          unit: 'PC',
        },
        LCg: {
          desc: 'Land cover overview-Percentage (NUTS 2-Grassland)',
          landcover: 'LCE',
          unit: 'PC',
        },
        LCwa: {
          desc: 'Land cover overview-Percentage (NUTS 2- Water)',
          landcover: 'LCG', // TO_ASK: Was LCE in the R script
          unit: 'PC',
        },
        LCwet: {
          desc: 'Land cover overview-Percentage (NUTS 2- Wetland )',
          landcover: 'LCH',
          unit: 'PC',
        },
      },
    },
    LANDUSE: {
      endpoint: 'lan_use_ovw',
      indicators: {
        LU: {
          desc: 'Land use overview-Square Km (NUTS 2-Total land use)',
          landuse: 'LU',
          unit: 'KM2',
        },
        LUagr: {
          desc: 'Land use overview_Percentage (NUTS 2- 	Agriculture )',
          landuse: 'LUA',
          unit: 'PC',
        },
        LUfa: {
          desc: 'Land use overview_Percentage (NUTS 2- Fishing and aquaculture )',
          landuse: 'LUC',
          unit: 'PC',
        },
        LUmq: {
          desc: 'Land use overview_Percentage (NUTS 2- Mining and quarrying )',
          landuse: 'LUD1',
          unit: 'PC',
        },
        LUen: {
          desc: 'Land use overview_Percentage (NUTS 2- Energy production )',
          landuse: 'LUD2',
          unit: 'PC',
        },
        LUwwt: {
          desc: 'Land use overview_Percentage (NUTS 2- Water and waste treatment )',
          landuse: 'LUD4',
          unit: 'PC',
        },
        LUcnstr: {
          desc: 'Land use overview_Percentage (NUTS 2- Construction )',
          landuse: 'LUD5',
          unit: 'PC',
        },
        LUinf: {
          desc: 'Land use overview_Percentage (NUTS 2-Transport, telecommunication, energy distribution, storage, protective works)',
          landuse: 'LUD6',
          unit: 'PC',
        },
      },
    },
    IRRIGATION: {
      endpoint: 'ef_poirrig',
      indicators: {
        IRRa: {
          desc: 'Irrigation- Share of irrigable area (NUTS 2-by size of irrigated area)',
          irrig: 'TOTAL',
          indic_ef: 'B_6_2_1_HA',
          composite: 'true',
          additional_data: {
            endpoint: 'reg_area3',
            landuse: 'TOTAL',
            unit: 'KM2',
            composition_operation: (main, additional) =>
              (main / (additional * 100)) * 100,
          },
        },
        IRRagr: {
          desc: 'Irrigation- Share of Utilized agricultural area (NUTS 2-by size of irrigated area)',
          irrig: 'TOTAL',
          indic_ef: 'AGRAREA_HA',
          composite: 'true',
          additional_data: {
            endpoint: 'reg_area3',
            landuse: 'TOTAL',
            unit: 'KM2',
            composition_operation: (main, additional) =>
              (main / (additional * 100)) * 100,
          },
        },
        IRRuaa: {
          desc: 'Irrigation- Irrigable land over the total utilized agricultural area (NUTS2)',
          irrig: 'TOTAL',
          indic_ef: 'B_6_2_1_HA',
          composite: 'true',
          additional_data: {
            endpoint: 'ef_poirrig',
            irrig: 'TOTAL',
            indic_ef: 'AGRAREA_HA',
            composition_operation: (main, additional) =>
              (main / (additional * 100)) * 100,
          },
        },
      },
    },
    EDUCATION: {
      endpoint: '',
      indicators: {
        EDUPl: {
          desc: 'Participation rates in selected education levels at regional level (Primary and lower secondary education (levels 1 and 2))',
          endpoint: 'educ_uoe_enra15',
          isced11: 'ED1_2',
          unit: 'RT',
        },
        EDUPh: {
          desc: 'Participation rates in selected education levels at regional level (Tertiary education (levels 5-8))',
          endpoint: 'educ_uoe_enra15',
          isced11: 'ED1_2',
          unit: 'RT',
        },
        EDUPt: {
          desc: 'Participation rates of selected age groups in education at regional level (From 15 to 24 years )',
          endpoint: 'educ_uoe_enra14',
          age: 'Y15-24',
          unit: 'RT',
        },
        EDUl: {
          desc: 'Share of population with certain educational attainment level (Primary and lower secondary education (levels 1 and 2))',
          endpoint: 'edat_lfse_04',
          age: 'Y25-64',
          isced11: 'ED0-2',
          sex: 'T',
        },
        EDUlf: {
          desc: 'Share of Female population with certain educational attainment level (Primary and lower secondary education (levels 1 and 2))',
          endpoint: 'edat_lfse_04',
          age: 'Y25-64',
          isced11: 'ED0-2',
          sex: 'F',
        },
        EDUh: {
          desc: 'Share of population with certain educational attainment level (Tertiary education (levels 5-8))',
          endpoint: 'edat_lfse_04',
          age: 'Y25-64',
          isced11: 'ED5-8',
          sex: 'T',
        },
        EDUhf: {
          desc: 'Share of Female population with certain educational attainment level (Tertiary education (levels 5-8))',
          endpoint: 'edat_lfse_04',
          age: 'Y25-64',
          isced11: 'ED5-8',
          sex: 'F',
        },
      },
    },
    RandD: {
      endpoint: '',
      indicators: {
        GERD: {
          desc: 'R&D expenditure-Percentage of gross domestic product (GDP) (NUTS2)',
          endpoint: 'rd_e_gerdreg',
          sectperf: 'TOTAL',
          unit: 'PC_GDP',
        },
        RD: {
          desc: 'R&D personnel and researchers (NUTS2)',
          endpoint: 'rd_p_persreg',
          prof_pos: 'TOTAL',
          sectperf: 'TOTAL',
          sex: 'T',
          unit: 'FTE',
        },
        RDr: {
          desc: 'R&D personnel and researchers-Percentage of active population(NUTS2)',
          endpoint: 'rd_p_persreg',
          prof_pos: 'TOTAL',
          sectperf: 'TOTAL',
          sex: 'T',
          unit: 'PC_ACT_FTE',
        },
        RDrf: {
          desc: 'R&D personnel and researchers(NUTS2 by sex-Female)',
          endpoint: 'rd_p_persreg',
          prof_pos: 'TOTAL',
          sectperf: 'TOTAL',
          sex: 'F',
          unit: 'PC_ACT_HC',
        },
      },
    },
    PATENT: {
      endpoint: 'pat_ep_rtot',
      indicators: {
        PAT: {
          desc: 'Patent(NUTS3)',
          unit: 'NR',
        },
        PATpmi: {
          desc: 'Patent-Per million inhabitants (NUTS3)',
          unit: 'P_MHAB',
        },
      },
    },
    ACCESSTOTECH: {
      endpoint: '',
      indicators: {
        HIA: {
          desc: 'Households with access to the internet at home-Percentage of households',
          endpoint: 'isoc_r_iacc_h',
          unit: 'PC_HH',
        },
        IIA: {
          desc: 'Individuals who used the internet, frequency of use and activities -Percentage of individuals',
          endpoint: 'isoc_r_iuse_i',
          indic_is: 'I_IUSE',
          unit: 'PC_IND',
        },
      },
    },
    HEALTHPERSONNEL: {
      endpoint: 'hlth_rs_prsrg',
      indicators: {
        HP: {
          desc: 'Health personnel (NUTS 2)',
          unit: 'NR',
        },
        HPpc: {
          desc: 'Health personnel-Inhabitants per Health personnel (NUTS 2)',
          unit: 'P_HTHAB',
        },
      },
    },
    HOSPITALBEDS: {
      endpoint: 'hlth_rs_bdsrg',
      indicators: {
        HOSb: {
          desc: 'Hospital beds(NUTS 2)',
          unit: 'NR',
        },
        HOSbi: {
          desc: 'Hospital beds(NUTS 2)-Inhabitants per hospital beds',
          unit: 'HAB_P',
        },
      },
    },
    ROADRAILWWN: {
      endpoint: 'tran_r_net',
      indicators: {
        MRN: {
          desc: 'Share of Major roads - KM per 1000KM2 (NUTS 2)',
          unit: 'KM_TKM2',
          tra_infr: 'MWAY',
        },
      },
    },
    VEHICLESTOCK: {
      endpoint: 'tran_r_vehst',
      indicators: {
        VEH: {
          desc: 'Stock of vehicles by category-Count Number (NUTS 2)',
          unit: 'NR',
          vehicle: 'TOT_X_TM',
        },
        VEHr: {
          desc: 'Stock of vehicles by category-Share (NUTS 2)',
          unit: 'NR',
          vehicle: 'TOT_X_TM',
          composite: 'true',
          additional_data: {
            endpoint: 'demo_r_d2jan',
            unit: 'NR',
            sex: 'T',
            age: 'TOTAL',
            composition_operation: (main, additional) => main / additional,
          },
        },
      },
    },
    SOILEROSION: {
      endpoint: 'aei_pr_soiler',
      indicators: {
        SE: {
          desc: 'Soil erosion by water, by erosion level, land cover (NUTS 3-Agricultural areas and natural grassland )',
          clc18: 'CLC2_321',
          unit: 'T_HA',
          level: 'TOTAL',
        },
      },
    },
  },
};
