/**
 * Переключение темы
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

export function getSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme | null {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
}

export function setTheme(theme: Theme) {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
}

export function applyInitialTheme() {
    const stored = getStoredTheme();
    const theme = stored ?? getSystemTheme();
    setTheme(theme);

    // Listen for OS theme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!getStoredTheme()) {
            setTheme(getSystemTheme());
        }
    });
}
