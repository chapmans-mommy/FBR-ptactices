// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// ✅ Ленивая загрузка компонента About
const About = lazy(() => import('./pages/About'));

// ❌ Обычный импорт (без lazy loading) для главной страницы
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px' }}>
        <nav style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
          <Link to="/">Главная</Link>
          <Link to="/about">О нас (lazy)</Link>
        </nav>

        <hr />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/about" 
            element={
              // Suspense показывает загрузку, пока компонент подгружается
              <Suspense fallback={<div>⏳ Загрузка страницы...</div>}>
                <About />
              </Suspense>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;