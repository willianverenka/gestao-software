from .base import BaseRepository


class PacienteRepository(BaseRepository):
    def criar_paciente(self, pessoa_id: int, convenio_id: int = None) -> dict:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            INSERT INTO pacientes (pessoa_id, convenio_id)
            VALUES (?, ?)
            """,
            (pessoa_id, convenio_id),
        )
        self.conn.commit()
        return {
            "paciente_id": cursor.lastrowid,
            "pessoa_id": pessoa_id,
            "convenio_id": convenio_id,
        }