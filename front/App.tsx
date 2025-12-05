
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Energy from './pages/Energy';
import HVAC from './pages/HVAC';
import ESG from './pages/ESG';
import IAQ from './pages/IAQ';
import Maintenance from './pages/Maintenance';
import Settings from './pages/Settings';
import Simulation from './pages/Simulation';
import { BuildingProvider } from './context/BuildingContext';

// Theme Context Definition
interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const App: React.FC = () => {
  // Initialize theme from localStorage or default to dark
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <BuildingProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/energy" element={<Energy />} />
              <Route path="/hvac" element={<HVAC />} />
              <Route path="/iaq" element={<IAQ />} />
              <Route path="/esg" element={<ESG />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </BuildingProvider>
    </ThemeContext.Provider>
  );
};

export default App;
