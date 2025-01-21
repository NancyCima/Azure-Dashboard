import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Ticket, LineChart, LayoutDashboard } from 'lucide-react';
import IncompleteTickets from './pages/IncompleteTickets';
import TicketsAnalysis from './pages/TicketsAnalysis';
import Dashboard from './pages/Dashboard';

function Home() {
    return (
        <div className="min-h-screen bg-white">
        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Title */}
            <h1 className="text-4xl font-bold text-blue-800 text-center mb-16">
            Projects Management
            </h1>

            {/* Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tickets Incompletos Card */}
            <Link to="/tickets-incompletos" className="block">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-100 transition-transform hover:scale-105">
                <img
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800"
                    alt="Incomplete Tickets"
                    className="w-full h-48 object-cover"
                />
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-blue-800">Incomplete Tickets</h3>
                    <Ticket className="text-blue-600 w-6 h-6" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    View Tickets
                    </button>
                </div>
                </div>
            </Link>

            {/* Análisis de Tickets Card */}
            <Link to="/analisis-tickets" className="block">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-100 transition-transform hover:scale-105">
                <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
                    alt="Tickets Analysis"
                    className="w-full h-48 object-cover"
                />
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-blue-800">Tickets Analysis</h3>
                    <LineChart className="text-blue-600 w-6 h-6" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    View Analysis
                    </button>
                </div>
                </div>
            </Link>

            {/* Dashboard Card */}
            <Link to="/dashboard" className="block">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-100 transition-transform hover:scale-105">
                <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
                    alt="Dashboard"
                    className="w-full h-48 object-cover"
                />
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-blue-800">Dashboard</h3>
                    <LayoutDashboard className="text-blue-600 w-6 h-6" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    View Dashboard
                    </button>
                </div>
                </div>
            </Link>
            </div>
        </div>
        </div>
    );
    }

    function App() {
    return (
        <Router>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tickets-incompletos" element={<IncompleteTickets />} />
            <Route path="/analisis-tickets" element={<TicketsAnalysis />} />
            <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        </Router>
    );
}

export default App;