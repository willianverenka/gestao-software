from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import get_connection
from .tables import criar_tabelas
from .routers import pessoas, funcionarios, pacientes, consultas, backoffice

app = FastAPI(title="MedSystem API", version="1.0.0")

# CORS — libera o frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra todos os routers
app.include_router(pessoas.router)
app.include_router(funcionarios.router)
app.include_router(pacientes.router)
app.include_router(consultas.router)
app.include_router(backoffice.router)


@app.on_event("startup")
def on_startup():
    """Cria as tabelas se não existirem."""
    with get_connection() as conn:
        criar_tabelas(conn)


@app.get("/health")
def health():
    return {"status": "ok"}
