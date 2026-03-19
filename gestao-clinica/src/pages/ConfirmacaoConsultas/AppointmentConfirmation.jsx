import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = 'http://localhost:8000';

const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca consultas agendadas da API
  useEffect(() => {
    const fetchConsultas = async () => {
      setLoading(true);
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_URL}/consultas?data=${hoje}`);
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultas();
  }, []);

  const atualizarStatus = async (id, novoStatus) => {
    try {
      const response = await fetch(`${API_URL}/consultas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        setAppointments(prev =>
          prev.map(appt =>
            appt.consulta_id === id ? { ...appt, status: novoStatus } : appt
          )
        );
      } else {
        // Se a API ainda não tem o endpoint de PATCH, atualiza só localmente
        setAppointments(prev =>
          prev.map(appt =>
            appt.consulta_id === id ? { ...appt, status: novoStatus } : appt
          )
        );
      }
    } catch (error) {
      // Atualiza localmente mesmo sem conexão
      setAppointments(prev =>
        prev.map(appt =>
          appt.consulta_id === id ? { ...appt, status: novoStatus } : appt
        )
      );
    }
  };

  const formatarDataHora = (dataHora) => {
    if (!dataHora) return '-';
    const d = new Date(dataHora);
    return {
      data: d.toLocaleDateString('pt-BR'),
      hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-6">
      <Button
        variant="ghost"
        className="mb-6 text-slate-500 hover:text-slate-800 p-0"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
      </Button>

      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Confirmação de Consultas
      </h1>
      <p className="text-slate-500 mb-8">
        Aqui a secretária pode confirmar ou recusar solicitações de consultas.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        {loading ? (
          <p className="text-slate-500 text-center py-12">Carregando consultas...</p>
        ) : appointments.length === 0 ? (
          <p className="text-slate-500 text-center py-12">
            Nenhuma consulta encontrada.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-4">Protocolo</th>
                <th className="p-4">Paciente</th>
                <th className="p-4">Médico</th>
                <th className="p-4">Data</th>
                <th className="p-4">Horário</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const { data, hora } = formatarDataHora(appt.data_hora);
                return (
                  <tr key={appt.consulta_id} className="border-b hover:bg-slate-50">
                    <td className="p-4 text-xs text-slate-400 font-mono">
                      {appt.protocolo || `#${appt.consulta_id}`}
                    </td>
                    <td className="p-4">{appt.paciente_nome || `Paciente #${appt.paciente_id}`}</td>
                    <td className="p-4">{appt.medico_nome || `Médico #${appt.medico_id}`}</td>
                    <td className="p-4">{data}</td>
                    <td className="p-4">{hora}</td>
                    <td className="p-4">
                      {appt.status === "agendada" && (
                        <Badge variant="outline">Pendente</Badge>
                      )}
                      {appt.status === "confirmada" && (
                        <Badge className="bg-green-500">Confirmado</Badge>
                      )}
                      {appt.status === "cancelada" && (
                        <Badge className="bg-red-500">Cancelado</Badge>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 rounded-full"
                        onClick={() => atualizarStatus(appt.consulta_id, 'confirmada')}
                        disabled={appt.status !== 'agendada'}
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => atualizarStatus(appt.consulta_id, 'cancelada')}
                        disabled={appt.status === 'cancelada'}
                      >
                        <X size={16} />
                      </Button>
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

export default AppointmentConfirmation;