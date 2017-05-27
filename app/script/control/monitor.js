$(function(){
    // title
    var $collapse = $('.collapse');
    var h = $('.manageBottom').height();
        $collapse.css({'height': h});
    $('#toggleInManage').on('click', function(){
        if($(this).hasClass('toggleInManage')){
            $(this).removeClass('toggleInManage').addClass('toggleOutManage');
            $collapse.css({'height': 0});
        }else{
            $(this).removeClass('toggleOutManage').addClass('toggleInManage');
            $collapse.css({'height': h});
        }
    });
    /**
     * tab 实时监控
     */
    $('.monitorTab').on('click', function(){
        $('#pointerTab').removeClass('pointerTabRight').addClass('pointerTabLeft');
        $('.track, .timeline, .trackAnalysis, .trackPanel').removeClass('visible').addClass('hidden');
        $('.monitor, .boundcontrol').removeClass('hidden').addClass('visible');
        map.clearOverlays(); 
        mapControl.removeSpeedControl();
    });
    /**
     * tab 轨迹查询
     */
    $('.trackTab').on('click', function(){
        $('#pointerTab').removeClass('pointerTabLeft').addClass('pointerTabRight');
        $('.monitor, .boundcontrol').removeClass('visible').addClass('hidden');
        $('.track, .timeline, .trackAnalysis').removeClass('hidden').addClass('visible');
        map.clearOverlays(); 
        mapControl.removeSpeedControl();
    });
});

$(function(){
    var bt = baidu.template,                // baidu.template
        service_id = getQueryString('service_id'),   // service_id
        ak = getQueryString('ak'),                   // ak
        sign = 0;     //判断是否访问过
        url = 'http://yingyan.baidu.com/api/v3',     // 请求地址
        url2 = 'http://api.map.baidu.com/geocoder/v2',     
        url3 = 'http://yingyan.baidu.com/api/v2',   
        $monitorTab2 = $('.monitorTab2'),
        $monitorList = $('#monitorList'),
        $monitorAll = $('.monitorAll'),
        $monitorOnline = $('.monitorOnline'),
        $monitorOffline = $('.monitorOffline'),
        $searchInputMonitor2 = $('#searchInputMonitor2'),           // 搜索的关键字
        $clearSearchBtnMonitor2 = $('#clearSearchBtnMonitor2'),        // 清除按钮
        $document2 = $(document),
        $inputPage2 = $('#inputPage2'),           // 当前页
        $allPage2 = $('#allPage2'),           // 总页数
        $prevPage2 = $('#prevPage2'),          // 上一页
        $nextPage2 = $('#nextPage2'),       // 下一页
        $monitorListItem = $('.monitorListItem '),
        monitor = {
            service_name: '',            // service名称
            service_type: 0,           // sercice类型
            allSize: 0,            // 全部页码
            currentPage: 1,            // 当前页码
            currentEntityName: '',          // 当前选中的entityname
            selectCar: {},              // 当前地图中选中车辆
            selectCompleteEntities: [],
            column: [],            // 当前service自定义字段描述
            column_key: [],          // 当前service自定字段key
            carIndex: undefined,             // 车辆的当前页index
            totalPage: 0,           // 总共页
            boundsType: 'all',            // 用户在切换全部，在线，离线时进行修改，bounds检索对应状态下的entity
            boundsearchTimestamp: 0,       // boundsearch的时间戳
            switchBounds: false,            // 是否开启范围检索
            onlineTime:  Math.ceil(new Date().getTime() / 1000) - 600,          // 当前时间往前十分钟，作为检测在线离线时间
            allEntities: [],                // 当前全部适配view entity数据
            onlineEntities: [],                 // 当前在线适配view entity数据
            offlineEntities: [],                  // 当前离线适配view entity数据
            allCompleteEntities: [],                   // 当前全部完整entity数据
            onlineCompleteEntities: [],             // 当前在线完整entity数据
            offlineCompleteEntities: [],              // 当前离线完整entity数据
            searchQuery: '',           // 当前检索关键字
            entityTotal: {            // 三种类型的entity的total
                all: 0,
                online: 0,
                offline: 0
            }
        }; 

    $('.monitorTab').on('click', function(){
        $monitorListItem.eq(monitor.carIndex).click();
    });

    function initMonitor(){
        addEvent();
        $monitorAll.click();
    }

    /**
     * 监听事件
     */
    function addEvent(){
        // 切换全部，在线，离线
        $monitorAll.css({'color': 'rgb(10, 140, 255)'});
        $monitorTab2.on('click', function(){
            var index = $monitorTab2.index($(this));
            monitor.currentPage = 1;
            $inputPage2.val(1);
            onSwitchmonitortab(index);
        });

        // 显示按钮
        $('#boundBtn').on('click', function(){
            if($(this).hasClass('boundOff')){
                $(this).removeClass('boundOff').addClass('boundOn');
                onSwitchboundsearch(true);
            }else{
                $(this).removeClass('boundOn').addClass('boundOff');
                onSwitchboundsearch(false);
            }
        });

        // 列表
        $monitorList.on('click', '.monitorListItem', function(e){
            monitor.carIndex = $monitorList.find('.monitorListItem').index($(this));
            $monitorList.find('.monitorListItem').removeClass('monitorSelect');
            $(this).addClass('monitorSelect');

            handleSelectCar($(this));
        });

        //  ====页码
        // 上一页
        $prevPage2.on('click', function(){
            if(monitor.currentPage === 1) return;
            onGetMonitorlist(--monitor.currentPage);
        });
        // 上一页
        $nextPage2.on('click', function(){
            if(monitor.currentPage === monitor.totalPage) return;
            onGetMonitorlist(++monitor.currentPage);
        });
        // 页码键盘
        $inputPage2.on('keypress', function(event){
            if(event.keyCode != 13) return;
            onJumpPage();
        });
        // GO跳转按钮
        $('#goPage2').on('click', function(event){
            onJumpPage();
        });

        // 搜索关键字
        $('#searchBtnMonitor2').on('click', function(){
            var search = $searchInputMonitor2.val();
            monitor.searchQuery = search;
            onGetMonitorlist(1);
        });

        $searchInputMonitor2.on('keyup', function(){
            var search = $searchInputMonitor2.val();
            setSwichSearchStyle(search);
            if(event.keyCode != 13) return;
            monitor.searchQuery = search;
            onGetMonitorlist(1);
        });

        $clearSearchBtnMonitor2.on('click', function(){
            $searchInputMonitor2.val('');
            monitor.searchQuery = '';
            $(this).addClass('hideCommon');
            onGetMonitorlist(1);
        });

    }



    // =======================================  列表

    /**
     * 查询轨迹查询数据前处理
     * 
     * @param {any} page
     */
    function onGetMonitorlist(page){
        monitor.currentPage = page;
        $inputPage2.val(page);
        switch(monitor.boundsType){
            case 'all': 
                onSearchallentity(page);
                break;
            case 'online': 
                onSearchonlineentity(page);
                break;
            case 'offline': 
                onSearchofflineentity(page);
                break;
        }
        onBoundsearchentity();
    }

    /**
     * 输入页码跳转
     * 
     * @returns
     */
    function onJumpPage(){
        var page = parseInt($inputPage2.val()) || 1;
            if(page === monitor.currentPage){
                $inputPage2.val(page);
                return;
            };
            if(page < 1 || page > monitor.totalPage){
                page = 1;
                $inputPage2.val(page);
            }
            onGetMonitorlist(page);
    }

    /**
     * 设置翻页按钮样式
     *
     * @param {number} jumpPage 要跳转到的页 
     */
    function setSwichPageStyle(jumpPage) {
        $prevPage2.removeClass('lastPageOff').addClass('lastPageOn');
        $nextPage2.removeClass('nextPageOff').addClass('nextPageOn');
        
        if(jumpPage === 1) {
            $prevPage2.removeClass('lastPageOn').addClass('lastPageOff');
        }
        
        if(jumpPage === monitor.totalPage) {
            $nextPage2.removeClass('nextPageOn').addClass('nextPageOff');
        }

        if(monitor.totalPage === 0){
            $prevPage2.removeClass('lastPageOn').addClass('lastPageOff');
            $nextPage2.removeClass('nextPageOn').addClass('nextPageOff');
        }
        
    }

    /**
     * 设置搜索关键字删除按钮的隐藏与显示
     * 
     * @param {any} search
     */
    function setSwichSearchStyle(search) {
        if(search && $clearSearchBtnMonitor2.hasClass('hideCommon')){
            $clearSearchBtnMonitor2.removeClass('hideCommon');
        }
        if(!search) $clearSearchBtnMonitor2.addClass('hideCommon');
    }

    /**
     * switchmonitortab，变更实时监控中的列表
     *
     * @param {number} index 要变更到的tab
     */
    function onSwitchmonitortab(index) {
        var $monitorBottomLine = $('.monitorList>div:last');
        $monitorTab2.css({'color': '#333'});
        $(this).css({'color': 'rgb(10, 140, 255)'});
        $monitorBottomLine.removeClass('monitorBottomLineLeft monitorBottomLineMid monitorBottomLineRight');
        monitor.carIndex === undefined;
        $inputPage2.val(1);
        switch(index){
            case 0: 
                $monitorBottomLine.addClass('monitorBottomLineLeft');
                monitor.boundsType = 'all';
                onSearchallentity(1);
                break;
            case 1: 
                $monitorBottomLine.addClass('monitorBottomLineMid');
                monitor.boundsType = 'online';
                onSearchonlineentity(1);
                break;
            case 2: 
                $monitorBottomLine.addClass('monitorBottomLineRight');
                monitor.boundsType = 'offline';
                onSearchofflineentity(1);
                break;
        }
        
        onBoundsearchentity();
    }
    
    /**
     *  searchallentity，查询所有entity
     *
     * @param {number} index页码
     */
    function onSearchallentity(index) {
        updateOnlineTime();
        index = index || monitor.currentPage;
        monitor.currentPage = index;
        monitor.allEntities = [];
        monitor.allCompleteEntities = [];
        var params = {
            'service_id': service_id,
            'ak': ak,
            'timeStamp': new Date().getTime(),
            'query': monitor.searchQuery,
            'page_index': index,
            'page_size': 10,
        };
        $.ajax({
            type: "GET",  
            url: url+"/entity/search",
            dataType: 'jsonp',
            data: params,
            success: function(data){
                if (data.status === 0) {
                    setAllEntities(data);
                    setallCompleteEntities(data);
                    monitor.entityTotal.all = data.total;
                    $monitorAll.find('>span').text('('+data.total+')');
                    var allpage = Math.ceil(data.total / 10);
                    monitor.totalPage = allpage;
                    $('#allPage2').text(allpage);
                } else {
                    setAllEntities([]);
                    setallCompleteEntities([]);
                    $monitorAll.find('>span').text('(0)');
                    monitor.totalPage = 0;
                    $('#allPage2').text(0);
                }
                
                setSwichPageStyle(index);
            },
            error: function(){
                console.log('获取监控设备失败');
            }
        });
    }

    
    
    /**
     *  searchofflineentity，查询离线entity
     *
     * @param {number} index页码
     */
    function onSearchofflineentity(index) {
        index = index || monitor.currentPage;
        monitor.allEntities = [];
        monitor.allCompleteEntities = [];
        var params = {
            'service_id': service_id,
            'ak': ak,
            'timeStamp': new Date().getTime(),
            'filter': 'inactive_time:' + monitor.onlineTime,
            'query': monitor.searchQuery,
            'page_index': index,
            'page_size': 10,
        };
         $.ajax({
            type: "GET",  
            url: url+"/entity/search",
            dataType: 'jsonp',
            data: params,
            success: function(data){
                if (data.status === 0) {
                    setAllEntities(data);
                    setallCompleteEntities(data);
                    monitor.entityTotal.offline = data.total;
                    $monitorOffline.find('>span').text('('+data.total+')');
                    var allpage = Math.ceil(data.total / 10);
                    monitor.totalPage = allpage;
                    $('#allPage2').text(allpage);
                } else {
                    setAllEntities([]);
                    setallCompleteEntities([]);
                    $monitorOffline.find('>span').text('(0)');
                    monitor.totalPage = 0;
                    $('#allPage2').text(0);
                }
                setSwichPageStyle(index);
            },
            error: function(){
                console.log('获取监控设备失败');
            }
        });

    }

    /**
     * 响应Action searchofflineentity，查询在线entity
     *
     * @param {number} index页码
     */
    function onSearchonlineentity(index) {
        index = index || monitor.currentPage;
        monitor.currentPage = index;
        monitor.allEntities = [];
        monitor.allCompleteEntities = [];
        var params = {
            'service_id': service_id,
            'ak': ak,
            'timeStamp': new Date().getTime(),
            'filter': 'active_time:' + monitor.onlineTime,
            'query': monitor.searchQuery,
            'page_index': index,
            'page_size': 10,
        };
         $.ajax({
            type: "GET",  
            url: url+"/entity/search",
            dataType: 'jsonp',
            data: params,
            success: function(data){
                if (data.status === 0) {
                    setAllEntities(data);
                    setallCompleteEntities(data);
                    monitor.entityTotal.online = data.total;
                    $monitorOnline.find('>span').text('('+data.total+')');
                    var allpage = Math.ceil(data.total / 10);
                    monitor.totalPage = allpage;
                    $('#allPage2').text(allpage);
                } else {
                    setAllEntities([]);
                    setallCompleteEntities([]);
                    $monitorOnline.find('>span').text('(0)');
                    monitor.totalPage = 0;
                    $('#allPage2').text(0);
                }
                setSwichPageStyle(index);
            },
            error: function(){
                console.log('获取监控设备失败');
            }
        });
    }

    /**
     * 根据查询结果设置entity格式
     *
     * @param {array} data entity数据
     */
    function setAllEntities(data) {
        var descIndex = 0;
        if (data.length === 0) return;
        data.entities.map(function (item, index) {
            var desc = '';
            if (commonfun.getOnlineStatus(item.latest_location.loc_time) === 0) {
                item.latest_location.speed = item.latest_location.speed || 0;
                desc = commonfun.getSpeed(item.latest_location.speed);
                descIndex = desc === '静止' ? 1 : 0;
            } else {
                desc = '离线';
                descIndex = 2;
            }
            monitor.allEntities[index] = [
                item.entity_name,
                desc,
                descIndex,
                '',
                item.entity_desc ? item.entity_desc : '无'
            ];
            // 为managerdemo添加特殊识别字段entity_id
            if (!!item.entity_id) {
                monitor.allEntities[index][3] = item.entity_id;
            }
        });
    }


    /**
     * 根据查询结果设置完整entity格式
     *
     * @param {array} data entity数据
     */
    function setallCompleteEntities(data) {
        if (data.length === 0) monitor.allEntities = [];
        monitor.allSize = data.size;
        $monitorList.html(bt('bt-monitor-list',{"list": monitor.allEntities}));
        if(monitor.carIndex === undefined)
        $monitorListItem = $monitorList.find('.monitorListItem');
    }


   

    /**
     * pdateonlinetime，修改判断在线离线时间
     *
     */
    function updateOnlineTime() {
        monitor.onlineTime = Math.ceil(new Date().getTime() / 1000) - 600;
    }


    // ======================================  地图上显示车辆
    
    /**
     * 点击选中一辆车
     *
     * @param {object} event 事件对象 
     */
    function handleSelectCar($this) {
        var entity_name = $this.attr('data-entity_name');
        var entity_status = $this.attr('data-entity_status');
        var entity_id = $this.attr('data-entity_id');
        monitor.currentEntityName = entity_name;
        onSelectcar(entity_name, entity_status, entity_id, 'allCompleteEntities');
    }

    /**
     * 响应Action selectallcar 返回选中车辆具体信息
     *
     */
    function onSelectcar(entity_name, entity_status, entity_id) {
        if(monitor.selectCar.entity_name === undefined && entity_name === undefined) return;
        let interval = false;
        if (monitor.selectCar.entity_name !== undefined && entity_name === undefined) {
            interval = true;
        }
        entity_name = entity_name || monitor.selectCar.entity_name;
        entity_status = entity_status !== undefined ? entity_status : monitor.selectCar.entity_status;
        monitor.selectCompleteEntities = [];
        var params = {
            'service_id': service_id,
            'ak': ak,
            'timeStamp': new Date().getTime(),
            'query': entity_name,
            'page_index': 1,
        };

        $.ajax({
            type: "GET",  
            url: url+"/entity/search",
            dataType: 'jsonp',
            data: params,
            success: function(data){
                if (data.status === 0) {
                    data.entities.map(function(item, index) {
                        if (item.entity_name === entity_name) {
                            var point = data.entities[0].latest_location;
                            var paramsGeo = {
                                'service_id': service_id,
                                'ak': ak,
                                location: point.latitude + ',' + point.longitude,
                                output: 'json'
                            };
                             $.ajax({
                                type: "GET",  
                                url: url2+"/",
                                dataType: 'jsonp',
                                data: paramsGeo,
                                success: function(dataGeo){
                                    var temp = [];
                                    monitor.column_key.map(function(keyitem, index) {
                                        if (keyitem === '_provider') {
                                            
                                        } else {
                                            temp[index] = [monitor.column[index] + ':', item[keyitem] !== undefined ? item[keyitem] : '无'];
                                        }
                                    });
                                    temp = temp.filter(function(item) {
                                        return item;
                                    });
                                    var lnglat = item.latest_location.longitude.toFixed(6) + ',' + item.latest_location.latitude.toFixed(6);
                                    var address = '地址未解析成功';
                                    if (dataGeo.result.formatted_address !== '') {
                                        address = dataGeo.result.formatted_address;
                                    } else {
                                        address = dataGeo.result.addressComponent.city + ', ' + location_desc.result.addressComponent.country;
                                    }
                                    monitor.selectCompleteEntities[index] = {
                                        point: [item.latest_location.longitude, item.latest_location.latitude],
                                        direction:item.latest_location.direction,
                                        status: commonfun.getInfoWindowStatus(item.latest_location.speed, item.latest_location.loc_time, item.latest_location.direction),
                                        infor: [
                                            ['状态:', commonfun.getInfoWindowStatus(item.latest_location.speed, item.latest_location.loc_time, item.latest_location.direction)],
                                            ['地址:', address],
                                            ['定位:', lnglat],
                                            ['时间:', commonfun.getLocalTime(item.latest_location.loc_time)]
                                        ].concat(temp)
                                    };
                                    monitor.selectCompleteEntities[index]['entity_name'] = item.entity_name;
                                    monitor.selectCompleteEntities[index]['entity_print'] = item.entity_name;
                                    monitor.selectCompleteEntities[index].entity_status = entity_status;
                                    monitor.selectCar = monitor.selectCompleteEntities[index];
                                    monitor.selectCompleteEntities[index].interval = interval;
                                    listenSelectCarData(monitor.selectCompleteEntities[index]);
                                    
                                    onBoundsearchentity();
                                },
                                error: function(){
                                    console.log('获取监控设备失败');
                                }
                            });
                        }  
                    });
                
                }
            },
            error: function(){
                console.log('获取监控设备失败');
            }
        });


    }

    
    /**
     * closemonitorinfobox 关闭实时监控中的infobox
     *
     */
    function onClosemonitorinfobox() {
        monitor.selectCar.entity_name = undefined;
    }

    /**
     * selectcardata事件,显示被选车辆
     *
     * @param {data} 选中entity数据
     */
    function listenSelectCarData(data) {
        mapControl.removeMonitorInfoBox();
        mapControl.removeEntityMarker();

        mapControl.setEntityMarker(data, monitor.service_type);
        mapControl.setMonitorInfoBox(data);

    }



    // ========================================  显示设备数量


    /**
     * 响应Action switchboundsearch 控制是否默认进行boundsearch
     *
     * @param {boolean} data 是否进行boundsearch
     */
    function onSwitchboundsearch(data) {
        monitor.switchBounds = data;
        onBoundsearchentity();
    }

    /**
     *  boundsearchentity 返回当前地图区域的entity
     */
    function onBoundsearchentity() {
        var time = new Date();
        monitor.boundsearchTimestamp = time.getTime();
        var inTimestamp = monitor.boundsearchTimestamp;
        var inBoundsEntity = [];
        var inBoundsEntityCount = 0;
        var total = 0;
        var boundsLimit = 400000;
        var bounds = map.getBounds();
        var center = bounds.getCenter();
        var northEast = bounds.getNorthEast();
        var southWest = bounds.getSouthWest();
        var page_size = map.getZoom() * 10;
        var width = 3;
        var height = 3;
        var boundsDistance = map.getDistance(northEast, southWest);

        if (!monitor.switchBounds || monitor.display === false) {
            $('.boundsearch_total span').text(0);
            boundsearchentity([]);
            return;
        }
        var boundsArr = [];

        // 把屏幕分为 width * height 个区域，分别调用boundsearch加载车辆数据
        var lngLatToPoint = function (lnglat) {
            return map.getMapType().getProjection().lngLatToPoint(lnglat);
        };
        var pointToLngLat = function (point) {
            return map.getMapType().getProjection().pointToLngLat(point);
        };
        var pixelNorthEast = lngLatToPoint(northEast);
        var pixelSouthWest = lngLatToPoint(southWest);
        var widthUnit = (pixelNorthEast.x - pixelSouthWest.x) / width;
        var heightUnit = (pixelNorthEast.y - pixelSouthWest.y) / height;
        for (var i = 0; i < width; i++) {
            for (var j = 0; j < height; j++) {
                var leftButtom = pointToLngLat(new BMap.Pixel(pixelSouthWest.x + widthUnit * i, pixelSouthWest.y + heightUnit * j));
                var rightTop = pointToLngLat(new BMap.Pixel(pixelSouthWest.x + widthUnit * (i + 1), pixelSouthWest.y + heightUnit * (j + 1)));
                boundsArr.push(leftButtom.lat + ',' + leftButtom.lng + ';' + rightTop.lat + ',' + rightTop.lng);
            }
        }
        var filter = '';
        switch (monitor.boundsType) {
            case 'all':
                filter = '';
                break;
            case 'online':
                filter = 'active_time:' + monitor.onlineTime;
                break;
            case 'offline':
                filter = 'inactive_time:' + monitor.onlineTime;
                break;
        }

        var getBoundsearchResultTable = function () {
            boundsArr.map(function (item, index) {
                var params = {
                    'service_id': service_id,
                    'ak': ak,
                    'timeStamp': new Date().getTime(),
                    'bounds': item,
                    'filter': filter,
                    'page_size': page_size
                };
                $.ajax({
                    type: "GET",  
                    url: url+"/entity/boundsearch",
                    dataType: 'jsonp',
                    data: params,
                    success: function(data){
                        if(data.status === 0) {
                            data.entities.map(function (eitem, eindex) {
                                var status = '';
                                var entity_status = 0;
                                if (commonfun.getOnlineStatus(eitem.latest_location.loc_time) === 0) {
                                    eitem.latest_location.speed = eitem.latest_location.speed || 0;
                                    status = commonfun.getSpeed(eitem.latest_location.speed);
                                    entity_status = status === '静止' ? 1 : 0;
                                } else {
                                    entity_status = 2;
                                    status = '离线';
                                }
                                inBoundsEntity.push({
                                    entity_name: eitem.entity_name,
                                    point: [eitem.latest_location.longitude, eitem.latest_location.latitude],
                                    direction: eitem.latest_location.direction,
                                    status: status,
                                    entity_status: entity_status
                                });


                            });
                            total = total + data.total;
                        }

                        if (++inBoundsEntityCount === width * height && inTimestamp === monitor.boundsearchTimestamp) {
                            $('.boundsearch_total span').text(total);
                            boundsearchentity([]);
                        }


                    },
                    error: function(){
                        console.log('获取监控设备失败');
                    }
                });

            });
        };
        var getBoundsearchResultOnce = function (page_index) {
            var temp = southWest.lat + ',' + southWest.lng + ';' + northEast.lat + ',' + northEast.lng;
            var params = {
                'service_id': service_id,
                'ak': ak,
                'timeStamp': new Date().getTime(),
                'bounds': temp,
                'filter': filter,
                'page_index': page_index,
                'page_size': 1000
            };

            $.ajax({
                    type: "GET",  
                    url: url+"/entity/boundsearch",
                    dataType: 'jsonp',
                    data: params,
                    success: function(data){
                        if (inTimestamp !== monitor.boundsearchTimestamp) {
                            return;
                        }
                        if (data.status === 3003) {
                            $('.boundsearch_total span').text(0);
                            boundsearchentity([]);
                            return;
                        }
                        if (data.status === 0) {
                            $('.boundsearch_total span').text(data.total);
                            if (data.total > 5000) {
                                getBoundsearchResultTable();
                                return;
                            }
                            data.entities.map(function (eitem, eindex) {
                                var status = '';
                                var entity_status = 0;
                                if (commonfun.getOnlineStatus(eitem.latest_location.loc_time) === 0) {
                                    eitem.latest_location.speed = eitem.latest_location.speed || 0;
                                    status = commonfun.getSpeed(eitem.latest_location.speed);
                                    entity_status = status === '静止' ? 1 : 0;
                                } else {
                                    entity_status = 2;
                                    status = '离线';
                                }
                                inBoundsEntity.push({
                                    entity_name: eitem.entity_name,
                                    point: [eitem.latest_location.longitude, eitem.latest_location.latitude],
                                    direction: eitem.latest_location.direction,
                                    status: status,
                                    entity_status: entity_status
                                });
                            });
                            if (inBoundsEntity.length !== data.total) {
                                getBoundsearchResultOnce(page_index + 1);
                            } else {
                                boundsearchentity(inBoundsEntity);
                            }
                        }

                    },
                    error: function(){
                        console.log('获取监控设备失败');
                    }
                });


        };
        // 划分成width * height 区域后仍然超过后端检索距离限制，则调用search检索
        if (boundsDistance > width * boundsLimit) {
            var tempData = [];
            var tempCount = 0;
            var tempTotal = monitor.entityTotal[monitor.boundsType];
            var page = Math.ceil(tempTotal / (map.getZoom() * 20));
            var j = page >= 3 ? 3 : page;
            for (var i = 0; i < j; i = i + 1) {
                var page_index = Math.ceil(i * 0.5 * page) + 1;
                var params = {
                    'service_id': service_id,
                    'ak': ak,
                    'timeStamp': new Date().getTime(),
                    'filter': filter,
                    'page_index': page_index,
                    'page_size': map.getZoom() * 20,
                    'sortby': 'loc_time:desc'
                };
                $.ajax({
                    type: "GET",  
                    url: url+"/entity/boundsearch",
                    dataType: 'jsonp',
                    data: params,
                    success: function(data){
                        if (inTimestamp !== monitor.boundsearchTimestamp) {
                            return;
                        }
                        if (data.status === 0) {
                            data.entities.map(function (eitem, eindex) {
                                var status = '';
                                var entity_status = 0;
                                if (commonfun.getOnlineStatus(eitem.latest_location.loc_time) === 0) {
                                    eitem.latest_location.speed = eitem.latest_location.speed || 0;
                                    status = commonfun.getSpeed(eitem.latest_location.speed);
                                    entity_status = status === '静止' ? 1 : 0;
                                } else {
                                    entity_status = 2;
                                    status = '离线';
                                }
                                tempData.push({
                                    entity_name: eitem.entity_name,
                                    point: [eitem.latest_location.longitude, eitem.latest_location.latitude],
                                    direction: eitem.latest_location.direction,
                                    status: status,
                                    entity_status: entity_status
                                });
                            });
                            if (++tempCount === j) {
                                $('.boundsearch_total span').text(data.total);
                                boundsearchentity(tempData);
                            }
                        }

                    },
                    error: function(){
                        console.log('获取监控设备失败');
                    }
                });

            }
            return;
        }
        if (boundsDistance < boundsLimit) {
            getBoundsearchResultOnce(1);
        } else {
            getBoundsearchResultTable();
        }
    }

    /**
     *  boundsearchentity事件,显示范围内车辆
     *
     * @param {Array} data 范围内entity数据
     */
    function boundsearchentity(data) {
        var that = this;
        var markerArr = [];
        var MarkerOption = {};
        if (monitor.service_type === 1) {
        } else {
            MarkerOption.height = 27;
            MarkerOption.width = 22;
        }
        if (data.length === 0) {
            mapControl.setBoundSearch([], MarkerOption);
        } else {
            data.map(function (item, index) {
                var img = mapControl.getEntityIcon(monitor.service_type, item);
                img.onload = function () {
                    markerArr.push({
                        geometry: {
                            type: 'Point',
                            coordinates: [item.point[0], item.point[1]]
                        },
                        icon: img,
                        deg: item.direction ? item.direction : 0,
                        entity_name: item.entity_name,
                        entity_status: item.entity_status
                    });
                    if (markerArr.length === data.length) {
                        mapControl.setBoundSearch(markerArr, MarkerOption);
                    }
                };
            });
        }
    }

    
    /**
     * 获取地址栏参数
     * 
     * @param {any} name
     * @returns
     */
    function getQueryString(name){
        var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if(r!=null)return  unescape(r[2]); return null;
    }


    
    window.initMonitor = initMonitor;
    window.onSelectcar = onSelectcar;
    window.onClosemonitorinfobox = onClosemonitorinfobox;
});