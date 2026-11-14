const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
const PREFIXO = 'miguelavilela/t6gc';

const estados = {
  ventoinha: false,
  lampada: false,
  bomba: false
};

console.log('Iniciando conexão com o broker:', BROKER_URL);

const client = mqtt.connect(BROKER_URL, {
  clientId: 'web_t6gc_' + Math.random().toString(16).substring(2, 10),
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 10000
});

client.on('connect', () => {
  console.log('Conectado ao Broker MQTT com sucesso!');
  document.getElementById('dot-broker').classList.add('online');
  document.getElementById('txt-broker').textContent = 'Broker Conectado';

  client.subscribe(`${PREFIXO}/sensores`);
  client.subscribe(`${PREFIXO}/status`);
  client.subscribe(`${PREFIXO}/ventoinha/state`);
  client.subscribe(`${PREFIXO}/lampada/state`);
  client.subscribe(`${PREFIXO}/bomba/state`);
});

client.on('error', (err) => {
  console.error('Erro na conexão MQTT:', err);
  document.getElementById('txt-broker').textContent = 'Erro no Broker';
});

client.on('close', () => {
  console.warn('Conexão MQTT fechada.');
  document.getElementById('dot-broker').classList.remove('online');
  document.getElementById('txt-broker').textContent = 'Reconectando...';
});

client.on('message', (topic, message) => {
  const payload = message.toString();

  if (topic === `${PREFIXO}/sensores`) {
    try {
      const dados = JSON.parse(payload);
      document.getElementById('valor-temp').textContent = `${dados.temperatura.toFixed(1)} °C`;
      document.getElementById('valor-umid').textContent = `${dados.umidade.toFixed(1)} %`;
      const hora = new Date().toLocaleTimeString('pt-BR');
      document.getElementById('ultima-atualizacao').textContent = `Última leitura às ${hora}`;
    } catch (e) {
      console.error('Erro ao ler JSON dos sensores:', e);
    }
  } 
  else if (topic === `${PREFIXO}/status`) {
    const online = payload === 'online';
    const dot = document.getElementById('dot-esp');
    const txt = document.getElementById('txt-esp');
    dot.classList.toggle('online', online);
    txt.textContent = online ? 'ESP32 Online' : 'ESP32 Offline';
  } 
  else if (topic.endsWith('/state')) {
    const partes = topic.split('/');
    const dispositivo = partes[partes.length - 2];
    if (dispositivo in estados) {
      atualizarInterface(dispositivo, payload === 'ON');
    }
  }
});

function atualizarInterface(dispositivo, ligado) {
  estados[dispositivo] = ligado;

  const card = document.getElementById(`card-${dispositivo}`);
  const status = document.getElementById(`status-${dispositivo}`);
  const btn = document.getElementById(`btn-${dispositivo}`);

  card.classList.toggle('ativo', ligado);
  status.textContent = ligado ? 'Ligada' : 'Desligada';
  btn.textContent = ligado ? 'Desligar' : 'Ligar';
  btn.classList.toggle('ligado', ligado);
}

function alternarDispositivo(dispositivo) {
  const novoEstado = !estados[dispositivo];
  const comando = novoEstado ? 'ON' : 'OFF';

  client.publish(`${PREFIXO}/${dispositivo}/set`, comando);
  atualizarInterface(dispositivo, novoEstado);
}

document.querySelectorAll('button[data-dispositivo]').forEach((botao) => {
  botao.addEventListener('click', () => {
    const dispositivo = botao.getAttribute('data-dispositivo');
    alternarDispositivo(dispositivo);
  });
});
