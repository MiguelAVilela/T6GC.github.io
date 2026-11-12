// Mesmo tópico configurado no código do ESP32
const MQTT_TOPIC = "miguelavilela/t6gc/temperatura";
// Conexão WebSocket Segura (WSS) exigida pelo HTTPS do GitHub Pages
const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";

const elTempAtual = document.getElementById("temp-atual");
const elTempMin = document.getElementById("temp-min");
const elTempMax = document.getElementById("temp-max");
const elTimestamp = document.getElementById("ultima-atualizacao");
const elStatusBadge = document.getElementById("status-badge");
const elStatusTexto = document.getElementById("status-texto");
const elHistorico = document.getElementById("lista-historico");

let tempMinima = null;
let tempMaxima = null;

// Conecta ao broker MQTT
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

    if (isNaN(temp)) return;

    atualizarInterface(temp);
  } catch (erro) {
    console.error("Erro ao ler mensagem MQTT:", erro);
  }
});

function atualizarInterface(temp) {
  const agora = new Date().toLocaleTimeString("pt-BR");

  // Atualiza valor principal
  elTempAtual.textContent = temp.toFixed(1);
  elTimestamp.textContent = `Última atualização às ${agora}`;

  // Muda a cor conforme a faixa térmica
  if (temp >= 32) {
    elTempAtual.style.color = "#ef4444"; // Quente (vermelho)
  } else if (temp <= 18) {
    elTempAtual.style.color = "#38bdf8"; // Frio (azul)
  } else {
    elTempAtual.style.color = "#22c55e"; // Amena (verde)
  }

  // Atualiza mínima e máxima
  if (tempMinima === null || temp < tempMinima) {
    tempMinima = temp;
    elTempMin.textContent = `${tempMinima.toFixed(1)} °C`;
  }
  if (tempMaxima === null || temp > tempMaxima) {
    tempMaxima = temp;
    elTempMax.textContent = `${tempMaxima.toFixed(1)} °C`;
  }

  // Adiciona ao histórico (mantém os 10 mais recentes)
  const item = document.createElement("li");
  item.innerHTML = `<span>${agora}</span><strong>${temp.toFixed(1)} °C</strong>`;
  elHistorico.prepend(item);

  if (elHistorico.children.length > 10) {
    elHistorico.removeChild(elHistorico.lastChild);
  }
}
