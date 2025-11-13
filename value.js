
function implied(odd){
 if(!odd || odd<=1) return 0;
 return 100/odd;
}

function ev(prob, odd){
 if(odd<=1) return -999;
 return (prob*(odd/100) - 1)*100;
}
