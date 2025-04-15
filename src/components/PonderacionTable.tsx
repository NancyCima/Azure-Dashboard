import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, UserPlus } from 'lucide-react';
import { useExpansion } from '../hooks/useExpansion';

interface Profile {
  role: string;
  estimatedHours: number;
  assignedNames: string[];
}

interface PersonData {
  name: string;
  ponderacion: number;
  vigencia: string;
  roles: string[];
}

interface PonderacionTableProps {
  tickets: any[];
}

const defaultProfiles: Profile[] = [
  { role: "QA", estimatedHours: 6720, assignedNames: [] },
  { role: "PO", estimatedHours: 896, assignedNames: [] },
  { role: "PM", estimatedHours: 2240, assignedNames: [] },
  { role: "SM", estimatedHours: 595, assignedNames: [] },
  { role: "Design", estimatedHours: 200, assignedNames: [] },
  { role: "Devs", estimatedHours: 17920, assignedNames: [] }
];

const PonderacionTable: React.FC<PonderacionTableProps> = ({ tickets }) => {
  const { expandedItems, toggleItem } = useExpansion<string>();
  const [profiles, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [people, setPeople] = useState<PersonData[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPersonForm, setShowAddPersonForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedPeople = localStorage.getItem('ponderacionPeople');
    const savedProfiles = localStorage.getItem('ponderacionProfiles');
    
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
  }, []);

  // Guardar cambios
  useEffect(() => {
    localStorage.setItem('ponderacionPeople', JSON.stringify(people));
    localStorage.setItem('ponderacionProfiles', JSON.stringify(profiles));
  }, [people, profiles]);

  const handleAddPerson = () => {
    if (!newPersonName.trim() || !selectedRole) return;

    const newPerson: PersonData = {
      name: newPersonName.trim(),
      ponderacion: 1,
      vigencia: new Date().toISOString().split('T')[0],
      roles: [selectedRole]
    };

    setPeople([...people, newPerson]);
    setProfiles(profiles.map(profile => 
      profile.role === selectedRole 
        ? { ...profile, assignedNames: [...profile.assignedNames, newPersonName.trim()] }
        : profile
    ));

    setNewPersonName('');
    setSelectedRole('');
    setShowAddPersonForm(false);
  };

  const handleRemovePerson = (personName: string) => {
    setPeople(people.filter(p => p.name !== personName));
    setProfiles(profiles.map(profile => ({
      ...profile,
      assignedNames: profile.assignedNames.filter(name => name !== personName)
    })));
  };

  const handleUpdatePonderacion = (personName: string, newValue: number) => {
    setPeople(people.map(person =>
      person.name === personName
        ? { ...person, ponderacion: newValue }
        : person
    ));
  };

  const handleUpdateVigencia = (personName: string, newDate: string) => {
    setPeople(people.map(person =>
      person.name === personName
        ? { ...person, vigencia: newDate }
        : person
    ));
  };

  const handleAddRole = (personName: string, newRole: string) => {
    setPeople(people.map(person =>
      person.name === personName
        ? { ...person, roles: [...new Set([...person.roles, newRole])] }
        : person
    ));

    setProfiles(profiles.map(profile =>
      profile.role === newRole
        ? { ...profile, assignedNames: [...new Set([...profile.assignedNames, personName])] }
        : profile
    ));
  };

  const handleRemoveRole = (personName: string, roleToRemove: string) => {
    setPeople(people.map(person =>
      person.name === personName
        ? { ...person, roles: person.roles.filter(role => role !== roleToRemove) }
        : person
    ));

    setProfiles(profiles.map(profile =>
      profile.role === roleToRemove
        ? { ...profile, assignedNames: profile.assignedNames.filter(name => name !== personName) }
        : profile
    ));
  };

  return (
    <div className="mb-4 p-2 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-800">Asignación de Recursos</h2>
        <button
          onClick={() => setShowAddPersonForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Agregar Persona
        </button>
      </div>

      {showAddPersonForm && (
        <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre completo"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol inicial
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar rol</option>
                {profiles.map(profile => (
                  <option key={profile.role} value={profile.role}>
                    {profile.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPerson}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAddPersonForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                  {rol.assignedNames.length} miembros
                </span>
                <span className="text-sm text-blue-600">
                  {rol.estimatedHours.toLocaleString('de-DE')}h presupuestadas
                </span>
              </div>
            </div>

            {expandedItems.includes(rol.role) && (
              <div className="p-2 bg-white border-t border-blue-100">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-blue-800">
                      <th className="pb-2 pl-4">Nombre</th>
                      <th className="pb-2">Ponderación</th>
                      <th className="pb-2">Vigencia</th>
                      <th className="pb-2">Roles adicionales</th>
                      <th className="pb-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rol.assignedNames.map((name) => {
                      const person = people.find(p => p.name === name);
                      if (!person) return null;

                      return (
                        <tr key={name} className="border-t border-gray-100">
                          <td className="py-2 pl-4">{name}</td>
                          <td className="py-2">
                            <input
                              type="number"
                              min="0.1"
                              max="2"
                              step="0.1"
                              value={person.ponderacion}
                              onChange={(e) => handleUpdatePonderacion(name, parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="date"
                              value={person.vigencia}
                              onChange={(e) => handleUpdateVigencia(name, e.target.value)}
                              className="px-2 py-1 border rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2 items-center">
                              <select
                                className="px-2 py-1 border rounded focus:ring-blue-500 focus:border-blue-500"
                                onChange={(e) => handleAddRole(name, e.target.value)}
                                value=""
                              >
                                <option value="">Agregar rol</option>
                                {profiles
                                  .filter(p => !person.roles.includes(p.role))
                                  .map(p => (
                                    <option key={p.role} value={p.role}>
                                      {p.role}
                                    </option>
                                  ))
                                }
                              </select>
                              <div className="flex gap-1">
                                {person.roles.map(role => (
                                  <span
                                    key={role}
                                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                  >
                                    {role}
                                    {person.roles.length > 1 && (
                                      <button
                                        onClick={() => handleRemoveRole(name, role)}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => handleRemovePerson(name)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PonderacionTable;