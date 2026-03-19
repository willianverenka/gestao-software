import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar as CalendarIcon, Stethoscope, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = 'http://localhost:8000';

const ESPECIALIDADES = [
  { id: 'cardiologia', nome: 'Cardiologia' },
  { id: 'pediatria', nome: 'Pediatria' },
  { id: 'ortopedia', nome: 'Ortopedia' }
];

const Schedule = () => {
  const navigate = useNavigate();

  const [especialidade, setEspecialidade] = useState("");
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMedico, setSelectedMedico] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agendando, setAgendando] = useState(false);

  // Busca de paciente por CPF
  const [cpfBusca, setCpfBusca] = useState('');
  const [paciente, setPaciente] = useState(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [erroPaciente, setErroPaciente] = useState('');

  // Busca horários da API quando muda especialidade ou data
  useEffect(() => {
    if (!especialidade || !date) return;

    const fetchHorarios = async () => {
      setLoading(true);
      setSelectedSlot(null);
      setSelectedMedico(null);
      try {
        const dataISO = date.toISOString().split('T')[0];
        const response = await fetch(
          `${API_URL}/horarios?especialidade=${especialidade}&data=${dataISO}`
        );
        if (response.ok) {
          const data = await response.json();
          setHorarios(data);
        } else {
          setHorarios([]);
        }
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setHorarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [especialidade, date]);

  const slotsUnicos = [...new Set(horarios.map(h => h.hora))].sort();

  const handleSelecionarSlot = (slot) => {
    setSelectedSlot(slot);
    const medico = horarios.find(h => h.hora === slot);
    setSelectedMedico(medico || null);
    setErroPaciente('');
  };

  const handleBuscarPaciente = async () => {
    if (!cpfBusca.trim()) {
      setErroPaciente('Digite o CPF do paciente.');
      return;
    }

    setBuscandoPaciente(true);
    setErroPaciente('');
    setPaciente(null);

    try {
      const response = await fetch(
        `${API_URL}/pacientes/buscar?cpf=${cpfBusca.replace(/[^\d]/g, '')}`
      );

      if (response.ok) {
        const data = await response.json();
        setPaciente(data);
      } else {
        setErroPaciente('Paciente não encontrado. Verifique o CPF ou cadastre o paciente primeiro.');
      }
    } catch (error) {
      setErroPaciente('Erro de conexão com o servidor.');
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const handleFinalizar = async () => {
    if (!paciente) {
      setErroPaciente('Busque o paciente pelo CPF primeiro.');
      return;
    }

    if (!selectedMedico) {
      alert('Selecione um horário primeiro.');
      return;
    }

    setAgendando(true);
    try {
      const dataISO = date.toISOString().split('T')[0];
      const dataHora = `${dataISO}T${selectedSlot}`;

      const response = await fetch(`${API_URL}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: paciente.paciente_id,
          medico_id: selectedMedico.medico_id,
          data_hora: dataHora,
          status: 'agendada',
        }),
      });

      if (response.ok) {
        const consulta = await response.json();
        alert(`Consulta agendada com sucesso!\nProtocolo: ${consulta.protocolo || consulta.consulta_id}`);
        setSelectedSlot(null);
        setSelectedMedico(null);
        setPaciente(null);
        setCpfBusca('');
        // Recarrega horários
        const res = await fetch(`${API_URL}/horarios?especialidade=${especialidade}&data=${dataISO}`);
        if (res.ok) setHorarios(await res.json());
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.detail || 'Não foi possível agendar.'}`);
      }
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setAgendando(false);
    }
  };

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
            />
          </div>

          <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center text-slate-800">
                <Clock className="mr-2 h-5 w-5 text-blue-600" /> 
                Horários para {ESPECIALIDADES.find(e => e.id === especialidade)?.nome}
              </h3>
              <Badge variant="outline">30 min</Badge>
            </div>

            {loading ? (
              <p className="text-slate-500 text-center py-8">Carregando horários...</p>
            ) : slotsUnicos.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Nenhum horário disponível para esta data. Cadastre médicos primeiro.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {slotsUnicos.map(slot => {
                  const isSelected = selectedSlot === slot;
                  const medico = horarios.find(h => h.hora === slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => handleSelecionarSlot(slot)}
                      className={`p-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div>{slot}</div>
                      {medico && (
                        <div className="text-[10px] font-normal mt-1 opacity-70">
                          {medico.medico_nome}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl animate-in zoom-in-95">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-3">
                  Confirmar Agendamento
                </p>
                <p className="text-lg font-medium mb-4">
                  Dia {date?.toLocaleDateString('pt-BR')} às{' '}
                  <span className="text-blue-400 font-bold">{selectedSlot}</span>
                  {selectedMedico && (
                    <span className="text-slate-400 text-sm ml-2">
                      com {selectedMedico.medico_nome}
                    </span>
                  )}
                </p>

                {/* Busca por CPF */}
                <div className="space-y-2 mb-4">
                  <Label className="text-slate-300">CPF do Paciente</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="000.000.000-00"
                      value={cpfBusca}
                      onChange={(e) => {
                        setCpfBusca(e.target.value);
                        setErroPaciente('');
                        setPaciente(null);
                      }}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    <Button
                      onClick={handleBuscarPaciente}
                      disabled={buscandoPaciente}
                      className="bg-slate-700 hover:bg-slate-600 px-3"
                    >
                      <Search size={16} />
                    </Button>
                  </div>
                  {erroPaciente && (
                    <span className="text-red-400 text-sm">{erroPaciente}</span>
                  )}
                  {paciente && (
                    <div className="bg-slate-800 rounded-lg p-3 text-sm">
                      <span className="text-green-400 font-semibold">✓ Paciente encontrado:</span>
                      <span className="text-white ml-2">{paciente.nome}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 h-12 rounded-xl font-bold"
                  onClick={handleFinalizar}
                  disabled={agendando || !paciente}
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
          <p className="text-slate-500 font-medium italic">
            Selecione uma especialidade para visualizar as datas e horários disponíveis.
          </p>
        </div>
      )}
    </div>
  );
};

export default Schedule;
