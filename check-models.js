const https = require('https');

const options = {
  hostname: 'api.openai.com',
  path: '/v1/models',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const models = JSON.parse(data);
    const visionModels = models.data.filter(m => 
      m.id.includes('gpt-4') || m.id.includes('vision') || m.id.includes('o1')
    );
    console.log('Vision Models:', visionModels.map(m => m.id));
  });
});

req.end();
