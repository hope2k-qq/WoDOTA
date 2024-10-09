import { Theme, createTheme } from '@mui/material/styles';
declare module '@mui/material/styles' {
    interface ThemeOptions {
        color?: {
            black_white?: string;
            white_0b0b0d?: string;
            eef0f3_1d2321?: string;
        },
    }

}

export const themes: Theme[] = [
    createTheme({
        color:{
            black_white: 'black',
            white_0b0b0d: 'white',
            eef0f3_1d2321: '#eef0f3',
        },
        palette: {
            background: {
                default: '#f5f5f5',
            },
        },
        typography: {
            fontFamily: 'Geometria, sans-serif',
        },

    }),
    createTheme({
        color:{
            black_white: 'white',
            white_0b0b0d: '#1c1c24',
            eef0f3_1d2321: '#1d2321',
        },
        palette: {
            background: {
                default: '#16171b',
            },
        },
        typography: {
            fontFamily: 'Geometria, sans-serif',
        },
    })
];
