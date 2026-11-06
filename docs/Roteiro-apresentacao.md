# Roteiro de apresentação do Dividi

**Integrantes:** Alicia, Eric e Yasmin Santiago.

Sugestão de fala para acompanhar os 16 slides. As notas também estão no PowerPoint.

## 01 · Dividi

Somos Alicia, Eric e Yasmin Santiago. O Dividi nasceu de uma situação comum: várias pessoas dividem gastos, mas no final ninguém sabe exatamente quanto precisa acertar. Vamos apresentar como a ideia evoluiu até virar um site funcional.

Fonte: Equipe informada pela usuária. Ilustração de abertura gerada para o projeto, usada como conceito visual.

## 02 · Uma viagem.

Em viagens, em uma casa compartilhada ou em uma saída com amigos, uma pessoa paga uma coisa e outra paga outra. Nem todo mundo participa de todos os gastos. O problema não é só fazer uma divisão: é lembrar o que aconteceu e cruzar todos os valores.

Fonte: Diário de Bordo Dividi, fornecido pela equipe.

## 03 · A ideia foi ficando mais clara

No início, pensamos em apenas dividir contas. Durante o planejamento percebemos que isso era pouco. A proposta ganhou sentido quando passamos a considerar várias despesas, pagadores diferentes e participantes diferentes. O Dividi registra esse conjunto e calcula o acerto.

Fonte: Diário de Bordo Dividi, fornecido pela equipe.

## 04 · Para quem compartilha gastos

O público principal reúne amigos, estudantes, pessoas que moram juntas e grupos que viajam. São situações em que as despesas se acumulam e a memória ou as mensagens do grupo deixam de ser suficientes. A proposta ainda precisa ser validada com grupos reais.

Fonte: Diário de Bordo Dividi, fornecido pela equipe.

## 05 · O caminho dentro do Dividi

O fluxo foi pensado para ser curto. Primeiro se cria um grupo, depois se registram as despesas. Os saldos são recalculados com base nesses registros. No final, o grupo consulta uma sugestão de pagamentos e registra as transferências realizadas fora do site.

Fonte: Diário de Bordo Dividi, fornecido pela equipe.

## 06 · A identidade visual

O protótipo no Figma ajudou a organizar as telas e a manter uma linguagem visual simples. O azul indica as ações principais, e as cores ajudam a diferenciar os saldos. A versão web manteve essa identidade e ganhou um layout para telas maiores. A imagem mostra o grupo de exemplo na versão web atual.

Fonte: Captura da versão local do Dividi realizada nesta tarefa. Diário de Bordo Dividi, seção Decisões de interface.

## 07 · O que entrou na primeira versão

A primeira versão ficou concentrada no que resolve o problema principal. Os participantes são registrados por nome e o dono da conta organiza os dados por eles. O acerto é um registro de transferências feitas por fora: o site não movimenta dinheiro.

Fonte: Código atual: app/dividi.tsx, formulários e telas; server/app.mjs; README.md do Dividi.

## 08 · Uma viagem de R$ 1.150,00

Este exemplo vem dos dados de teste do projeto. Os quatro participantes dividem R$ 1.150 igualmente, então a parte de cada um é R$ 287,50. O saldo compara quanto a pessoa pagou com a sua parte. João pagou mais que a sua parte e tem a receber. Os outros três têm a pagar.

Fonte: Código atual: app/model.ts, exemplo Viagem para a praia. Cálculos: 1150/4=287,50; 800−287,50=512,50; 200−287,50=−87,50; 150−287,50=−137,50; 0−287,50=−287,50.

## 09 · O acerto do grupo

A partir dos saldos, o Dividi combina quem deve com quem tem a receber. Neste exemplo, Pedro, Maria e Ana pagam a João. Depois desses pagamentos, todos ficam com saldo zero. O registro de um acerto atualiza os saldos sem apagar as despesas. A rotina busca uma solução simples, mas não deve ser apresentada como garantia matemática do menor número possível de transferências em todos os cenários.

Fonte: Código atual: app/model.ts, funções balances e transfers. Resultado do exemplo: Pedro→João 287,50; Maria→João 137,50; Ana→João 87,50.

## 10 · Duas formas de dividir

Uma dúvida importante foi a divisão por consumo. Cadastrar cada produto poderia deixar o processo demorado. A solução adotada foi permitir valores individuais sem exigir o cadastro de todos os itens. No exemplo de R$100, as quatro pessoas podem dividir igualmente em R$25 ou informar partes diferentes de R$40, R$30, R$20 e R$10. As duas somas fecham o mesmo total. A leitura automática de notas ficou para depois.

Fonte: Diario_de_Bordo_Dividi.docx, seção A questão da divisão por consumo. Código atual: app/expense-form.tsx. Exemplo ilustrativo: 100/4=25; 40+30+20+10=100.

## 11 · Tecnologias simples, funções claras

A versão atual é independente. React e TypeScript organizam a interface e os cálculos. O CSS mantém o visual no celular e no computador. O Node executa o servidor. O SQLite guarda contas, sessões e despesas, e o Zod valida os dados recebidos. O objetivo foi manter poucas dependências e responsabilidades fáceis de localizar.

Fonte: Código atual: package.json, vite.config.ts, server/app.mjs, server/store.mjs e server/validation.mjs.

## 12 · Como o projeto foi desenvolvido

O processo não foi só montar telas. Primeiro foi necessário questionar a utilidade da ideia. Depois vieram o público, o escopo e o protótipo. Na implementação, o foco foi fazer os dados e os cálculos funcionarem juntos. A revisão final separou telas e formulários, centralizou a comunicação com o servidor e deixou o código mais legível.

Fonte: Diário de Bordo Dividi e histórico de desenvolvimento desta conversa. Organização atual descrita no README.md.

## 13 · O que foi verificado

Foram executados testes de cálculo e de servidor, além da checagem de tipos e da compilação. Também foi testado no navegador o fluxo de despesa com centavos e o registro de acerto no exemplo. Isso demonstra funcionamento técnico local, mas ainda não equivale a uma pesquisa de usabilidade ou validação com usuários reais.

Fonte: Scripts check-calculations.mjs e check-server.mjs; execução de typecheck e build; teste no navegador registrado nesta conversa.

## 14 · Os próximos passos

O site funciona localmente. A publicação em uma hospedagem independente ainda é um próximo passo. Também fazem sentido convites para que os participantes colaborem, pagamentos parciais e recuperação de senha. A leitura de notas fiscais continua como possibilidade futura, depois de validar o fluxo principal.

Fonte: Estado atual do código e README.md; melhorias discutidas nesta conversa e funções futuras do Diário de Bordo.

## 15 · Uma hipótese de modelo de negócio

No planejamento, foi considerada uma proposta freemium. As funções que resolvem o problema principal seriam gratuitas. Recursos adicionais poderiam compor uma versão premium. Isso ainda é uma hipótese: não há planos pagos implementados, usuários comerciais ou receita validada.

Fonte: Diario_de_Bordo_Dividi.docx, seção Modelo de negócio. O código atual não implementa cobrança ou anúncios.

## 16 · Dividi

O aprendizado central foi transformar uma ideia genérica de dividir contas em uma proposta focada na organização de várias despesas. O grupo informa o que aconteceu, e o Dividi mantém os saldos e apresenta o acerto. O código e esta apresentação ficam no repositório do projeto. O repositório foi criado privado, então a equipe precisa conceder acesso antes de compartilhar com outras pessoas.

Fonte: Integrantes informados pela usuária. Repositório criado nesta tarefa: https://github.com/yasmin-sntgo/dividi.
