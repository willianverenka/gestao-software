import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Stethoscope, UserPlus, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const ROLE_LABELS = {
  secretaria: 'Secretária',
  medico: 'Médico',
  paciente: 'Paciente',
};

const ROLE_SECTIONS = {
  secretaria: [
    {
      title: 'Cadastro de funcionários',
      description: 'Registre médicos e secretárias com login e papel definidos.',
      icon: UserPlus,
      action: '/cadastro-funcionario',
      button: 'Cadastrar funcionário',
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: 'Consultas pendentes',
      description: 'Confirme ou cancele solicitações que ainda estão em aberto.',
      icon: CalendarCheck,
      action: '/confirmacao-consultas',
      button: 'Ver pendências',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
  ],
  paciente: [
    {
      title: 'Agendar consulta',
      description: 'Escolha especialidade, data e horário.',
      icon: Stethoscope,
      action: '/calendario',
      button: 'Ir para o agendamento',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
  ],
  medico: [
    {
      title: 'Agenda médica',
      description: 'Espaço reservado para a agenda e as rotinas do médico.',
      icon: Stethoscope,
      action: '/agenda-medico',
      button: 'Ver agenda',
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
  ],
};

function RoleCard({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <article
      className={`group rounded-[1.75rem] border p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${item.tone}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <h3 className="mt-5 text-xl font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>

      {item.action ? (
        <Button
          variant="outline"
          className="mt-6 w-full justify-between rounded-2xl border-white/60 bg-white/80"
          onClick={() => onNavigate(item.action)}
        >
          {item.button}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </article>
  );
}

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cards = ROLE_SECTIONS[user?.role] || [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {ROLE_LABELS[user?.role] || user?.role}
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
          Olá, {user?.nome?.split(' ')[0] || 'usuário'}.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          Use as opções abaixo para acessar os fluxos disponíveis para o seu perfil.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <RoleCard key={item.title} item={item} onNavigate={navigate} />
        ))}
      </section>
    </div>
  );
}

export default Home;
