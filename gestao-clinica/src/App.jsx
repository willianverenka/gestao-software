import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import EmployeeRegistration from './pages/CadastroFuncionario/EmployeeRegistration';
import PatientRegistration from './pages/CadastroPaciente/PatientRegistration';
import Schedule from './pages/Calendario/Schedule';
import AppointmentConfirmation from './pages/ConfirmacaoConsultas/AppointmentConfirmation';
import AgendaMedico from './pages/AgendaMedico/AgendaMedico';
import Login from './pages/Login/Login';
import { AppShell } from '@/components/AppShell';
import {
  GuestOnly,
  PatientRegistrationGate,
  RequireAuth,
} from '@/components/RouteGuards';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path="/pacientes"
          element={
            <PatientRegistrationGate>
              <PatientRegistration />
            </PatientRegistrationGate>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell>
                <Home />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/cadastro-funcionario"
          element={
            <RequireAuth roles={['secretaria']}>
              <AppShell>
                <EmployeeRegistration />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/calendario"
          element={
            <RequireAuth roles={['paciente']}>
              <AppShell>
                <Schedule />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/confirmacao-consultas"
          element={
            <RequireAuth roles={['secretaria']}>
              <AppShell>
                <AppointmentConfirmation />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/agenda-medico"
          element={
            <RequireAuth roles={['medico']}>
              <AppShell>
                <AgendaMedico />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
