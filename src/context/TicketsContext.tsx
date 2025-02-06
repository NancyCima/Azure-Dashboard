import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Ticket, UserStory, IncompleteTicket } from '../services/api';

interface TicketsContextType {
  tickets: Ticket[];
  userStories: UserStory[];
  incompleteTickets: IncompleteTicket[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [incompleteTickets, setIncompleteTickets] = useState<IncompleteTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsData, userStoriesData, incompleteTicketsData] = await Promise.all([
        api.getTickets(),
        api.getUserStories(),
        api.getIncompleteTickets(),
      ]);

      setTickets(ticketsData);
      setUserStories(userStoriesData);
      setIncompleteTickets(incompleteTicketsData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <TicketsContext.Provider value={{ 
      tickets, 
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