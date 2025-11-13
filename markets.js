
function calcOU(lambdaC, lambdaF){
 let total=lambdaC+lambdaF;
 let under=poisson(total,0)+poisson(total,1)+poisson(total,2);
 return {over:(1-under)*100, under:under*100};
}

function calcBTTS(lambdaC, lambdaF){
 let pc=1-poisson(lambdaC,0);
 let pf=1-poisson(lambdaF,0);
 return {btts:(pc*pf)*100};
}
