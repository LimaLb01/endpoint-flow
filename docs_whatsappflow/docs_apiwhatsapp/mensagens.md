Como enviar mensagens
Este documento descreve como usar a API para enviar mensagens aos usuários do WhatsApp.

Tipos de mensagem
Você pode usar a API para enviar os tipos de mensagem a seguir.

As mensagens de endereço permitem que você solicite facilmente um endereço de entrega aos usuários do WhatsApp.



As mensagens de áudio mostram um ícone e um link para um arquivo de áudio. Quando o usuário do WhatsApp toca no ícone, o cliente do WhatsApp carrega e reproduz o arquivo.



As mensagens de contato permitem que você envie informações avançadas de contato diretamente aos usuários do WhatsApp, como nomes, números de telefone, endereços físicos e endereços de email.



As mensagens de documento exibem um ícone de documento para o usuário do WhatsApp clicar e baixar.



As mensagens de imagem exibem uma única imagem e uma legenda opcional.



As mensagens interativas de botão de URL de CTA permitem que você associe qualquer URL a um botão para não precisar incluir URLs inteiros que são longos e obscuros no corpo da mensagem.



As mensagens de fluxo interativas permitem enviar mensagens estruturadas mais naturais ou agradáveis para os clientes. Por exemplo, é possível usar o WhatsApp Flows para marcar compromissos, navegar por produtos, coletar feedback dos clientes, captar novos leads de vendas ou qualquer outra ação.

As mensagens de fluxo interativas estão documentadas no nosso conjunto de documentos do WhatsApp Flows.



As mensagens de lista interativas permitem apresentar uma lista de opções para escolha dos usuários do WhatsApp.



As mensagens de solicitação de localização interativas exibem um corpo de texto e o botão de enviar localização. Quando o usuário do WhatsApp toca no botão, uma tela para compartilhar a localização é exibida, permitindo que ele faça o compartilhamento.



As mensagens de botões de resposta interativas permitem que você envie até três respostas predefinidas para o usuário escolher.



As mensagens de localização permitem que você envie as coordenadas de latitude e longitude de uma localização para um usuário do WhatsApp.



As mensagens de figurinhas exibem imagens animadas ou estáticas de figurinhas em uma mensagem do WhatsApp.



As mensagens de texto contêm apenas um corpo de texto e uma prévia de link opcional.



As mensagens de modelo permitem que você envie modelos de marketing, utilidade e autenticação para usuários do WhatsApp. Ao contrário de todos os demais tipos de mensagens, as mensagens de modelo não exigem que haja uma janela de atendimento ao cliente 24 horas aberta entre você e o destinatário da mensagem antes de serem enviadas.



As mensagens de vídeo exibem uma prévia em miniatura de uma imagem de vídeo com uma legenda opcional. Quando o usuário do WhatsApp toca na prévia, o vídeo é carregado e exibido.



As mensagens de reação são reações com emoji que você pode aplicar a uma mensagem anterior recebida de um usuário do WhatsApp.


Qualidade da mensagem
A qualidade da mensagem é baseada em como ela foi recebida pelos usuários do WhatsApp nos últimos 7 dias e ponderada pela recenticidade. Ela é determinada por uma combinação de sinais de feedback, que incluem bloqueios, denúncias, silenciamentos e arquivamentos, além dos motivos fornecidos pelos usuários quando bloqueiam sua empresa.

Diretrizes para o envio de mensagens de alta qualidade:

Verifique se as mensagens seguem a Política de Mensagens do WhatsApp Business.
Envie mensagens apenas a usuários do WhatsApp que aceitaram receber contato da sua empresa.
Crie mensagens altamente personalizadas e úteis para os usuários.
Evite enviar mensagens introdutórias ou de boas-vindas que sejam vagas demais.
Evite enviar muitas mensagens aos clientes por dia.
Otimize suas mensagens em termos de conteúdo e tamanho.
O status do número de telefone comercial, a classificação de qualidade e os limites de envio de mensagens são exibidos no painel Gerenciador do WhatsApp > Ferramentas da conta > Números de telefone.


É normal que números com alto tráfego passem por alterações na qualidade em intervalos curtos (até mesmo em minutos).

Janelas de atendimento ao cliente
Se você receber uma mensagem ou uma ligação de um usuário do WhatsApp, uma janela de atendimento de 24 horas será aberta (ou atualizada, caso já tenha sido iniciada).

Enquanto a janela de atendimento ao cliente estiver aberta, você poderá enviar qualquer tipo de mensagem ao usuário. Caso contrário, será possível enviar somente mensagens de modelo ao usuário, pois esse é o único tipo de mensagem que pode ser enviado fora da janela de atendimento ao cliente.

Só é possível fazer envios a usuários que aceitaram receber suas mensagens.

Problema conhecido: em casos raros, talvez você receba uma mensagem de um usuário, mas não consiga respondê-la dentro do prazo da janela de atendimento ao cliente. Lamentamos o transtorno.

Solicitações
Todas as solicitações de envio de mensagem usam o ponto de extremidade POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID/messages:

POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages
O corpo do post varia conforme o tipo de mensagem, mas a carga usa a seguinte sintaxe comum:

{
  "messaging_product": "whatsapp",
  "recipient_type": "<RECIPIENT_TYPE>",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "<MESSAGE_TYPE>",
  "<MESSAGE_TYPE>": {<MESSAGE_CONTENTS>}
}
O valor da propriedade type na carga do corpo indica o tipo de mensagem. É necessário incluir uma propriedade correspondente a esse tipo que descreva o conteúdo da mensagem.

A propriedade recipient_type pode ser indivudal para mensagens individuais ou group para mensagens em grupo.

Saiba mais sobre a API de Grupos

Abaixo, há uma solicitação para enviar uma mensagem de texto a um usuário do WhatsApp. O type é definido como text, e o objeto text descreve o conteúdo da mensagem:

curl 'https://graph.facebook.com/v24.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "As requested, here'\''s the link to our latest product: https://www.meta.com/quest/quest-3/"
  }
}'
Se fosse entregue ao usuário, a mensagem teria esta aparência no cliente do WhatsApp:


Respostas
A API retornará a seguinte resposta JSON ao aceitar a solicitação de envio de mensagem se não houver erros. Essa resposta indica somente que a API aceitou a solicitação, ou seja, não indica a entrega da mensagem. O status de entrega de mensagem é comunicado pelos webhooks de mensagens.

Sintaxe da resposta
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "<WHATSAPP_USER_PHONE_NUMBER>",
      "wa_id": "<WHATSAPP_USER_PHONE_NUMBER>"
    }
  ],
  "messages": [
    {
      "id": "<WHATSAPP_MESSAGE_ID>",
      "group_id": "<GROUP_ID>", <!-- Only included if messaging a group -->
      "message_status": "<PACING_STATUS>" <!-- Only included if sending a template -->
    }
  ]
}
Conteúdo da resposta
Placeholder	Description	Sample Value
<GROUP_ID>

String

The string identifier of a group made using the Groups API.

This field shows when messages are sent, received, or read from a group.

Learn more about the Groups API

Y2FwaV9ncm91cDoxNzA1NTU1MDEzOToxMjAzNjM0MDQ2OTQyMzM4MjAZD

<PACING_STATUS>

String

Indicates template pacing status. The message_status property is only included in responses when sending a template message that uses a template that is being paced.

wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI4MjZGRDA0OUE2OTQ3RkEyMzcA

<WHATSAPP_USER_PHONE_NUMBER>

String

WhatsApp user's WhatsApp phone number. May not match wa_id value.

+16505551234

<WHATSAPP_USER_ID>

String

WhatsApp user's WhatsApp ID. May not match input value.

16505551234

<WHATSAPP_MESSAGE_ID>

String

WhatsApp Message ID. This ID appears in associated messages webhooks, such as sent, read, and delivered webhooks.

wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI4MjZGRDA0OUE2OTQ3RkEyMzcA

Mensagens comerciais
As mensagens comerciais são mensagens interativas usadas com um catálogo de produtos. Consulte o artigo Compartilhar produtos com clientes para saber como usar esses tipos de mensagem.

Confirmações de leitura
Para confirmar a leitura, você pode marcar uma mensagem como lida exibindo dois tiques azuis (chamados de "confirmações de leitura") abaixo da mensagem do usuário do WhatsApp:


Indicadores de digitação
Caso você leve alguns segundos ou mais para responder a um usuário, será possível informar que a resposta está sendo elaborada usando o indicador de digitação e as confirmações de leitura no cliente do WhatsApp:


Respostas contextuais
Você pode enviar uma mensagem para um usuário do WhatsApp como uma resposta contextual, que cita uma mensagem anterior em um balão de contexto:


Dessa forma, fica mais fácil para o usuário saber a qual mensagem específica você está respondendo.

Webhooks
As mensagens enviadas a usuários do WhatsApp disparam webhooks de mensagens. Assine esse tópico para receber notificações relacionadas ao status de mensagens.

WhatsApp user phone number formats
Plus signs (+), hyphens (-), parenthesis ((,)), and spaces are supported in send message requests.

We highly recommend that you include both the plus sign and country calling code when sending a message to a customer. If the plus sign is omitted, your business phone number's country calling code is prepended to the customer's phone number. This can result in undelivered or misdelivered messages.

For example, if your business is in India (country calling code 91) and you send a message to the following customer phone number in various formats:

Number In Send Message Request	Number Message Delivered To	Outcome
+16315551234

+16315551234

Correct number

+1 (631) 555-1234

+16315551234

Correct number

(631) 555-1234

+916315551234

Potentially wrong number

1 (631) 555-1234

+9116315551234

Potentially wrong number

Note: For Brazil and Mexico, the extra added prefix of the phone number may be modified by the Cloud API. This is a standard behavior of the system and is not considered a bug.

Cache de mídia
Caso esteja usando um (link) para um ativo de mídia no servidor (em vez do ID (id) de um ativo carregado nos nossos servidores), a API de Nuvem do WhatsApp armazena em cache interno o ativo por um período estático de dez minutos. O ativo em cache será usado em solicitações de envio de mensagem subsequentes se o link nas cargas posteriores de envio de mensagem for o mesmo que o da carga de envio da mensagem inicial.

Se não quiser que o ativo em cache seja reutilizado em uma mensagem subsequente no período de 10 minutos, adicione uma string de consulta aleatória ao link do ativo na nova carga de solicitação de envio de mensagem. Ele será tratado como um novo ativo, obtido do seu servidor e armazenado em cache por 10 minutos.

Por exemplo:

Link do ativo na 1ª solicitação de envio de mensagem: https://link.to.media/sample.jpg – ativo recuperado, em cache por 10 minutos
Link do ativo na 2ª solicitação de envio de mensagem: https://link.to.media/sample.jpg – uso do ativo em cache
Link do ativo na 3ª solicitação de envio de mensagem: https://link.to.media/sample.jpg – ativo recuperado, em cache por dez minutos
Sequência de entrega de várias mensagens
Se você enviar várias mensagens, talvez elas não sejam entregues na mesma ordem das solicitações da API. Caso haja uma ordem a ser seguida, verifique se cada mensagem foi entregue no status delivered do webhook de mensagens antes de enviar a próxima.

Tempo de vida (TTL) da mensagem
Se não conseguirmos entregar uma mensagem a um usuário do WhatsApp, faremos novas tentativas de entrega por um período conhecido como tempo de vida (TTL, pelas iniciais em inglês) ou período de validade da mensagem.

TTL padrão
Todas as mensagens, exceto modelos de autenticação: 30 dias.
Modelos de autenticação: 10 minutos
Como personalizar o TTL para modelos
Você pode personalizar o TTL padrão para modelos de autenticação e utilidade, assim como para modelos de marketing enviados usando a API de MM Lite. Para saber mais, consulte nosso documento Tempo de vida.

Quando o TTL é excedido: mensagens descartadas
As mensagens que não puderem ser entregues dentro do TTL padrão ou personalizado serão descartadas.

Se você não receber um webhook de mensagens de status com status definido como delivered antes da expiração do TTL, presuma que a mensagem foi descartada.

Se você enviar uma mensagem e houver uma falha (mudança de status para failed), poderá ocorrer um atraso no recebimento do webhook. Por isso, é recomendável incorporar um buffer antes de presumir o descarte.

Solução de problemas
Se você está tendo problemas com a entrega de mensagens, consulte Mensagem não entregue.