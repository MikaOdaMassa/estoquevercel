'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../actions/users';
import Swal from 'sweetalert2';

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'OPERATOR', location: 'COZINHA' });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ username: '', password: '', role: 'OPERATOR', location: 'COZINHA' });
    setShowModal(true);
  }

  function openEdit(user: any) {
    setIsEditing(true);
    setCurrentId(user.id);
    setFormData({ username: user.username, password: '', role: user.role, location: user.location });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEditing && currentId) {
        await updateUser(currentId, formData);
        Swal.fire('Sucesso', 'Usuário atualizado', 'success');
      } else {
        await createUser(formData);
        Swal.fire('Sucesso', 'Usuário criado', 'success');
      }
      setShowModal(false);
      loadUsers();
    } catch (e: any) {
      Swal.fire('Erro', e.message, 'error');
    }
  }

  async function handleDelete(id: string, username: string) {
    const result = await Swal.fire({
      title: `Excluir usuário ${username}?`,
      text: "Esta ação não pode ser desfeita.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      const res = await deleteUser(id);
      if (res.success) {
        loadUsers();
        Swal.fire('Deletado', 'Usuário removido', 'success');
      } else {
        Swal.fire('Erro', res.message, 'error');
      }
    }
  }

  return (
    <div className="p-5 md:p-10 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', margin: 0 }}>Gestão de Usuários</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Controle quem acessa o sistema e quais as permissões</p>
        </div>
        <button 
          onClick={openCreate}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
        >
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-3xl overflow-x-auto border border-slate-200 shadow-sm">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '20px 24px' }}>Usuário</th>
              <th style={{ padding: '20px 24px' }}>Cargo</th>
              <th style={{ padding: '20px 24px' }}>Local</th>
              <th style={{ padding: '20px 24px' }}>Criado em</th>
              <th style={{ padding: '20px 24px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '20px 24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                         <i className="fas fa-user"></i>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{u.username}</span>
                   </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800,
                    background: u.role === 'ADMIN' ? '#eef2ff' : '#f0fdf4',
                    color: u.role === 'ADMIN' ? '#4f46e5' : '#16a34a'
                  }}>
                    {u.role === 'ADMIN' ? 'ADMINISTRADOR' : 'OPERADOR'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '13px' }}>
                    <i className={`fas ${u.location === 'BAR' ? 'fa-glass-martini-alt' : 'fa-utensils'}`} style={{ marginRight: '6px' }}></i>
                    {u.location}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', color: '#64748b', fontSize: '14px' }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      onClick={() => openEdit(u)}
                      style={{ background: '#f1f5f9', border: 'none', color: '#475569', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id, u.username)}
                      style={{ background: '#fef2f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Nenhum usuário cadastrado.</div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-6 md:p-10 rounded-3xl w-full max-w-md shadow-2xl m-4">
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              {isEditing ? 'Atualize as informações do usuário.' : 'Crie um novo acesso para a equipe.'}
            </p>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Username</label>
                <input 
                  required 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input 
                  type="password" 
                  required={!isEditing}
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Cargo</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})} 
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff' }}
                  >
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Lugar</label>
                  <select 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff' }}
                  >
                    <option value="COZINHA">Cozinha</option>
                    <option value="BAR">Bar</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
