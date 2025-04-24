import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, WorkItem } from '../services/api';
import { useAuth } from './AuthContext';

interface TicketsContextType {
  workitems: WorkItem[];
  userStories: WorkItem[];
  incompleteTickets: WorkItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [workitems, setWorkitems] = useState<WorkItem[]>([]);
  const [userStories, setUserStories] = useState<WorkItem[]>([]);
  const [incompleteTickets, setIncompleteTickets] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth(); // Escucha el estado de autenticación

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workitemData] = await Promise.all([
        api.getWorkitems()
      ]);
      
      const userStoriesData = workitemData
            .filter(ticket => ticket.type === 'User Story'  || ticket.type === 'Technical Challenge' || ticket.type === 'Technical Debt')
            .filter(ticket => ticket !== undefined
                && ((ticket.storyPoints === null || ticket.storyPoints === 0) 
                        || (ticket.acceptance_criteria === null || ticket.acceptance_criteria === '')
                        || (ticket.description === null || ticket.description === '')));

      // Unit todos los child_work_items de las user stories en un solo array
      const incompleteTicketsData = workitemData
                                      .filter(ticket => ticket.type === 'User Story') 
                                      .filter(ticket => ticket !== undefined)
                                      .filter(ticket => ticket !== undefined && ticket.child_work_items && ticket.child_work_items.length > 0)
                                      .flatMap(ticket => ticket.child_work_items)
                                      .filter((ticket): ticket is WorkItem => ticket !== undefined);

      console.log('✅ Tickets incompletos count:', incompleteTicketsData.length);
      console.log('✅ Tickets completos:', workitemData);
      console.log('✅ User Stories:', userStoriesData);
      console.log('✅ Tickets incompletos (otros):', incompleteTicketsData);

      const totalCompletedHours = workitemData.reduce((acc, ticket) => {
        const completedHours = ticket.completed_hours || 0;
        return acc + completedHours;
      }
      , 0);

      console.log('✅ Total horas completadas:', totalCompletedHours);

      setWorkitems(workitemData);
      setUserStories(userStoriesData);
      setIncompleteTickets(incompleteTicketsData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos: ' + err);
    } finally {
      setLoading(false);
    }
  };

  // Condiciona el fetchData para que solo se ejecute cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  return (
    <TicketsContext.Provider value={{ 
      workitems, 
      userStories, 
      incompleteTickets, 
      loading, 
      error,
      refreshData: fetchData 
    }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
}