import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ThemeProvider } from './components/theme-provider'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="alef-erp-theme">
            <TooltipProvider>
                <BrowserRouter>
                    <AppRoutes />
                    <Toaster />
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    )
}

export default App
