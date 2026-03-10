import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EmployeeRegistration from './pages/CadastroFuncionario/EmployeeRegistration';
import PatientRegistration from './pages/CadastroPaciente/PatientRegistration';
import Home from './pages/Home/Home';

function App() {
  return (
    <Router> 
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro-funcionario" element={<EmployeeRegistration />} />
            <Route path="/pacientes" element={<PatientRegistration />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;