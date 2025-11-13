
function mediaGolos(seq){
 if(!seq) return 0;
 let arr = seq.split(',').map(n=>+n.trim());
 let sum = arr.reduce((a,b)=>a+b,0);
 return sum/arr.length;
}

function calcForma(seq){
 if(!seq) return 0;
 let arr = seq.split(',').map(s=>s.trim().toUpperCase());
 let p=0;
 arr.forEach(r=>{ if(r=='V')p+=3; if(r=='E')p+=1; });
 return (p/15)*10;
}
