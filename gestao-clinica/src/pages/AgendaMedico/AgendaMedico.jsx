import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  FileText,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/context/AuthContext';
import { readErrorMessage } from '@/lib/api';

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STATUS_CONFIG = {
  confirmada: {
    label: 'Confirmada',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rowClass: 'border-l-4 border-l-emerald-400',
    dotClass: 'bg-emerald-400',
  },
  agendada: {
    label: 'Pendente',
    icon: Clock3,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    rowClass: 'border-l-4 border-l-blue-400',
    dotClass: 'bg-blue-400',
  },
  cancelada: {
    label: 'Cancelada',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-600 border-red-200',
    rowClass: 'border-l-4 border-l-red-400 opacity-60',
    dotClass: 'bg-red-400',
  },
};

const SUMMARY_STATS = (lista) => ({
  total: lista.length,
  confirmadas: lista.filter((c) => c.status === 'confirmada').length,
  agendadas: lista.filter((c) => c.status === 'agendada').length,
  canceladas: lista.filter((c) => c.status === 'cancelada').length,
});

const formatMonthValue = (dateValue) => ({
  ano: dateValue.getFullYear(),
  mes: dateValue.getMonth() + 1,
});

const formatTime = (iso) => {
  if (!iso) return '—';
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '—';
  return value.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getAvatar = (nome) => {
  if (!nome) return 'MD';
  const parts = nome
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'MD';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const AgendaMedico = () => {
  const navigate = useNavigate();
  const { apiFetch, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [medico, setMedico] = useState(null);
  const [consultasDoDia, setConsultasDoDia] = useState([]);
  const [datesWithAppointments, setDatesWithAppointments] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingConsultas, setLoadingConsultas] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [consultasError, setConsultasError] = useState('');
  const medicoId = user?.funcionario_id ?? null;

  const dateKey = formatDate(selectedDate);

  const stats = useMemo(() => SUMMARY_STATS(consultasDoDia), [consultasDoDia]);
  const medicoEspecialidade = medico?.especialidade_nome || 'Especialidade não informada';
  const medicoCrm = medico?.crm || 'CRM não informado';

  const loadProfile = useCallback(async () => {
    if (!medicoId) {
      setProfileError('Sessão do médico inválida.');
      setMedico(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setProfileError('');

    try {
      const response = await apiFetch(`/medicos/${medicoId}/perfil`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Falha ao carregar perfil do médico.'));
      }
      const payload = await response.json();
      setMedico(payload || null);
    } catch (error) {
      setMedico(null);
      setProfileError(error.message || 'Falha ao carregar perfil do médico.');
    } finally {
      setLoadingProfile(false);
    }
  }, [apiFetch, medicoId]);

  const loadConsultas = useCallback(async () => {
    if (!medicoId) {
      setConsultasError('Sessão do médico inválida.');
      setConsultasDoDia([]);
      setLoadingConsultas(false);
      return;
    }

    setLoadingConsultas(true);
    setConsultasError('');

    try {
      const response = await apiFetch(`/medicos/${medicoId}/consultas?data=${dateKey}`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Falha ao carregar consultas do dia.'));
      }
      const payload = await response.json();
      setConsultasDoDia(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setConsultasDoDia([]);
      setConsultasError(error.message || 'Falha ao carregar consultas do dia.');
    } finally {
      setLoadingConsultas(false);
    }
  }, [apiFetch, dateKey, medicoId]);

  const loadCalendarMarkers = useCallback(async () => {
    if (!medicoId) {
      setDatesWithAppointments([]);
      setLoadingCalendar(false);
      return;
    }

    setLoadingCalendar(true);
    const { ano, mes } = formatMonthValue(visibleMonth);

    try {
      const response = await apiFetch(`/medicos/${medicoId}/consultas/datas?ano=${ano}&mes=${mes}`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Falha ao carregar datas com consultas.'));
      }
      const payload = await response.json();
      const nextDates = Array.isArray(payload)
        ? payload
            .filter((item) => typeof item === 'string')
            .map((item) => {
              const [year, month, day] = item.split('-').map(Number);
              return new Date(year, month - 1, day);
            })
            .filter((item) => !Number.isNaN(item.getTime()))
        : [];
      setDatesWithAppointments(nextDates);
    } catch {
      setDatesWithAppointments([]);
    } finally {
      setLoadingCalendar(false);
    }
  }, [apiFetch, medicoId, visibleMonth]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadConsultas();
  }, [loadConsultas]);

  useEffect(() => {
    loadCalendarMarkers();
  }, [loadCalendarMarkers]);

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <Button
        variant="ghost"
        className="mb-6 text-slate-500 hover:text-slate-800 p-0 h-auto"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
      </Button>

      <div className="flex items-center gap-4 mb-8 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl shadow-sm">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
          {getAvatar(medico?.nome)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {loadingProfile ? 'Carregando médico...' : medico?.nome || 'Médico'}
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
            {medicoEspecialidade} &bull; {medicoCrm}
          </p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <User className="h-4 w-4 text-indigo-500" />
          Visualizando sua agenda
        </div>
      </div>

      {profileError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between gap-4">
            <span>{profileError}</span>
            <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-red-700" onClick={loadProfile}>
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold mb-4 flex items-center text-slate-800 text-sm">
              <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
              Selecione a Data
            </h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(d) => {
                if (!d) return;
                setSelectedDate(d);
                setVisibleMonth(d);
              }}
              className="rounded-md border-none w-full p-0"
              modifiers={{ hasAppointment: datesWithAppointments }}
              modifiersClassNames={{
                hasAppointment: 'font-bold underline decoration-indigo-400 decoration-2',
              }}
              classNames={{
                months: 'w-full',
                month: 'w-full space-y-4',
                caption: 'flex justify-center pt-1 relative items-center mb-4',
                caption_label: 'text-sm font-medium text-slate-900',
                nav: 'space-x-1 flex items-center',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity',
                table: 'w-full border-collapse',
                head_row: 'flex w-full justify-between mb-2',
                head_cell: 'text-slate-500 rounded-md w-10 font-normal text-[0.8rem] flex-1 text-center',
                row: 'flex w-full mt-2 justify-between',
                cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1',
                day: 'h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-all mx-auto flex items-center justify-center',
                day_selected: 'bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white',
                day_today: 'bg-slate-100 text-slate-900',
                day_outside: 'text-slate-400 opacity-50',
                day_disabled: 'text-slate-500 opacity-50',
              }}
            />
            {loadingCalendar ? (
              <p className="mt-3 text-xs text-slate-500">Carregando datas com consultas...</p>
            ) : null}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-slate-800 text-sm">Legenda de Status</h3>
            <div className="space-y-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                  {cfg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, colorClass: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
              { label: 'Confirmadas', value: stats.confirmadas, colorClass: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Agendadas', value: stats.agendadas, colorClass: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
              { label: 'Canceladas', value: stats.canceladas, colorClass: 'text-red-600', bg: 'bg-red-50 border-red-200' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.bg} text-center`}>
                <p className={`text-2xl font-bold ${s.colorClass}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                Consultas de{' '}
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                {stats.total} {stats.total === 1 ? 'consulta' : 'consultas'}
              </Badge>
            </div>

            {consultasError ? (
              <div className="px-6 py-8">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="flex items-center justify-between gap-4">
                    <span>{consultasError}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-red-700"
                      onClick={loadConsultas}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              </div>
            ) : loadingConsultas ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Clock className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Carregando consultas do dia...</p>
              </div>
            ) : consultasDoDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Nenhuma consulta agendada nesta data.</p>
                <p className="text-slate-400 text-sm mt-1">Selecione outro dia no calendário.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {consultasDoDia.map((consulta) => {
                  const cfg = STATUS_CONFIG[consulta.status] ?? STATUS_CONFIG.agendada;
                  const StatusIcon = cfg.icon;

                  return (
                    <div
                      key={consulta.consulta_id}
                      className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${cfg.rowClass}`}
                    >
                      <div className="flex-shrink-0 w-16 text-center pt-1">
                        <span className="text-lg font-bold text-slate-700">{formatTime(consulta.data_hora)}</span>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-center pt-2">
                        <div className={`w-3 h-3 rounded-full ${cfg.dotClass}`} />
                        <div className="w-0.5 h-full bg-slate-200 mt-1" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-slate-400" />
                            {consulta.paciente_nome}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.badgeClass}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-3.5 w-3.5" />
                            {medicoEspecialidade}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {consulta.convenio_nome}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaMedico;
