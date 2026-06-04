import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Playground from './pages/Playground.jsx'
import Docs from './pages/Docs.jsx'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('sm_token') || '')
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sm_user') || 'null'))
  const [apiKey, setApiKey] = useState(localStorage.getItem('sm_api_key') || '')

  useEffect(() => {
    if (token) {
      localStorage.setItem('sm_token', token)
    } else {
      localStorage.removeItem('sm_token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('sm_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('sm_user')
    }
  }, [user])

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('sm_api_key', apiKey)
    } else {
      localStorage.removeItem('sm_api_key')
    }
  }, [apiKey])

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setApiKey('')
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    localStorage.removeItem('sm_api_key')
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar token={token} user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home token={token} setToken={setToken} user={user} setUser={setUser} setApiKey={setApiKey} />} />
            <Route 
              path="/dashboard" 
              element={token ? <Dashboard token={token} user={user} apiKey={apiKey} setApiKey={setApiKey} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/playground" 
              element={token ? <Playground token={token} apiKey={apiKey} /> : <Navigate to="/" />} 
            />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-brand-border py-6 bg-brand-dark/40 text-center text-sm text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} SearchMind API. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#/docs" className="hover:text-indigo-400 transition-colors">Docs</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}
