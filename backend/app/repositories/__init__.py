from .base import BaseRepository
from .pessoa_repository import PessoaRepository
from .convenio_repository import ConvenioRepository
from .especialidade_repository import EspecialidadeRepository
from .funcionario_repository import FuncionarioRepository
from .paciente_repository import PacienteRepository
from .consulta_repository import ConsultaRepository

__all__ = [
    "BaseRepository",
    "PessoaRepository",
    "ConvenioRepository",
    "EspecialidadeRepository",
    "FuncionarioRepository",
    "PacienteRepository",
    "ConsultaRepository",
]

