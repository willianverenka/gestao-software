import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { readErrorMessage } from '@/lib/api';

const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadPendentes = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await apiFetch('/consultas/pendentes-de-confirmacao');
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Falha ao carregar consultas.'));
      }
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Falha ao carregar consultas.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadPendentes();
  }, [loadPendentes]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const patchStatus = async (consultaId, novoStatus) => {
    setActionId(consultaId);
    setError(null);
    try {
      const response = await apiFetch(`/consultas/${consultaId}/status`, {
        method: 'PATCH',
        body: { status: novoStatus },
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Falha ao atualizar consulta.'));
      }
      await loadPendentes();
    } catch (e) {
      setError(e.message || 'Falha ao atualizar consulta.');
    } finally {
      setActionId(null);
    }
  };

  const confirmAppointment = (consultaId) => patchStatus(consultaId, 'confirmada');
  const rejectAppointment = (consultaId) => patchStatus(consultaId, 'cancelada');

  const statusBadge = (status) => {
    if (status === 'agendada') {
      return <Badge variant="outline">Pendente</Badge>;
    }
    if (status === 'confirmada') {
      return <Badge className="bg-green-500">Confirmado</Badge>;
    }
    if (status === 'cancelada') {
      return <Badge className="bg-red-500">Cancelado</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-slate-500 hover:text-slate-800"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
        </Button>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Confirmação de Consultas</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Aqui a secretária pode confirmar ou recusar solicitações de consultas pendentes.
        </p>

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200">
          {loading ? (
            <p className="p-8 text-center text-slate-500">Carregando…</p>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Médico</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Horário</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhuma consulta pendente de confirmação.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => {
                    const pending = appt.status === 'agendada';
                    const busy = actionId === appt.consulta_id;
                    return (
                      <tr key={appt.consulta_id} className="border-b hover:bg-slate-50">
                        <td className="p-4">{appt.paciente_nome}</td>
                        <td className="p-4">{appt.medico_nome}</td>
                        <td className="p-4">{formatDate(appt.data_hora)}</td>
                        <td className="p-4">{formatTime(appt.data_hora)}</td>
                        <td className="p-4">{statusBadge(appt.status)}</td>

                        <td className="flex justify-center gap-2 p-4">
                          <Button
                            size="sm"
                            className="rounded-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => confirmAppointment(appt.consulta_id)}
                            disabled={!pending || busy}
                          >
                            <Check size={16} />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            onClick={() => rejectAppointment(appt.consulta_id)}
                            disabled={!pending || busy}
                          >
                            <X size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;
