import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ponderaciones } from '../utils/ponderacionesData';
import { profiles } from '../utils/profilesData';
import { useExpansion } from '../hooks/useExpansion';

interface PonderacionTableProps {
  tickets: any[];
}

const PonderacionTable: React.FC<PonderacionTableProps> = ({ tickets }) => {
    const { expandedItems, toggleItem } = useExpansion<string>();
    const [vigencia, setVigencia] = useState<{ [key: string]: string }>({});
  
    // Obtener todos los asignados únicos de los tickets
    const allAssignees = Array.from(new Set(
      tickets.map(t => typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?.displayName)
    )).filter(Boolean) as string[];
  
    // Encontrar recursos no asignados a ningún rol
    const unassigned = allAssignees.filter(name => 
      !profiles.some(rol => rol.assignedNames.includes(name))
    );
  
    return (
      <div className="mb-4 p-2 bg-white shadow rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-800">Asignación de Recursos</h2>
        </div>
  
        <div className="space-y-1">
          {profiles.map(rol => (
            <div key={rol.role} className="bg-blue-50 rounded-lg">
              <div 
                className="p-2 cursor-pointer flex items-center justify-between hover:bg-blue-100 transition-colors"
                onClick={() => toggleItem(rol.role)}
              >
                <div className="flex items-center">
                  {expandedItems.includes(rol.role) 
                    ? <ChevronDown className="w-5 h-5 mr-2 text-blue-600" />
                    : <ChevronRight className="w-5 h-5 mr-2 text-blue-600" />}
                  <span className="font-medium text-blue-800">{rol.role}</span>
                </div>
                <div className="flex items-center gap-x-4 min-w-[300px] justify-end">
                    <div className="flex items-center gap-x-2">
                        <span className="text-sm text-blue-600 bg-blue-100 px-1.5 py-1 rounded-full w-24 text-center">
                        {rol.assignedNames.length} miembros
                        </span>
                        <span className="text-sm text-blue-600 w-40 text-right">
                        {rol.estimatedHours.toLocaleString('de-DE')}h presupuestadas
                        </span>
                    </div>
                </div>
              </div>
  
              {expandedItems.includes(rol.role) && (
                <div className="p-2 bg-white border-t border-blue-100">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-blue-800">
                        <th className="pb-2 pl-4 w-2/5">Nombre</th>
                        <th className="pb-2 w-1/5">Ponderación</th>
                        <th className="pb-2 pr-4 w-2/5">Vigencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rol.assignedNames.map((name) => (
                        <tr key={name} className="border-t border-gray-100">
                          <td className="py-1.5 pl-4 w-2/5">{name}</td>
                          <td className="py-1.5 w-1/5">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {ponderaciones[name] || 1}
                            </span>
                          </td>
                          <td className="py-1.5 pr-4 w-2/5">
                            <input
                              type="date"
                              className="w-32 border rounded-lg px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                              value={vigencia[name] || '2024-12-31'}
                              onChange={(e) => setVigencia(prev => ({
                                ...prev,
                                [name]: e.target.value
                              }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
  
          {unassigned.length > 0 && (
            <div className="bg-blue-50 rounded-lg">
              <div 
                className="p-2 cursor-pointer flex items-center justify-between hover:bg-blue-100 transition-colors"
                onClick={() => toggleItem('otros')}
              >
                <div className="flex items-center">
                  {expandedItems.includes('otros') 
                    ? <ChevronDown className="w-5 h-5 mr-2 text-blue-600" />
                    : <ChevronRight className="w-5 h-5 mr-2 text-blue-600" />}
                  <span className="font-medium text-blue-800">Otros</span>
                </div>
                <span className="text-sm text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full w-24 text-center">
                    {unassigned.length} miembros
                </span>
              </div>
  
              {expandedItems.includes('otros') && (
                <div className="p-2 bg-white border-t border-blue-100">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-blue-800">
                            <th className="pb-2 pl-4 w-2/5">Nombre</th>
                            <th className="pb-2 w-1/5">Ponderación</th>
                            <th className="pb-2 pr-4 w-2/5">Vigencia</th>
                        </tr>
                        </thead>
                        <tbody>
                            {unassigned.map(name => (
                                <tr key={name} className="border-t border-gray-100">
                                    <td className="py-1.5 pl-4 w-2/5">{name}</td>
                                    <td className="py-1.5 w-1/5">
                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                                            Ponderación: 1.0
                                        </span>
                                    </td>
                                    <td className="py-1.5 pr-4 w-2/5">
                                        <input
                                            type="date"
                                            className="w-32 border rounded-lg px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={vigencia[name] || '2024-12-31'}
                                            onChange={(e) => setVigencia(prev => ({
                                                ...prev,
                                                [name]: e.target.value
                                            }))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };  

export default PonderacionTable;