/**
 * This contains all of the indicators that have to be requested from the eurostat API formatted as:
 * CATEGORY: {
 *  endpoint:string           If all the indicators of a certain categories have a common endpoint or at least the root of an endpoint it is here
 *  indicators: {             All the indicators of a certain category
 *    INDICATOR: {
 *      desc:string           A description of the indicator as written in the R script I got the indicators from
 *      uom:string            The unit of measurement for the indicator
 *      uom_d:string          A description of the uom for the indicator
 *      type:string           The type of indicator (economic, ...)
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
export type CompositionFunction = (main: number, additional: number) => number;

export type CombinationFunction = (parameterList: number[]) => number;

type IndicatorAPIData = {
  /** The indicator category (e.g. GDP, GVA) */
  [key: string]: {
    /** The type of indicator */
    type:
      | 'ECONOMIC'
      | 'COHESION'
      | 'KNOWLEDGE'
      | 'INFRASTRUCTURE'
      | 'INSTITUTIONS'
      | 'TBD';
    /** The root part of the Eurostat API endpoint */
    endpoint: string;
    /** The list of indicators of the given category */
    indicators: {
      /** The data for every indicator */
      [key: string]: {
        /** The description for the indicator */
        desc: string;
        /** Some indicators have different endpoints with a root in common */
        endpoint?: string;
        /** The unit of the indicator (needed for the Eurostat API query) */
        unit?: string;
        /** The unit of measurement of the indicator */
        uom: string;
        /** The description of the uom of the indicator */
        uom_d: string;
        /** The default year from which to choose the data instance for this indicator */
        default_year: number;
        /** True if the indicator is calculated from 2 other, if true there is an additional_data field */
        composite?: boolean;
        /** Other data needed for some of the indicators */
        [keys: string]:
          | number
          | string
          | boolean
          | string[]
          | CombinationFunction
          | {
              /** The endpoint for the secondary indicator needed for composition */
              endpoint: string;
              /** The unit of the secndary indicator (needed for the Eurostat API query) */
              unit?: string;
              /** Other data needed for some of the secondary indicators */
              [keys: string]:
                | string
                | string[]
                | CompositionFunction
                | CombinationFunction;
            };
      };
    };
  };
};

const eurostatIndicators: IndicatorAPIData = {
  GDP: {
    type: 'ECONOMIC',
    endpoint: 'nama_10r_3gdp',
    indicators: {
      GDP: {
        desc: 'GDP at Current Market Prices',
        unit: 'MIO_EUR',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
      },
      GDPpps: {
        desc: 'GDP Purchasing Power Standards',
        unit: 'MIO_PPS_EU27_2020',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
      },
      GDPpc: {
        desc: 'GDP per Inhabitant',
        unit: 'EUR_HAB',
        uom: '€',
        uom_d: 'Euros',
        default_year: 2018,
      },
      GDPpps_pc: {
        desc: 'GDP Purchasing Power Standards per Inhabitant',
        unit: 'PPS_EU27_2020_HAB',
        uom: '€',
        uom_d: 'Euros',
        default_year: 2018,
      },
      GDPdens: {
        desc: 'GDP Density',
        unit: 'MIO_EUR',
        uom: 'M€/Km^2',
        uom_d: 'Millions of Euros per Square Kilometer',
        default_year: 2018,
        composite: true,
        additional_data: {
          endpoint: 'reg_area3',
          landuse: 'TOTAL',
          unit: 'KM2',
          composition_operation: (main: number, additional: number): number =>
            main / additional,
        },
      },
    },
  },
  GVA: {
    type: 'ECONOMIC',
    endpoint: 'nama_10r_',
    indicators: {
      GVA: {
        desc: 'Gross Value Added',
        endpoint: '3gva',
        unit: 'MIO_EUR',
        nace_r2: 'TOTAL',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
      },
      GVApc: {
        desc: 'Gross Value Added Per Capita',
        endpoint: '3gva',
        unit: 'MIO_EUR',
        nace_r2: 'TOTAL',
        uom: '€pc',
        uom_d: 'Euros per Person',
        default_year: 2018,
        composite: true,
        additional_data: {
          endpoint: 'nama_10r_3popgdp',
          unit: 'THS',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 1000,
        },
      },
      GVAagr: {
        desc: 'Gross Value Added - by Sector - Agriculture, Forestry and Fishing',
        endpoint: '3gva',
        unit: 'MIO_EUR',
        nace_r2: 'A',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
        composite: true,
        additional_data: {
          endpoint: 'nama_10r_3gva',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      GVAind: {
        desc: 'Gross Value Added - by Sector - Industry',
        endpoint: '3gva',
        unit: 'MIO_EUR',
        nace_r2: 'B-E',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
        composite: true,
        additional_data: {
          endpoint: 'nama_10r_3gva',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      GVAmnf: {
        desc: 'Gross Value Added - by Sector - Manufacturing',
        endpoint: '3gva',
        unit: 'MIO_EUR',
        nace_r2: 'C',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
        composite: true,
        additional_data: {
          endpoint: 'nama_10r_3gva',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      GVAcnstr: {
        desc: 'Gross Value Added - by Sector - Construction',
        endpoint: '3gva',
        unit: 'MIO_EUR',
        nace_r2: 'F',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
        composite: true,
        additional_data: {
          endpoint: 'nama_10r_3gva',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      GVAgr: {
        desc: 'Real Growth Rate of Regional Gross Value Added at Basic Prices',
        endpoint: '2gvagr',
        uom: 'Index',
        uom_d: 'Index, 2015 = 100',
        unit: 'I15',
        default_year: 2019,
      },
    },
  },
  HOUSEHOLDINCOME: {
    type: 'ECONOMIC',
    endpoint: 'nama_10r_2hhinc',
    indicators: {
      HHI: {
        desc: 'Household Income',
        unit: 'MIO_EUR',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
        direct: 'BAL',
        na_item: 'B5N',
      },
      HHIpc: {
        desc: 'Household Income',
        unit: 'EUR_HAB',
        uom: '€pc',
        uom_d: 'Euros per Inhabitant',
        default_year: 2018,
        direct: 'BAL',
        na_item: 'B5N',
      },
      HHIpps: {
        desc: 'Household Income Purchasing Power Standards',
        unit: 'MIO_PPS_EU27_2020',
        uom: 'M€',
        uom_d: 'Millions of Euros',
        default_year: 2018,
        direct: 'BAL',
        na_item: 'B5N',
      },
      HHIpps_pc: {
        desc: 'Household Income Purchasing Power Standards per Inhabitant',
        unit: 'PPS_EU27_2020_HAB',
        uom: '€pc',
        uom_d: 'Euros per Inhabitant',
        default_year: 2018,
        direct: 'BAL',
        na_item: 'B5N',
      },
    },
  },
  EMPLOYMENT: {
    type: 'ECONOMIC',
    endpoint: '',
    indicators: {
      EMPL: {
        desc: 'Employment',
        endpoint: 'nama_10r_3empers',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2018,
        nace_r2: 'TOTAL',
        wstatus: 'EMP',
      },
      EMPLeap: {
        desc: 'Employment - by Age - 15-64',
        endpoint: 'lfst_r_lfe2emp',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'T',
      },
      EMPLf: {
        desc: 'Employment - by Sex - Female',
        endpoint: 'lfst_r_lfe2emp',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'F',
      },
      EMPLagr: {
        desc: 'Employment - by Sector - Agriculture, Forestry and Fishing',
        endpoint: 'lfst_r_lfe2en2',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'T',
        nace_r2: 'A',
        composite: true,
        additional_data: {
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      EMPLind: {
        desc: 'Employment - by Sector - Industry',
        endpoint: 'lfst_r_lfe2en2',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'T',
        nace_r2: 'B-E',
        composite: true,
        additional_data: {
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      EMPLcnstr: {
        desc: 'Employment - by Sector - Construction',
        endpoint: 'lfst_r_lfe2en2',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'T',
        nace_r2: 'F',
        composite: true,
        additional_data: {
          endpoint: 'lfst_r_lfe2en2',
          age: 'Y15-64',
          sex: 'T',
          nace_r2: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      EMPLr: {
        desc: 'Employment Rate - by Age - 15-64',
        endpoint: 'lfst_r_lfe2emprt',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'T',
      },
      EMPLrf: {
        desc: 'Employment rate - by Sex - Female',
        endpoint: 'lfst_r_lfe2emprt',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        age: 'Y15-64',
        sex: 'F',
      },
      EMPLkt: {
        desc: 'Employment in Technology and Knowledge-Intensive Sectors',
        endpoint: 'htec_emp_reg2',
        uom: '%',
        uom_d: 'Percentage of Total Employment',
        default_year: 2019,
        unit: 'PC_EMP',
        sex: 'T',
        nace_r2: 'HTC',
      },
      EMPLktf: {
        desc: 'Employment in Technology and Knowledge-Intensive Sectors - by Sex - Female',
        endpoint: 'htec_emp_reg2',
        uom: '%',
        uom_d: 'Percentage of Total Employment',
        default_year: 2019,
        unit: 'PC_EMP',
        sex: 'F',
        nace_r2: 'HTC',
      },
      UEMPL: {
        desc: 'Unemployment - by Age - 15-74',
        endpoint: 'lfst_r_lfu3pers',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-74',
        sex: 'T',
        isced11: 'TOTAL',
      },
      UEMPLf: {
        desc: 'Unemployment - by Sex - Female',
        endpoint: 'lfst_r_lfu3pers',
        uom: 'K People',
        uom_d: 'Thousands of People',
        default_year: 2019,
        age: 'Y15-74',
        sex: 'F',
        isced11: 'TOTAL',
      },
      UEMPLr: {
        desc: 'Unemployment Rate - by Age - 15-74',
        endpoint: 'lfst_r_lfu3rt',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        age: 'Y15-74',
        sex: 'T',
        isced11: 'TOTAL',
      },
      UEMPLrf: {
        desc: 'Unemployment Rate - by Sex - Female',
        endpoint: 'lfst_r_lfu3rt',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        age: 'Y15-74',
        sex: 'F',
        isced11: 'TOTAL',
      },
      LUEMPLr: {
        desc: 'Long Term Unemployment Rate',
        endpoint: 'lfst_r_lfu2ltu',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        unit: 'PC_ACT',
        age: 'Y15-74',
        sex: 'T',
        isced11: 'TOTAL',
      },
      LUEMPLrf: {
        desc: 'Long Term Unemployment Rate - by Sex - Female',
        endpoint: 'lfst_r_lfu2ltu',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        unit: 'PC_ACT',
        age: 'Y15-74',
        sex: 'F',
        isced11: 'TOTAL',
      },
      AROPE: {
        desc: 'People at Risk of Poverty or Social Exclusion',
        endpoint: 'ilc_peps11',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2018,
        unit: 'PC',
      },
      MatDep: {
        desc: 'Severe Material Deprivation Rate',
        endpoint: 'ilc_mddd21',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2018,
        unit: 'PC',
      },
      COMTr: {
        desc: 'Commuting Rate - Outside the Region',
        endpoint: 'lfst_r_lfe2ecomm',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        sex: 'T',
        age: 'Y15-64',
        c_work: 'OUTR',
        composite: true,
        additional_data: {
          endpoint: 'lfst_r_lfp2act',
          age: 'Y15-64',
          sex: 'T',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      COMTrf: {
        desc: 'Commuting Rate - Outside the Region - by Sex - Female',
        endpoint: 'lfst_r_lfe2ecomm',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
        sex: 'F',
        age: 'Y15-64',
        c_work: 'OUTR',
        composite: true,
        additional_data: {
          endpoint: 'lfst_r_lfp2act',
          age: 'Y15-64',
          sex: 'F',
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
    },
  },
  DEPENDENCY: {
    type: 'ECONOMIC',
    endpoint: 'demo_r_pjangrp3',
    indicators: {
      DPNDr: {
        desc: 'Age Dependency Ratio - by Age - (0-14 & > 65)/ 15-64 ',
        unit: 'NR',
        sex: 'T',
        uom: '%',
        uom_d: 'Percentage of Working-Age Population',
        default_year: 2019,
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
        combining_operation: (parameterList: number[]) => {
          return parameterList.reduce(
            (sum: number, currentValue: number) => (sum += currentValue)
          );
        },
        composite: true,
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
          combining_operation: (parameterList: number[]) => {
            return parameterList.reduce(
              (sum: number, currentValue: number) => (sum += currentValue)
            );
          },
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      OADr: {
        desc: 'Old Age Dependency Ratio - by Age - 65 years or over / 15-64',
        unit: 'NR',
        sex: 'T',
        uom: '%',
        uom_d: 'Percentage of Working-Age Population',
        default_year: 2019,
        age: ['Y65-69', 'Y70-74', 'Y75-79', 'Y80-84', 'Y85-89', 'Y_GE90'],
        combined_parameter: 'age',
        combining_operation: (parameterList: number[]) => {
          return parameterList.reduce(
            (sum: number, currentValue: number) => (sum += currentValue)
          );
        },
        composite: true,
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
          combining_operation: (parameterList: number[]) => {
            return parameterList.reduce(
              (sum: number, currentValue: number) => (sum += currentValue)
            );
          },
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
      YADr: {
        desc: 'Young Age Dependency Ratio - by Age - 0-14/ 15-64',
        unit: 'NR',
        sex: 'T',
        uom: '%',
        uom_d: 'Percentage of Working-Age Population',
        default_year: 2019,
        age: ['Y_LT5', 'Y5-9', 'Y10-14'],
        combined_parameter: 'age',
        combining_operation: (parameterList: number[]) => {
          return parameterList.reduce(
            (sum: number, currentValue: number) => (sum += currentValue)
          );
        },
        composite: true,
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
          combining_operation: (parameterList: number[]) => {
            return parameterList.reduce(
              (sum: number, currentValue: number) => (sum += currentValue)
            );
          },
          composition_operation: (main: number, additional: number): number =>
            (main / additional) * 100,
        },
      },
    },
  },
  DEMOGRAPHICS: {
    endpoint: 'demo_r_d3dens',
    type: 'TBD',
    indicators: {
      POPdens: {
        desc: 'Population Density',
        unit: 'PER_KM2',
        uom: 'P/Km^2',
        uom_d: 'People per Square Kilometer',
        default_year: 2018,
      },
    },
  },
  MORTALITY: {
    type: 'TBD',
    endpoint: 'demo_r_minfind',
    indicators: {
      IMR: {
        desc: 'Infant Mortality Rate',
        unit: 'RT',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2018,
      },
    },
  },
  LIFEEXPECTANCY: {
    endpoint: 'demo_r_mlifexp',
    type: 'TBD',
    indicators: {
      LE: {
        desc: 'Life Expectancy - by Age - Less than 1 Year',
        age: 'Y_LT1',
        sex: 'T',
        uom: 'Y',
        uom_d: 'Years',
        default_year: 2018,
      },
      LEf: {
        desc: 'Life expectancy - by Sex - Female - by Age - Less than 1 Year',
        age: 'Y_LT1',
        sex: 'F',
        uom: 'Y',
        uom_d: 'Years',
        default_year: 2018,
      },
      LEm: {
        desc: 'Life expectancy - Year - by Sex - Male - by Age - Less than 1 Year',
        age: 'Y_LT1',
        sex: 'M',
        uom: 'Y',
        uom_d: 'Years',
        default_year: 2018,
      },
    },
  },
  LIVESTOCK: {
    endpoint: 'ef_olslsureg',
    type: 'ECONOMIC',
    indicators: {
      LUS: {
        desc: 'Livestock - Number of Farms and Heads of Animals by Livestock Units of Farm',
        lsu: 'TOTAL',
        indic_ef: 'HOLD_HOLD',
        uom: 'H',
        uom_d: 'Total Number of Holdings',
        default_year: 2007,
      },
      LUSh: {
        desc: 'Livestock - LSU of the Holdings with Livestock - Number of Farms and Heads of Animals by Livestock Units of Farm',
        lsu: 'TOTAL',
        indic_ef: 'C_LIVESTOCK_LSU',
        uom: 'LSU',
        uom_d: 'LSU of the Holdings with Livestock',
        default_year: 2007,
      },
    },
  },
  LANDCOVER: {
    endpoint: 'lan_lcv_ovw',
    type: 'INFRASTRUCTURE',
    indicators: {
      LC: {
        desc: 'Land Cover Overview',
        landcover: 'LC',
        unit: 'KM2',
        uom: 'Km^2',
        uom_d: 'Square Kilometers',
        default_year: 2015,
      },
      LCa: {
        desc: 'Land Cover Overview - Artificial Land',
        landcover: 'LCA',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Artificial Land',
        default_year: 2015,
      },
      LCc: {
        desc: 'Land Cover Overview - Cropland',
        landcover: 'LCB',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Cropland',
        default_year: 2015,
      },
      LCw: {
        desc: 'Land Cover Overview - Woodland',
        landcover: 'LCC',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Woodland',
        default_year: 2015,
      },
      LCg: {
        desc: 'Land Cover Overview - Grassland',
        landcover: 'LCE',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Grassland',
        default_year: 2015,
      },
      LCwa: {
        desc: 'Land Cover Overview - Water',
        landcover: 'LCG',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Water',
        default_year: 2015,
      },
      LCwet: {
        desc: 'Land Cover Overview - Wetland',
        landcover: 'LCH',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Wetland',
        default_year: 2015,
      },
    },
  },
  LANDUSE: {
    endpoint: 'lan_use_ovw',
    type: 'INFRASTRUCTURE',
    indicators: {
      LU: {
        desc: 'Land Use Overview - Total Land Use',
        landuse: 'LU',
        unit: 'KM2',
        uom: 'Km^2',
        uom_d: 'Square Kilometers',
        default_year: 2015,
      },
      LUagr: {
        desc: 'Land Use Overview - Agriculture',
        landuse: 'LUA',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Agriculture',
        default_year: 2015,
      },
      LUfa: {
        desc: 'Land Use Overview - Fishing and Aquaculture',
        landuse: 'LUC',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Fishing and Aquaculture',
        default_year: 2015,
      },
      LUmq: {
        desc: 'Land Use Overview - Mining and Quarrying',
        landuse: 'LUD1',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Mining and Quarrying',
        default_year: 2015,
      },
      LUen: {
        desc: 'Land Use Overview - Energy Production',
        landuse: 'LUD2',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Energy Production',
        default_year: 2015,
      },
      LUwwt: {
        desc: 'Land use overview - Water and Waste Treatment',
        landuse: 'LUD4',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Water and Waste Treatment',
        default_year: 2015,
      },
      LUcnstr: {
        desc: 'Land Use Overview - Construction',
        landuse: 'LUD5',
        unit: 'PC',
        uom: '%',
        uom_d: 'Percentage of Construction',
        default_year: 2015,
      },
      LUinf: {
        desc: 'Land Use Overview - Transport, Telecommunication, Energy Distribution, Storage, Protective Works',
        landuse: 'LUD6',
        unit: 'PC',
        uom: '%',
        uom_d:
          'Percentage of Transport, Telecommunication, Energy Distribution, Storage, Protective Works',
        default_year: 2015,
      },
    },
  },
  IRRIGATION: {
    endpoint: 'ef_poirrig',
    type: 'INFRASTRUCTURE',
    indicators: {
      IRRa: {
        desc: 'Irrigation - Share of Irrigable Area',
        uom: '%',
        uom_d: 'Share of Irrigable Area',
        default_year: 2013,
        irrig: 'TOTAL',
        indic_ef: 'B_6_2_1_HA',
        composite: true,
        additional_data: {
          endpoint: 'reg_area3',
          landuse: 'TOTAL',
          unit: 'KM2',
          composition_operation: (main: number, additional: number): number =>
            (main / (additional * 100)) * 100,
        },
      },
      IRRagr: {
        desc: 'Irrigation - Share of Utilized Agricultural Area',
        uom: '%',
        uom_d: 'Share of Utilized Agricultural Area',
        default_year: 2013,
        irrig: 'TOTAL',
        indic_ef: 'AGRAREA_HA',
        composite: true,
        additional_data: {
          endpoint: 'reg_area3',
          landuse: 'TOTAL',
          unit: 'KM2',
          composition_operation: (main: number, additional: number): number =>
            (main / (additional * 100)) * 100,
        },
      },
      IRRuaa: {
        desc: 'Irrigation - Irrigable Land Over the Total Utilized Agricultural Area',
        uom: 'IL/TUAA',
        uom_d: 'Irrigable Land Over the Total Utilized Agricultural Area',
        default_year: 2010,
        irrig: 'TOTAL',
        indic_ef: 'B_6_2_1_HA',
        composite: true,
        additional_data: {
          endpoint: 'ef_poirrig',
          irrig: 'TOTAL',
          indic_ef: 'AGRAREA_HA',
          composition_operation: (main: number, additional: number): number =>
            (main / (additional * 100)) * 100,
        },
      },
    },
  },
  EDUCATION: {
    endpoint: '',
    type: 'KNOWLEDGE',
    indicators: {
      EDUPl: {
        desc: 'Participation Rates in Primary and Lower Secondary Education (Levels 1-2)',
        endpoint: 'educ_uoe_enra15',
        isced11: 'ED1_2',
        unit: 'RT',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2016,
      },
      EDUPh: {
        desc: 'Participation Rates in Tertiary Education (Levels 5-8)',
        endpoint: 'educ_uoe_enra15',
        isced11: 'ED1_2',
        unit: 'RT',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2016,
      },
      EDUPt: {
        desc: 'Participation Rates of Selected Age Groups in Education (15-24)',
        endpoint: 'educ_uoe_enra14',
        age: 'Y15-24',
        unit: 'RT',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2016,
      },
      EDUl: {
        desc: 'Share of Population with Primary and Lower Secondary Education (Levels 1-2)',
        endpoint: 'edat_lfse_04',
        age: 'Y25-64',
        isced11: 'ED0-2',
        sex: 'T',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
      },
      EDUlf: {
        desc: 'Share of Female Population with Primary and Lower Secondary Education (Levels 1-2)',
        endpoint: 'edat_lfse_04',
        age: 'Y25-64',
        isced11: 'ED0-2',
        sex: 'F',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
      },
      EDUh: {
        desc: 'Share of Population with Tertiary Education (Levels 5-8)',
        endpoint: 'edat_lfse_04',
        age: 'Y25-64',
        isced11: 'ED5-8',
        sex: 'T',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
      },
      EDUhf: {
        desc: 'Share of Female Population with Tertiary Education (Levels 5-8)',
        endpoint: 'edat_lfse_04',
        age: 'Y25-64',
        isced11: 'ED5-8',
        sex: 'F',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2019,
      },
    },
  },
  RandD: {
    endpoint: '',
    type: 'TBD',
    indicators: {
      GERD: {
        desc: 'R&D Expenditure',
        endpoint: 'rd_e_gerdreg',
        sectperf: 'TOTAL',
        unit: 'PC_GDP',
        uom: '%',
        uom_d: 'Percentage of GDP',
        default_year: 2017,
      },
      RD: {
        desc: 'R&D Personnel and Researchers',
        endpoint: 'rd_p_persreg',
        prof_pos: 'TOTAL',
        sectperf: 'TOTAL',
        sex: 'T',
        unit: 'FTE',
        uom: 'P',
        uom_d: 'People',
        default_year: 2017,
      },
      RDr: {
        desc: 'R&D Personnel and Researchers Ratio',
        endpoint: 'rd_p_persreg',
        prof_pos: 'TOTAL',
        sectperf: 'TOTAL',
        sex: 'T',
        unit: 'PC_ACT_FTE',
        uom: '%',
        uom_d: 'Percentage of Active Population',
        default_year: 2017,
      },
      RDrf: {
        desc: 'R&D Personnel and Researchers - by Sex - Female',
        endpoint: 'rd_p_persreg',
        prof_pos: 'TOTAL',
        sectperf: 'TOTAL',
        sex: 'F',
        unit: 'PC_ACT_HC',
        uom: '%',
        uom_d: 'Percentage of Female',
        default_year: 2018,
      },
    },
  },
  PATENT: {
    type: 'KNOWLEDGE',
    endpoint: 'pat_ep_rtot',
    indicators: {
      PAT: {
        desc: 'Patents',
        unit: 'NR',
        uom: 'P',
        uom_d: 'Patents',
        default_year: 2012,
      },
      PATpmi: {
        desc: 'Patents per Million Inhabitants',
        unit: 'P_MHAB',
        uom: 'P',
        uom_d: 'Patents per Million Inhabitants',
        default_year: 2012,
      },
    },
  },
  ACCESSTOTECH: {
    type: 'INFRASTRUCTURE',
    endpoint: '',
    indicators: {
      HIA: {
        desc: 'Households with Access to the Internet at Home',
        endpoint: 'isoc_r_iacc_h',
        unit: 'PC_HH',
        uom: '%',
        uom_d: 'Percentage of Households',
        default_year: 2019,
      },
      IIA: {
        desc: 'Individuals with Access to the Internet',
        endpoint: 'isoc_r_iuse_i',
        indic_is: 'I_IUSE',
        unit: 'PC_IND',
        uom: '%',
        uom_d: 'Percentage of Individuals',
        default_year: 2019,
      },
    },
  },
  HEALTHPERSONNEL: {
    type: 'TBD',
    endpoint: 'hlth_rs_prsrg',
    indicators: {
      HP: {
        desc: 'Health Personnel',
        unit: 'NR',
        uom: 'HP',
        uom_d: 'Health Personnel',
        default_year: 2016,
      },
      HPpc: {
        desc: 'Inhabitants per Health Personnel',
        unit: 'P_HTHAB',
        uom: 'I/HP',
        uom_d: 'Inhabitants per Health Personnel',
        default_year: 2016,
      },
    },
  },
  HOSPITALBEDS: {
    type: 'INFRASTRUCTURE',
    endpoint: 'hlth_rs_bdsrg',
    indicators: {
      HOSb: {
        desc: 'Hospital Beds',
        unit: 'NR',
        uom: 'HB',
        uom_d: 'Hospital Beds',
        default_year: 2016,
      },
      HOSbi: {
        desc: 'Inhabitants per Hospital Beds',
        unit: 'HAB_P',
        uom: 'I/HB',
        uom_d: 'Inhabitants per Hospital Bed',
        default_year: 2016,
      },
    },
  },
  ROADRAILWWN: {
    type: 'INFRASTRUCTURE',
    endpoint: 'tran_r_net',
    indicators: {
      MRN: {
        desc: 'Share of Major Roads',
        unit: 'KM_TKM2',
        tra_infr: 'MWAY',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2018,
      },
    },
  },
  VEHICLESTOCK: {
    type: 'TBD',
    endpoint: 'tran_r_vehst',
    indicators: {
      VEH: {
        desc: 'Stock of Vehicles by Category - Number',
        unit: 'NR',
        vehicle: 'TOT_X_TM',
        uom: 'V',
        uom_d: 'Vehicles',
        default_year: 2017,
      },
      VEHr: {
        desc: 'Stock of Vehicles by Category - Share',
        unit: 'NR',
        vehicle: 'TOT_X_TM',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2017,
        composite: true,
        additional_data: {
          endpoint: 'demo_r_d2jan',
          unit: 'NR',
          sex: 'T',
          age: 'TOTAL',
          composition_operation: (main: number, additional: number): number =>
            main / additional,
        },
      },
    },
  },
  SOILEROSION: {
    type: 'INFRASTRUCTURE',
    endpoint: 'aei_pr_soiler',
    indicators: {
      SE: {
        desc: 'Soil Erosion - Agricultural Areas and Natural Grassland',
        clc18: 'CLC2_321',
        unit: 'T_HA',
        level: 'TOTAL',
        uom: '%',
        uom_d: 'Percentage',
        default_year: 2016,
      },
    },
  },
};

export { eurostatIndicators };
