
function factorial(n){return n<=1?1:n*factorial(n-1);}
function poisson(l, k){return (Math.pow(l,k)*Math.exp(-l))/factorial(k);}

function probs(gmC, gsC, gmF, gsF){
 const lambdaC=(gmC+gsF)/2;
 const lambdaF=(gmF+gsC)/2;

 let casa=0, fora=0, empate=0;

 for(let c=0;c<7;c++){
   for(let f=0;f<7;f++){
     let p=poisson(lambdaC,c)*poisson(lambdaF,f);
     if(c>f) casa+=p;
     else if(f>c) fora+=p;
     else empate+=p;
   }
 }
 return {casa:casa*100, empate:empate*100, fora:fora*100, lambdaC, lambdaF};
}
