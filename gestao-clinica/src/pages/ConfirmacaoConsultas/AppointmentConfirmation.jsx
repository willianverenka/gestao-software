import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = "http://localhost:8000";

const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadPendentes = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/consultas/pendentes-de-confirmacao`
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erro ${response.status}`);
      }
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Falha ao carregar consultas.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendentes();
  }, [loadPendentes]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  };

  const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const patchStatus = async (consultaId, novoStatus) => {
    setActionId(consultaId);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/consultas/${consultaId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        }
      );
      if (!response.ok) {
        let detail = `Erro ${response.status}`;
        try {
          const body = await response.json();
          if (body.detail) {
            detail =
              typeof body.detail === "string"
                ? body.detail
                : JSON.stringify(body.detail);
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      await loadPendentes();
    } catch (e) {
      setError(e.message || "Falha ao atualizar consulta.");
    } finally {
      setActionId(null);
    }
  };

  const confirmAppointment = (consultaId) =>
    patchStatus(consultaId, "confirmada");

  const rejectAppointment = (consultaId) =>
    patchStatus(consultaId, "cancelada");

  const statusBadge = (status) => {
    if (status === "agendada") {
      return <Badge variant="outline">Pendente</Badge>;
    }
    if (status === "confirmada") {
      return <Badge className="bg-green-500">Confirmado</Badge>;
    }
    if (status === "cancelada") {
      return <Badge className="bg-red-500">Cancelado</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 text-slate-500 hover:text-slate-800 p-0 h-auto"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
      </Button>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Confirmação de Consultas
      </h1>

      <p className="text-slate-500 mb-8">
        Aqui a secretária pode confirmar ou recusar solicitações de consultas.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
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
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500"
                  >
                    Nenhuma consulta pendente de confirmação.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => {
                  const pending = appt.status === "agendada";
                  const busy = actionId === appt.consulta_id;
                  return (
                    <tr
                      key={appt.consulta_id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="p-4">{appt.paciente_nome}</td>
                      <td className="p-4">{appt.medico_nome}</td>
                      <td className="p-4">{formatDate(appt.data_hora)}</td>
                      <td className="p-4">{formatTime(appt.data_hora)}</td>
                      <td className="p-4">{statusBadge(appt.status)}</td>

                      <td className="p-4 flex gap-2 justify-center">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-white-700 rounded-full"
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
  );
};

export default AppointmentConfirmation;
