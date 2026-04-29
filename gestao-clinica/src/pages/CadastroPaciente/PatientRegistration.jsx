import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
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
import { DateOfBirthPicker } from '@/components/DateOfBirthPicker';
import { useCatalogOptions } from '@/hooks/useCatalogOptions';

const INITIAL_STATE = {
  nome: '',
  email: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  genero: '',
  convenio: '',
  senha: '',
  confirmarSenha: '',
};

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
];

const PatientRegistration = () => {
  const navigate = useNavigate();
  const { user, apiFetch } = useAuth();
  const {
    options: convenios,
    items: convenioItems,
    loading: loadingConvenios,
    error: convenioError,
    reload: reloadConvenios,
  } = useCatalogOptions('/convenios');
  const convenioCatalogBlocked = loadingConvenios || (!convenios.length && Boolean(convenioError));

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadingConvenios || convenios.length === 0) return;

    setFormData((prev) => {
      if (prev.convenio && convenios.some((item) => item.codigo === prev.convenio)) {
        return prev;
      }

      const particular = convenios.find((item) => item.codigo === 'particular');
      const fallback = particular?.codigo || convenios[0].codigo;
      if (prev.convenio === fallback) return prev;
      return { ...prev, convenio: fallback };
    });
  }, [convenios, loadingConvenios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};

    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!formData.cpf.trim()) novosErros.cpf = 'CPF é obrigatório';
    if (!formData.email.trim()) novosErros.email = 'E-mail é obrigatório.';
    else if (!validarEmail(formData.email)) novosErros.email = 'Insira um e-mail válido.';
    if (formData.senha.length < 6) novosErros.senha = 'Mínimo de 6 caracteres.';
    if (formData.senha !== formData.confirmarSenha) {
      novosErros.confirmarSenha = 'As senhas não coincidem.';
    }
    if (!formData.convenio) novosErros.convenio = 'Selecione um convênio.';
    if (convenioError && !convenios.length) {
      novosErros.convenio = 'Recarregue os convênios antes de cadastrar.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/pacientes', {
        method: 'POST',
        body: {
          nome: formData.nome,
          email: formData.email.trim().toLowerCase(),
          cpf: formData.cpf.replace(/[^\d]+/g, ''),
          telefone: formData.telefone || null,
          convenio: formData.convenio,
          senha: formData.senha,
        },
      });

      if (response.ok) {
        alert('Paciente cadastrado com sucesso!');
        setFormData(INITIAL_STATE);
        navigate(`/login?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`, {
          replace: true,
        });
        return;
      }

      const msg = await readErrorMessage(response, 'Falha ao salvar.');
      alert(`Erro no servidor: ${msg}`);
    } catch (error) {
      console.error('Erro na conexão:', error);
      alert('Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(user ? '/' : '/login');
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/5">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 h-auto p-0 text-slate-500 hover:text-slate-800"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> {user ? 'Voltar para o início' : 'Voltar para o login'}
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Cadastro de Paciente</h2>
          <p className="text-sm text-slate-500">
            O cadastro já cria a senha para o novo acesso.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && <span className="text-sm text-red-500 font-medium">{errors.cpf}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <DateOfBirthPicker
              id="dataNascimento"
              value={formData.dataNascimento}
              onChange={(value) => handleSelectChange('dataNascimento', value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <span className="text-sm text-red-500 font-medium">{errors.email}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label>Gênero</Label>
            <Select
              items={GENDER_OPTIONS}
              value={formData.genero || undefined}
              onValueChange={(value) => handleSelectChange('genero', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Convênio</Label>
            <Select
              items={convenioItems}
              value={formData.convenio || undefined}
              onValueChange={(value) => handleSelectChange('convenio', value)}
              disabled={convenioCatalogBlocked}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loadingConvenios ? 'Carregando convênios...' : 'Selecione o convênio'}
                />
              </SelectTrigger>
              <SelectContent>
                {convenios.map((item) => (
                  <SelectItem key={item.codigo} value={item.codigo}>
                    {item.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {convenioError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p>{convenioError}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-auto p-0 text-amber-700 hover:bg-transparent hover:text-amber-900"
                  onClick={reloadConvenios}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : errors.convenio ? (
              <span className="text-sm font-medium text-red-500">{errors.convenio}</span>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
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
              name="confirmarSenha"
              type="password"
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
          className="w-full mt-6 gap-2"
          disabled={loading || convenioCatalogBlocked}
        >
          {loading ? 'Salvando...' : 'Cadastrar Paciente'}
          {!loading ? <CheckCircle2 className="h-4 w-4" /> : null}
        </Button>
      </form>
    </div>
  );
};

export default PatientRegistration;
