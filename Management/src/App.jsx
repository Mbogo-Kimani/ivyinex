import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Common/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Subscriptions from './pages/Subscriptions'
import Devices from './pages/Devices'
import Packages from './pages/Packages'
import Vouchers from './pages/Vouchers'
import Payments from './pages/Payments'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { AuthProvider } from './hooks/useAuth'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
})

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Toaster position="top-right" />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="users" element={<Users />} />
                                <Route path="subscriptions" element={<Subscriptions />} />
                                <Route path="devices" element={<Devices />} />
                                <Route path="packages" element={<Packages />} />
                                <Route path="vouchers" element={<Vouchers />} />
                                <Route path="payments" element={<Payments />} />
                                <Route path="logs" element={<Logs />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App