import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = 'http://localhost:8000';

// ─── Aba Consultas ────────────────────────────────────────────────────────────

const AbaConsultas = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/backoffice/consultas`);
      if (response.ok) setConsultas(await response.json());
      else setConsultas([]);
    } catch (error) {
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConsultas(); }, []);

  const atualizarStatus = async (id, novoStatus) => {
    try {
      await fetch(`${API_URL}/backoffice/consultas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
    } catch (e) {}
    setConsultas(prev => prev.map(c => c.consulta_id === id ? { ...c, status: novoStatus } : c));
  };

  const formatarDataHora = (dataHora) => {
    if (!dataHora) return { data: '-', hora: '-' };
    const d = new Date(dataHora);
    return {
      data: d.toLocaleDateString('pt-BR'),
      hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const statusBadge = (status) => {
    if (status === 'agendada') return <Badge variant="outline">Pendente</Badge>;
    if (status === 'confirmada') return <Badge className="bg-green-500">Confirmada</Badge>;
    if (status === 'cancelada') return <Badge className="bg-red-500">Cancelada</Badge>;
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={fetchConsultas}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-slate-500 text-center py-12">Carregando...</p>
        ) : consultas.length === 0 ? (
          <p className="text-slate-500 text-center py-12">Nenhuma consulta encontrada.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Protocolo</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Paciente</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Médico</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Data</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Horário</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((c) => {
                const { data, hora } = formatarDataHora(c.data_hora);
                return (
                  <tr key={c.consulta_id} className="border-b hover:bg-slate-50">
                    <td className="p-4 text-xs text-slate-400 font-mono">{c.protocolo || `#${c.consulta_id}`}</td>
                    <td className="p-4 font-medium">{c.paciente_nome}</td>
                    <td className="p-4 text-slate-600">{c.medico_nome}</td>
                    <td className="p-4 text-slate-600">{data}</td>
                    <td className="p-4 text-slate-600">{hora}</td>
                    <td className="p-4">{statusBadge(c.status)}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-full"
                          onClick={() => atualizarStatus(c.consulta_id, 'confirmada')}
                          disabled={c.status !== 'agendada'}>
                          <Check size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-full"
                          onClick={() => atualizarStatus(c.consulta_id, 'cancelada')}
                          disabled={c.status === 'cancelada'}>
                          <X size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Aba Pacientes ────────────────────────────────────────────────────────────

const AbaPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPacientes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/backoffice/pacientes`);
        if (response.ok) setPacientes(await response.json());
        else setPacientes([]);
      } catch (error) {
        setPacientes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {loading ? (
        <p className="text-slate-500 text-center py-12">Carregando...</p>
      ) : pacientes.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Nenhum paciente cadastrado.</p>
      ) : (
        <table className="w-full text-left">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">Nome</th>
              <th className="p-4 text-sm font-semibold text-slate-600">CPF</th>
              <th className="p-4 text-sm font-semibold text-slate-600">E-mail</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Data Nasc.</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p) => (
              <tr key={p.paciente_id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{p.nome}</td>
                <td className="p-4 text-slate-600 font-mono text-sm">{p.cpf}</td>
                <td className="p-4 text-slate-600">{p.email}</td>
                <td className="p-4 text-slate-600">{p.data_nascimento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Aba Médicos ──────────────────────────────────────────────────────────────

const AbaMedicos = () => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicos = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/backoffice/medicos`);
        if (response.ok) setMedicos(await response.json());
        else setMedicos([]);
      } catch (error) {
        setMedicos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicos();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {loading ? (
        <p className="text-slate-500 text-center py-12">Carregando...</p>
      ) : medicos.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Nenhum médico cadastrado.</p>
      ) : (
        <table className="w-full text-left">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">Nome</th>
              <th className="p-4 text-sm font-semibold text-slate-600">CRM</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Especialidade</th>
              <th className="p-4 text-sm font-semibold text-slate-600">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {medicos.map((m) => (
              <tr key={m.funcionario_id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{m.nome}</td>
                <td className="p-4 text-slate-600 font-mono text-sm">{m.crm}</td>
                <td className="p-4 text-slate-600">{m.especialidade}</td>
                <td className="p-4 text-slate-600">{m.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const Backoffice = () => {
  const navigate = useNavigate();
  const [aba, setAba] = useState('consultas');

  const abas = [
    { id: 'consultas', label: 'Consultas' },
    { id: 'pacientes', label: 'Pacientes' },
    { id: 'medicos', label: 'Médicos' },
  ];

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <Button variant="ghost" className="mb-6 text-slate-500 hover:text-slate-800 p-0" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
      </Button>

      <h1 className="text-3xl font-bold text-slate-800 mb-2">Painel Backoffice</h1>
      <p className="text-slate-500 mb-6">Gerencie consultas, pacientes e médicos.</p>

      {/* Abas */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {abas.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              aba === a.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'consultas' && <AbaConsultas />}
      {aba === 'pacientes' && <AbaPacientes />}
      {aba === 'medicos' && <AbaMedicos />}
    </div>
  );
};

export default Backoffice;