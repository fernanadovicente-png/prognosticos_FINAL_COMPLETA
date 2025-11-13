
function ev(prob, odd){
 if(!odd || odd<=1) return -999;
 return (prob*(odd/100) - 1)*100;
}
