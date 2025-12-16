# 🚀 Configuração do MCP Render

## O que é o MCP Render?

O **MCP (Model Context Protocol) Render** é um servidor MCP que permite interagir com a plataforma Render.com através do protocolo MCP, oferecendo capacidades como:

### 📋 Funcionalidades Principais:

1. **Gerenciamento de Serviços**
   - Listar serviços (web services, background workers, etc.)
   - Criar novos serviços
   - Atualizar configurações de serviços
   - Deletar serviços

2. **Gerenciamento de Deploys**
   - Ver status de deploys
   - Triggerar novos deploys
   - Ver logs de deploys
   - Rollback de deploys

3. **Gerenciamento de Variáveis de Ambiente**
   - Listar variáveis de ambiente
   - Adicionar/atualizar variáveis
   - Deletar variáveis

4. **Monitoramento**
   - Ver logs em tempo real
   - Ver métricas de uso
   - Ver status de saúde dos serviços

5. **Gerenciamento de Domínios**
   - Listar domínios customizados
   - Adicionar/remover domínios

## 🔧 Como Configurar no Cursor

### Opção 1: Configuração via Interface do Cursor

1. Abra as configurações do Cursor
2. Vá em **Settings** → **Features** → **MCP Servers**
3. Adicione a seguinte configuração:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer rnd_ERaKoCTU6uDtRgv4obLxDtupuvwJ"
      }
    }
  }
}
```

### Opção 2: Arquivo de Configuração (se suportado)

Crie um arquivo `.cursor/mcp.json` ou adicione ao arquivo de configuração do Cursor.

## 🔑 Como Obter a API Key

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Vá em **Account Settings** → **API Keys**
3. Crie uma nova API Key ou use a existente
4. Copie a chave (formato: `rnd_...`)

## 💡 Casos de Uso para o Projeto

### 1. **Deploy Automatizado**
   - Fazer deploy automático após push no GitHub
   - Verificar status do deploy
   - Rollback em caso de erro

### 2. **Gerenciamento de Variáveis de Ambiente**
   - Atualizar variáveis de ambiente via código
   - Sincronizar variáveis entre ambientes
   - Validar configurações antes do deploy

### 3. **Monitoramento e Logs**
   - Ver logs em tempo real durante testes
   - Monitorar saúde do serviço
   - Alertas automáticos em caso de problemas

### 4. **CI/CD Integrado**
   - Integrar com pipelines de CI/CD
   - Deploy condicional baseado em testes
   - Gerenciamento de múltiplos ambientes

## 📚 Recursos Adicionais

- [Documentação Render API](https://render.com/docs/api)
- [Documentação MCP](https://modelcontextprotocol.io/)

## ⚠️ Segurança

- **NUNCA** commite a API Key no Git
- Use variáveis de ambiente para armazenar a chave
- Rotacione a chave periodicamente
- Use permissões mínimas necessárias

## 🔄 Próximos Passos

Após configurar o MCP Render, você poderá:

1. ✅ Fazer deploys automatizados
2. ✅ Gerenciar variáveis de ambiente via código
3. ✅ Monitorar logs e métricas
4. ✅ Automatizar tarefas de infraestrutura

