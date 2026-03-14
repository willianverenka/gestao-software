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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};
    
    if (!formData.nome) novosErros.nome = "Nome é obrigatório";
    if (!formData.cpf) novosErros.cpf = "CPF é obrigatório";
    
    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    setLoading(true);

    try {
      const URL_API_PACIENTES = '';

      const response = await fetch(URL_API_PACIENTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf.replace(/[^\d]+/g, ''), 
          data_nascimento: formData.dataNascimento, 
          telefone: formData.telefone,
          genero: formData.genero,
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
        const errorData = await response.json();
        alert(`Erro no servidor: ${errorData.message || 'Falha ao salvar.'}`);
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
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input id="dataNascimento" name="dataNascimento" type="date" value={formData.dataNascimento} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>

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

          <div className="space-y-2">
            <Label>Convênio</Label>
            <Select onValueChange={(v) => handleSelectChange('convenio', v)} defaultValue="particular">
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