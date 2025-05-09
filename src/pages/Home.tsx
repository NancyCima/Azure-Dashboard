import { Link } from 'react-router-dom';
import { Ticket, LineChart, LayoutDashboard } from 'lucide-react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';

function Home() {
    return (
        <div className="min-h-screen bg-white">
        <Navbar/>
        <Header />
        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Title */}
            <h1 className="text-4xl font-bold text-[#2461b3] text-center mb-16">
                Gestión de Proyectos
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
                    <h3 className="text-xl font-semibold text-blue-800">Tickets Incompletos</h3>
                    <Ticket className="text-blue-600 w-6 h-6" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Ver Tickets
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
                    <h3 className="text-xl font-semibold text-blue-800">Análisis de Tickets</h3>
                    <LineChart className="text-blue-600 w-6 h-6" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Ver Análisis
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
                    Ver Dashboard
                    </button>
                </div>
                </div>
            </Link>
            </div>
        </div>
        </div>
    );
}
export default Home;