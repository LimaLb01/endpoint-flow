Começar
Este guia ajudará você a enviar e receber sua primeira mensagem usando a API de Nuvem. Você também aprenderá a configurar webhooks para usar com um app de exemplo.

Este documento destina-se a pessoas que desenvolvem apps para si mesmas ou para organizações próprias. Se você estiver criando um app que será usado por outras empresas, consulte Provedores de soluções.

Antes de começar
Você precisará do seguinte:

Um conta de desenvolvedor da Meta: saiba mais sobre o processo de registro como desenvolvedor da Meta.
Um app do tipo Empresa: saiba mais sobre a criação de apps. Caso você não veja a opção para criar um app do tipo Empresa, selecione Outro > Avançar > Empresa durante o processo de criação.
Etapa 1: adicionar o produto WhatsApp ao app
Se você tiver criado um novo app, a solicitação Adicionar produtos ao seu app será exibida. Role a tela para baixo e, em WhatsApp, selecione Configurar. Também é possível selecionar seu app na tela Meus apps e seguir as mesmas instruções novamente para adicionar o WhatsApp.

Caso você já tenha um portfólio empresarial, será preciso anexá-lo. Se ainda não tiver um, siga as instruções para criar e anexar o portfólio.

Veja o que acontece quando você adiciona o produto WhatsApp ao seu app e anexa um portfólio empresarial:

É criada uma versão de teste da Conta do WhatsApp Business (WABA, pelas iniciais em inglês), que pode ser usada para enviar mensagens de teste gratuitas para você.
É criado um número de telefone comercial de teste associado à sua WABA, que você pode usar para enviar mensagens gratuitas para até 5 destinatários.
É criado um modelo "hello world" pré-aprovado.
Etapa 2: gerar um token de acesso
No menu à esquerda do Painel de Apps, navegue até WhatsApp > Configuração da API e clique no botão azul Gerar token de acesso. Conclua o fluxo para gerar um token de acesso do usuário. Normalmente, você usará um token do sistema ou um token comercial, mas para as etapas mencionadas, um token do usuário é suficiente.

Etapa 3: adicionar um número de destinatário
Adicione um número válido do WhatsApp para enviar mensagens de teste. Em Enviar e receber mensagens, selecione o campo Para e escolha Gerenciar lista de números de telefone.

É possível adicionar qualquer número válido do WhatsApp como destinatário. O destinatário receberá um código de confirmação no WhatsApp que pode ser usado para verificar o número de telefone.

Após a verificação, o número do destinatário deverá ser selecionado no campo Para. Repita esse processo se quiser adicionar outro destinatário, sem ultrapassar o limite de 5 números no total.

Etapa 4: enviar uma mensagem de teste
Envie a mensagem de modelo pré-aprovada hello_world ao número do destinatário escolhido.

No painel WhatsApp > Configuração da API:

Confirme que seu número de telefone comercial de teste aparece selecionado no campo De.
Selecione o número de telefone do destinatário para o qual você quer enviar a mensagem no campo Para. Se houver mais de um número adicionado, será possível enviar várias mensagens de uma vez.
No painel Enviar mensagens com a API, clique no botão Enviar mensagem.
Outra opção é copiar o comando cURL, colar em uma nova janela de terminal e depois executá-lo.

O código indica que você está enviando uma mensagem de modelo (”type”:”template”) e identificando um modelo específico para usar (”name”:”hello_world”).

Etapa 5: clonar nosso app de exemplo e configurar webhooks
Com os webhooks, você pode receber notificações HTTP em tempo real sobre mudanças em objetos específicos. No WhatsApp, os webhooks podem notificar você sobre diferentes eventos ocorridos no app, como entrega de mensagens, notificações de leitura e até mesmo alterações na conta.

Adicione um URL de retorno de ligação para ver o conteúdo dos webhooks. Siga o guia Testar app do webhook para clonar nosso app de amostra, que aceita notificações de webhooks e exibe suas cargas JSON na tela.

Depois que seu webhook estiver configurado, reenvie o modelo de mensagem e responda a ele. Você verá 4 notificações de webhook diferentes: as notificações de envio, entrega e leitura, além do conteúdo da mensagem recebida.

Etapa 6: adicionar um número comercial real (opcional)
Com as versões de teste do número comercial e da WABA, você pode começar a desenvolver seu app. O uso desses ativos de teste permite que você não pague para enviar mensagens enquanto trabalha no processo de desenvolvimento.

Quando estiver tudo pronto para começar a enviar mensagens aos seus clientes, você poderá adicionar um número de telefone comercial real usando o painel Configuração da API e criar uma WABA real.

Próximas etapas
Saiba mais sobre tokens de acesso e usuários do sistema
Aprenda sobre modelos de mensagem
