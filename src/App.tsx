import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { TicketsProvider } from './context/TicketsContext';
import IncompleteTickets from './pages/IncompleteTickets';
import TicketsAnalysis from './pages/TicketsAnalysis';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

function App() {
    return (
        <TicketsProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />}  />
                    <Route path="/tickets-incompletos" element={<IncompleteTickets />} />
                    <Route path="/analisis-tickets" element={<TicketsAnalysis />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </Router>
        </TicketsProvider>
    );
}

export default App;