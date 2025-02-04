import Header from '../components/Header';

function Dashboard() {
    return (
        <div className="min-h-screen bg-white">
            <Header showBackButton />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-blue-800 mb-8">Dashboard</h1>
                    <div className="bg-blue-50 p-8 rounded-lg shadow">
                        <p className="text-blue-800 text-xl">Página en construcción</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;