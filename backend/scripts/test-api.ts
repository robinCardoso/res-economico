import axios from 'axios';

async function testLogin() {
  try {
    console.log('\n🔍 Testando API de login...\n');
    
    const response = await axios.post('http://localhost:3000/auth/login', {
      email: 'administrativo@redeuniaonacional.com.br',
      password: 'Pcs775595',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Login bem-sucedido!');
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.error('❌ Erro na resposta:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('❌ Erro de conexão - Backend não está respondendo');
      console.error('   Verifique se o backend está rodando em http://localhost:3000');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testLogin();

