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

  let horasEstimadasHastaHoy = 0;
  let horasPonderadasHastaHoy = 0;
  let horasAdelantadas = 0;
  let horasEstimadasTotales = 0;
  let horasPonderadasTotales = 0;

  const progreso = calculateEntregableProgress(stories);

  stories.forEach(story => {
    (story.child_work_items || []).forEach(item => {
      // Obtener dueDate: prioriza la fecha de la tarea, sino usa la de la User Story padre
      const fechaItem = item.dueDate 
        ? new Date(item.dueDate) 
        : story.dueDate 
          ? new Date(story.dueDate) 
          : null;
      const fechaValida = fechaItem && !isNaN(fechaItem.getTime());
      const esPasado = fechaValida && fechaItem <= hoy;
   
      // Obtener esfuerzo de la tarea
      const estimated = Number(item.new_estimate ?? item.estimated_hours ?? 0);
      const estimatedOriginal = Number(item.estimated_hours ?? 0); 
      const completed = Number(item.completed_hours ?? 0);
      const factor = ponderaciones[(item.assignedTo || '').trim()] || 1;
      const weighted = completed * factor;

      // Acumular totales
      horasEstimadasTotales += estimatedOriginal;
      horasPonderadasTotales += weighted;

      if (esPasado) {
        horasEstimadasHastaHoy += estimated;
        horasPonderadasHastaHoy += weighted;
      } else if (fechaValida && fechaItem > hoy) {
        horasAdelantadas += weighted;
      }
    });
  });

  const diferenciaHorasTotal = horasPonderadasTotales - horasEstimadasTotales;

  const porcentajeConsumo = horasEstimadasTotales > 0 
    ? (horasPonderadasTotales / horasEstimadasTotales) * 100 
    : 0;

  return {
    porcentajeAvance: Number(progreso.toFixed(2)),
    porcentajeConsumo: Number(porcentajeConsumo.toFixed(2)),
    horasEstimadas: Number(horasEstimadasHastaHoy.toFixed(2)),
    horasPonderadas: Number(horasPonderadasHastaHoy.toFixed(2)),
    horasAdelantadas: Number(horasAdelantadas.toFixed(2)),
    diferenciaHoras: Number(diferenciaHorasTotal.toFixed(2))
  };
};

export const renderSemaforoEntrega = (
  semaforo: SemaforoResult, 
  dueDate: string
) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaEntrega = new Date(dueDate);
  fechaEntrega.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

  let estado = '';
  let color = '';
  
  // Regla 1: Fecha pasada
  if (fechaEntrega < hoy) {
    estado = semaforo.porcentajeAvance >= 100 ? 'Según lo previsto' : 'En riesgo';
    color = semaforo.porcentajeAvance >= 100 ? 'bg-green-500' : 'bg-red-500';
  } 
  // Regla 2: Fecha futura
  else {
    if (semaforo.diferenciaHoras >= 0) {
      estado = 'Según lo previsto';
      color = 'bg-green-500';
    } else {
      estado = 'Atrasado';
      color = 'bg-red-500';
      // Regla 5: 10 días o menos y falta ≥30%
      if (diasRestantes <= 10 && semaforo.porcentajeAvance < 70) {
        estado = 'En riesgo';
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 min-w-[90px]">
      <div className={`w-5 h-5 rounded-full ${color} mb-1`} />
      <div className="text-center">
        <span className="text-xs font-semibold text-gray-700">{estado}</span>
        {semaforo.horasAdelantadas > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-700 font-medium">
              Adelantadas: {semaforo.horasAdelantadas.toLocaleString('es-ES')}h
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const renderSemaforoConsumo = (consumo: SemaforoResult) => {
  let estado = '';
  let color = '';


  // La diferencia ahora es horasPonderadas - horasEstimadas
  // Si es positivo, significa que se consumieron más horas de las estimadas
  // Si es negativo, significa que se consumieron menos horas de las estimadas
  if (consumo.diferenciaHoras > 0) {
    estado = 'Sobre consumido';
    color = 'bg-red-500';
  } else if (consumo.diferenciaHoras < 0) {
    estado = 'Sub consumido';
    color = 'bg-blue-500';
  } else {
    estado = 'En límite';
    color = 'bg-green-500';
  }

  return (
    <div className="flex flex-col items-center gap-1 min-w-[90px]">
      <div className={`w-5 h-5 rounded-full ${color} mb-1`} />
      <div className="text-center">
        <span className="text-xs font-semibold text-gray-700">{estado}</span>
        <span className={`text-xs font-medium ${
          consumo.diferenciaHoras > 0 ? 'text-red-700' : 'text-blue-700'
        } block mt-1`}>
          {Math.abs(consumo.diferenciaHoras).toLocaleString('es-ES')}h {consumo.diferenciaHoras < 0 ? 'menos' : 'extra'}
        </span>
      </div>
    </div>
  );
};