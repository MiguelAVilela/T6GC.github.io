// Mesmo tópico configurado no código do ESP32
const MQTT_TOPIC = "miguelavilela/t6gc/clima";
const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";

const elTempAtual = document.getElementById("temp-atual");
const elTempMin = document.getElementById("temp-min");
const elTempMax = document.getElementById("temp-max");

const elUmidAtual = document.getElementById("umid-atual");
const elUmidMin = document.getElementById("umid-min");
const elUmidMax = document.getElementById("umid-max");

const elTimestamp = document.getElementById("ultima-atualizacao");
const elStatusBadge = document.getElementById("status-badge");
const elStatusTexto = document.getElementById("status-texto");
const elHistorico = document.getElementById("lista-historico");

let tempMinima = null;
let tempMaxima = null;
let umidMinima = null;
let umidMaxima = null;

const client = mqtt.connect(BROKER_URL, {
  clientId: "WebClient-" + Math.random().toString(16).substring(2, 10),
  clean: true,
  reconnectPeriod: 3000
});

client.on("connect", () => {
  elStatusBadge.className = "status conectado";
  elStatusTexto.textContent = "Conectado em tempo real";
  client.subscribe(MQTT_TOPIC);
});

client.on("reconnect", () => {
  elStatusBadge.className = "status desconectado";
  elStatusTexto.textContent = "Reconectando...";
});

client.on("offline", () => {
  elStatusBadge.className = "status desconectado";
  elStatusTexto.textContent = "Desconectado";
});

client.on("message", (topic, message) => {
  if (topic !== MQTT_TOPIC) return;

  try {
    const dados = JSON.parse(message.toString());
    const temp = parseFloat(dados.temperatura);
    const umid = parseFloat(dados.umidade);

    if (isNaN(temp) || isNaN(umid)) return;

    atualizarInterface(temp, umid);
  } catch (erro) {
    console.error("Erro ao ler mensagem MQTT:", erro);
  }
});

function atualizarInterface(temp, umid) {
  const agora = new Date().toLocaleTimeString("pt-BR");

  // Atualiza valores principais
  elTempAtual.textContent = temp.toFixed(1);
  elUmidAtual.textContent = umid.toFixed(1);
  elTimestamp.textContent = `Última atualização às ${agora}`;

  // Cor dinâmica da temperatura
  if (temp >= 32) {
    elTempAtual.style.color = "#ef4444"; // Quente
  } else if (temp <= 18) {
    elTempAtual.style.color = "#38bdf8"; // Frio
  } else {
    elTempAtual.style.color = "#22c55e"; // Amena
  }

  // Atualiza mínimas e máximas de temperatura
  if (tempMinima === null || temp < tempMinima) {
    tempMinima = temp;
    elTempMin.textContent = tempMinima.toFixed(1);
  }
  if (tempMaxima === null || temp > tempMaxima) {
    tempMaxima = temp;
    elTempMax.textContent = tempMaxima.toFixed(1);
  }

  // Atualiza mínimas e máximas de umidade
  if (umidMinima === null || umid < umidMinima) {
    umidMinima = umid;
    elUmidMin.textContent = umidMinima.toFixed(1);
  }
  if (umidMaxima === null || umid > umidMaxima) {
    umidMaxima = umid;
    elUmidMax.textContent = umidMaxima.toFixed(1);
  }

  // Adiciona ao histórico (mantém os 10 mais recentes)
  const item = document.createElement("li");
  item.innerHTML = `
    <span>${agora}</span>
    <div class="hist-valores">
      <span class="hist-temp">${temp.toFixed(1)} °C</span>
      <span class="hist-umid">${umid.toFixed(1)} %</span>
    </div>
  `;
  elHistorico.prepend(item);

  if (elHistorico.children.length > 10) {
    elHistorico.removeChild(elHistorico.lastChild);
  }
}
