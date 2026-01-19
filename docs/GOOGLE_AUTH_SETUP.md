# Configuração de Login com Google no Supabase

O erro `Unsupported provider: provider is not enabled` ocorre porque o provedor de autenticação "Google" não foi ativado no painel do seu projeto Supabase.

Siga os passos abaixo para configurar:

## 1. Obter Credenciais no Google Cloud Platform (GCP)
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto (ou selecione um existente).
3. Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
   - Selecione "Externo" e preencha os dados obrigatórios (Nome do App, E-mail de suporte, etc).
4. Vá em **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
   - Tipo de aplicativo: **Aplicação Web**.
   - Nome: `Digital Mixologist` (ou o que preferir).
   - **Origens JavaScript autorizadas**: 
     - Adicione `http://localhost:5173` (para testes locais).
     - Adicione a URL do seu site em produção (ex: `https://seu-projeto.vercel.app`).
   - **User de redirecionamento autorizados**:
     - Você precisará da URL do Supabase. Ela é: `https://noczwifnspociazpxtfh.supabase.co/auth/v1/callback`
5. Clique em Criar e copie o **ID do Cliente** e a **Chave Secreta do Cliente**.

## 2. Ativar no Supabase
1. Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2. No menu lateral, vá em **Authentication** > **Providers**.
3. Encontre o **Google** na lista e clique para expandir.
4. Ative a opção **Enable Google**.
5. Cole o **Client ID** e o **Client Secret** que você gerou no passo anterior.
6. Clique em **Save**.

## 3. Testar
Após salvar, volte para a aplicação local (`http://localhost:5173`), recarregue a página e tente clicar no botão "Google" novamente. O erro deve desaparecer e você será redirecionado para a tela de login do Google.
