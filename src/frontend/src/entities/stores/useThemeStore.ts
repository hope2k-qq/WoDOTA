import { themes } from "../../themes";
import { Theme } from "@mui/material/styles";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IThemeStore {
    currentThemeIndex: number;
    currentTheme: Theme | null;
    setTheme: (theme: Theme | null) => void;
    cycleThemes: () => void;
    getCurrentTheme: () => Theme | null;
}

export const useThemeStore = create<IThemeStore>()(
    persist<IThemeStore>(
        (set, get) => ({
            currentThemeIndex: 0,
            currentTheme: null,
            setTheme: (theme: Theme | null) => {
                if (theme != null) {
                    const themeIndex = themes.findIndex((t) => t === theme);
                    if (themeIndex !== -1) {
                        set({
                            currentThemeIndex: themeIndex,
                            currentTheme: themes[themeIndex],
                        });
                    }
                }
            },

            cycleThemes: () => {
                set((state) => ({
                    currentThemeIndex: (state.currentThemeIndex + 1) % themes.length,

                    currentTheme: themes[(state.currentThemeIndex + 1) % themes.length],
                }));
            },
            getCurrentTheme: () => {
                const themeIndex = get().currentThemeIndex;
                return themes[themeIndex];
            },
        }),
        {
            name: "theme",
            version: 1,
        }
    )
);
