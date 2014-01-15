var selene = (function() {
    var map;
    return {
        init: function () {
            var mapOptions = {
                zoom: 6,
                center: new google.maps.LatLng(41.8925, 12.491944),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            this.getData();
            this.resize();
        }, 
        resize: function () {
            var top = $('#main-navbar').height();
            var left = $('#left-panel').width();
            var width = $(window).width() - left;
            var height = $(window).height() - top;
            
            $('#map-canvas').css({
                position: 'absolute',
                top: top,
                left: left,
                width: width,
                height: height
            });
        },
        getData: function () {
            $.getJSON('dati/biblioteche.json', function(biblio) {
                console.log(biblio);
            });    
        }
    };

}());