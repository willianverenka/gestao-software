import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Stethoscope, Search, UserPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const API_URL = 'http://localhost:8000';

// ─── Tela Inicial ─────────────────────────────────────────────────────────────

const TelaEscolha = ({ onNovo }) => (
  <div className="space-y-4">
    <div onClick={onNovo} className="p-4 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><UserPlus className="text-blue-600" /></div>
      <div><h3 className="font-semibold text-slate-800">Novo Paciente</h3><p className="text-slate-500 text-sm">Cadastrar um novo paciente no sistema.</p></div>
    </div>
  </div>
);

// ─── Busca por CPF ────────────────────────────────────────────────────────────

const BuscaPorCPF = ({ onEncontrado }) => {
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    if (!cpf.trim()) { setErro('Digite o CPF do paciente.'); return; }
    setLoading(true); setErro('');
    try {
      const response = await fetch(`${API_URL}/pacientes/buscar?cpf=${cpf.replace(/[^\d]/g, '')}`);
      if (response.ok) onEncontrado(await response.json());
      else setErro('Paciente não encontrado. Verifique o CPF ou cadastre um novo paciente.');
    } catch (error) { setErro('Erro de conexão com o servidor.'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CPF do Paciente</Label>
        <div className="flex gap-2">
          <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => { setCpf(e.target.value); setErro(''); }} onKeyDown={(e) => e.key === 'Enter' && handleBuscar()} />
          <Button onClick={handleBuscar} disabled={loading}>{loading ? "..." : <Search size={16} />}</Button>
        </div>
        {erro && <span className="text-sm text-red-500">{erro}</span>}
      </div>
    </div>
  );
};

// ─── Cadastro de Novo Paciente ────────────────────────────────────────────────

const FormCadastroPaciente = ({ onCadastrado }) => {
  const [formData, setFormData] = useState({ nome: '', email: '', cpf: '', dataNascimento: '', telefone: '', genero: '', convenio: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })); };
  const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarCPF = (cpf) => {
    const limpo = cpf.replace(/[^\d]+/g, '');
    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(limpo[i - 1]) * (11 - i);
    resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(limpo[i - 1]) * (12 - i);
    resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(limpo[10]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};
    if (!formData.nome.trim()) novosErros.nome = "Nome é obrigatório.";
    if (!validarCPF(formData.cpf)) novosErros.cpf = "CPF inválido.";
    if (!validarEmail(formData.email)) novosErros.email = "Insira um e-mail válido.";
    if (!formData.dataNascimento) novosErros.dataNascimento = "Data de nascimento é obrigatória.";
    if (Object.keys(novosErros).length > 0) { setErrors(novosErros); return; }
    setLoading(true);
    try {
      const generoMap = { masculino: 'M', feminino: 'F', outro: 'O' };
      const response = await fetch(`${API_URL}/pacientes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formData.nome, cpf: formData.cpf.replace(/[^\d]+/g, ''), email: formData.email, data_nascimento: formData.dataNascimento, telefone: formData.telefone || null, genero: generoMap[formData.genero] || null, convenio: formData.convenio || null }),
      });
      if (response.ok) { const data = await response.json(); onCadastrado({ ...data, cpf: formData.cpf.replace(/[^\d]+/g, ''), nome: formData.nome }); }
      else { const errorData = await response.json(); alert(`Erro: ${typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)}`); }
    } catch (error) { alert('Erro de conexão com o servidor.'); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className={errors.nome ? "border-red-500" : ""} />
        {errors.nome && <span className="text-sm text-red-500">{errors.nome}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className={errors.cpf ? "border-red-500" : ""} />
          {errors.cpf && <span className="text-sm text-red-500">{errors.cpf}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Input id="dataNascimento" name="dataNascimento" type="date" value={formData.dataNascimento} onChange={handleChange} className={errors.dataNascimento ? "border-red-500" : ""} />
          {errors.dataNascimento && <span className="text-sm text-red-500">{errors.dataNascimento}</span>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={errors.email ? "border-red-500" : ""} />
        {errors.email && <span className="text-sm text-red-500">{errors.email}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-2">
          <Label>Gênero</Label>
          <Select onValueChange={(v) => handleSelectChange('genero', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Convênio</Label>
        <Select onValueChange={(v) => handleSelectChange('convenio', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="particular">Particular (Sem Convênio)</SelectItem>
            <SelectItem value="unimed">Unimed</SelectItem>
            <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
            <SelectItem value="amil">Amil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full mt-4" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar Paciente"}</Button>
    </form>
  );
};

// ─── Agendamento ──────────────────────────────────────────────────────────────

const FormAgendamento = ({ paciente, onFinalizado }) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidade, setEspecialidade] = useState('');
  const [date, setDate] = useState(new Date());
  const [horarios, setHorarios] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [selectedMedico, setSelectedMedico] = useState(null);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [agendando, setAgendando] = useState(false);

  useEffect(() => {
    const fetchEspecialidades = async () => {
      try { const r = await fetch(`${API_URL}/especialidades`); if (r.ok) setEspecialidades(await r.json()); } catch (e) {}
    };
    fetchEspecialidades();
  }, []);

  useEffect(() => {
    if (!especialidade || !date) return;
    const fetchHorarios = async () => {
      setLoadingHorarios(true); setSelectedSlot(null); setMedicos([]); setSelectedMedico(null);
      try {
        const dataISO = date.toISOString().split('T')[0];
        const r = await fetch(`${API_URL}/horarios?especialidade=${especialidade}&data=${dataISO}`);
        if (r.ok) setHorarios(await r.json()); else setHorarios([]);
      } catch (e) { setHorarios([]); } finally { setLoadingHorarios(false); }
    };
    fetchHorarios();
  }, [especialidade, date]);

  const slotsUnicos = [...new Set(horarios.map(h => h.hora))].sort();

  const handleSelecionarSlot = async (slot) => {
    setSelectedSlot(slot);
    setSelectedMedico(null);
    setLoadingMedicos(true);
    try {
      const dataISO = date.toISOString().split('T')[0];
      const r = await fetch(`${API_URL}/medicos-disponiveis?especialidade=${especialidade}&data=${dataISO}&hora=${slot}`);
      if (r.ok) setMedicos(await r.json()); else setMedicos([]);
    } catch (e) { setMedicos([]); } finally { setLoadingMedicos(false); }
  };

  const handleAgendar = async () => {
    if (!selectedMedico) return;
    setAgendando(true);
    try {
      const dataISO = date.toISOString().split('T')[0];
      const r = await fetch(`${API_URL}/consultas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: paciente.paciente_id, medico_id: selectedMedico.medico_id, data_hora: `${dataISO}T${selectedSlot}`, status: 'agendada' }),
      });
      if (r.ok) onFinalizado(await r.json());
      else { const errorData = await r.json(); alert(`Erro: ${typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)}`); }
    } catch (e) { alert('Erro de conexão com o servidor.'); } finally { setAgendando(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-green-700 font-semibold">✓ Paciente: {paciente.nome}</p>
        <p className="text-green-600 text-sm">CPF: {paciente.cpf}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center text-slate-700">
          <Stethoscope className="mr-2 h-4 w-4 text-blue-600" /> Especialidade
        </label>
        {especialidades.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-700 text-sm">Nenhum médico cadastrado ainda.</p>
          </div>
        ) : (
          <Select onValueChange={(v) => { setEspecialidade(v); setSelectedSlot(null); setMedicos([]); setSelectedMedico(null); }}>
            <SelectTrigger><SelectValue placeholder="Selecione a especialidade" /></SelectTrigger>
            <SelectContent>{especialidades.map(esp => <SelectItem key={esp} value={esp}>{esp}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {especialidade && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center text-slate-800">
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" /> Data
            </h3>
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border-none w-full p-0" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center text-slate-800">
              <Clock className="mr-2 h-4 w-4 text-blue-600" /> Horários
            </h3>
            {loadingHorarios ? (
              <p className="text-slate-500 text-center py-4 text-sm">Carregando...</p>
            ) : slotsUnicos.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">Nenhum horário disponível.</p>
            ) : (
              <div className="space-y-2">
                {slotsUnicos.map(slot => (
                  <button key={slot} onClick={() => handleSelecionarSlot(slot)}
                    className={`w-full p-3 rounded-xl border text-sm font-bold transition-all text-left ${
                      selectedSlot === slot
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seleção de médico */}
      {selectedSlot && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold mb-3 text-slate-800">Escolha o Médico</h3>
          {loadingMedicos ? (
            <p className="text-slate-500 text-center py-4 text-sm">Carregando médicos...</p>
          ) : medicos.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">Nenhum médico disponível neste horário.</p>
          ) : (
            <div className="space-y-2">
              {medicos.map(m => (
                <button key={m.medico_id} onClick={() => setSelectedMedico(m)}
                  className={`w-full p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    selectedMedico?.medico_id === m.medico_id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                  {m.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resumo e confirmação */}
      {selectedSlot && selectedMedico && (
        <div className="bg-slate-900 text-white rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Resumo do Agendamento</p>
          <p className="font-medium">{date?.toLocaleDateString('pt-BR')} às <span className="text-blue-400 font-bold">{selectedSlot}</span></p>
          <p className="text-slate-400 text-sm">com {selectedMedico.nome}</p>
          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-500 font-bold" onClick={handleAgendar} disabled={agendando}>
            {agendando ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Confirmação Final ────────────────────────────────────────────────────────

const ConfirmacaoFinal = ({ paciente, consulta, onNovo }) => {
  const navigate = useNavigate();
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">✓</span>
      </div>
      <h3 className="text-xl font-bold text-slate-800">Consulta agendada com sucesso!</h3>
      <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
        <p className="text-sm text-slate-600"><span className="font-semibold">Paciente:</span> {paciente.nome}</p>
        <p className="text-sm text-slate-600"><span className="font-semibold">CPF:</span> {paciente.cpf}</p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Protocolo:</span>{' '}
          <span className="font-mono text-blue-600">{consulta.protocolo || `#${consulta.consulta_id}`}</span>
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onNovo}>Novo Agendamento</Button>
        <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const PatientRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [etapa, setEtapa] = useState('escolha');
  const [paciente, setPaciente] = useState(null);
  const [consulta, setConsulta] = useState(null);

  useEffect(() => {
    if (location.state?.paciente) {
      setPaciente(location.state.paciente);
      setEtapa('agendamento');
    }
  }, [location.state]);

  const titulos = {
    escolha: 'Pacientes', cadastro: 'Cadastro de Paciente',
    busca: 'Buscar Paciente', agendamento: 'Agendar Consulta', confirmacao: 'Consulta Confirmada',
  };

  const voltar = () => {
    if (etapa === 'cadastro') setEtapa('escolha');
    else if (etapa === 'busca') setEtapa('escolha');
    else if (etapa === 'agendamento') setEtapa('escolha');
    else navigate('/');
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
      <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-slate-800 p-0 h-auto" onClick={voltar}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {etapa === 'escolha' ? 'Voltar ao Início' : 'Voltar'}
      </Button>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">{titulos[etapa]}</h2>
      {etapa === 'escolha' && <TelaEscolha onNovo={() => setEtapa('cadastro')} />}
      {etapa === 'cadastro' && <FormCadastroPaciente onCadastrado={(p) => { setPaciente(p); setEtapa('agendamento'); }} />}
      {etapa === 'busca' && <BuscaPorCPF onEncontrado={(p) => { setPaciente(p); setEtapa('agendamento'); }} />}
      {etapa === 'agendamento' && paciente && <FormAgendamento paciente={paciente} onFinalizado={(c) => { setConsulta(c); setEtapa('confirmacao'); }} />}
      {etapa === 'confirmacao' && paciente && consulta && <ConfirmacaoFinal paciente={paciente} consulta={consulta} onNovo={() => { setPaciente(null); setConsulta(null); setEtapa('escolha'); }} />}
    </div>
  );
};

export default PatientRegistration;