import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Timeline from './components/Timeline';
import RecycleBinPage from './pages/RecycleBinPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function TimelinePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage, default to 'public' (hide whispers by default)
    const saved = localStorage.getItem('viewMode');
    return saved || 'public';
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSearch={setSearchQuery}
        currentSearch={searchQuery}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
      />

      <main className="max-w-3xl mx-auto px-4 pt-20 pb-8">
        <Timeline searchQuery={searchQuery} viewMode={viewMode} />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TimelinePage />} />
          <Route path="/recycle-bin" element={<RecycleBinPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
