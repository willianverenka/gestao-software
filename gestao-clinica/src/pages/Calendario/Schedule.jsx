import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar as CalendarIcon, Stethoscope } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ESPECIALIDADES = [
  { id: 'cardiologia', nome: 'Cardiologia' },
  { id: 'pediatria', nome: 'Pediatria' },
  { id: 'ortopedia', nome: 'Ortopedia' },
];

const Schedule = () => {
  const navigate = useNavigate();

  const [especialidade, setEspecialidade] = useState("");
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [agendando, setAgendando] = useState(false);

  const availableSet = useMemo(() => new Set(availableSlots), [availableSlots]);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h < 18; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const fetchDisponiveis = async (dataObj = date, esp = especialidade) => {
    if (!esp) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    try {
      const response = await fetch(
        `http://localhost:8000/consultas/disponiveis?data=${formatDate(dataObj)}&especialidade=${encodeURIComponent(esp)}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setAvailableSlots(payload?.horarios || []);
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAgendar = async () => {
    if (!selectedSlot || !especialidade) return;
    setAgendando(true);

    try {
      const response = await fetch("http://localhost:8000/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: 1,
          especialidade,
          data: formatDate(date),
          hora: selectedSlot,
        }),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          msg = errorData?.detail || errorData?.message || msg;
        } catch {
          // corpo não-JSON
        }
        throw new Error(msg);
      }

      await fetchDisponiveis();
      alert("Consulta agendada com sucesso!");
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      alert(error.message || "Falha ao agendar consulta.");
    } finally {
      setAgendando(false);
    }
  };

  useEffect(() => {
    if (especialidade) fetchDisponiveis();
  }, [especialidade, date]);

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <Button 
        variant="ghost" 
        className="mb-6 text-slate-500 hover:text-slate-800 p-0" 
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
      </Button>

      <div className="max-w-md mb-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center text-slate-700">
            <Stethoscope className="mr-2 h-4 w-4 text-blue-600" /> 
            Qual especialidade você busca?
          </label>
          <Select onValueChange={(v) => { setEspecialidade(v); setSelectedSlot(null); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a especialidade" />
            </SelectTrigger>
            <SelectContent>
              {ESPECIALIDADES.map(esp => (
                <SelectItem key={esp.id} value={esp.id}>{esp.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {especialidade ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
          
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm h-fit">
            <h3 className="font-semibold mb-4 flex items-center text-slate-800">
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" /> Escolha a Data
            </h3>
            <Calendar 
            mode="single" 
            selected={date} 
            onSelect={(d) => d && setDate(d)} 
            className="rounded-md border-none w-full p-0" 
            classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-sm font-medium text-slate-900",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                table: "w-full border-collapse",
                head_row: "flex w-full justify-between mb-2",
                head_cell: "text-slate-500 rounded-md w-10 font-normal text-[0.8rem] flex-1 text-center", 
                row: "flex w-full mt-2 justify-between",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1", 
                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-all mx-auto flex items-center justify-center", 
                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                day_today: "bg-slate-100 text-slate-900",
                day_outside: "text-slate-400 opacity-50",
                day_disabled: "text-slate-500 opacity-50",
            }}
            />
          </div>

          <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center text-slate-800">
                <Clock className="mr-2 h-5 w-5 text-blue-600" /> 
                Horários disponíveis para {ESPECIALIDADES.find(e => e.id === especialidade)?.nome}
              </h3>
              <Badge variant="outline">30 min</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {timeSlots.map(slot => {
                const isOccupied = loadingSlots || !availableSet.has(slot);
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    disabled={isOccupied}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                      isOccupied ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' :
                      isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 
                      'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {selectedSlot && (
              <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in zoom-in-95">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Confirmar Agendamento</p>
                  <p className="text-lg font-medium">
                    Dia {date?.toLocaleDateString('pt-BR')} às <span className="text-blue-400 font-bold">{selectedSlot}</span>
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-500 px-10 h-12 rounded-xl font-bold"
                  onClick={handleAgendar}
                  disabled={agendando || loadingSlots}
                >
                  {agendando ? "Agendando..." : "Finalizar Agendamento"}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed rounded-3xl border-slate-200">
          <Stethoscope className="h-10 w-10 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium italic">Selecione uma especialidade para visualizar as datas e horários disponíveis.</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;