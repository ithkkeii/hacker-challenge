export const theme = {
  typography: {
    fontSize: {
      small: '12px',
      medium: '14px',
      large: '18px',
    },
  },
  palette: {
    background: {
      black: '#000',
      white: '#fff',
      lightBlue: '#F7FAFF',
      whitesmoke: '#f0f2f5',
    },
    common: {
      black: '#000',
      white: '#fff',
      lightGrey: 'rgb(225,228,232)',
      grey: '#ababab',
      lightGreen: 'rgb(38,212,135)',
      darkGreen: 'rgb(38,182,135)',
      lightCrimson: 'rgb(200,0,78)',
      darkCrimson: 'rgb(154,0,54)',
      lightBlue: 'rgb(63,81,181)',
      darkBlue: 'rgb(48,63,159)',
      lightGold: 'rgb(252,193,10)',
      darkGold: 'rgb(224,168,0)',
      dark: '#36393f',
      red: '#FF4646',
      lightRed: '#FF6E6E',
      orange: '#f59b42',
      blue: '#097bbf',
      darkCyan: '#738f93',
    },
  },
  shadows: {
    1: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    2: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    3: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    4: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    5: '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    6: '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    7: '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    8: '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    9: '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    10: '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  },
};

export interface STheme {
  typography: {
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  palette: {
    background: {
      black: string;
      white: string;
      lightBlue: string;
      whitesmoke: string;
    };
    common: {
      black: string;
      white: string;
      lightGreen: string;
      darkGreen: string;
      lightCrimson: string;
      darkCrimson: string;
      lightBlue: string;
      darkBlue: string;
      lightGold: string;
      darkGold: string;
      dark: string;
      lightRed: string;
      orange: string;
      grey: string;
      lightGrey: string;
      blue: string;
      darkCyan: string;
    };
  };
  shadows: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
  };
}
