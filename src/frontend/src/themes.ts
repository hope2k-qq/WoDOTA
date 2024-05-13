import { Theme, createTheme } from '@mui/material/styles';
declare module '@mui/material/styles' {
    interface ThemeOptions {
        colorVariation?: {
            black_white?: string;
        },
    }

}

export const themes: Theme[] = [
    createTheme({
        colorVariation:{
            black_white: 'black',
        },
        palette: {
            background: {
                default: '#F5F5F5',
            },
        },
    }),
    createTheme({
        colorVariation:{
            black_white: 'white',

        },
        palette: {
            background: {
                default: '#0b0414',
            },
        },
    })
];
