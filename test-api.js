async function runApiTests() {
  const baseUrl = 'http://localhost:3000';
  
  // 1. Create a user to get a token
  const tempEmail = `test_event_${Date.now()}@example.com`;
  console.log('--- Registering temporary user ---');
  await fetch(`${baseUrl}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Event Tester',
      email: tempEmail,
      senha: 'testpassword123'
    })
  });

  // 2. Login to get token
  console.log('--- Logging in ---');
  const loginRes = await fetch(`${baseUrl}/api/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tempEmail,
      senha: 'testpassword123'
    })
  });
  const loginBody = await loginRes.json();
  const token = loginBody.token;
  console.log('Token received:', token ? 'YES' : 'NO');
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `norte_eventos_token=${token}`
  };

  // 3. Test GET /api/eventos (should be empty initially)
  console.log('\nTesting GET /api/eventos:');
  let getRes = await fetch(`${baseUrl}/api/eventos`, { headers });
  let getBody = await getRes.json();
  console.log('Status:', getRes.status, '| Initial Events:', getBody);

  // 4. Test POST /api/eventos
  console.log('\nTesting POST /api/eventos:');
  const postRes = await fetch(`${baseUrl}/api/eventos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nome: 'Teste Evento API',
      categoria: 'Tecnologia',
      capacidade: 100,
      data: '2026-10-10',
      hora: '14:00',
      local: 'Online',
      descricao: 'Teste backend',
      bannerClass: 'event-card-gradient-2',
      inscritos: 10
    })
  });
  const postBody = await postRes.json();
  console.log('Status:', postRes.status, '| Created Event:', postBody);
  const eventId = postBody.evento?.id;

  // 5. Test PUT /api/eventos/:id
  if (eventId) {
    console.log(`\nTesting PUT /api/eventos/${eventId}:`);
    const putRes = await fetch(`${baseUrl}/api/eventos/${eventId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        nome: 'Teste Evento API Atualizado',
        categoria: 'Cultura',
        capacidade: 200,
        data: '2026-11-11',
        hora: '15:00',
        local: 'Fisico',
        descricao: 'Teste backend atualizado',
        bannerClass: 'event-card-gradient-3'
      })
    });
    const putBody = await putRes.json();
    console.log('Status:', putRes.status, '| Update Response:', putBody);
  }

  // 6. Test GET /api/eventos again
  console.log('\nTesting GET /api/eventos (After Update):');
  getRes = await fetch(`${baseUrl}/api/eventos`, { headers });
  getBody = await getRes.json();
  console.log('Status:', getRes.status, '| Current Events:', getBody);

  // 7. Test DELETE /api/eventos/:id
  if (eventId) {
    console.log(`\nTesting DELETE /api/eventos/${eventId}:`);
    const delRes = await fetch(`${baseUrl}/api/eventos/${eventId}`, {
      method: 'DELETE',
      headers
    });
    const delBody = await delRes.json();
    console.log('Status:', delRes.status, '| Delete Response:', delBody);
  }
}

runApiTests();
