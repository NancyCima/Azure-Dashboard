import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ponderaciones } from '../utils/ponderacionesData';
import { profiles } from '../utils/profilesData';
import { useExpansion } from '../hooks/useExpansion';

interface PonderacionTableProps {
  tickets: any[];
}

interface Profile {
  role: string;
  assignedNames: string[];
  estimatedHours: number;
}

interface MemberData {
  name: string;
  role: string;
  ponderacion: number;
  vigencia: string;
}

const PonderacionTable: React.FC<PonderacionTableProps> = ({ tickets }) => {
  const { expandedItems, toggleItem } = useExpansion<string>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<{ name: string; role: string } | null>(null);
  const [newMemberData, setNewMemberData] = useState<MemberData>({
    name: '',
    role: '',
    ponderacion: 1,
    vigencia: '2025-01-01'
  });
  const [editingMember, setEditingMember] = useState<{
    name: string;
    role: string;
    ponderacion: number;
    vigencia: string;
  } | null>(null);

  const [profilesState, setProfilesState] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('profiles');
    return saved ? JSON.parse(saved) : profiles;
  });
  
  const [ponderacionesState, setPonderacionesState] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('ponderaciones');
    return saved ? JSON.parse(saved) : ponderaciones;
  });
  
  const [vigenciaState, setVigenciaState] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('vigencia');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('profiles', JSON.stringify(profilesState));
    localStorage.setItem('ponderaciones', JSON.stringify(ponderacionesState));
    localStorage.setItem('vigencia', JSON.stringify(vigenciaState));
  }, [profilesState, ponderacionesState, vigenciaState]);

  const allAssignedNames = profilesState.flatMap(p => p.assignedNames);
  const unassigned = Object.keys(ponderacionesState)
  .filter(name => !allAssignedNames.includes(name));

  const handleAddMember = () => {
    // Validar campos vacíos
    if (!newMemberData.name.trim() || !newMemberData.role) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    // Verificar si el nombre ya existe en el rol seleccionado específicamente
    const isDuplicateInSameRole = profilesState.some(profile => 
        profile.role === newMemberData.role && 
        profile.assignedNames.includes(newMemberData.name.trim())
    );

    // Si el rol es "Otros", verificar si ya existe en las ponderaciones
    const existsInOthers = newMemberData.role === 'Otros' && Object.keys(ponderacionesState).includes(newMemberData.name.trim());

    if (isDuplicateInSameRole || existsInOthers) {
        setShowError(true);
        setSuccessMessage('Ya existe un miembro con este nombre en el rol seleccionado');
        setTimeout(() => {
        setShowError(false);
        setSuccessMessage('');
        }, 3000);
        return;
    }

    if (newMemberData.role !== 'Otros') {
      setProfilesState(prev => prev.map(p => 
        p.role === newMemberData.role 
          ? { ...p, assignedNames: [...p.assignedNames, newMemberData.name] }
          : p
      ));
    }

    setPonderacionesState(prev => ({
        ...prev,
        [newMemberData.name]: newMemberData.ponderacion
    }));

    setVigenciaState(prev => ({
        ...prev,
        [newMemberData.name]: newMemberData.vigencia
    }));

    setShowAddModal(false);
    setNewMemberData({
        name: '',
        role: '',
        ponderacion: 1,
        vigencia: '2025-01-01'
    });
    showSuccess('Miembro agregado exitosamente');
  };

  const removeFromRole = (role: string, name: string) => {
    setProfilesState(prev => prev.map(p =>
      p.role === role
        ? { ...p, assignedNames: p.assignedNames.filter(n => n !== name) }
        : p
    ));
    
    setPonderacionesState(prev => {
        const newState = { ...prev };
        delete newState[name];
        return newState;
    });
    setVigenciaState(prev => {
        const newState = { ...prev };
        delete newState[name];
        return newState;
    });
    
    showSuccess('Miembro eliminado exitosamente');
  };

  const openEditModal = (name: string) => {
    const originalRole = profilesState.find(p => p.assignedNames.includes(name))?.role ?? 'Otros';
    setEditingMember({
      name,
      role: originalRole,
      ponderacion: ponderacionesState[name],
      vigencia: vigenciaState[name] || '2025-01-01'
    });
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (!editingMember) return;

    // Actualizar ponderación y vigencia
    setPonderacionesState(prev => ({ ...prev, [editingMember.name]: editingMember.ponderacion }));
    setVigenciaState(prev => ({ ...prev, [editingMember.name]: editingMember.vigencia }));

    // Manejar cambio de rol
    const originalRole = profilesState.find(p => p.assignedNames.includes(editingMember.name))?.role || 'Otros';
    
    if (editingMember.role !== originalRole) {
      setProfilesState(prev => {
        // Remover del rol original
        const updated = prev.map(p => 
          p.role === originalRole ? { ...p, assignedNames: p.assignedNames.filter(n => n !== editingMember.name) } : p
        );

        // Agregar al nuevo rol si no es Otros
        if (editingMember.role !== 'Otros') {
          return updated.map(p => 
            p.role === editingMember.role ? { ...p, assignedNames: [...p.assignedNames, editingMember.name] } : p
          );
        }
        return updated;
      });
    }

    setShowEditModal(false);
    showSuccess('Cambios guardados exitosamente');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  return (
    <div className="mb-4 p-2 bg-white shadow rounded-lg">
      {/* Modales */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Agregar Miembro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre*</label>
                <input
                  type="text"
                  className={`w-full border rounded-lg px-3 py-2 ${
                    showError && !newMemberData.name ? 'border-red-500' : ''
                  }`}
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol*</label>
                <select
                  className={`w-full border rounded-lg px-3 py-2 ${
                    showError && !newMemberData.role ? 'border-red-500' : ''
                  }`}
                  value={newMemberData.role}
                  onChange={(e) => setNewMemberData(prev => ({...prev, role: e.target.value}))}
                >
                  <option value="">Seleccionar Rol</option>
                  {profilesState.map(profile => (
                    <option key={profile.role} value={profile.role}>{profile.role}</option>
                  ))}
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ponderación*</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full border rounded-lg px-3 py-2"
                  value={newMemberData.ponderacion}
                  onChange={(e) => setNewMemberData(prev => ({...prev, ponderacion: parseFloat(e.target.value)}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vigencia*</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={newMemberData.vigencia}
                  onChange={(e) => setNewMemberData(prev => ({...prev, vigencia: e.target.value}))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={handleAddMember}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Editar Miembro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  value={editingMember.name}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember(prev => prev && ({ ...prev, role: e.target.value }))}
                >
                  {profilesState.map(p => (
                    <option key={p.role} value={p.role}>{p.role}</option>
                  ))}
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ponderación</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editingMember.ponderacion}
                  onChange={(e) => setEditingMember(prev => prev && ({ ...prev, ponderacion: parseFloat(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vigencia</label>
                <input
                  type="date"
                  value={editingMember.vigencia}
                  onChange={(e) => setEditingMember(prev => prev && ({ ...prev, vigencia: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={handleConfirmEdit}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="mb-4">¿Estás seguro de eliminar a {memberToDelete.name}?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                onClick={() => {
                  removeFromRole(memberToDelete.role, memberToDelete.name);
                  setShowDeleteModal(false);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCannotDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">No se puede eliminar</h3>
            <p className="mb-4">Este miembro tiene horas registradas en tickets y no puede ser eliminado.</p>
            <div className="flex justify-end">
                <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => setShowCannotDeleteModal(false)}
                >
                Aceptar
                </button>
            </div>
            </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {showSuccessAlert && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-center animate-fade-in">
            {successMessage}
            </div>
        </div>
      )}

      {/* Mensaje de error */}
      {showError && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg text-center animate-fade-in">
                {successMessage || '¡Complete todos los campos requeridos!'}
            </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-800">Asignación de Recursos</h2>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          onClick={() => setShowAddModal(true)}
        >
          Nuevo Miembro +
        </button>
      </div>

      <div className="space-y-1">
        {profilesState.map(rol => (
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
                      <th className="pb-2 pr-4 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rol.assignedNames.map((name) => (
                      <tr key={name} className="border-t border-gray-100">
                        <td className="py-1.5 pl-4 w-2/5">{name}</td>
                        <td className="py-1.5 w-1/5">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="w-20 border rounded-lg px-2 py-1 text-sm cursor-pointer"
                            value={ponderacionesState[name] || 1}
                            onClick={() => openEditModal(name)}
                            readOnly
                          />
                        </td>
                        <td className="py-1.5 pr-4 w-2/5">
                          <input
                            type="date"
                            className="w-32 border rounded-lg px-3 py-1 text-sm cursor-pointer"
                            value={vigenciaState[name] || '2025-01-01'}
                            onClick={() => openEditModal(name)}
                            readOnly
                          />
                        </td>
                        <td className="py-1.5 pr-4 w-[5%] text-right">
                          <button 
                            onClick={() => {
                                const hasHours = tickets.some(ticket => 
                                    ticket.assignedTo === name && 
                                    (ticket.completed_hours || 0) > 0
                                );
                                if (hasHours) {
                                    setShowCannotDeleteModal(true);
                                } else {
                                    setMemberToDelete({ name, role: rol.role });
                                    setShowDeleteModal(true);
                                }
                            }}
                            className="text-red-500 hover:text-red-700 text-xl font-bold px-2 py-1"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {/* Sección de Otros */}
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
                      <th className="pb-2 pr-4 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassigned.map(name => (
                      <tr key={name} className="border-t border-gray-100">
                        <td className="py-1.5 pl-4 w-2/5">{name}</td>
                        <td className="py-1.5 w-1/5">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="w-20 border rounded-lg px-2 py-1 text-sm cursor-pointer"
                            value={ponderacionesState[name] || 1}
                            onClick={() => openEditModal(name)}
                            readOnly
                          />
                        </td>
                        <td className="py-1.5 pr-4 w-2/5">
                          <input
                            type="date"
                            className="w-32 border rounded-lg px-3 py-1 text-sm cursor-pointer"
                            value={vigenciaState[name] || '2025-01-01'}
                            onClick={() => openEditModal(name)}
                            readOnly
                          />
                        </td>
                        <td className="py-1.5 pr-4 w-[5%] text-right">
                          <button 
                            onClick={() => {
                                const hasHours = tickets.some(ticket => 
                                ticket.assignedTo === name && 
                                (ticket.completed_hours || 0) > 0
                                );
                            
                                if (hasHours) {
                                setShowCannotDeleteModal(true);
                                } else {
                                setMemberToDelete({ name, role: 'Otros' });
                                setShowDeleteModal(true);
                                }
                            }}
                            className="text-red-500 hover:text-red-700 text-xl font-bold px-2 py-1"
                          >
                            ×
                          </button>
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