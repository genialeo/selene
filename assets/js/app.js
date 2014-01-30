var selene = (function() {
    var map;
    var infowindow = new google.maps.InfoWindow();
    var gmarkers = [];

    function getData () {
        $.getJSON('dati/indirizzi.json', function(sede) {
            setMarkers(sede);
        });    
    };

    function setMarkers (json) {
        var green = 'assets/images/mm_20_green.png';
        var red = 'assets/images/mm_20_red.png'; 

        $.each(json, function(key, data) {
            var latLng = new google.maps.LatLng(data.latitude, data.longitude);
            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
                title: data.nome,
                icon: (data.stato === 0) ? red : green,
                color: (data.stato === 0) ? 'red' : 'green',
                tipologia: data.tipologia,
                ip: data.ip
            });
        
            if (data.stato=='0') {
                data.stato='<image src=\"assets/images/circle_red.png\">&nbsp;&nbsp;Guasta';
            }
            else {
                data.stato='<image src=\"assets/images/circle_green.png\">&nbsp;&nbsp;Attiva';
            }

            gmarkers.push(marker);
            google.maps.event.addListener(marker, 'click', function () { clickHandler(data, marker); });

        });
    };

    function clickHandler (data, marker) {
        var ids = {ids: ['day','week','month','year']};
        var header = _.template($('#infoboxTPL').html());
        var dettagli = _.template($('#infoboxDettagliTPL').html());
        var emptymrtg = _.template($('#emptyMRTGTPL').html());
        var erroremrtg = _.template($('#errorMRTGTPL').html());
        var mrtg = _.template($('#infoboxMRTGTPL').html());
        var ping = _.template($('#pingPanel').html());
        var tracert = _.template($('#tracertPanel').html());

        var m = 'traffic.htm';
        var mrtgData = getMrtgData(m);

        mrtgData.done(function(value){
            _.each(ids.ids, function (id) {
                $('#'+id).remove();
            });
                        
            // Fix for IE
            var content1 = $('#dettagli').clone(true);
            var content2 = $('#ping').clone(true);
            var content3 = $('#tracert').clone(true);

            $('.tab-content').html('').append(content1).append(mrtg(value)).append(content2).append(content3);
        });

        mrtgData.fail(function(){
            _.each(ids.ids, function (id) {
                $('#'+id).remove();
            });
            $('.tab-content').append(erroremrtg(ids));
            $('#mrtgTab a:first').tab('show');
        });

        google.maps.event.addListenerOnce(infowindow, 'domready', function(){

            $('#pingButton').on('click', function () {
                var ip = $('#ping input').val();
                var source = new EventSource('php/pingsse.php?ip='+ip);
                
                source.addEventListener('message' , function(e) {
                    var resp = '';
                    resp = e.data.replace(/\"/gm,'');
                    resp = resp.replace(/\\r\\n/gm,'') + '<br>';
                    if (resp != '<br>') {
                        $('#pingresults').append(resp);
                    }
                });

                source.addEventListener('error' , function(e){
                    source.close();
                });
            });

            $('#tracertButton').on('click', function () {
                var ip = $('#tracert input').val();
                var source = new EventSource('php/tracertsse.php?ip='+ip);
                
                source.addEventListener('message' , function(e) {
                    var resp = '';
                    resp = e.data.replace(/\"/gm,'');
                    resp = resp.replace(/\\r\\n/gm,'') + '<br>';
                    if (resp != '<br>') {
                        $('#tracertresults').append(resp);
                    }
                });

                source.addEventListener('error' , function(e){
                    alert(e);
                    source.close();
                });
            });

        });

        var out = '<div class="well" style="height: 400px; width: 500px;">';
            out += header();
            out += '<div class="tab-content">';
            out += dettagli(data);
            out += emptymrtg(ids);
            out += ping(data);
            out += tracert(data);
            out += '</div>';
            out += '</div>';

        infowindow.open(map,marker);
        infowindow.setContent(out);
    };

    function getMrtgData (m) {
        var mrtgbaseurl = 'MRTG/';
        var promise = $.Deferred();

        $.ajax({
            url: mrtgbaseurl + m,
            contentType: 'text/html',
            timeout: 2000,
            success: function (data) {
                var out = {};
                out.img = [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(data, 'text/html');
                out.data = $(doc).find('strong').html();

                var grafici = $(doc).find('.graph');

                _.each(grafici, function (grafico) {
                    var g = $(grafico).find('img');
                    var t = $(grafico).find('table').addClass('table');
                    var obj = {titolo: $(grafico).find('h2').html(), id: g.attr('alt'), img: mrtgbaseurl + g.attr('src'), dati: t[0].outerHTML.replace(/>\s+</g,'><')};
                    out.img.push(obj);
                });
                promise.resolve(out);
            },
            error: function (request,error) {
                promise.reject(error);
            }
        });
        return promise;
    };

    function searchGeoMarkers (address, radius) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
                marker.setVisible(false);
                map.setCenter(results[0].geometry.location);
                for (var i=0; i<gmarkers.length; i++) {
                    if (google.maps.geometry.spherical.computeDistanceBetween(gmarkers[i].getPosition(), marker.getPosition()) < radius*1000) {
                        gmarkers[i].setVisible(true);
                    }
                    else {
                        gmarkers[i].setVisible(false);
                    }
                }
            }
            else {
                alert('Errore');
            }
        });
    };

    function searchMarkers (cosa, dove) {
        for (var i=0; i<gmarkers.length; i++) {
            if (gmarkers[i][dove] == cosa) {
                gmarkers[i].setVisible(true);
            }
            else {
                gmarkers[i].setVisible(false);
            }
        }
    };

    function showMarkers (category) {
        for (var i=0; i<gmarkers.length; i++) {
            if (gmarkers[i].color == category) {
                gmarkers[i].setVisible(true);
            }
        }
    };

    function hideMarkers () {
        for (var i=0; i<gmarkers.length; i++) {
            gmarkers[i].setVisible(false);
        }
    };

    return {
        init: function () {
            var mapOptions = {
                zoom: 9,
                center: new google.maps.LatLng(41.8925, 12.491944),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            this.resize();
            getData();
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
        cerca: function (cosa, dove) {
            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }
            if (isNumeric(dove)) {
                searchGeoMarkers(cosa, dove);
            }
            else {
                searchMarkers(cosa, dove);
            }
        },
        mark: function (category) {
            hideMarkers();
             if (category === 'tutte') {
                showMarkers('red');
                showMarkers('green');
            }
            else {
                showMarkers('red');    
            }
            
        }
    };

}());