Mensagens de áudio
É possível usar a API de Nuvem para enviar mensagens de voz e mensagens de áudio básicas.

Mensagens de voz
Uma mensagem de voz (também chamada de recado de voz, mensagem de áudio ou apenas áudio) é uma gravação de uma ou mais pessoas falando e pode incluir sons de fundo, como música. As mensagens de voz incluem recursos como download automático, foto do perfil e ícone de voz, que não estão disponíveis em mensagens de áudio básicas. Se o usuário tiver definido a transcrição de mensagem de voz como Automática, uma transcrição de texto da mensagem também será incluída.


As mensagens de voz exigem arquivos .ogg codificados com o codec OPUS. Caso você envie um tipo de arquivo diferente ou um arquivo codificado com um codec diferente, a transcrição da mensagem de voz falhará.
O ícone de reprodução só aparecerá se o arquivo tiver 512 KB ou menos. Caso contrário, ele será substituído por um ícone de download (uma seta voltada para baixo).
A imagem do perfil da empresa é usada como imagem do perfil, acompanhada por um ícone de microfone.
As transcrições de voz aparecem somente se o usuário tiver habilitado a opção Transcrição automática de mensagens de voz. Se o usuário tiver definido essa opção como Manual, o texto "Transcrever" aparecerá e o texto transcrito será exibido ao tocar nessa opção. Se o usuário tiver definido a transcrição de mensagens de voz como Nunca, nenhuma transcrição será exibida.
Mensagens de áudio básicas
As mensagens de áudio básicas exibem um ícone de download e um ícone de música. Quando o usuário do WhatsApp toca no ícone de reprodução, ele precisa baixar manualmente a mensagem de áudio para que o cliente do WhatsApp carregue e reproduza o arquivo.


O ícone de download será substituído por um ícone de reprodução se o usuário do WhatsApp tiver ativado o download automático de mídias de áudio e se as condições para o download automático forem atendidas (por exemplo, o aparelho estiver conectado a uma rede Wi-Fi).
Se você enviar um arquivo .ogg codificado com o código OPUS como uma mensagem de áudio básica, o ícone de música será substituído por um ícone de microfone. Além disso, se o usuário tiver habilitado a transcrição de mensagens de vozAutomática ou Manual, um texto de transcrição ou o texto "Transcrever" acompanhará a mensagem.
Sintaxe da solicitação
Use o ponto de extremidade POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages para enviar uma mensagem de áudio a um usuário do WhatsApp.

curl 'https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages' \ -H 'Content-Type: application/json' \ -H 'Authorization: Bearer <ACCESS_TOKEN>' \ -d ' { "messaging_product": "whatsapp", "recipient_type": "individual", "to": "<WHATSAPP_USER_PHONE_NUMBER>", "type": "audio", "audio": { "id": "<MEDIA_ID>", <!-- Only if using uploaded media --> "link": "<MEDIA_URL>", <!-- Only if using hosted media (not recommended) --> "voice": <IS_VOICE?> <!-- Only include if sending voice message --> } }' 
Parâmetros de solicitação
Espaço reservado	Descrição	Valor de exemplo
<ACCESS_TOKEN>

String

Required.

System token or business token.

EAAAN6tcBzAUBOZC82CW7iR2LiaZBwUHS4Y7FDtQxRUPy1PHZClDGZBZCgWdrTisgMjpFKiZAi1FBBQNO2IqZBAzdZAA16lmUs0XgRcCf6z1LLxQCgLXDEpg80d41UZBt1FKJZCqJFcTYXJvSMeHLvOdZwFyZBrV9ZPHZASSqxDZBUZASyFdzjiy2A1sippEsF4DVV5W2IlkOSr2LrMLuYoNMYBy8xQczzOKDOMccqHEZD

<API_VERSION>

String

Optional.

Graph API version.

v24.0
<IS_VOICE?>

Booliano

Opcional.

Defina como true se estiver enviando uma mensagem de voz. As mensagens de voz devem ser arquivos Ogg codificados com o codec OPUS.

Para enviar uma mensagem de áudio básica, defina como false ou omita totalmente.

true

<MEDIA_ID>

String

Required if using uploaded media, otherwise omit.

ID of the uploaded media asset.

1013859600285441

<MEDIA_URL>

String

Required if using hosted media, otherwise omit.

URL of the media asset hosted on your public server. For better performance, we recommend using id and an uploaded media asset ID instead.

https://www.luckyshrub.com/media/ringtones/wind-chime.mp3

<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>

String

Required.

WhatsApp business phone number ID.

106540352242922

<WHATSAPP_USER_PHONE_NUMBER>

String

Required.

WhatsApp user phone number.

+16505551234

Formatos de áudio compatíveis
Audio Type	Extension	MIME Type	Max Size
AAC

.aac

audio/aac

16 MB

AMR

.amr

audio/amr

16 MB

MP3

.mp3

audio/mpeg

16 MB

MP4 Audio

.m4a

audio/mp4

16 MB

OGG Audio

.ogg

audio/ogg (OPUS codecs only; base audio/ogg not supported; mono input only)

16 MB

Os erros mais comuns associados a arquivos de áudio são tipos MIME incompatíveis (o tipo MIME não corresponde ao tipo de arquivo indicado pelo nome do arquivo) e codificação inválida para arquivos Ogg (somente codec OPUS). Caso ocorra um erro ao enviar uma mensagem com um arquivo de mídia, verifique se o tipo MIME real do arquivo de áudio corresponde ao tipo listado acima. Para arquivos Ogg, certifique-se de codificar com o codec OPUS.

Exemplo de solicitação
Exemplo de solicitação para enviar uma mensagem de imagem usando uma identificação de mídia carregada e uma legenda.

curl 'https://graph.facebook.com/v24.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "type": "audio",
  "audio": {
    "id" : "1013859600285441",
    "voice": true
  }
}'
Exemplo de resposta
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+16505551234",
      "wa_id": "16505551234"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3NEYxMzAzMzQ5MkEA"
    }
  ]
}