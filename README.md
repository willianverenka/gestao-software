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

# Diagrama de componentes
<img width="886" height="548" alt="image" src="https://github.com/user-attachments/assets/1992f816-3c1c-403c-aebd-c5e5afad8b46" />

