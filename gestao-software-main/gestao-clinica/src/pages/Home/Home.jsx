import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Activity } from 'lucide-react'; 
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo ao MedSystem</h1>
      <p className="text-slate-500 mb-8">O que você deseja fazer hoje?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/cadastro-funcionario')}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <UserPlus className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Funcionários</h3>
          <p className="text-slate-500 text-sm mb-4">Cadastre novos médicos, recepcionistas ou administradores.</p>
          <Button variant="outline" className="w-full">Acessar Cadastro</Button>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => navigate('/pacientes')}>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Pacientes</h3>
          <p className="text-slate-500 text-sm mb-4">Registre novos pacientes e gerencie informações de convênio.</p>
          <Button variant="outline" className="w-full">Acessar Cadastro</Button>
        </div>
      </div>
    </div>
  );
};

export default Home;