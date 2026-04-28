import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    senha: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setForm((current) => ({ ...current, email }));
    }
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  const submit = async (email, senha) => {
    setLoading(true);
    setError('');
    try {
      await login({ email, senha });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit(form.email, form.senha);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-60" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/5 md:p-7">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                MedSystem
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Entrar na conta</h1>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-slate-700">
                Senha
              </Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                placeholder="••••••••"
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              onClick={() => navigate('/pacientes')}
            >
              <UserPlus className="h-4 w-4" />
              Cadastre-se
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
