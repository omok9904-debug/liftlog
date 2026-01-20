import Home from '@/pages/Home'
import ThemeToggle from '@/components/ThemeToggle'
import { ThemeProvider } from '@/context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <Home />
    </ThemeProvider>
  )
}

export default App
