import { useState } from 'react';

export const useExpansion = <T extends number | string>() => {
  const [expandedItems, setExpandedItems] = useState<T[]>([]);

  const toggleItem = (itemId: T) => {
    setExpandedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return { expandedItems, toggleItem };
};