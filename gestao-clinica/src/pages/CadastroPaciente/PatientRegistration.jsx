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
import { DateOfBirthPicker } from "@/components/DateOfBirthPicker";

const PatientRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    genero: '',
    convenio: 'particular'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};
    
    if (!formData.nome.trim()) novosErros.nome = "Nome é obrigatório";
    if (!formData.cpf.trim()) novosErros.cpf = "CPF é obrigatório";
    if (!formData.email.trim()) novosErros.email = "E-mail é obrigatório.";
    else if (!validarEmail(formData.email)) novosErros.email = "Insira um e-mail válido.";

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    setLoading(true);

    try {
      const URL_API_PACIENTES = 'http://localhost:8000/pacientes';

      const response = await fetch(URL_API_PACIENTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email.trim(),
          cpf: formData.cpf.replace(/[^\d]+/g, ''),
          telefone: formData.telefone || null,
          convenio: formData.convenio,
        }),
      });

      if (response.ok) {
        alert('Paciente cadastrado com sucesso!');
        setFormData({
          nome: '',
          email: '',
          cpf: '',
          dataNascimento: '',
          telefone: '',
          genero: '',
          convenio: 'particular'
        });
      } else {
        let msg = 'Falha ao salvar.';
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === 'string') {
            msg = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            msg = errorData.detail.map((e) => e.msg || JSON.stringify(e)).join(' ');
          } else if (errorData.message) {
            msg = errorData.message;
          }
        } catch {
          /* corpo não-JSON */
        }
        alert(`Erro no servidor: ${msg}`);
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
      alert('Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-8 p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
        <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 text-slate-500 hover:text-slate-800 p-0 h-auto"
            onClick={() => navigate('/')}
            >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
        </Button>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Cadastro de Paciente</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className={errors.nome ? "border-red-500" : ""} />
            {errors.nome && <span className="text-sm text-red-500 font-medium">{errors.nome}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className={errors.cpf ? "border-red-500" : ""} />
            {errors.cpf && <span className="text-sm text-red-500 font-medium">{errors.cpf}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <DateOfBirthPicker
              id="dataNascimento"
              value={formData.dataNascimento}
              onChange={(v) => handleSelectChange("dataNascimento", v)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={errors.email ? "border-red-500" : ""} />
            {errors.email && <span className="text-sm text-red-500 font-medium">{errors.email}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
          </div>

          <div className="space-y-2">
            <Label>Gênero</Label>
            <Select value={formData.genero || undefined} onValueChange={(v) => handleSelectChange('genero', v)}>
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

          <div className="space-y-2">
            <Label>Convênio</Label>
            <Select value={formData.convenio} onValueChange={(v) => handleSelectChange('convenio', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o convênio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="particular">Particular (Sem Convênio)</SelectItem>
                <SelectItem value="unimed">Unimed</SelectItem>
                <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
                <SelectItem value="amil">Amil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar Paciente"}
        </Button>
      </form>
    </div>
  );
};

export default PatientRegistration;