import React, { useMemo, useState } from 'react';
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

const MEDICO_LOGADO = {
  id: 1,
  nome: 'Dr. Carlos Eduardo',
  crm: 'CRM/SP 123456',
  especialidade: 'Cardiologia',
  avatar: 'CE',
};

const CONSULTAS_DATA = [
  {
    id: 1,
    medico_id: 1,
    data: '2026-04-23',
    hora: '08:00',
    paciente: 'Ana Paula Ferreira',
    convenio: 'Unimed',
    status: 'confirmada',
    observacao: 'Retorno pós-cirúrgico',
  },
  {
    id: 2,
    medico_id: 1,
    data: '2026-04-23',
    hora: '09:00',
    paciente: 'Roberto Alves',
    convenio: 'Amil',
    status: 'agendada',
    observacao: 'Primeira consulta',
  },
  {
    id: 3,
    medico_id: 1,
    data: '2026-04-23',
    hora: '09:30',
    paciente: 'Mariana Costa',
    convenio: 'SulAmérica',
    status: 'cancelada',
    observacao: 'Paciente desmarcou',
  },
  {
    id: 4,
    medico_id: 1,
    data: '2026-04-23',
    hora: '10:00',
    paciente: 'João Henrique Souza',
    convenio: 'Bradesco Saúde',
    status: 'confirmada',
    observacao: 'Eletrocardiograma',
  },
  {
    id: 5,
    medico_id: 1,
    data: '2026-04-23',
    hora: '11:00',
    paciente: 'Fernanda Lima',
    convenio: 'Hapvida',
    status: 'agendada',
    observacao: '',
  },
  {
    id: 6,
    medico_id: 1,
    data: '2026-04-23',
    hora: '14:00',
    paciente: 'Carlos Mendes',
    convenio: 'Particular',
    status: 'confirmada',
    observacao: 'Controle de hipertensão',
  },
  {
    id: 7,
    medico_id: 1,
    data: '2026-04-23',
    hora: '15:00',
    paciente: 'Patrícia Rocha',
    convenio: 'Unimed',
    status: 'confirmada',
    observacao: 'Arritmia',
  },
  {
    id: 8,
    medico_id: 1,
    data: '2026-04-23',
    hora: '16:00',
    paciente: 'Tiago Barros',
    convenio: 'Amil',
    status: 'agendada',
    observacao: 'Palpitações',
  },

  {
    id: 9,
    medico_id: 1,
    data: '2026-04-24',
    hora: '08:30',
    paciente: 'Luciana Pinto',
    convenio: 'SulAmérica',
    status: 'agendada',
    observacao: 'Avaliação inicial',
  },
  {
    id: 10,
    medico_id: 1,
    data: '2026-04-24',
    hora: '10:00',
    paciente: 'Rafael Nunes',
    convenio: 'Bradesco Saúde',
    status: 'confirmada',
    observacao: 'Ecocardiograma',
  },
  {
    id: 11,
    medico_id: 1,
    data: '2026-04-24',
    hora: '14:30',
    paciente: 'Sônia Cavalcanti',
    convenio: 'Hapvida',
    status: 'confirmada',
    observacao: 'Retorno mensal',
  },

  {
    id: 12,
    medico_id: 1,
    data: '2026-04-25',
    hora: '09:00',
    paciente: 'Diego Freitas',
    convenio: 'Particular',
    status: 'agendada',
    observacao: '',
  },
  {
    id: 13,
    medico_id: 1,
    data: '2026-04-25',
    hora: '11:30',
    paciente: 'Beatriz Cunha',
    convenio: 'Unimed',
    status: 'cancelada',
    observacao: 'Reagendar',
  },
];

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

const AgendaMedico = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 23));

  const dateKey = formatDate(selectedDate);

  const consultasDoDia = useMemo(() => {
    return CONSULTAS_DATA.filter(
      (c) => c.medico_id === MEDICO_LOGADO.id && c.data === dateKey
    ).sort((a, b) => a.hora.localeCompare(b.hora));
  }, [dateKey]);

  const stats = useMemo(() => SUMMARY_STATS(consultasDoDia), [consultasDoDia]);

  const datesWithAppointments = useMemo(() => {
    const unique = [...new Set(CONSULTAS_DATA.filter((c) => c.medico_id === MEDICO_LOGADO.id).map((c) => c.data))];
    return unique.map((d) => {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day);
    });
  }, []);

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
          {MEDICO_LOGADO.avatar}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{MEDICO_LOGADO.nome}</h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
            {MEDICO_LOGADO.especialidade} &bull; {MEDICO_LOGADO.crm}
          </p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <User className="h-4 w-4 text-indigo-500" />
          Visualizando sua agenda
        </div>
      </div>

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
              onSelect={(d) => d && setSelectedDate(d)}
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

            {consultasDoDia.length === 0 ? (
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
                      key={consulta.id}
                      className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${cfg.rowClass}`}
                    >
                      <div className="flex-shrink-0 w-16 text-center pt-1">
                        <span className="text-lg font-bold text-slate-700">{consulta.hora}</span>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-center pt-2">
                        <div className={`w-3 h-3 rounded-full ${cfg.dotClass}`} />
                        <div className="w-0.5 h-full bg-slate-200 mt-1" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-slate-400" />
                            {consulta.paciente}
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
                            {MEDICO_LOGADO.especialidade}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {consulta.convenio}
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
