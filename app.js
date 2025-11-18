// ==============================
//  LIGAR INPUTS DO HTML
// ==============================

// Estatísticas automáticas (listas)
const gmCasaAuto    = document.getElementById("gmCasaAuto");
const gsCasaAuto    = document.getElementById("gsCasaAuto");
const gmForaAuto    = document.getElementById("gmForaAuto");
const gsForaAuto    = document.getElementById("gsForaAuto");
const formaCasaAuto = document.getElementById("formaCasaAuto");
const formaForaAuto = document.getElementById("formaForaAuto");

// Odds
const odd1     = document.getElementById("odd1");
const oddX     = document.getElementById("oddX");
const odd2     = document.getElementById("odd2");
const odd1X    = document.getElementById("odd1X");
const oddX2    = document.getElementById("oddX2");
const odd12    = document.getElementById("odd12");
const oddOver  = document.getElementById("oddOver");
const oddUnder = document.getElementById("oddUnder");
const oddBTTS  = document.getElementById("oddBTTS");

// Resultado
const res = document.getElementById("res");

// ==============================
//  FUNÇÕES AUXILIARES
// ==============================

// "1,0,1,2,3" -> média de golos
function mediaGolos(str){
  if (!str) return 0;
  const arr = String(str)
    .split(",")
    .map(x => parseFloat(x.trim()))
    .filter(x => !isNaN(x));
  if (arr.length === 0) return 0;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

// "E,D,D,V,V" ou "1,1,0,0,0" -> forma (0–10 ou mais, mas vamos usar direto)
function calcForma(str){
  if (!str) return 0;

  const s = String(str).trim();

  // Caso V/E/D
  if (/[VvEeDd]/.test(s)) {
    return s
      .split(",")
      .map(r => r.trim().toUpperCase())
      .map(r => r === "V" ? 3 : r === "E" ? 1 : 0)
      .reduce((a,b)=>a+b,0);
  }

  // Caso numérico "1,1,0,0,0"
  const arr = s
    .split(",")
    .map(x => parseFloat(x.trim()))
    .filter(x => !isNaN(x));
  if (arr.length === 0) return 0;
  let soma = arr.reduce((a,b)=>a+b,0);
  if (soma < 0) soma = 0;
  return soma;
}

// Filtro para evitar EV e odds absurdos
function validoEV(nome, prob, odd, evValor){
  if (isNaN(prob) || isNaN(odd) || isNaN(evValor)) return false;
  if (odd <= 1 || odd > 20) return false;         // odds estranhas
  if (prob < 5 || prob > 95) return false;        // prob ridícula
  if (evValor > 200 || evValor < -200) return false; // EV muito fora
  return true;
}

// ==============================
//  FUNÇÃO PRINCIPAL
// ==============================
function calcular(){
  try {
    // ---------- 1. Ler listas e converter ----------
    const gmC = mediaGolos(gmCasaAuto.value);   // ex: "1,0,1,2,3"
    const gsC = mediaGolos(gsCasaAuto.value);   // ex: "1,2,2,0,0"
    const gmF = mediaGolos(gmForaAuto.value);   // ex: "1,4,1,3,2"
    const gsF = mediaGolos(gsForaAuto.value);   // ex: "3,3,1,3,0"

    const fC = calcForma(formaCasaAuto.value);  // ex: "E,D,D,V,V"
    const fF = calcForma(formaForaAuto.value);  // ex: "D,V,E,E,V"

    // ---------- 2. Probabilidades base ----------
    let base = probs(gmC, gsC, gmF, gsF);

    // Ajuste com forma
    base.casa += fC * 1.2;
    base.fora += fF * 1.2;

    // Normalizar 1X2 para somar ≈100
    const soma3 = base.casa + base.empate + base.fora;
    if (soma3 > 0) {
      base.casa   = base.casa   / soma3 * 100;
      base.empate = base.empate / soma3 * 100;
      base.fora   = base.fora   / soma3 * 100;
    }

    const ou = calcOU(base.lambdaC, base.lambdaF);
    const bt = calcBTTS(base.lambdaC, base.lambdaF);

    // ---------- 3. Odds ----------
    const odds = {
      casa:   +odd1.value,
      empate: +oddX.value,
      fora:   +odd2.value,
      o1X:    +odd1X.value,
      oX2:    +oddX2.value,
      o12:    +odd12.value,
      over:   +oddOver.value,
      under:  +oddUnder.value,
      btts:   +oddBTTS.value
    };

    // ---------- 4. EVs ----------
    const values = {
      casa:   ev(base.casa, odds.casa),
      empate: ev(base.empate, odds.empate),
      fora:   ev(base.fora, odds.fora),
      o1X:    ev(base.casa + base.empate, odds.o1X),
      oX2:    ev(base.empate + base.fora, odds.oX2),
      o12:    ev(base.casa + base.fora, odds.o12),
      over:   ev(ou.over, odds.over),
      under:  ev(ou.under, odds.under),
      btts:   ev(bt.btts, odds.btts)
    };

    // ---------- 5. Probabilidades e odds por mercado ----------
    const probsMercado = {
      casa:   base.casa,
      empate: base.empate,
      fora:   base.fora,
      o1X:    base.casa + base.empate,
      oX2:    base.empate + base.fora,
      o12:    base.casa + base.fora,
      over:   ou.over,
      under:  ou.under,
      btts:   bt.btts
    };

    const oddsMercado = {
      casa:   odds.casa,
      empate: odds.empate,
      fora:   odds.fora,
      o1X:    odds.o1X,
      oX2:    odds.oX2,
      o12:    odds.o12,
      over:   odds.over,
      under:  odds.under,
      btts:   odds.btts
    };

    // Lista de mercados com tudo junto
    let markets = Object.keys(values).map(nome => ({
      nome,
      prob: probsMercado[nome],
      odd:  oddsMercado[nome],
      ev:   values[nome]
    }));

    // ---------- 6. Filtrar mercados válidos ----------
    let validos = markets.filter(m =>
      validoEV(m.nome, m.prob, m.odd, m.ev)
    );

    // Se todos foram cortados, usa todos (fallback)
    if (validos.length === 0) {
      validos = markets;
    }

    // ---------- 7. Melhor, segura, extra ----------
    // Melhor = maior EV
    let melhor = [...validos].sort((a,b)=>b.ev - a.ev)[0];

    // Mais segura = maior probabilidade
    let segura = [...validos].sort((a,b)=>b.prob - a.prob)[0];

    // Sugestão extra = prob > 40% e EV > 0 e diferente da melhor
    let extra = validos
      .filter(m => m.prob > 40 && m.ev > 0 && m.nome !== melhor.nome)
      .sort((a,b)=>b.ev - a.ev)[0] || null;

    // ---------- 8. Resultado provável ----------
    const gCasaEst = (gmC + gsF) / 2;
    const gForaEst = (gmF + gsC) / 2;

    const gCasaR = Math.max(0, Math.round(gCasaEst));
    const gForaR = Math.max(0, Math.round(gForaEst));

    const resultadoProvavel = `${gCasaR} - ${gForaR}`;

    // ---------- 9. Output ----------
    res.innerHTML = `
      <h3>Probabilidades Reais</h3>
      Casa: ${base.casa.toFixed(1)}%<br>
      Empate: ${base.empate.toFixed(1)}%<br>
      Fora: ${base.fora.toFixed(1)}%<br><br>

      <h3>Over/Under</h3>
      Over 2.5: ${ou.over.toFixed(1)}%<br>
      Under 2.5: ${ou.under.toFixed(1)}%<br><br>

      <h3>BTTS</h3>
      Ambas marcam: ${bt.btts.toFixed(1)}%<br><br>

      <h3>Value Bets</h3>
      Casa: ${values.casa.toFixed(1)}%<br>
      Empate: ${values.empate.toFixed(1)}%<br>
      Fora: ${values.fora.toFixed(1)}%<br>
      1X: ${values.o1X.toFixed(1)}%<br>
      X2: ${values.oX2.toFixed(1)}%<br>
      12: ${values.o12.toFixed(1)}%<br>
      Over: ${values.over.toFixed(1)}%<br>
      Under: ${values.under.toFixed(1)}%<br>
      BTTS: ${values.btts.toFixed(1)}%<br><br>

      <h3>🔥 Melhor Aposta (Valor)</h3>
      ${melhor.nome.toUpperCase()} (EV ${melhor.ev.toFixed(1)}% / ${melhor.prob.toFixed(1)}%)<br><br>

      <h3>✅ Aposta Mais Segura</h3>
      ${segura.nome.toUpperCase()} (${segura.prob.toFixed(1)}% prob.)<br><br>

      <h3>📌 Sugestão Extra</h3>
      ${extra ? `${extra.nome.toUpperCase()} (EV ${extra.ev.toFixed(1)}% / ${extra.prob.toFixed(1)}%)` : "Nenhuma com boa probabilidade e EV positivo."}<br><br>

      <h3>🎯 Resultado Provável</h3>
      ${resultadoProvavel}<br>
    `;
  } catch (e) {
    console.error(e);
    res.innerHTML = "Erro ao calcular. Abre a consola (F12) e vê a mensagem de erro.";
  }
}
