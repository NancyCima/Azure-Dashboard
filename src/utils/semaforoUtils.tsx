import { WorkItem } from "../services/api";
import { ponderaciones } from "./ponderacionesData";
import { calculateEntregableProgress } from "./progressCalculations";

interface SemaforoResult {
  porcentajeAvance: number;
  porcentajeConsumo: number;
  horasEstimadas: number;
  horasPonderadas: number;
  horasAdelantadas: number;
  diferenciaHoras: number;
}

export const calcularSemaforos = (stories: WorkItem[]): SemaforoResult => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let horasEstimadas = 0;
  let horasPonderadas = 0;
  let horasAdelantadas = 0;

  const progreso = calculateEntregableProgress(stories);

  stories.forEach(story => {
    (story.child_work_items || []).forEach(item => {
      const fechaItem = item.dueDate ? new Date(item.dueDate) : null;
      fechaItem?.setHours(0, 0, 0, 0);

      const estimado = Number(item.new_estimate ?? item.estimated_hours ?? 0);
      const completado = Number(item.completed_hours ?? 0);
      const asignado = (item.assignedTo || '').trim();
      const factor = ponderaciones[asignado] || 1;
      const ponderado = completado * factor;

      // 1. Sumar todas las horas estimadas (sin importar fecha)
      horasEstimadas += estimado;

      // 2. Calcular horas adelantadas (solo si la tarea es futura)
      if (fechaItem && fechaItem > hoy) {
        horasAdelantadas += ponderado;
      }

      // 3. Acumular horas ponderadas
      horasPonderadas += ponderado;
    });
  });

  // 4. Calcular diferencia CORRECTA (Ponderadas - Estimadas)
  const diferenciaHoras = horasPonderadas - horasEstimadas;

  // 5. Calcular porcentaje de consumo correcto
  const porcentajeConsumo = horasEstimadas > 0
    ? (horasPonderadas / horasEstimadas) * 100
    : 0;

  return {
    porcentajeAvance: Number(progreso.toFixed(2)),
    porcentajeConsumo: Number(porcentajeConsumo.toFixed(2)),
    horasEstimadas: Number(horasEstimadas.toFixed(2)),
    horasPonderadas: Number(horasPonderadas.toFixed(2)),
    horasAdelantadas: Number(horasAdelantadas.toFixed(2)),
    diferenciaHoras: Number(diferenciaHoras.toFixed(2)),
  };
};

export const renderSemaforoEntrega = (progreso: number, dueDate: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaEntrega = new Date(dueDate);
  fechaEntrega.setHours(0, 0, 0, 0);

  let estado = '';
  let color = '';

  if (progreso >= 100 && fechaEntrega < hoy) {
    estado = 'Según lo previsto';
    color = 'bg-green-500';
  } else if (progreso >= 100 && fechaEntrega >= hoy) {
    estado = 'Adelantado';
    color = 'bg-green-500';
  } else if (progreso < 100 && fechaEntrega < hoy) {
    estado = 'En riesgo';
    color = 'bg-red-500';
  } else if (progreso >= 90) {
    estado = 'En camino';
    color = 'bg-yellow-500';
  } else {
    estado = 'Atrasado';
    color = 'bg-red-500';
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`w-5 h-5 rounded-full ${color} mb-1`} />
      <span className="text-[10px] font-medium text-gray-600">{estado}</span>
    </div>
  );
};

export const renderSemaforoConsumo = (consumo: SemaforoResult) => {
  let estado = '';
  let color = '';

  if (consumo.diferenciaHoras < 0) {
    estado = 'Sobre consumido';
    color = 'bg-red-500';
  } else if (consumo.diferenciaHoras > 0) {
    estado = 'Sub consumido';
    color = 'bg-blue-500';
  } else {
    estado = 'En límite';
    color = 'bg-yellow-500';
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`w-5 h-5 rounded-full ${color} mb-1`} />
      <span className="text-[10px] font-medium text-gray-600">{estado}</span>
      <span className="text-[10px] text-gray-500">
        {consumo.porcentajeConsumo.toFixed(2)}% ({consumo.diferenciaHoras <= 0 ? '+' : ''}{consumo.diferenciaHoras.toFixed(2)}h)
      </span>
      <span className="text-[10px] text-green-600 mt-1">
        Adelantadas: {consumo.horasAdelantadas.toFixed(2)}h
      </span>
    </div>
  );
};
