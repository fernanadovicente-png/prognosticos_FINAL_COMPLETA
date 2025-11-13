
function calcular(){
 // Auto stats
 let gmC = mediaGolos(gmCasaAuto.value);
 let gsC = mediaGolos(gsCasaAuto.value);
 let gmF = mediaGolos(gmForaAuto.value);
 let gsF = mediaGolos(gsForaAuto.value);

 let fC = calcForma(formaCasaAuto.value);
 let fF = calcForma(formaForaAuto.value);

 let base = probs(gmC, gsC, gmF, gsF);

 base.casa += fC*1.2;
 base.fora += fF*1.2;

 let ou = calcOU(base.lambdaC, base.lambdaF);
 let bt = calcBTTS(base.lambdaC, base.lambdaF);

 let odds = {
   casa:+odd1.value, empate:+oddX.value, fora:+odd2.value,
   o1X:+odd1X.value, oX2:+oddX2.value, o12:+odd12.value,
   over:+oddOver.value, under:+oddUnder.value, btts:+oddBTTS.value
 };

 let values = {
   casa:ev(base.casa, odds.casa),
   empate:ev(base.empate, odds.empate),
   fora:ev(base.fora, odds.fora),
   o1X:ev(base.casa+base.empate, odds.o1X),
   oX2:ev(base.empate+base.fora, odds.oX2),
   o12:ev(base.casa+base.fora, odds.o12),
   over:ev(ou.over, odds.over),
   under:ev(ou.under, odds.under),
   btts:ev(bt.btts, odds.btts)
 };

 let best = Object.entries(values).sort((a,b)=>b[1]-a[1])[0];

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

 <h2>🔥 Melhor Aposta: ${best[0].toUpperCase()} (EV ${best[1].toFixed(1)}%)</h2>
 `;
}
