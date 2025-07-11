'use client';

import { useBrowserIsDarkMode } from "@/hooks/useBrowserIsDarkMode";
import { CssBaseline, PaletteMode } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { PropsWithChildren, useMemo, useState } from "react";

export type ColorMode = "dark" | "light" | "system";

const colorModeLut: Readonly<Record<ColorMode, PaletteMode | undefined>> = {
    dark: 'dark',
    light: 'light',
    system: undefined,
};

export default function ColorModeComponent({ children }: PropsWithChildren) {
    const [colorMode] = useState<ColorMode>("system");
    const browserIsDarkMode = useBrowserIsDarkMode();

    const theme = useMemo(() => {
        let mode = colorModeLut[colorMode];
        if (colorMode === "system") {
            mode = browserIsDarkMode ? "dark" : "light";
        }

        return createTheme({
            palette: {
                mode: mode,
            },
        });

    }, [browserIsDarkMode, colorMode]);

    return (<>
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
        <CssBaseline enableColorScheme />
    </>);
}