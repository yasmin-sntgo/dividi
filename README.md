# Dividi

![Apresentação do Dividi](docs/apresentacao-preview.png)

**Integrantes:** Alicia, Eric e Yasmin Santiago.

Organize despesas compartilhadas e descubra quem precisa pagar quem. Site independente com cadastro por e-mail e senha, divisão igual ou personalizada e histórico de acertos.

## Apresentação do projeto

- [PowerPoint editável: ideia, processo e resultado](docs/Apresentacao-Dividi.pptx)
- [Roteiro para a apresentação](docs/Roteiro-apresentacao.md)



## Rodar no Windows

Instale Node.js 24 LTS ou superior. Abra o PowerShell:

```powershell
cd "C:\Users\Yasmin\OneDrive\Documentos\Dividi"
npm ci
npm run dev
```

Se as dependências já estiverem instaladas, basta `npm run dev`. Abra http://127.0.0.1:5173. O comando inicia a interface e a API juntos. Para parar, pressione Ctrl+C.

Crie uma conta pelo próprio Dividi, usando seu nome, e-mail e uma senha com pelo menos 10 caracteres. O modo de exemplo pode ser testado sem cadastro. O cadastro não envia e-mails de verificação e a recuperação de senha por e-mail ainda não foi implementada.

## Dados

O banco é criado automaticamente em `data/dividi.sqlite`. O salvamento é feito pelo servidor, vinculado à conta; não depende do armazenamento do navegador. Faça cópias de segurança do diretório `data` com o servidor parado. Não compartilhe nem publique esse diretório.

Os dados da versão online anterior não são automaticamente transferidos para este banco. A versão anterior foi preservada em um arquivo de backup ao lado da pasta do projeto, incluindo os arquivos do banco de teste antigo.

## Tecnologias

- React e TypeScript: interface e cálculos em centavos inteiros.
- CSS: layout responsivo.
- Vite: desenvolvimento e build da interface.
- Node.js: API e servidor de arquivos.
- SQLite integrado ao Node.js: contas, sessões e despesas persistentes.
- Zod: validação no servidor.
- Lucide: ícones.

As senhas usam scrypt com salt individual. As sessões ficam no banco e usam cookies HttpOnly. A API separa os dados por conta, verifica versões concorrentes, limita tentativas de login e bloqueia solicitações de escrita vindas de outras origens.

## Verificações

```powershell
npm run typecheck
npm test
npm run build
```

## Executar a versão compilada

```powershell
npm run build
npm start
```

Abra http://127.0.0.1:3001. A interface e a API são servidas pelo mesmo processo. Esse comando roda localmente; não publica o site.

## Hospedagem independente

Use um servidor com Node.js 24+, HTTPS e disco persistente. Compile com `npm run build`, depois execute `npm start`. Configure:

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT`: porta fornecida pela hospedagem.
- `DIVIDI_PUBLIC_ORIGIN`: endereço HTTPS final, sem barra no final.
- `DIVIDI_DATABASE_PATH`: caminho para o SQLite no disco persistente.

Em produção, os cookies são seguros por padrão e exigem HTTPS. Não hospede o banco em um sistema de arquivos descartável. O domínio e o provedor de hospedagem são escolhidos separadamente.

## Onde encontrar cada parte

- pp/dividi.tsx: navegação e salvamento dos dados compartilhados.
- pp/groups-screen.tsx, group-screen.tsx e profile-screen.tsx: telas.
- pp/group-form.tsx, xpense-form.tsx e uth-form.tsx: formulários com seus próprios campos.
- pp/model.ts: tipos, cálculos e exemplo interativo.
- pp/api.ts: comunicação com o servidor e tratamento das respostas.
- pp/ui.tsx e group-cards.tsx: elementos visuais reutilizados.
- pp/globals.css: todo o estilo, incluindo adaptações para celular.
- server/app.mjs: rotas da API e autenticação.
- server/store.mjs: consultas SQLite.
- server/validation.mjs: validação das despesas antes de salvar.

A organização mantém as mesmas tecnologias e o mesmo design. Os formulários guardam seus campos localmente; o componente principal cuida apenas da navegação e dos dados compartilhados.
