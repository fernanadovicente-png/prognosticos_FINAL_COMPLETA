//-------------------------------------------------------
// 🔥 1. Converter Forma (V/E/D) → Pontos
//-------------------------------------------------------
function formaParaPontos(str){
  if(!str) return 0;
  return str
    .split(",")
    .map(s => s.trim().toUpperCase())
    .map(r => r === "V" ? 3 : r === "E" ? 1 : 0)
    .reduce((a,b)=>a+b,0);
}

//-------------------------------------------------------
// 🔥 2. Função Principal
//-------------------------------------------------------
function calcular(){

  // Inputs golos
  const gmC = +gmCasa.value, gsC = +gsCasa.value;
  const gmF = +gmFora.value, gsF = +gsFora.value;

  //-------------------------------------------------------
  // 🔥 NOVO – converter forma: agora podes usar V,E,D
  //-------------------------------------------------------
  const fC = formaParaPontos(formaCasa.value);
  const fF = formaParaPontos(formaFora.value);

  //-------------------------------------------------------
  // Base de probabilidades
  //-------------------------------------------------------
  let base = probs(gmC, gsC, gmF, gsF);

  base.casa += fC * 1.2;
  base.fora += fF * 1.2;

  let ou = calcOU(base.lambdaC, base.lambdaF);
  let bt = calcBTTS(base.lambdaC, base.lambdaF);

  //-------------------------------------------------------
  // Odds
  //-------------------------------------------------------
  let odds = {
    casa:+odd1.value, empate:+oddX.value, fora:+odd2.value,
    o1X:+odd1X.value, oX2:+oddX2.value, o12:+odd12.value,
    over:+oddOver.value, under:+oddUnder.value, btts:+oddBTTS.value
  };

  //-------------------------------------------------------
  // NOVOS MERCADOS — simulações mais simples
  //-------------------------------------------------------
  const over15Prob = Math.min(100, ou.over + 20);
  const over35Prob = Math.max(0, ou.over - 25);
  const handicapM1Prob = base.casa - base.fora;
  const handicapM2Prob = base.casa - base.fora - 10;

  //-------------------------------------------------------
  // EV de todos os mercados
  //-------------------------------------------------------
  let values = {
    casa: ev(base.casa, odds.casa),
    empate: ev(base.empate, odds.empate),
    fora: ev(base.fora, odds.fora),
    o1X: ev(base.casa+base.empate, odds.o1X),
    oX2: ev(base.empate+base.fora, odds.oX2),
    o12: ev(base.casa+base.fora, odds.o12),
    over25: ev(ou.over, odds.over),
    under25: ev(ou.under, odds.under),
    btts: ev(bt.btts, odds.btts),

    // NOVOS
    over15: ev(over15Prob, 1.14),
    over35: ev(over35Prob, 1.85),
    hcapM1: ev(handicapM1Prob, 1.40),
    hcapM2: ev(handicapM2Prob, 2.30)
  };

  //-------------------------------------------------------
  // 🔥 FILTRO REALISTA – evitar picks absurdas
  //-------------------------------------------------------
  function valido(market, prob, odd){
    if(prob < 15) return false;     // mínimo 15% probabilidade real
    if(odd > 15) return false;      // odds impossíveis / fantasmas
    return true;
  }

  //-------------------------------------------------------
  // 📌 Lista de mercados permitidos
  //-------------------------------------------------------
  let markets = {
    "1": {prob: base.casa, ev: values.casa, odd: odds.casa},
    "12": {prob: base.casa+base.fora, ev: values.o12, odd: odds.o12},
    "1X": {prob: base.casa+base.empate, ev: values.o1X, odd: odds.o1X},
    "Over 1.5": {prob: over15Prob, ev: values.over15, odd: 1.14},
    "Over 2.5": {prob: ou.over, ev: values.over25, odd: odds.over},
    "Over 3.5": {prob: over35Prob, ev: values.over35, odd: 1.85},
    "Handicap -1": {prob: handicapM1Prob, ev: values.hcapM1, odd: 1.40},
    "Handicap -2": {prob: handicapM2Prob, ev: values.hcapM2, odd: 2.30}
  };

  //-------------------------------------------------------
  // ✂ Escolher apenas mercados válidos
  //-------------------------------------------------------
  let validos = Object.entries(markets).filter(([k,v]) =>
    valido(k, v.prob, v.odd)
  );

  //-------------------------------------------------------
  // 🔥 MELHOR APOSTA (maior EV realista)
  //-------------------------------------------------------
  let best = validos.sort((a,b)=>b[1].ev - a[1].ev)[0];

  //-------------------------------------------------------
  // ✅ APOSTA SEGURA (maior probabilidade)
  //-------------------------------------------------------
  let segura = validos.sort((a,b)=>b[1].prob - a[1].prob)[0];

  //-------------------------------------------------------
  // 📌 APOSTA ALTERNATIVA (prob > 40% + EV positivo)
  //-------------------------------------------------------
  let alternativa = validos.filter(([k,v]) =>
    v.prob > 40 && v.ev > 0
  )[0];

  //-------------------------------------------------------
  // 🎯 RESULTADO PROVÁVEL
  //-------------------------------------------------------
  let gCasa = (gmC + gsF) / 2;
  let gFora = (gmF + gsC) / 2;
  let resProv = `${Math.round(gCasa)} - ${Math.round(gFora)}`;

  //-------------------------------------------------------
  // 🖥️ Output FINAL
  //-------------------------------------------------------
  document.getElementById("res").innerHTML = `
    <h3>🔥 Melhor Aposta</h3>
    ${best[0]} (EV ${best[1].ev.toFixed(1)}%)<br><br>

    <h3>✅ Aposta Segura</h3>
    ${segura[0]} (${segura[1].prob.toFixed(1)}%)<br><br>

    <h3>📌 Alternativa</h3>
    ${alternativa ? alternativa[0] : "Nenhuma disponível"}<br><br>

    <h3>🎯 Resultado Provável</h3>
    ${resProv}<br>
  `;
}
