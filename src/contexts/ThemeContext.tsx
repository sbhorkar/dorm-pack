import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { colleges, College } from '@/lib/colleges';

interface ThemeContextType {
  selectedCollege: College | null;
  setCollegeTheme: (collegeName: string) => void;
  clearCollegeTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME = {
  primary: "262 83% 58%",
  secondary: "262 30% 96%",
  accent: "262 83% 68%",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  useEffect(() => {
    // Load saved college from localStorage
    const savedCollege = localStorage.getItem('selectedCollege');
    if (savedCollege) {
      const college = colleges.find(c => c.name === savedCollege);
      if (college) {
        setSelectedCollege(college);
        applyCollegeTheme(college);
      }
    }
  }, []);

  const applyCollegeTheme = (college: College) => {
    const root = document.documentElement;
    
    // Apply college colors to CSS variables
    root.style.setProperty('--primary', college.primary);
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    root.style.setProperty('--accent', college.accent);
    root.style.setProperty('--ring', college.primary);
    
    // Apply secondary with good contrast
    root.style.setProperty('--secondary', `${college.primary.split(' ')[0]} 30% 95%`);
    root.style.setProperty('--secondary-foreground', college.primary);
  };

  const setCollegeTheme = (collegeName: string) => {
    const college = colleges.find(c => c.name === collegeName);
    if (college) {
      setSelectedCollege(college);
      applyCollegeTheme(college);
      localStorage.setItem('selectedCollege', collegeName);
    }
  };

  const clearCollegeTheme = () => {
    const root = document.documentElement;
    
    // Reset to default theme
    root.style.setProperty('--primary', DEFAULT_THEME.primary);
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    root.style.setProperty('--accent', DEFAULT_THEME.accent);
    root.style.setProperty('--secondary', DEFAULT_THEME.secondary);
    root.style.setProperty('--ring', DEFAULT_THEME.primary);
    
    setSelectedCollege(null);
    localStorage.removeItem('selectedCollege');
  };

  return (
    <ThemeContext.Provider value={{ selectedCollege, setCollegeTheme, clearCollegeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
