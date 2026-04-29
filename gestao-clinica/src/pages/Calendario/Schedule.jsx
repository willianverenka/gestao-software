import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { readErrorMessage } from '@/lib/api';
import { useCatalogOptions } from '@/hooks/useCatalogOptions';

const Schedule = () => {
  const navigate = useNavigate();
  const { apiFetch } = useAuth();
  const {
    options: especialidades,
    items: especialidadeItems,
    loading: loadingEspecialidades,
    error: especialidadesError,
    reload: reloadEspecialidades,
  } = useCatalogOptions('/especialidades');
  const especialidadeCatalogBlocked =
    loadingEspecialidades || (!especialidades.length && Boolean(especialidadesError));

  const [especialidade, setEspecialidade] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const availableSet = useMemo(() => new Set(availableSlots), [availableSlots]);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h < 18; h += 1) {
      slots.push(`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const fetchDisponiveis = useCallback(
    async (dataObj = date, esp = especialidade) => {
      if (!esp) return;
      setLoadingSlots(true);
      setScheduleError('');
      setAvailableSlots([]);
      setSelectedSlot(null);

      try {
        const response = await apiFetch(
          `/consultas/disponiveis?data=${formatDate(dataObj)}&especialidade=${encodeURIComponent(esp)}`,
        );
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Erro ao buscar horários.'));
        }
        const payload = await response.json();
        setAvailableSlots(payload?.horarios || []);
      } catch (error) {
        setScheduleError(error.message || 'Erro ao buscar horários disponíveis.');
        console.error('Erro ao buscar horários disponíveis:', error);
      } finally {
        setLoadingSlots(false);
      }
    },
    [apiFetch, date, especialidade],
  );

  const handleAgendar = async () => {
    if (!selectedSlot || !especialidade) return;
    setAgendando(true);
    setScheduleError('');

    try {
      const response = await apiFetch('/consultas', {
        method: 'POST',
        body: {
          especialidade,
          data: formatDate(date),
          hora: selectedSlot,
        },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Falha ao agendar consulta.'));
      }

      await fetchDisponiveis();
      alert('Consulta agendada com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      setScheduleError(error.message || 'Falha ao agendar consulta.');
      alert(error.message || 'Falha ao agendar consulta.');
    } finally {
      setAgendando(false);
    }
  };

  useEffect(() => {
    if (especialidade) fetchDisponiveis();
  }, [especialidade, date, fetchDisponiveis]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="p-0 text-slate-500 hover:text-slate-800" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
        </Button>
      </div>

      <section className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center text-slate-700">
            <Stethoscope className="mr-2 h-4 w-4 text-blue-600" />
            Qual especialidade você busca?
          </label>
          <Select
            items={especialidadeItems}
            value={especialidade || undefined}
            onValueChange={(value) => {
              setEspecialidade(value);
              setSelectedSlot(null);
            }}
            disabled={especialidadeCatalogBlocked}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue
                placeholder={
                  loadingEspecialidades ? 'Carregando especialidades...' : 'Selecione a especialidade'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {especialidades.map((esp) => (
                <SelectItem key={esp.codigo} value={esp.codigo}>
                  {esp.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {especialidadesError ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>{especialidadesError}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-amber-700 hover:bg-transparent hover:text-amber-900"
                onClick={reloadEspecialidades}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {scheduleError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {scheduleError}
        </p>
      ) : null}

      {especialidade ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-fit rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 flex items-center font-semibold text-slate-800">
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
              Escolha a Data
            </h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selected) => {
                if (!selected) return;
                setDate(selected);
                setSelectedSlot(null);
              }}
              className="w-full rounded-md border-none p-0"
              classNames={{
                months: 'w-full',
                month: 'w-full space-y-4',
                caption: 'relative mb-4 flex items-center justify-center pt-1',
                caption_label: 'text-sm font-medium text-slate-900',
                nav: 'flex items-center space-x-1',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 transition-opacity hover:opacity-100',
                table: 'w-full border-collapse',
                head_row: 'mb-2 flex w-full justify-between',
                head_cell: 'flex-1 rounded-md text-center text-[0.8rem] font-normal text-slate-500',
                row: 'mt-2 flex w-full justify-between',
                cell: 'relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20',
                day: 'mx-auto flex h-10 w-10 items-center justify-center rounded-md p-0 font-normal transition-all hover:bg-slate-100 aria-selected:opacity-100',
                day_selected:
                  'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
                day_today: 'bg-slate-100 text-slate-900',
                day_outside: 'text-slate-400 opacity-50',
                day_disabled: 'text-slate-500 opacity-50',
              }}
            />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="flex items-center text-lg font-bold text-slate-800">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Horários disponíveis para {especialidades.find((item) => item.codigo === especialidade)?.nome}
              </h3>
              <Badge variant="outline">30 min</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {timeSlots.map((slot) => {
                const isOccupied = loadingSlots || !availableSet.has(slot);
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    disabled={isOccupied}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border p-3 text-sm font-bold transition-all duration-200 ${
                      isOccupied
                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        : isSelected
                          ? 'scale-105 border-blue-600 bg-blue-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {selectedSlot ? (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-5 text-white md:flex-row">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Confirmar Agendamento
                  </p>
                  <p className="text-lg font-medium">
                    Dia {date?.toLocaleDateString('pt-BR')} às{' '}
                    <span className="font-bold text-blue-400">{selectedSlot}</span>
                  </p>
                </div>
                <Button
                  className="h-12 rounded-xl bg-blue-600 px-10 font-bold hover:bg-blue-500"
                  onClick={handleAgendar}
                  disabled={agendando || loadingSlots}
                >
                  {agendando ? 'Agendando...' : 'Finalizar Agendamento'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 py-20">
          <Stethoscope className="mb-4 h-10 w-10 text-slate-300" />
          <p className="max-w-md text-center text-slate-500 font-medium italic">
            {loadingEspecialidades
              ? 'Carregando especialidades...'
              : especialidadesError
                ? 'Não foi possível carregar as especialidades.'
                : 'Selecione uma especialidade para visualizar as datas e horários disponíveis.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Schedule;
