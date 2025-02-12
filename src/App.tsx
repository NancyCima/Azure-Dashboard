import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import IncompleteTickets from './pages/IncompleteTickets';
import TicketsAnalysis from './pages/TicketsAnalysis';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import { TicketsProvider } from './contexts/TicketsContext';


function App() {
    return (
        <AuthProvider>
            <TicketsProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/" 
                                element={
                                    <ProtectedRoute>
                                        <Home />
                                    </ProtectedRoute>
                                }
                            />
                        <Route path="/tickets-incompletos" 
                                element={   
                                    <ProtectedRoute>
                                        <IncompleteTickets/>
                                    </ProtectedRoute>
                                }
                            />
                        <Route path="/analisis-tickets" 
                                element={
                                    <ProtectedRoute>
                                        <TicketsAnalysis />
                                    </ProtectedRoute>
                                } 
                            />
                        <Route path="/dashboard" 
                                element={ 
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } 
                            />
                    </Routes>
                </Router>
            </TicketsProvider>
        </AuthProvider>
    );
}

export default App;