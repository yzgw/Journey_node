$(function(){
    // // return false;
    // $.ajax({
    //     type : 'GET',
    //     url : 'http://www.flickr.com/services/rest/',
    //     data : {
    //         format : 'json',
    //         method : 'flickr.photos.search',
    //         api_key : '39a8f6729c11a45dc8b1a939811a9057',
    //         text : 'landscape',
    //         per_page : '5',
    //         page : Math.floor(Math.random() * 10000),
    //         content_type : 1,
    //         privacy_filter : 1,
    //     },
    //     dataType : 'jsonp',
    //     jsonp : 'jsoncallback',
    //     success : _getFlickrPhotos
    // });
    // 
    // function _getFlickrPhotos(data){
    //     var dataStat  = data.stat;
    //     if(dataStat == 'ok'){
    //         console.log("ok");
    //         console.log(data.photos.photo[0]);
    //         var item = data.photos.photo[0];
    //         var url = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '.jpg';
    //         $('body').css("background-image", 'url(' + url + ')');            
    //     }else{
    //             // fail
    //             console.log('ng');
    //     }
    // }
});
