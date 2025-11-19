// =======================
//  FUNÇÕES AUXILIARES
// =======================

// Converte string "2,1,2,0,0" em média de golos
function mediaGolos(str) {
  if (!str) return 0;
  const nums = str
    .split(/[,\.; ]+/)
    .map(n => n.trim())
    .filter(n => n !== "")
    .map(Number)
    .filter(n => !isNaN(n));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Converte forma "V,E,D,V,V" em pontos 0-10
function calcForma(str) {
  if (!str) return 0;
  const pts = str
    .split(/[,\.; ]+/)
    .map(s => s.trim().toUpperCase())
    .filter(s => s !== "")
    .map(r => (r === "V" ? 3 : r === "E" ? 1 : 0));
  const total = pts.reduce((a, b) => a + b, 0);
  return Math.min(10, total); // cap a 10
}

// Pequeno “clamp” para probabilidades
function clampProb(x) {
  return Math.max(0, Math.min(100, x));
}

// Traduz chave interna para nome bonito
const labelMercado = {
  casa: "1",
  empate: "X",
  fora: "2",
  o1X: "1X",
  oX2: "X2",
  o12: "12",
  over25: "Over 2.5",
  under25: "Under 2.5",
  btts: "BTTS"
};

// =======================
//  FUNÇÃO PRINCIPAL
// =======================
function calcular() {
  try {
    // ---------- Ler inputs automáticos ----------
    const gmC = mediaGolos(gmCasaAuto.value);
    const gsC = mediaGolos(gsCasaAuto.value);
    const gmF = mediaGolos(gmForaAuto.value);
    const gsF = mediaGolos(gsForaAuto.value);

    const fC = calcForma(formaCasaAuto.value);
    const fF = calcForma(formaForaAuto.value);

    // ---------- Probabilidades base (Poisson / lógica antiga) ----------
    let base = probs(gmC, gsC, gmF, gsF); // vem do teu logic.js

    // Ajuste pela forma (bónus simples)
    base.casa = clampProb(base.casa + fC * 1.2);
    base.fora = clampProb(base.fora + fF * 1.2);

    // Re-normalizar para não passar dos 100%
    const somaCFX = base.casa + base.empate + base.fora;
    if (somaCFX > 0) {
      base.casa = (base.casa / somaCFX) * 100;
      base.empate = (base.empate / somaCFX) * 100;
      base.fora = (base.fora / somaCFX) * 100;
    }

    // Over/Under + BTTS (markets.js)
    const ou = calcOU(base.lambdaC, base.lambdaF);
    const bt = calcBTTS(base.lambdaC, base.lambdaF);

    // ---------- Odds ----------
    const odds = {
      casa: +odd1.value || 0,
      empate: +oddX.value || 0,
      fora: +odd2.value || 0,
      o1X: +odd1X.value || 0,
      oX2: +oddX2.value || 0,
      o12: +odd12.value || 0,
      over: +oddOver.value || 0,
      under: +oddUnder.value || 0,
      btts: +oddBTTS.value || 0
    };

    // ---------- EV básicos ----------
    const values = {
      casa: ev(base.casa, odds.casa),
      empate: ev(base.empate, odds.empate),
      fora: ev(base.fora, odds.fora),
      o1X: ev(base.casa + base.empate, odds.o1X),
      oX2: ev(base.empate + base.fora, odds.oX2),
      o12: ev(base.casa + base.fora, odds.o12),
      over25: ev(ou.over, odds.over),
      under25: ev(ou.under, odds.under),
      btts: ev(bt.btts, odds.btts)
    };

    // ---------- Construir mercados para ranking ----------
    const mercados = [
      {
        key: "casa",
        nome: "1",
        prob: base.casa,
        odd: odds.casa,
        ev: values.casa
      },
      {
        key: "empate",
        nome: "X",
        prob: base.empate,
        odd: odds.empate,
        ev: values.empate
      },
      {
        key: "fora",
        nome: "2",
        prob: base.fora,
        odd: odds.fora,
        ev: values.fora
      },
      {
        key: "o1X",
        nome: "1X",
        prob: clampProb(base.casa + base.empate),
        odd: odds.o1X,
        ev: values.o1X
      },
      {
        key: "oX2",
        nome: "X2",
        prob: clampProb(base.empate + base.fora),
        odd: odds.oX2,
        ev: values.oX2
      },
      {
        key: "o12",
        nome: "12",
        prob: clampProb(base.casa + base.fora),
        odd: odds.o12,
        ev: values.o12
      },
      {
        key: "over25",
        nome: "Over 2.5",
        prob: clampProb(ou.over),
        odd: odds.over,
        ev: values.over25
      },
      {
        key: "under25",
        nome: "Under 2.5",
        prob: clampProb(ou.under),
        odd: odds.under,
        ev: values.under25
      },
      {
        key: "btts",
        nome: "BTTS",
        prob: clampProb(bt.btts),
        odd: odds.btts,
        ev: values.btts
      }
    ];

    // ---------- Filtro de mercados “reais” ----------
    const mercadosValidos = mercados.filter(m => {
      if (!m.odd || m.odd <= 1) return false;  // odd inválida
      if (m.odd > 30) return false;            // odds absurdas
      if (m.prob < 5) return false;            // prob muito baixa
      return true;
    });

    if (!mercadosValidos.length) {
      res.innerHTML = "Nenhum mercado válido. Verifica as odds.";
      return;
    }

    // Melhor Aposta = maior EV
    const melhor = [...mercadosValidos].sort((a, b) => b.ev - a.ev)[0];

    // Aposta Mais Segura = maior probabilidade
    const segura = [...mercadosValidos].sort((a, b) => b.prob - a.prob)[0];

    // Sugestão Extra = prob > 40% e EV positivo, diferente da melhor
    const extra =
      mercadosValidos.find(
        m => m.key !== melhor.key && m.prob > 40 && m.ev > 0
      ) || null;

    // ---------- Resultado provável ----------
    const expGolosCasa = base.lambdaC; // do probs()
    const expGolosFora = base.lambdaF;

    const gC = Math.round(expGolosCasa);
    const gF = Math.round(expGolosFora);
    const resultadoProvavel = `${gC} - ${gF}`;

    // ---------- Output ----------
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
      Over: ${values.over25.toFixed(1)}%<br>
      Under: ${values.under25.toFixed(1)}%<br>
      BTTS: ${values.btts.toFixed(1)}%<br><br>

      <h3>🔥 Melhor Aposta (Valor)</h3>
      ${melhor.nome} (EV ${melhor.ev.toFixed(1)}% / ${melhor.prob.toFixed(
      1
    )}% )<br><br>

      <h3>✅ Aposta Mais Segura</h3>
      ${segura.nome} (${segura.prob.toFixed(1)}% prob.)<br><br>

      <h3>📌 Sugestão Extra</h3>
      ${
        extra
          ? `${extra.nome} (EV ${extra.ev.toFixed(1)}% / ${extra.prob.toFixed(
              1
            )}%)`
          : "Nenhuma disponível"
      }<br><br>

      <h3>🎯 Resultado Provável</h3>
      ${resultadoProvavel}
    `;
  } catch (e) {
    console.error(e);
    res.innerHTML = "Erro ao calcular. Ver consola (F12).";
  }
}
