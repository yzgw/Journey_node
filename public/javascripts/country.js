$(function(){

    $.ajax({
        type : 'GET',
        url : 'http://www.flickr.com/services/rest/',
        data : {
            format : 'json',
            method : 'flickr.photos.search',
            api_key : '39a8f6729c11a45dc8b1a939811a9057',
            text : 'landscape ' + $("#iso_name").text(),
            per_page : '20',
            page : Math.floor( Math.random() * 10 ),
            content_type : 1,
        },
        dataType : 'jsonp',
        jsonp : 'jsoncallback',
        success : _getFlickrPhotos
    });

    // 
    // var wikipediaHTMLResult = function(data) {
    //     // console.log(data.parse.text['*'] );
    //     var readData = $('<div>' + data.parse.text['*'] + '</div>');
    //  
    //     var box = readData.find('.infobox');
    // 
    //     var binomialName    = box.find('.binomial').text();
    //     var fishName        = box.find('th').first().text();
    //     var imageURL        = null;
    //  
    //     // Check if page has images
    //     if(data.parse.images.length >= 1) {
    //         imageURL        = box.find('img').first().attr('src');
    //         console.log(imageURL);
    //     }
    // 
    //     $('#insertTest').append(box);
    // };
    // 
    // callWikipediaAPI("日本")
    //  
    // 
    // function callWikipediaAPI(wikipediaPage) {
    //     $.getJSON('http://ja.wikipedia.org/w/api.php?action=parse&format=json&callback=?', {page:wikipediaPage, prop:'text|images', uselang:'ja'}, wikipediaHTMLResult);
    // }

    function _getFlickrPhotos(data){
        var dataStat  = data.stat;
        if(dataStat == 'ok'){
            var items = data.photos.photo;
            console.log(items[0]);
            for(var i = 0; i < items.length; i++){
                var url = 'http://www.flickr.com/photos/' + items[i].owner + '/' + items[i].id;
                var thumbnail = 'http://farm' + items[i].farm + '.static.flickr.com/' + items[i].server + '/' + items[i].id + '_' + items[i].secret + '_t.jpg';
                
                $("#photos").append('<a href=' + url + '><img src="' + thumbnail + '"></a>');
            }
        }
    }
});
