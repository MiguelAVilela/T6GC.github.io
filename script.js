const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
const PREFIXO = 'miguelavilela/t6gc';

let modoAutomatico = true;
const estados = {
  ventoinha: false,
  lampada: false,
  bomba: false,
  peltier: 'OFF' // 'OFF', 'HEAT' ou 'COOL'
};

const client = mqtt.connect(BROKER_URL, {
  clientId: 'web_t6gc_' + Math.random().toString(16).substring(2, 10),
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 10000
});

client.on('connect', () => {
  document.getElementById('dot-broker').classList.add('online');
  document.getElementById('txt-broker').textContent = 'Broker Conectado';

  client.subscribe(`${PREFIXO}/sensores`);
  client.subscribe(`${PREFIXO}/status`);
  client.subscribe(`${PREFIXO}/modo/state`);
  client.subscribe(`${PREFIXO}/estufa/status`);
  client.subscribe(`${PREFIXO}/ventoinha/state`);
  client.subscribe(`${PREFIXO}/lampada/state`);
  client.subscribe(`${PREFIXO}/bomba/state`);
  client.subscribe(`${PREFIXO}/peltier/state`);
});

client.on('error', (err) => {
  console.error('Erro na conexão MQTT:', err);
  document.getElementById('txt-broker').textContent = 'Erro no Broker';
});

client.on('close', () => {
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
    document.getElementById('dot-esp').classList.toggle('online', online);
    document.getElementById('txt-esp').textContent = online ? 'ESP32 Online' : 'ESP32 Offline';
  }
  else if (topic === `${PREFIXO}/modo/state`) {
    modoAutomatico = (payload === 'AUTO');
    const btnModo = document.getElementById('btn-modo');
    btnModo.textContent = modoAutomatico ? 'Modo: Automático' : 'Modo: Manual';
    btnModo.classList.toggle('manual', !modoAutomatico);
  }
  else if (topic === `${PREFIXO}/estufa/status`) {
    document.getElementById('status-estufa').textContent = payload;
  }
  else if (topic === `${PREFIXO}/peltier/state`) {
    atualizarInterfacePeltier(payload);
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

function atualizarInterfacePeltier(modo) {
  estados.peltier = modo;
  const card = document.getElementById('card-peltier');
  const status = document.getElementById('status-peltier');
  const btnHeat = document.getElementById('btn-peltier-heat');
  const btnCool = document.getElementById('btn-peltier-cool');

  card.classList.toggle('ativo', modo !== 'OFF');
  btnHeat.classList.toggle('ligado', modo === 'HEAT');
  btnCool.classList.toggle('ligado', modo === 'COOL');

  if (modo === 'HEAT') {
    status.textContent = 'Esquentando';
  } else if (modo === 'COOL') {
    status.textContent = 'Esfriando';
  } else {
    status.textContent = 'Desligada';
  }
}

// Alternar Modo Automático / Manual
document.getElementById('btn-modo').addEventListener('click', () => {
  const novoModo = modoAutomatico ? 'MANUAL' : 'AUTO';
  client.publish(`${PREFIXO}/modo/set`, novoModo);
});

// Botões dos dispositivos simples
document.querySelectorAll('button[data-dispositivo]').forEach((botao) => {
  botao.addEventListener('click', () => {
    const dispositivo = botao.getAttribute('data-dispositivo');
    const novoEstado = !estados[dispositivo];
    const comando = novoEstado ? 'ON' : 'OFF';

    client.publish(`${PREFIXO}/${dispositivo}/set`, comando);
    atualizarInterface(dispositivo, novoEstado);
  });
});

// Botões dos 2 sentidos da Peltier
document.querySelectorAll('button[data-peltier]').forEach((botao) => {
  botao.addEventListener('click', () => {
    const modo = botao.getAttribute('data-peltier');
    client.publish(`${PREFIXO}/peltier/set`, modo);
    atualizarInterfacePeltier(modo);
  });
});
