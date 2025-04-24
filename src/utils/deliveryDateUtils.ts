import * as DateHolidays from "date-holidays";

export const getDaysUntilDelivery = (dueDate: string) => {
    // Calcular los días restantes hasta la fecha de entrega
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(dueDate);
    deliveryDate.setHours(0, 0, 0, 0);

    if (deliveryDate < today) return 0;

    let count = 0;
    const currentDate = new Date(today);
    const hd = new  DateHolidays.default(); 
    hd.init("AR"); // Cargar feriados de Argentina

    while (currentDate < deliveryDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        const esFeriado = hd.isHoliday(currentDate);
        const esFinDeSemana = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        if (!esFinDeSemana && !esFeriado) count++;
    }

    return count;
};

export const getDaysStatusStyle = (days: number, progress: number): string => {
    if (days === 0 && progress >= 100) return 'text-black'; // Para entregas cumplidas
    if (days === 0) return 'text-red-600 font-bold'; // Para no entregas cumplidas
    if (days <= 7) return 'text-red-500'; // Entregas cercanas
    if (days <= 15) return 'text-orange-500';
    return 'text-green-600';
};