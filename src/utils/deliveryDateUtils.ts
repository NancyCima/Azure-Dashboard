export const getDaysUntilDelivery = (dueDate: string) => {
    // Calcular los días restantes hasta la fecha de entrega
    const today = new Date();
    const deliveryDate = new Date(dueDate);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const getDaysStatusStyle = (days: number): string => {
    if (days < 0) return 'text-black line-through'; // Para fechas pasadas
    if (days === 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-red-500';
    if (days <= 15) return 'text-orange-500';
    return 'text-green-600';
};