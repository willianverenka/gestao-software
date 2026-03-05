# MedSystem

## Integrantes:
- Theo Zago Zimmermann - 221230352

- Willian Verenka - 221240815

- Gabriel Lovato - 221230048

- João Vitor Sitta - 221230543

- João Rogante - 222230815


# Linguagem a framework
- Escolhemos a linguagem Javascript com o framework React.js para o front-end.
- Para back-end escolhemos Python como linguagem e o framework FastAPI.

# Reuso de frameworks
- React.js para estruturar o front-end por ser padrão de indústria e apresentar vasto ecossistema de bibliotecas de componentes de interface. 

- FastAPI para o back-end pela facilidade de uso e familiaridade da equipe de desenvolvedores.

# Componentes
- Componente de autenticação nativo do FastAPI

- Componente de autorização nativo do FastAPI

- Componente de mensageria assíncrona com o RabbitMQ

# Reuso de objetos e funções
- Classe para validação de dados cadastrais de pacientes e funcionários

- Classe para validação de horários ocupados em uma agenda

# Reuso de aplicações
- Integração com API de sistema de autorização de convênios e operadoras da ANS

# Reuso de bibliotecas
- Pydantic para validação de schemas da API e garantir a integração backend-frontend.

- FPDF para a geração de relatórios de agenda, consultas e receitas em PDF

- React Hook Form para validação de formulários no front-end

- Smptlib para enviar e-mails de notificação para pacientes

- Shadcn para reutilizar componentes de interface


# Reuso de padrões em arquitetura
- Orientação a serviços a fim de desacoplar as regras de negócio da aplicação e aumentar a testabilidade e futura substituição de regras.

- Arquitetura de mensageria assíncrona para melhorar a usabilidade da plataforma e a performance em requisições demoradas para o servidor, como a geração de PDFs, por exemplo.

# Interfaces
•	AgendamentoService
listarEspecialidades()

listarMedicosPorEspecialidade(Especialidade especialidade)

listarHorariosDisponiveis(Medico medico, Data data)

registrarAgendamento(Paciente paciente, Medico medico, Horario horario)

gerarConfirmacao(Agendamento agendamento)


•	AgendaService
buscarConsultasConfirmadas(Data dataInicio, Data dataFim)

gerarVisualizacaoAgenda(List<Consulta> consultas)

gerarDocumentoAgenda(AgendaVisualizada agenda)


•	CirurgiaService

listarCirurgiasPendentesRevisao()

consultarDetalhesCirurgia(Cirurgia cirurgia)

validarInformacoesCirurgia(DetalhesCirurgia detalhes)

anexarDocumentacao(Cirurgia cirurgia, List<Documento> documentos)



•	AutorizacaoOperadoraService

submeterSolicitacaoAutorizacao(Cirurgia cirurgia, List<Documento> documentos)

registrarProtocolo(Cirurgia cirurgia, Protocolo protocolo)

atualizarStatusCirurgia(Cirurgia cirurgia, Status status)


# Componentes

## Agendamento de consultas
Interface: AgendamentoService
listarEspecialidades()
listarMedicosPorEspecialidade(Especialidade especialidade)
listarHorariosDisponiveis(Medico medico, Data data)
registrarAgendamento(Paciente paciente, Medico medico, Horario horario)
gerarConfirmacao(Agendamento agendamento)

## Visualização de agenda 
Interface: AgendaService
buscarConsultasConfirmadas(Data dataInicio, Data dataFim)
gerarVisualizacaoAgenda(List<Consulta> consultas)
gerarDocumentoAgenda(AgendaVisualizada agenda)

## Gestão de Cirurgias e Consultas
Interfaces: CirurgiaService

listarCirurgiasPendentesRevisao()
consultarDetalhesCirurgia(Cirurgia cirurgia)
validarInformacoesCirurgia(DetalhesCirurgia detalhes)
anexarDocumentacao(Cirurgia cirurgia, List<Documento> documentos)
Autorização da Operadora
Interface: AutorizacaoOperadoraService
enviarSolicitacaoAutorizacao(Cirurgia cirurgia, List<Documento> documentos)
registrarProtocolo(Cirurgia cirurgia, Protocolo protocolo)
atualizarStatusCirurgia(Cirurgia cirurgia, Status status)

# Condições

registrarAgendamento(Paciente paciente, Medico medico, Horario horario)

Pré-condição: O paciente deve estar cadastrado e ativo no sistema; o médico deve existir e estar vinculado a uma especialidade; o horário deve estar disponível (não reservado) e pertencer a uma data futura.

Pós-condição: Um objeto Agendamento é criado com status confirmado, o horário é marcado como indisponível, o paciente e o médico são notificados.


buscarConsultasConfirmadas(Data dataInicio, Data dataFim)

Pré-condição: dataInicio deve ser uma data válida e anterior ou igual a dataFim

Pós-condição: Retorna uma lista de objetos Consulta com status confirmado dentro do intervalo informado, ordenada cronologicamente


validarInformacoesCirurgia(DetalhesCirurgia detalhes)

Pré-condição:	O objeto DetalhesCirurgia deve estar completamente preenchido (paciente, procedimento, CID, médico responsável e data prevista); a cirurgia deve estar no status Pendente Revisão.

Pós-condição:	O status da cirurgia é atualizado para Revisada em caso de sucesso, ou para Pendente Correção com os campos inválidos identificados em caso de falha.


enviarSolicitacaoAutorizacao(Cirurgia cirurgia, List<Documento> documentos)

Pré-condição: A cirurgia deve estar com status validada, a lista de documentos não deve estar vazia, o paciente deve possuir plano de saúde ativo.

Pós-condição: A solicitação é enviada à operadora, o status da cirurgia é atualizado para Aguardando Autorização, um protocolo de solicitação é gerado e associado à cirurgia.


# Dependências

<img width="416" height="360" alt="image" src="https://github.com/user-attachments/assets/74ad6a15-a38e-40b6-a22b-4a809d051131" />

# Diagrama de componentes e interfaces

<img width="425" height="349" alt="image" src="https://github.com/user-attachments/assets/e515a3ee-3ddd-4850-a825-9df54f2892b2" />




