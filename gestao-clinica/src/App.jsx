import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import EmployeeRegistration from './pages/CadastroFuncionario/EmployeeRegistration';
import PatientRegistration from './pages/CadastroPaciente/PatientRegistration';
import Home from './pages/Home/Home';
import Schedule from './pages/Calendario/Schedule';
import AppointmentConfirmation from './pages/ConfirmacaoConsultas/AppointmentConfirmation';
import Backoffice from './pages/Backoffice/Backoffice';

function KeyboardListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        navigate('/backoffice');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <KeyboardListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro-funcionario" element={<EmployeeRegistration />} />
        <Route path="/pacientes" element={<PatientRegistration />} />
        <Route path="/calendario" element={<Schedule />} />
        <Route path="/confirmacao-consultas" element={<AppointmentConfirmation />} />
        <Route path="/backoffice" element={<Backoffice />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto">
          <AppRoutes />
        </div>
      </div>
    </Router>
  );
}

export default App;