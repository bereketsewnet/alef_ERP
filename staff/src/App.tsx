import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ThemeProvider } from './components/theme-provider'
import { TooltipProvider } from './components/ui/tooltip'

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="alef-erp-theme">
            <TooltipProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    )
}

export default App
