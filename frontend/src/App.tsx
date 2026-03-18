import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import IdentityManagement from './pages/IdentityManagement';
import Verification from './pages/Verification';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/identity" element={<IdentityManagement />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <ToastContainer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
