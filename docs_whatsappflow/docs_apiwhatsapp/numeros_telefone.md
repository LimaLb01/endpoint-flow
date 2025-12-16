Números de telefone comerciais
Este documento descreve os números de telefone comerciais do WhatsApp, bem como os requisitos, as informações de gerenciamento e os recursos únicos relacionados.

Como registrar números de telefone comerciais
É preciso registrar um número de telefone comercial válido para enviar e receber mensagens via API de Nuvem. Os números registrados ainda funcionam ​para fins cotidianos, como ligações e mensagens de texto, mas não podem ser usados ​​com o WhatsApp Messenger ("WhatsApp").

Os números que já estiverem em uso no WhatsApp não poderão ser registrados, a menos que sejam excluídos primeiro. Para registrar um número que foi banido do WhatsApp, reative-o primeiro por meio do processo de apelação.

Após a conclusão das etapas descritas no nosso documento Introdução, um número de telefone comercial de teste será gerado e registrado para você automaticamente.

Requisitos de qualificação
Os números de telefone qualificados devem:

pertencer a você;
ter código do país e código de área (códigos curtos não são compatíveis);
poder receber chamadas de voz ou SMS;
o número deve ter recursos dimensionados
Para registrar um número 0800, consulte Registrar 0800 e números gratuitos.

Métodos de registro
Painel de Apps: conclua as etapas descritas no nosso documento Introdução. Depois, acesse o painel Painel de Apps > WhatsApp > Configuração da API para adicionar um número de telefone.
Meta Business Suite: você pode registrar um número de telefone comercial ao usar o Meta Business Suite para criar uma conta comercial do WhatsApp.
Gerenciador do WhatsApp: consulte o artigo Como conectar seu número de telefone à sua conta do WhatsApp Business na Central de Ajuda.
Cadastro incorporado: se você estiver trabalhando com um parceiro de soluções, ele fornecerá um link para o cadastro incorporado, que poderá ser usado para registrar um número.
Status
Os números de telefone comerciais têm um status, que reflete a classificação de qualidade e o limite de troca de mensagens. Esses números devem ter o status "conectado" para enviar e receber mensagens usando a API.

Como ver o status via Gerenciador do WhatsApp
O status atual do seu número de telefone comercial é exibido na coluna Status no painel Gerenciador do WhatsApp > Ferramentas da conta > Números de telefone.

Consulte o artigo Sobre a classificação por qualidade do seu número de telefone do WhatsApp Business para saber mais sobre as classificações de qualidade e o status que aparecem no Gerenciador do WhatsApp.

Como receber o status via API
Solicite o campo status na sua identificação de número de telefone comercial do WhatsApp. Consulte a referência GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID> para conferir uma lista de valores de status retornáveis ​​e os respectivos significados.

Solicitação de exemplo
curl 'https://graph.facebook.com/v24.0/106540352242922?fields=status' \
-H 'Authorization: Bearer EAAJB...'
Resposta de exemplo
{
  "status": "CONNECTED",
  "id": "106540352242922"
}
Nomes de exibição
Para registrar um número de telefone comercial, é preciso fornecer informações de nome de exibição. O nome de exibição aparece no perfil do WhatsApp do seu número de telefone comercial e também pode ser mostrado na parte superior de conversas individuais e na lista de conversas se determinadas condições forem atendidas. Consulte o documento Nomes de exibição para saber como funcionam os nomes de exibição.


Perfis empresariais
O perfil empresarial fornece informações adicionais sobre sua empresa, como endereço, site, descrição, entre outras. Você pode fornecer essas informações ao registrar o número de telefone comercial. Consulte o documento Perfis comerciais para saber como os perfis comerciais funcionam.


Status de conta comercial oficial
Os números de telefone comerciais podem receber o status de Conta Comercial Oficial ("OBA"). Os números de OBA têm uma marca de seleção azul ao lado do nome na visualização de contatos.


Consulte nosso documento sobre contas comerciais oficiais para saber como solicitar o status de OBA para um número de telefone comercial.

Confirmação em duas etapas
É preciso definir um PIN de confirmação em duas etapas ao registrar um número de telefone comercial. Você precisará desse código de identificação pessoal para alterar seu PIN ou excluir seu número de telefone da plataforma.

Como alterar seu PIN via Gerenciador do WhatsApp
Você precisará do código de identificação pessoal atual para alterar seu PIN via Gerenciador do WhatsApp. Para alterar seu PIN:

Acesse Gerenciador do WhatsApp > Ferramentas da conta > Números de telefone.
Selecione seu número de telefone comercial.
Clique na aba Confirmação em duas etapas.
Clique no botão Alterar PIN e complete o fluxo.
Caso você não tenha seu PIN, será possível alterá-lo usando a API.

Como alterar seu PIN via API
Use o ponto de extremidade POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID> para definir um novo PIN.

Solicitação de exemplo
curl 'https://graph.facebook.com/v24.0/106540352242922/' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "pin": "150954"
}'
Resposta de exemplo
Se a operação for bem-sucedida:

{
  "success": true
}
Como desabilitar a confirmação em duas etapas
Para desabilitar a confirmação em duas etapas usando o Gerenciador do WhatsApp, siga os passos para alterar seu PIN, mas clique no botão Desativar a confirmação em duas etapas ao final do processo. Um email com um link será enviado ao endereço de email associado ao portfólio empresarial. Use o link para desabilitar a confirmação em duas etapas. Depois disso, é possível reabilitar a configuração ao definir um novo PIN.

Não é possível desabilitar a confirmação em duas etapas usando a API.

0800 e números gratuitos
Talvez você queira registrar um 0800 ou outro número gratuito na plataforma. Porém, esses números normalmente têm um sistema de resposta interativa de voz (IVR, pelas iniciais em inglês) que não pode ser navegado por uma chamada de registro do WhatsApp. Esse tipo de número de telefone pode ser registrado, mas é necessário que ele aceite chamadas de números internacionais e redirecione o SMS ou a chamada de voz para um agente humano.

Veja as etapas para registrar números de telefone com sistema IVR:

O WhatsApp consegue compartilhar com você um ou dois números de telefone dos quais a ligação de registro será feita.
Crie uma lista de permissão para esses números. Caso você não consiga criar uma lista de permissão para esses números, adicione o número de telefone à sua WABA. Além disso, abra um tíquete no Suporte Direto para pedir os números da chamada de registro e inclua o número de telefone que você deseja registrar.
Redirecione a chamada de registro para um funcionário ou uma caixa de correio. Depois, acesse o código de registro.
Não há compatibilidade com números de telefone com sistema de resposta interativa de voz (IVR) que não podem receber chamadas de registro.

Limite de números registrados
Novos portfólios empresariais são limitados inicialmente a dois números de telefone comercial registrados.

Se a empresa for verificada ou você atingir o limite de mensagens de 2.000, aumentaremos automaticamente o limite para 20. Após o aumento, você receberá uma notificação do Meta Business Suite informando o novo limite e um webhook business_capability_update será disparado com max_phone_numbers_per_business definido como o novo limite.

Verificar números de telefone
É preciso verificar o número de telefone que você quer usar para enviar mensagens aos clientes. Os números de telefone devem ser verificados por meio de um código enviado por SMS ou ligação de voz. O processo de verificação pode ser feito a partir das chamadas da Graph API especificadas a seguir.

Para verificar um número de telefone usando a Graph API, faça uma solicitação POST a PHONE_NUMBER_ID/request_code. Na chamada, inclua o idioma e o método de verificação escolhido.

Ponto de extremidade	Autenticação
/PHONE_NUMBER_ID/request_code

Faça sua autenticação com um token de acesso de usuário do sistema.

Se você estiver solicitando o código em nome de outra empresa, o token de acesso precisa ter acesso avançado para a permissão whatsapp_business_management.

Parâmetros
Nome	Descrição
code_method

string

Obrigatório.

O método de verificação escolhido. Opções compatíveis:

SMS
VOICE
language

string

Obrigatório.

O código de dois caracteres do idioma. Por exemplo: "en".

Solicitação de exemplo
curl -X POST 'https://graph.facebook.com/v24.0/106540352242922/request_code?code_method=SMS&language=en_US' \
-H 'Authorization: Bearer EAAJB...'
Depois da chamada de API, você receberá o código de verificação por meio do método selecionado. Para concluir o processo de verificação, inclua o código em uma solicitação POST a PHONE_NUMBER_ID/verify_code.

Ponto de extremidade	Autenticação
/PHONE_NUMBER_ID/verify_code

Faça sua autenticação com um token de acesso de usuário do sistema.

Se você estiver solicitando o código em nome de outra empresa, o token de acesso precisa ter acesso avançado para a permissão whatsapp_business_management.

Parâmetros
Nome	Descrição
code

string numérica

Obrigatório.

O código recebido depois de fazer a chamada a FROM_PHONE_NUMBER_ID/request_code.

Exemplo
Exemplo de solicitação:

curl -X POST \
  'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/verify_code' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -F 'code=000000'
A resposta bem-sucedida é semelhante a esta:

{
  "success": true
}
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

Verificação de alteração de identidade
Podemos verificar a identidade de um cliente antes de enviarmos sua mensagem para ele. Para isso, habilite a verificação de alteração de identidade no seu número de telefone comercial.

Se o cliente realizar uma ação no WhatsApp que considerarmos uma alteração de identidade, geraremos um novo hash de identidade para ele. Com essa configuração habilitada, você poderá recuperar esse hash sempre que enviar uma mensagem ao cliente. Nesse caso, sempre que você receber ou enviar uma mensagem para um cliente sem um hash de identidade, incluiremos o hash dele nos webhooks de mensagem recebida ou status da mensagem. Assim, você pode capturar e armazenar esse hash para uso futuro.

Quando quiser usar o hash, inclua-o na solicitação de envio de mensagem. Compararemos o hash da solicitação com o atual do cliente. Se eles forem iguais, a mensagem será entregue. Caso haja incompatibilidade, isso significa que a identidade do cliente foi alterada depois do seu último contato com ele. Por isso, não entregaremos a mensagem. Nesse caso, enviaremos um webhook de status de mensagem com o código de erro 137000, notificando sobre a falha e a discrepância dos hashes.

Ao receber esse tipo de webhook, considere que o número de telefone do cliente deixou de ser confiável. Para reestabelecer a confiança, verifique a identidade do cliente por meio de outro canal que não seja o WhatsApp. Depois, reenvie a mensagem com falha para a nova identidade (se houver), sem um hash. Armazene, então, o novo hash do cliente incluído no webhook de status de entrega.

Sintaxe da solicitação
Envie uma solicitação POST ao ponto de extremidade WhatsApp Business Phone Number > Settings para habilitar ou desabilitar a verificação de alteração de identidade.

POST /<WHATSAPP_BUSINESS_PHONE_NUMBER>/settings

Corpo do post
{
  "user_identity_change" : {
    "enable_identity_key_check": <ENABLE_IDENTITY_KEY_CHECK>
}
Defina <ENABLE_IDENTITY_KEY_CHECK> como true para habilitar a verificação de identidade ou como false para desabilitá-la.

Exemplo de solicitação para habilitar a configuração
curl 'https://graph.facebook.com/v24.0/106850078877666/settings' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "user_identity_change": {
    "enable_identity_key_check": true
  }
}'
Exemplo de resposta a essa solicitação
{
  "success": true
}
Exemplo de envio de mensagem com verificação
Esta mensagem só seria entregue se o valor recipient_identity_key_hash correspondesse ao hash atual do cliente.

curl 'https://graph.facebook.com/v24.0/106850078877666/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "recipient_identity_key_hash": "DF2lS5v2W6x=",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Your latest statement is attached. See... "
  }
}'
Webhooks
Em webhooks de mensagens recebidas com o objeto contacts (como webhook de mensagens de texto), o hash do cliente é atribuído à propriedade identity_key_hash.

Em webhooks de mensagens enviadas (webhooks de mensagens de status), o hash do cliente é atribuído à propriedade recipient_identity_key_hash no objeto statuses.

Como consultar o nível da taxa de transferência
Use o ponto de extremidade Número de telefone do WhatsApp Business para consultar o nível da taxa de transferência atual de um número de telefone:

GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>?fields=throughput

Recuperar todos os números de telefone
Para receber uma lista de todos os números de telefone associados a uma conta do WhatsApp Business, envie uma solicitação GET para o ponto de extremidade de conta do WhatsApp Business > números de telefone.

Além disso, os números de telefone podem ser classificados em ordem crescente ou decrescente de acordo com o last_onboarded_time, que é baseado em quando o usuário concluiu a integração do cadastro incorporado. Se não for especificada, a ordem padrão será decrescente.

Sintaxe da solicitação
curl -X GET "https://graph.facebook.com/<API_VERSION>/<WABA_ID>/phone_numbers?access_token=<ACCESS_TOKEN>" 
Em caso de sucesso, um objeto JSON será retornado com uma lista de nomes, telefones, classificações de qualidade e IDs de telefones associados a uma empresa. Os resultados são exibidos por data de conclusão do cadastro incorporado em ordem decrescente, com a integração mais recente listada primeiro.

Resposta de exemplo
{
  "data": [
    {
      "verified_name": "Jasper's Market",
      "display_phone_number": "+1 631-555-5555",
      "id": "1906385232743451",
      "quality_rating": "GREEN"
      
    },
    {
      "verified_name": "Jasper's Ice Cream",
      "display_phone_number": "+1 631-555-5556",
      "id": "1913623884432103",
      "quality_rating": "NA"
    }
  ]
}
Sintaxe da solicitação
curl -X GET "https://graph.facebook.com/<API_VERSION>/<WABA_ID>/phone_numbers?access_token=&lt;SYSTEM_USER_ACCESS_TOKEN>]&amp;sort=['last_onboarded_time_ascending']" 
Resposta de exemplo
Em caso de sucesso, um objeto JSON será retornado com uma lista de nomes, telefones, classificações de qualidade e IDs de telefones associados a uma empresa. Os resultados são exibidos em ordem crescente com base em quando o usuário concluiu o cadastro incorporado, com a integração mais recente listada por último.

{
  "data": [
   {
      "verified_name": "Jasper's Ice Cream",
      "display_phone_number": "+1 631-555-5556",
      "id": "1913623884432103",
      "quality_rating": "NA"
    },
    {
      "verified_name": "Jasper's Market",
      "display_phone_number": "+1 631-555-5555",
      "id": "1906385232743451",
      "quality_rating": "GREEN"     
    }   
  ]
}
Filtrar números de telefone
Consulte e filtre números de telefone com base em account_mode. No momento, essa opção de filtragem está sendo testada no modo beta. Nem todos os desenvolvedores têm acesso ao recurso.

Parâmetros
Nome	Descrição
field

Valor: account_mode

operator

Valor: EQUAL

value

Valores:SANDBOX, LIVE

Sintaxe da solicitação
curl -i -X GET "https://graph.facebook.com/<API_VERSION>/<WABA_ID>/phone_numbers?filtering=[{"field":"account_mode","operator":"EQUAL","value":"SANDBOX"}]&access_token=<ACCESS_TOKEN> 
Resposta de exemplo
{
  "data": [
    {
      "id": "1972385232742141",    
      "display_phone_number": "+1 631-555-1111",
      "verified_name": "John’s Cake Shop",
      "quality_rating": "UNKNOWN",
    }
  ],
  "paging": {
	"cursors": {
		"before": "abcdefghij",
		"after": "klmnopqr"
	}
   }
}
Recuperar um número de telefone único
Para consultar informações sobre um número de telefone, envie uma solicitação GET ao ponto de extremidade de número de telefone do WhatsApp Business:

Sintaxe da solicitação
GET https://graph.facebook.com/<API_VERSION>/<PHONE_NUMBER_ID>
Exemplo de solicitação
curl \
'https://graph.facebook.com/v15.0/105954558954427/' \
-H 'Authorization: Bearer EAAFl...'
Em caso de sucesso, um objeto JSON é retornado com o nome, o número de telefone, o ID do telefone e as classificações de qualidade do número de telefone consultado.

{
  "code_verification_status" : "VERIFIED",
  "display_phone_number" : "15555555555",
  "id" : "105954558954427",
  "quality_rating" : "GREEN",
  "verified_name" : "Support Number"
}
Consultar status do nome de exibição (beta)
Inclua fields=name_status como um parâmetro da string de consulta para consultar o status do nome de exibição associado a um número de telefone específico. No momento, esse campo está na versão beta e não está disponível para todos os desenvolvedores.

Exemplo de solicitação
curl \
'https://graph.facebook.com/v15.0/105954558954427?fields=name_status' \
-H 'Authorization: Bearer EAAFl...'
Exemplo de resposta
{
  "id" : "105954558954427",
  "name_status" : "AVAILABLE_WITHOUT_REVIEW"
}
O valor name_status pode ser um dos seguintes:

APPROVED – o nome foi aprovado. Você já pode baixar o certificado.
AVAILABLE_WITHOUT_REVIEW – o certificado do telefone está disponível, e o nome de exibição está pronto para ser usado sem análise.
DECLINED – o nome não foi aprovado. Não é possível baixar o certificado.
EXPIRED – o certificado expirou e não é mais possível baixá-lo.
PENDING_REVIEW – a solicitação de nome está em análise. Não é possível baixar o certificado.
NONE – não há certificados disponíveis.
Os certificados têm validade de sete dias.

Como excluir números de telefone comerciais
Apenas os administradores do portfólio empresarial podem excluir números de telefone comerciais. Além disso, os números não poderão ser excluídos se tiverem sido usados para enviar mensagens pagas nos últimos 30 dias.

Como excluir números de telefone comerciais via Gerenciador do WhatsApp
Caso o número de telefone comercial tenha o status "Conectado", você precisará do seu PIN de confirmação em duas etapas para excluir o número.

Carregue seu portfólio empresarial no Gerenciador do WhatsApp.
Se o painel Números de telefone não carregar automaticamente, navegue até Ferramentas da conta (ícone de caixa de ferramentas) > Telefones.
Clique no ícone da lixeira do número de telefone e conclua o fluxo.
Caso o número tenha sido usado para enviar mensagens pagas nos últimos 30 dias, redirecionaremos você para o painel Insights, que mostra a data da última mensagem paga. A exclusão do número de telefone poderá ser feita 30 dias após a data listada.

Como excluir números de telefone comerciais via API
Não é possível excluir um número de telefone comercial via API.

Como migrar números de telefone comerciais
É possível migrar números de telefone de uma WABA para outra, bem como migrar um número da API Local para a API de Nuvem.

Componentes de conversa
Você pode habilitar componentes de interface do usuário para que os usuários do WhatsApp interajam por mensagem com sua empresa mais facilmente. Consulte Componentes de conversa.