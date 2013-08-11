$(function(){

    var nt = new Date(), hr = nt.getHours(), mes = "";
    if( hr <= 4 )	 { mes = 'こんばんは';	}
    else if( hr <= 7 )	{ mes = 'おはよう'; }
    else if( hr <= 18 )	{ mes = 'こんにちは'; }
    else if( hr <= 23 )	{ mes = 'こんばんは'; }
    $("#greeting").text(mes);

});
