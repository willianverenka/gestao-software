import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Search, Stethoscope, ClipboardList, Briefcase, ArrowLeft, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const API_URL = 'http://localhost:8000';

const ESPECIALIDADES = [
  'Cardiologia', 'Pediatria', 'Ortopedia', 'Dermatologia',
  'Neurologia', 'Ginecologia', 'Oftalmologia', 'Psiquiatria',
];

const TelaInicial = ({ onCadastro, onJaCadastrado }) => (
  <div className="space-y-4">
    <div onClick={onCadastro} className="p-4 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><UserPlus className="text-blue-600" /></div>
      <div><h3 className="font-semibold text-slate-800">Cadastro</h3><p className="text-slate-500 text-sm">Cadastrar novo paciente ou funcionário.</p></div>
    </div>
    <div onClick={onJaCadastrado} className="p-4 border-2 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4">
      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0"><Search className="text-orange-600" /></div>
      <div><h3 className="font-semibold text-slate-800">Já Cadastrado</h3><p className="text-slate-500 text-sm">Buscar pelo CPF e acessar informações.</p></div>
    </div>
  </div>
);

const TelaCadastroEscolha = ({ onPaciente, onFuncionario }) => (
  <div className="space-y-4">
    <div onClick={onPaciente} className="p-4 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Users className="text-blue-600" /></div>
      <div><h3 className="font-semibold text-slate-800">Paciente</h3><p className="text-slate-500 text-sm">Cadastrar novo paciente no sistema.</p></div>
    </div>
    <div onClick={onFuncionario} className="p-4 border-2 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-4">
      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0"><Briefcase className="text-purple-600" /></div>
      <div><h3 className="font-semibold text-slate-800">Funcionário</h3><p className="text-slate-500 text-sm">Cadastrar médico ou secretária.</p></div>
    </div>
  </div>
);

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

// ─── Formulário Cadastro Funcionário ─────────────────────────────────────────

const tipoCards = [
  { tipo: 'medico', titulo: 'Médico', descricao: 'CRM e especialidade obrigatórios.', icon: Stethoscope, color: 'blue' },
  { tipo: 'secretaria', titulo: 'Secretária', descricao: 'Recepcionista ou secretária.', icon: ClipboardList, color: 'orange' },
];

const colorMap = { blue: { bg: 'bg-blue-100', text: 'text-blue-600' }, orange: { bg: 'bg-orange-100', text: 'text-orange-600' } };

const FormCadastroFuncionario = ({ onCadastrado }) => {
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', cpf: '', dataNascimento: '', telefone: '', genero: '', crm: '', especialidade: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })); };
  const handleSelectChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })); };
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
    if (!validarEmail(formData.email)) novosErros.email = "Insira um e-mail válido.";
    if (!validarCPF(formData.cpf)) novosErros.cpf = "CPF inválido.";
    if (!formData.dataNascimento) novosErros.dataNascimento = "Data de nascimento é obrigatória.";
    if (tipoSelecionado === 'medico' && !formData.crm.trim()) novosErros.crm = "CRM é obrigatório para médicos.";
    if (tipoSelecionado === 'medico' && !formData.especialidade) novosErros.especialidade = "Especialidade é obrigatória.";
    if (Object.keys(novosErros).length > 0) { setErrors(novosErros); return; }
    setLoading(true);
    try {
      const generoMap = { masculino: 'M', feminino: 'F', outro: 'O' };
      const response = await fetch(`${API_URL}/funcionarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formData.nome, cpf: formData.cpf.replace(/[^\d]+/g, ''), email: formData.email, data_nascimento: formData.dataNascimento, telefone: formData.telefone || null, genero: generoMap[formData.genero] || null, cargo: tipoSelecionado, crm: tipoSelecionado === 'medico' ? formData.crm : null, especialidade: tipoSelecionado === 'medico' ? formData.especialidade : null }),
      });
      if (response.ok) { setSucesso(true); }
      else { const errorData = await response.json(); alert(`Erro: ${typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)}`); }
    } catch (error) { alert('Erro de conexão com o servidor.'); } finally { setLoading(false); }
  };

  if (sucesso) return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><span className="text-3xl">✓</span></div>
      <h3 className="text-xl font-bold text-slate-800">{tipoSelecionado === 'medico' ? 'Médico' : 'Secretária'} cadastrado com sucesso!</h3>
      <div className="flex flex-col gap-3">
        <Button onClick={() => { setSucesso(false); setTipoSelecionado(null); setFormData({ nome: '', email: '', cpf: '', dataNascimento: '', telefone: '', genero: '', crm: '', especialidade: '' }); }}>Cadastrar outro</Button>
        <Button variant="outline" onClick={() => onCadastrado()}>Voltar</Button>
      </div>
    </div>
  );

  if (!tipoSelecionado) return (
    <div className="space-y-4">
      <p className="text-slate-500 text-center mb-2">Selecione o tipo de funcionário:</p>
      {tipoCards.map((card) => {
        const Icon = card.icon; const colors = colorMap[card.color];
        return (
          <div key={card.tipo} onClick={() => setTipoSelecionado(card.tipo)} className="p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-4">
            <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center shrink-0`}><Icon className={colors.text} /></div>
            <div><h3 className="font-semibold text-slate-800">{card.titulo}</h3><p className="text-slate-500 text-sm">{card.descricao}</p></div>
          </div>
        );
      })}
    </div>
  );

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
      {tipoSelecionado === 'medico' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input id="crm" name="crm" value={formData.crm} onChange={handleChange} placeholder="Ex: 123456-SP" className={errors.crm ? "border-red-500" : ""} />
            {errors.crm && <span className="text-sm text-red-500">{errors.crm}</span>}
          </div>
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select onValueChange={(v) => handleSelectChange('especialidade', v)}>
              <SelectTrigger className={errors.especialidade ? "border-red-500" : ""}><SelectValue placeholder="Selecione a especialidade" /></SelectTrigger>
              <SelectContent>{ESPECIALIDADES.map(esp => <SelectItem key={esp} value={esp}>{esp}</SelectItem>)}</SelectContent>
            </Select>
            {errors.especialidade && <span className="text-sm text-red-500">{errors.especialidade}</span>}
          </div>
        </>
      )}
      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar"}</Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => setTipoSelecionado(null)}>Voltar</Button>
      </div>
    </form>
  );
};

// ─── Busca por CPF ────────────────────────────────────────────────────────────

const BuscaCPF = ({ onResultado }) => {
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    if (!cpf.trim()) { setErro('Digite o CPF.'); return; }
    setLoading(true); setErro('');
    try {
      const resPaciente = await fetch(`${API_URL}/pacientes/buscar?cpf=${cpf.replace(/[^\d]/g, '')}`);
      if (resPaciente.ok) { onResultado({ tipo: 'paciente', ...await resPaciente.json() }); return; }
    } catch (e) {}
    try {
      const resFuncionario = await fetch(`${API_URL}/funcionarios/buscar?cpf=${cpf.replace(/[^\d]/g, '')}`);
      if (resFuncionario.ok) { onResultado({ tipo: 'funcionario', ...await resFuncionario.json() }); return; }
    } catch (e) {}
    setErro('CPF não encontrado.');
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CPF</Label>
        <div className="flex gap-2">
          <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => { setCpf(e.target.value); setErro(''); }} onKeyDown={(e) => e.key === 'Enter' && handleBuscar()} />
          <Button onClick={handleBuscar} disabled={loading}>{loading ? "..." : <Search size={16} />}</Button>
        </div>
        {erro && <span className="text-sm text-red-500">{erro}</span>}
      </div>
    </div>
  );
};

// ─── Resultado Paciente ───────────────────────────────────────────────────────

const ResultadoPaciente = ({ pessoa, onAgendar }) => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultas = async () => {
      try { const r = await fetch(`${API_URL}/pacientes/${pessoa.paciente_id}/consultas`); if (r.ok) setConsultas(await r.json()); }
      catch (e) {} finally { setLoading(false); }
    };
    fetchConsultas();
  }, [pessoa.paciente_id]);

  const formatarDataHora = (dh) => {
    if (!dh) return { data: '-', hora: '-' };
    const d = new Date(dh);
    return { data: d.toLocaleDateString('pt-BR'), hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
  };

  const statusBadge = (s) => {
    if (s === 'agendada') return <Badge variant="outline" className="text-xs">Pendente</Badge>;
    if (s === 'confirmada') return <Badge className="bg-green-500 text-xs">Confirmada</Badge>;
    if (s === 'cancelada') return <Badge className="bg-red-500 text-xs">Cancelada</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-green-700 font-semibold">✓ Paciente encontrado!</p>
        <p className="text-green-600 text-sm mt-1"><span className="font-medium">{pessoa.nome}</span> — CPF: {pessoa.cpf}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Consultas Marcadas</h3>
        {loading ? <p className="text-slate-400 text-sm text-center py-2">Carregando...</p>
          : consultas.length === 0 ? <p className="text-slate-400 text-sm text-center py-2">Nenhuma consulta encontrada.</p>
          : (
            <div className="space-y-2">
              {consultas.map((c) => {
                const { data, hora } = formatarDataHora(c.data_hora);
                return (
                  <div key={c.consulta_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{c.medico_nome}</p>
                      <p className="text-xs text-slate-500">{c.especialidade} — {data} às {hora}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.protocolo || `#${c.consulta_id}`}</p>
                    </div>
                    {statusBadge(c.status)}
                  </div>
                );
              })}
            </div>
          )}
      </div>
      <div onClick={onAgendar} className="p-4 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Stethoscope className="text-blue-600" /></div>
        <div><h3 className="font-semibold text-slate-800">Agendar Nova Consulta</h3><p className="text-slate-500 text-sm">Escolher especialidade, data e horário.</p></div>
      </div>
    </div>
  );
};

// ─── Resultado Funcionário ────────────────────────────────────────────────────

const ResultadoFuncionario = ({ pessoa }) => {
  const cargoLabel = { medico: 'Médico', secretaria: 'Secretária', backoffice: 'Backoffice' };
  const cargoIcon = { medico: <Stethoscope className="text-blue-600" />, secretaria: <ClipboardList className="text-orange-600" />, backoffice: <Briefcase className="text-purple-600" /> };
  const cargoBg = { medico: 'bg-blue-100', secretaria: 'bg-orange-100', backoffice: 'bg-purple-100' };
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-green-700 font-semibold">✓ Funcionário encontrado!</p>
        <p className="text-green-600 text-sm mt-1"><span className="font-medium">{pessoa.nome}</span> — CPF: {pessoa.cpf}</p>
      </div>
      <div className="p-4 border border-slate-200 rounded-xl flex items-center gap-4">
        <div className={`w-12 h-12 ${cargoBg[pessoa.cargo]} rounded-lg flex items-center justify-center shrink-0`}>{cargoIcon[pessoa.cargo]}</div>
        <div>
          <h3 className="font-semibold text-slate-800">{cargoLabel[pessoa.cargo]}</h3>
          {pessoa.especialidade && <p className="text-slate-500 text-sm">Especialidade: {pessoa.especialidade}</p>}
          {pessoa.crm && <p className="text-slate-500 text-sm">CRM: {pessoa.crm}</p>}
          <p className="text-slate-500 text-sm">E-mail: {pessoa.email}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Horários + Agendamento para Secretária ───────────────────────────────────

const HorariosSecretaria = ({ pessoa }) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidade, setEspecialidade] = useState('');
  const [date, setDate] = useState(new Date());
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState(null);
  const [cpfPaciente, setCpfPaciente] = useState('');
  const [paciente, setPaciente] = useState(null);
  const [erroPaciente, setErroPaciente] = useState('');
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [consultaAgendada, setConsultaAgendada] = useState(null);

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

  // Remove os segundos (08:00:00 → 08:00)
  const slotsUnicos = [...new Set(horarios.map(h => h.hora.slice(0, 5)))].sort();

  const handleSelecionarSlot = async (slot) => {
    setSelectedSlot(slot); setSelectedMedico(null); setLoadingMedicos(true);
    try {
      const dataISO = date.toISOString().split('T')[0];
      const r = await fetch(`${API_URL}/medicos-disponiveis?especialidade=${especialidade}&data=${dataISO}&hora=${slot}`);
      if (r.ok) setMedicos(await r.json()); else setMedicos([]);
    } catch (e) { setMedicos([]); } finally { setLoadingMedicos(false); }
  };

  const handleBuscarPaciente = async () => {
    if (!cpfPaciente.trim()) { setErroPaciente('Digite o CPF do paciente.'); return; }
    setBuscandoPaciente(true); setErroPaciente(''); setPaciente(null);
    try {
      const r = await fetch(`${API_URL}/pacientes/buscar?cpf=${cpfPaciente.replace(/[^\d]/g, '')}`);
      if (r.ok) setPaciente(await r.json()); else setErroPaciente('Paciente não encontrado.');
    } catch (e) { setErroPaciente('Erro de conexão.'); } finally { setBuscandoPaciente(false); }
  };

  const handleAgendar = async () => {
    if (!paciente || !selectedMedico) return;
    setAgendando(true);
    try {
      const dataISO = date.toISOString().split('T')[0];
      const r = await fetch(`${API_URL}/consultas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: paciente.paciente_id, medico_id: selectedMedico.medico_id, data_hora: `${dataISO}T${selectedSlot}`, status: 'agendada' }),
      });
      if (r.ok) {
        const consulta = await r.json();
        setConsultaAgendada({ ...consulta, paciente_nome: paciente.nome, medico_nome: selectedMedico.nome, data: date.toLocaleDateString('pt-BR'), hora: selectedSlot });
        setSelectedSlot(null); setSelectedMedico(null); setPaciente(null); setCpfPaciente(''); setMedicos([]);
        const res = await fetch(`${API_URL}/horarios?especialidade=${especialidade}&data=${dataISO}`);
        if (res.ok) setHorarios(await res.json());
      } else {
        const errorData = await r.json();
        alert(`Erro: ${typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)}`);
      }
    } catch (e) { alert('Erro de conexão com o servidor.'); } finally { setAgendando(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-orange-700 font-semibold">✓ Secretária: {pessoa.nome}</p>
        <p className="text-orange-600 text-sm">Visualize horários e agende consultas para pacientes</p>
      </div>

      {consultaAgendada && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
          <p className="text-green-700 font-semibold">✓ Consulta agendada com sucesso!</p>
          <p className="text-green-600 text-sm"><span className="font-medium">Paciente:</span> {consultaAgendada.paciente_nome}</p>
          <p className="text-green-600 text-sm"><span className="font-medium">Médico:</span> {consultaAgendada.medico_nome}</p>
          <p className="text-green-600 text-sm"><span className="font-medium">Data:</span> {consultaAgendada.data} às {consultaAgendada.hora}</p>
          <p className="text-green-600 text-sm"><span className="font-medium">Protocolo:</span> <span className="font-mono font-bold">{consultaAgendada.protocolo || `#${consultaAgendada.consulta_id}`}</span></p>
          <button className="text-green-600 text-xs underline mt-1" onClick={() => setConsultaAgendada(null)}>Fechar</button>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center text-slate-700"><Stethoscope className="mr-2 h-4 w-4 text-blue-600" /> Especialidade</label>
        {especialidades.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3"><p className="text-yellow-700 text-sm">Nenhum médico cadastrado ainda.</p></div>
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
            <h3 className="font-semibold mb-3 flex items-center text-slate-800"><CalendarIcon className="mr-2 h-4 w-4 text-blue-600" /> Escolha a Data</h3>
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border-none w-full p-0" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold flex items-center text-slate-800 text-sm">
                <Clock className="mr-2 h-4 w-4 text-blue-600 shrink-0" /> Horários para {especialidade}
              </h3>
              <span className="text-xs text-slate-400 border border-slate-200 rounded-md px-2 py-1 shrink-0 ml-2">30 min</span>
            </div>
            {loadingHorarios ? (
              <p className="text-slate-500 text-center py-4 text-sm">Carregando...</p>
            ) : slotsUnicos.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">Nenhum horário disponível.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slotsUnicos.map(slot => (
                  <button key={slot} onClick={() => handleSelecionarSlot(slot)}
                    className={`py-2.5 px-1 rounded-lg border text-sm font-semibold transition-all duration-200 text-center ${
                      selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                    selectedMedico?.medico_id === m.medico_id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                  {m.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && selectedMedico && (
        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Agendar Consulta</p>
          <p className="font-medium">{date?.toLocaleDateString('pt-BR')} às <span className="text-blue-400 font-bold">{selectedSlot}</span></p>
          <p className="text-slate-400 text-sm">Médico: {selectedMedico.nome}</p>
          <div className="space-y-2">
            <Label className="text-slate-300">CPF do Paciente</Label>
            <div className="flex gap-2">
              <Input placeholder="000.000.000-00" value={cpfPaciente}
                onChange={(e) => { setCpfPaciente(e.target.value); setErroPaciente(''); setPaciente(null); }}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarPaciente()} />
              <Button onClick={handleBuscarPaciente} disabled={buscandoPaciente} className="bg-slate-700 hover:bg-slate-600 px-3">
                <Search size={16} />
              </Button>
            </div>
            {erroPaciente && <span className="text-red-400 text-sm">{erroPaciente}</span>}
            {paciente && (
              <div className="bg-slate-800 rounded-lg p-2 text-sm flex justify-between items-center">
                <span><span className="text-green-400 font-semibold">✓ </span><span className="text-white">{paciente.nome}</span></span>
                <span className="text-slate-400 text-xs font-mono">{paciente.cpf}</span>
              </div>
            )}
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-11" onClick={handleAgendar} disabled={agendando || !paciente}>
            {agendando ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const Home = () => {
  const navigate = useNavigate();
  const [tela, setTela] = useState('inicial');
  const [resultado, setResultado] = useState(null);

  const handleResultado = (data) => {
    if (data.tipo === 'funcionario' && data.cargo === 'backoffice') { navigate('/backoffice'); return; }
    setResultado(data); setTela('resultado');
  };

  const voltar = () => {
    if (tela === 'cadastroPaciente' || tela === 'cadastroFuncionario') setTela('cadastro');
    else if (tela === 'cadastro' || tela === 'busca' || tela === 'resultado') setTela('inicial');
    else setTela('inicial');
  };

  const titulos = {
    inicial: 'Bem-vindo ao MedSystem', cadastro: 'Cadastro',
    cadastroPaciente: 'Cadastro de Paciente', cadastroFuncionario: 'Cadastro de Funcionário',
    busca: 'Buscar pelo CPF', resultado: 'Dados Encontrados',
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
      {tela !== 'inicial' && (
        <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-slate-800 p-0 h-auto" onClick={voltar}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      )}
      <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">{titulos[tela]}</h1>
      {tela === 'inicial' && <p className="text-slate-500 text-center mb-6">O que você deseja fazer hoje?</p>}
      <div className="mt-4">
        {tela === 'inicial' && <TelaInicial onCadastro={() => setTela('cadastro')} onJaCadastrado={() => setTela('busca')} />}
        {tela === 'cadastro' && <TelaCadastroEscolha onPaciente={() => setTela('cadastroPaciente')} onFuncionario={() => setTela('cadastroFuncionario')} />}
        {tela === 'cadastroPaciente' && <FormCadastroPaciente onCadastrado={(p) => navigate('/pacientes', { state: { paciente: p, etapa: 'agendamento' } })} />}
        {tela === 'cadastroFuncionario' && <FormCadastroFuncionario onCadastrado={() => setTela('inicial')} />}
        {tela === 'busca' && <BuscaCPF onResultado={handleResultado} />}
        {tela === 'resultado' && resultado && (
          resultado.tipo === 'paciente' ? (
            <ResultadoPaciente pessoa={resultado} onAgendar={() => navigate('/pacientes', { state: { paciente: resultado, etapa: 'agendamento' } })} />
          ) : resultado.cargo === 'secretaria' ? (
            <HorariosSecretaria pessoa={resultado} />
          ) : (
            <ResultadoFuncionario pessoa={resultado} />
          )
        )}
      </div>
    </div>
  );
};

export default Home;