import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { readErrorMessage } from '@/lib/api';
import { useCatalogOptions } from '@/hooks/useCatalogOptions';

const INITIAL_STATE = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  cargo: 'secretaria',
  crm: '',
  especialidade: '',
  senha: '',
  confirmarSenha: '',
};

const CARGO_OPTIONS = [
  { value: 'secretaria', label: 'Secretária' },
  { value: 'medico', label: 'Médico' },
];

const EmployeeRegistration = () => {
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

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCargoChange = (value) => {
    setFormData((prev) => ({ ...prev, cargo: value }));
    if (errors.crm) setErrors((prev) => ({ ...prev, crm: '' }));
    if (errors.especialidade) setErrors((prev) => ({ ...prev, especialidade: '' }));
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validarCPF = (cpf) => {
    const limpo = cpf.replace(/[^\d]+/g, '');

    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i += 1) {
      soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) resto = 0;

    if (resto !== parseInt(limpo.substring(9, 10), 10)) return false;
    soma = 0;

    for (let i = 1; i <= 10; i += 1) {
      soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.substring(10, 11), 10)) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};

    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório.';
    if (!validarEmail(formData.email)) novosErros.email = 'Insira um e-mail válido.';
    if (!validarCPF(formData.cpf)) novosErros.cpf = 'CPF inválido.';
    if (formData.cargo === 'medico') {
      if (!formData.crm.trim()) {
        novosErros.crm = 'O CRM é obrigatório para médicos.';
      }
      if (!formData.especialidade) {
        novosErros.especialidade = 'A especialidade é obrigatória para médicos.';
      }
      if (especialidadesError && !especialidades.length) {
        novosErros.especialidade = 'Recarregue as especialidades antes de cadastrar.';
      }
    }
    if (formData.senha.length < 6) novosErros.senha = 'Mínimo de 6 caracteres.';
    if (formData.senha !== formData.confirmarSenha) {
      novosErros.confirmarSenha = 'As senhas não coincidem.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/funcionarios', {
        method: 'POST',
        body: {
          nome: formData.nome,
          email: formData.email.trim().toLowerCase(),
          cpf: formData.cpf.replace(/[^\d]+/g, ''),
          telefone: formData.telefone || null,
          cargo: formData.cargo,
          crm: formData.cargo === 'medico' ? formData.crm : null,
          especialidade: formData.cargo === 'medico' ? formData.especialidade : null,
          senha: formData.senha,
        },
      });

      if (response.ok) {
        alert('Funcionário cadastrado com sucesso!');
        setFormData(INITIAL_STATE);
        return;
      }

      const msg = await readErrorMessage(response, 'Verifique os dados.');
      alert(`Erro ao cadastrar: ${msg}`);
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/5">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 h-auto p-0 text-slate-500 hover:text-slate-800"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <BadgeCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Cadastro de Funcionário</h2>
          <p className="text-sm text-slate-500">
            A secretária cria o funcionário e já define a senha de acesso.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <span className="text-sm text-red-500 font-medium">{errors.nome}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <span className="text-sm text-red-500 font-medium">{errors.email}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="Apenas números"
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && <span className="text-sm text-red-500 font-medium">{errors.cpf}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Cargo</Label>
            <Select items={CARGO_OPTIONS} value={formData.cargo} onValueChange={handleCargoChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {CARGO_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.cargo === 'medico' ? (
            <>
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  name="crm"
                  value={formData.crm}
                  onChange={handleChange}
                  placeholder="Ex: 123456-SP"
                  className={errors.crm ? 'border-red-500' : ''}
                />
                {errors.crm && <span className="text-sm text-red-500 font-medium">{errors.crm}</span>}
              </div>

              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>Especialidade</Label>
                <Select
                  items={especialidadeItems}
                  value={formData.especialidade || undefined}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, especialidade: value }));
                    if (errors.especialidade) {
                      setErrors((prev) => ({ ...prev, especialidade: '' }));
                    }
                  }}
                  disabled={especialidadeCatalogBlocked}
                >
                  <SelectTrigger className={`w-full ${errors.especialidade ? 'border-red-500' : ''}`}>
                    <SelectValue
                      placeholder={
                        loadingEspecialidades ? 'Carregando especialidades...' : 'Selecione a especialidade'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((item) => (
                      <SelectItem key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {especialidadesError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
                ) : errors.especialidade ? (
                  <span className="text-sm text-red-500 font-medium">{errors.especialidade}</span>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              className={errors.senha ? 'border-red-500' : ''}
            />
            {errors.senha && <span className="text-sm text-red-500 font-medium">{errors.senha}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
            <Input
              id="confirmarSenha"
              type="password"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              className={errors.confirmarSenha ? 'border-red-500' : ''}
            />
            {errors.confirmarSenha && (
              <span className="text-sm text-red-500 font-medium">{errors.confirmarSenha}</span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          disabled={loading || (formData.cargo === 'medico' && especialidadeCatalogBlocked)}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </form>
    </div>
  );
};

export default EmployeeRegistration;
