import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, ClipboardList, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = 'http://localhost:8000';

const ESPECIALIDADES = [
  'Cardiologia',
  'Pediatria',
  'Ortopedia',
  'Dermatologia',
  'Neurologia',
  'Ginecologia',
  'Oftalmologia',
  'Psiquiatria',
];

const tipoCards = [
  {
    tipo: 'medico',
    titulo: 'Médico',
    descricao: 'Cadastre um médico com CRM e especialidade.',
    icon: Stethoscope,
    color: 'blue',
  },
  {
    tipo: 'secretaria',
    titulo: 'Secretária',
    descricao: 'Cadastre uma secretária ou recepcionista.',
    icon: ClipboardList,
    color: 'orange',
  },
  {
    tipo: 'backoffice',
    titulo: 'Backoffice',
    descricao: 'Cadastre um funcionário administrativo.',
    icon: Briefcase,
    color: 'purple',
  },
];

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
};

const FormularioFuncionario = ({ tipo, onVoltar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    genero: '',
    crm: '',
    especialidade: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validarCPF = (cpf) => {
    const limpo = cpf.replace(/[^\d]+/g, '');
    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(limpo[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(limpo[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(limpo[10]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};

    if (!formData.nome.trim()) novosErros.nome = "Nome é obrigatório.";
    if (!validarEmail(formData.email)) novosErros.email = "Insira um e-mail válido.";
    if (!validarCPF(formData.cpf)) novosErros.cpf = "CPF inválido.";
    if (!formData.dataNascimento) novosErros.dataNascimento = "Data de nascimento é obrigatória.";
    if (tipo === 'medico' && !formData.crm.trim()) novosErros.crm = "CRM é obrigatório para médicos.";
    if (tipo === 'medico' && !formData.especialidade) novosErros.especialidade = "Especialidade é obrigatória.";

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    setLoading(true);
    try {
      const generoMap = { masculino: 'M', feminino: 'F', outro: 'O' };

      const body = {
        nome: formData.nome,
        cpf: formData.cpf.replace(/[^\d]+/g, ''),
        email: formData.email,
        data_nascimento: formData.dataNascimento,
        telefone: formData.telefone || null,
        genero: generoMap[formData.genero] || null,
        cargo: tipo,
        crm: tipo === 'medico' ? formData.crm : null,
        especialidade: tipo === 'medico' ? formData.especialidade : null,
      };

      const response = await fetch(`${API_URL}/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSucesso(true);
        setFormData({
          nome: '', email: '', cpf: '', dataNascimento: '',
          telefone: '', genero: '', crm: '', especialidade: '',
        });
      } else {
        const errorData = await response.json();
        const detalhe = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
        alert(`Erro: ${detalhe}`);
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {tipo === 'medico' ? 'Médico' : tipo === 'secretaria' ? 'Secretária' : 'Backoffice'} cadastrado com sucesso!
        </h3>
        <p className="text-slate-500 mb-6">O funcionário foi registrado no sistema.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setSucesso(false)} variant="outline">
            Cadastrar outro
          </Button>
          <Button onClick={onVoltar}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
        <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? "border-red-500" : ""} />
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
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tipo === 'medico' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input id="crm" name="crm" value={formData.crm} onChange={handleChange} placeholder="Ex: 123456-SP" className={errors.crm ? "border-red-500" : ""} />
            {errors.crm && <span className="text-sm text-red-500">{errors.crm}</span>}
          </div>

          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select onValueChange={(v) => handleSelectChange('especialidade', v)}>
              <SelectTrigger className={errors.especialidade ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map(esp => (
                  <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.especialidade && <span className="text-sm text-red-500">{errors.especialidade}</span>}
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="w-full" onClick={onVoltar}>
          Voltar
        </Button>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
};

const EmployeeRegistration = () => {
  const navigate = useNavigate();
  const [tipoSelecionado, setTipoSelecionado] = useState(null);

  return (
    <div className="w-full max-w-lg mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 text-slate-500 hover:text-slate-800 p-0 h-auto"
        onClick={() => tipoSelecionado ? setTipoSelecionado(null) : navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {tipoSelecionado ? 'Voltar' : 'Voltar para o Início'}
      </Button>

      <h2 className="text-2xl font-semibold text-center text-slate-800 mb-6">
        Cadastro de Funcionário
      </h2>

      {!tipoSelecionado ? (
        <div className="space-y-4">
          <p className="text-slate-500 text-center mb-6">Selecione o tipo de funcionário:</p>
          {tipoCards.map((card) => {
            const Icon = card.icon;
            const colors = colorMap[card.color];
            return (
              <div
                key={card.tipo}
                onClick={() => setTipoSelecionado(card.tipo)}
                className={`p-4 border-2 rounded-xl cursor-pointer hover:${colors.border} hover:bg-slate-50 transition-all flex items-center gap-4`}
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={colors.text} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{card.titulo}</h3>
                  <p className="text-slate-500 text-sm">{card.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <FormularioFuncionario
          tipo={tipoSelecionado}
          onVoltar={() => setTipoSelecionado(null)}
        />
      )}
    </div>
  );
};

export default EmployeeRegistration;