import { createContext, useContext, useEffect } from "react"

type ThemeProviderProps = {
    children: React.ReactNode
}

type ThemeProviderState = {
    theme: "light"
    setTheme: () => void
}

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("dark")
        root.classList.add("light")
    }, [])

    const value = {
        theme: "light" as const,
        setTheme: () => null,
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
