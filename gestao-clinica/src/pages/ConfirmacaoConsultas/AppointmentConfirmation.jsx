import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AppointmentConfirmation = () => {

  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patient: "João Silva",
      doctor: "Dr. Carlos",
      date: "12/03/2026",
      time: "14:00",
      status: "Pendente"
    },
    {
      id: 2,
      patient: "Maria Oliveira",
      doctor: "Dra. Fernanda",
      date: "13/03/2026",
      time: "09:30",
      status: "Pendente"
    }
  ]);

  const confirmAppointment = (id) => {
    setAppointments(
      appointments.map((appt) =>
        appt.id === id ? { ...appt, status: "Confirmado" } : appt
      )
    );
  };

  const rejectAppointment = (id) => {
    setAppointments(
      appointments.map((appt) =>
        appt.id === id ? { ...appt, status: "Recusado" } : appt
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-6">

      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Confirmação de Consultas
      </h1>

      <p className="text-slate-500 mb-8">
        Aqui a secretária pode confirmar ou recusar solicitações de consultas.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

        <table className="w-full text-left">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-4">Paciente</th>
              <th className="p-4">Médico</th>
              <th className="p-4">Data</th>
              <th className="p-4">Horário</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-b hover:bg-slate-50">

                <td className="p-4">{appt.patient}</td>
                <td className="p-4">{appt.doctor}</td>
                <td className="p-4">{appt.date}</td>
                <td className="p-4">{appt.time}</td>

                <td className="p-4">
                  {appt.status === "Pendente" && (
                    <Badge variant="outline">Pendente</Badge>
                  )}

                  {appt.status === "Confirmado" && (
                    <Badge className="bg-green-500">Confirmado</Badge>
                  )}

                  {appt.status === "Recusado" && (
                    <Badge className="bg-red-500">Recusado</Badge>
                  )}
                </td>

                <td className="p-4 flex gap-2 justify-center">

                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-white-700 rounded-full"
                    onClick={() => confirmAppointment(appt.id)}
                    disabled={appt.status !== "Pendente"}
                  >
                    <Check size={16} />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => rejectAppointment(appt.id)}
                    disabled={appt.status !== "Pendente"}
                  >
                    <X size={16} />
                  </Button>

                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
};

export default AppointmentConfirmation;
