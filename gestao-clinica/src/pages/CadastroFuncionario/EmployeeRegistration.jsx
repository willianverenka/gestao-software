import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { ArrowLeft } from 'lucide-react';
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

const EmployeeRegistration = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    cpf: '', 
    telefone: '', 
    cargo: 'recepcionista', 
    crm: '', 
    senha: '', 
    confirmarSenha: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCargoChange = (value) => {
    setFormData(prev => ({ ...prev, cargo: value }));
    if (errors.crm) setErrors(prev => ({ ...prev, crm: '' }));
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validarCPF = (cpf) => {
    const limpo = cpf.replace(/[^\d]+/g, '');

    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

    let soma = 0, resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if ((resto === 10) || (resto === 11)) resto = 0;

    if (resto !== parseInt(limpo.substring(9, 10))) return false;
    soma = 0;

    for (let i = 1; i <= 10; i++) {
        soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;

    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(limpo.substring(10, 11))) return false;
    return true;
  };

  const validarCRM = (crm) => {
    const regexCRM = /^\d{4,10}[-/][a-zA-Z]{2}$|^\d{4,10}$/;
    return regexCRM.test(crm.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};

    if (!validarEmail(formData.email)) novosErros.email = "Insira um e-mail válido.";

    if (!validarCPF(formData.cpf)) novosErros.cpf = "CPF inválido.";

    if (formData.cargo === 'medico') {
      if (!formData.crm.trim()) {
        novosErros.crm = "O CRM é obrigatório para médicos.";
      } else if (!validarCRM(formData.crm)) {
        novosErros.crm = "Formato de CRM inválido (Ex: 123456-SP).";
      }
    }
    
    if (formData.senha.length < 6) novosErros.senha = "Mínimo de 6 caracteres.";
    if (formData.senha !== formData.confirmarSenha) novosErros.confirmarSenha = "As senhas não coincidem.";

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    setLoading(true);

    try {
      const URL_API_FUNCIONARIOS = '';

      const response = await fetch(URL_API_FUNCIONARIOS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf.replace(/[^\d]+/g, ''), 
          telefone: formData.telefone,
          cargo: formData.cargo,
          crm: formData.cargo === 'medico' ? formData.crm : null,
          password: formData.senha, 
        }),
      });

      if (response.ok) {
        alert('Funcionário cadastrado com sucesso!');
      } else {
        const errorData = await response.json();
        alert(`Erro ao cadastrar: ${errorData.message || 'Verifique os dados.'}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-xl shadow-lg font-sans">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4 text-slate-500 hover:text-slate-800 p-0 h-auto"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
      </Button>
      <h2 className="text-2xl font-semibold text-center text-slate-800 mb-6">
        Cadastro de Funcionário
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome Completo</Label>
          <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required className={errors.email ? "border-red-500" : ""} />
          {errors.email && <span className="text-sm text-red-500 font-medium">{errors.email}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="Apenas números" required className={errors.cpf ? "border-red-500" : ""} />
          {errors.cpf && <span className="text-sm text-red-500 font-medium">{errors.cpf}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label>Cargo</Label>
          <Select value={formData.cargo} onValueChange={handleCargoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recepcionista">Recepcionista/Secretária</SelectItem>
              <SelectItem value="medico">Médico</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.cargo === 'medico' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="crm">CRM</Label>
            <Input id="crm" name="crm" value={formData.crm} onChange={handleChange} placeholder="Ex: 123456-SP" className={errors.crm ? "border-red-500" : ""} />
            {errors.crm && <span className="text-sm text-red-500 font-medium">{errors.crm}</span>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" type="password" name="senha" value={formData.senha} onChange={handleChange} required className={errors.senha ? "border-red-500" : ""} />
          {errors.senha && <span className="text-sm text-red-500 font-medium">{errors.senha}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
          <Input id="confirmarSenha" type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} required className={errors.confirmarSenha ? "border-red-500" : ""} />
          {errors.confirmarSenha && <span className="text-sm text-red-500 font-medium">{errors.confirmarSenha}</span>}
        </div>

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>
    </div>
  );
};

export default EmployeeRegistration;