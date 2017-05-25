$(function(){
    var bt = baidu.template,                // baidu.template
        service_id = getQueryString('service_id'),   // service_id
        ak = getQueryString('ak'),                   // ak
        url = 'http://yingyan.baidu.com/api/v3',     // 请求地址
        url2 = 'http://api.map.baidu.com/geocoder/v2',     
        url3 = 'http://yingyan.baidu.com/api/v2',   
        $datetimepicker = $('#datetimepicker'),      // datetimepicker控件
        $datetimeInput = $('#datetimeInput'),        // 时间选择的input
        $searchInputMonitor = $('#searchInputMonitor'),           // 搜索的关键字
        $clearSearchBtnMonitor = $('#clearSearchBtnMonitor'),        // 清除按钮
        $document = $(document),
        $inputPage = $('#inputPage'),           // 当前页
        $allPage = $('#allPage'),           // 总页数
        $trackList = $('#trackList'),           // track列表
        $prevPage = $('#prevPage'),          // 上一页
        $nextPage = $('#nextPage'),       // 下一页
        $monitorListItems = null,   // track实体列表
        $monitorListItems0 = null,   // track有轨迹实体列表
        $timelineMain = $('#timelineMain'),         // 时间线容器
        $timelinePlay = $('#timelinePlay'),       // 暂停播放按钮
        $timelineProgress = $('#timelineProgress'),       // 时间轴进度条
        $timelineLabel = $('#timelineLabel'),       // 提示时间
        $runPart = $('#runPart'),             // 时间段
        $caliperA = $('#caliperA'),             // 左边卡尺
        $caliperB = $('#caliperB'),             // 右边卡尺
        $caliperPartA = $('#caliperPartA'),             // 左边移动卡尺
        $caliperPartB = $('#caliperPartB'),             // 右边移动卡尺
        $analysis = $('.analysis'),                   // 轨迹纠偏 驾车行为展开
        $analysisTitle = $('.analysisTitle'),         // 轨迹纠偏 驾车行为 title
        $trackPanel = $('.trackPanel'),                   // 轨迹纠偏 驾车行为面板
        $processInput = $('.processControl input');         // 轨迹纠偏 input
        $behaviorInput = $('.behaviorControl input');          // 驾车行为 input
        $controlItemNum = $('.controlItemNum');          // 驾车行为显示数字文本
        track = {
            size : 10,            // 一页数
            trackProcess: {         // 轨迹纠偏状态对象
                is_processed: '0',
                need_denoise: '1',
                need_vacuate: '1',
                need_mapmatch: '0',
                transport_mode: '1'
            },
            behavior: {              // 当前轨迹驾驶行为分析
                behaviorSpeeding: 0,
                behaviorAcceleration: 0,
                behaviorSteering: 0
            },
            trackBehaviorSortData: [],         // 异步加载的驾驶分析排序数据
            trackBehaviorPointData: {                // 实际返回给view的驾驶分析数据
                harsh_acceleration: [],
                harsh_breaking: [],
                harsh_steering: [],
                speeding: []
            },
            // 异步加载的驾驶分析数据计数
            trackBehaviorDataCount: 0,
            behaviorCheck: ['0', '0', '0', '0'],          // 驾驶行为四个checkbox状态，0未选中 1选中
            trackStayRouteSortData: [],         // 异步加载的停留点排序数据
            trackStayRoutePointData: [],            // 实际返回给view的停留点数据
            trackStayRouteDataCount: 0,           // 异步加载的停留点数据计数
            transport_mode: [
                'driving',
                'riding',
                'walking'
            ],
            trackList: [],              // 当前track列表
            currentTrackPageIndex: 1,     // 当前track页码
            searchQuery: '',              // 查询关键字
            trackPageTotal: 0,           //track总页数
            start_time: 0,            // 当前选中开始时间
            end_time: 0,              // 当前结束时间
            selectTrack: '',          // 选择的tarck name
            trackRouteDataCount: 0,             // 异步加载的选中的轨迹数据计数
            trackRouteSortData: [],             // 异步加载的选中的轨迹排序数据
            trackRoutePointData: [],           // 实际返回给view的轨迹数据
            trackRouteNoZero: [],              // 实际返回过滤掉00点 
            trackSearching: 0,                 //标记正在轨迹检索 0未检索 1正在检索
            staypointSearching: 0,           //标记正在停留点检索 0未检索 1正在检索
            analysisbehaviorSearching: 0,      //标记正在轨迹分析检索 0未检索 1正在检索
        },
        draw = {
            totalPoints: [],            // 所有秒回点
            starttime: '',              // 开始时间
            endtime: '',               //  结束时间
            first: false,              // 判断是否是第一次绘制轨迹
        },
        timeline = {
            timeCount: [],           // 时间轴显示的小时数量
            timeNumber: [],          // 时间轴显示的时间数字标识
            // 播放速度，常规速度为0.1/frame 
            // 减速为 0.08,0.06,0.04,0.02,0.01 
            // 加速为 0.12,0.14,0.16,0.18,0.20
            playSpeed: [0.01, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2],
            playSpeedIndex: 5,                 //当前播放速度位置
            progress: 0,                       // 时间轴位置
            currentProgress: 0,              // 当前时间轴位置
            currentPageX:  0,                 // 当前时间轴位置对应的pageX
            hovertime: '0:0',           // 浮动时间
            caliperAPosition: 0,           // 卡尺A位置
            caliperBPosition: 721,         // 卡尺B位置 
            timelineLong: 721,             // 时间轴长度
            caliperAclientX: 0,             // 卡尺A的clientX
            caluperCurrent: '',           // 当前拖动的卡尺
            initTimeStamp: 0,            // 当天起始时间时间错
            initMouseX: 0,            // 初始鼠标拖动位置
            dataPart: [],                 // 当前有数据的时间段数组
        };

    /**
     * 时间控件
     */
    $datetimeInput.val(commonfun.getCurrentDate());
    onChangedatetime(commonfun.getCurrentDate());
    $datetimepicker.datetimepicker({
        format: 'yyyy-mm-dd',
        language: 'zh-CN',
        weekStart: 1,
        todayBtn:  1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        forceParse: 0,
        minView: 2,
        pickerPosition: 'bottom-left',
        endDate: new Date()
    })
    .on('changeDate', function() {
        onGetTracklist(1);
    });
    
    /**
     * 初始化
     */
    function init(){
        onGetTracklist(track.currentTrackPageIndex);
        initTimeLine();
        initTrackAnalysis();
        addEvent();
        initSpeedControl();
    }
    init();
    
    /**
     * 监听事件
     */
    function addEvent(){
        // 上一页
        $prevPage.on('click', function(){
            if(track.currentTrackPageIndex === 1) return;
            onGetTracklist(--track.currentTrackPageIndex);
        });
        // 上一页
        $nextPage.on('click', function(){
            if(track.currentTrackPageIndex === track.trackPageTotal) return;
            onGetTracklist(++track.currentTrackPageIndex);
        });
        // 页码键盘
        $inputPage.on('keypress', function(event){
            if(event.keyCode != 13) return;
            onJumpPage();
        });
        // GO跳转按钮
        $('#goPage').on('click', function(event){
            onJumpPage();
        });

        // 搜索关键字
        $('#searchBtnMonitor').on('click', function(){
            var search = $searchInputMonitor.val();
            track.searchQuery = search;
            onGetTracklist(1);
        });

        $searchInputMonitor.on('keyup', function(){
            var search = $searchInputMonitor.val();
            setSwichSearchStyle(search);
            if(event.keyCode != 13) return;
            track.searchQuery = search;
            onGetTracklist(1);
        });

        $clearSearchBtnMonitor.on('click', function(){
            $searchInputMonitor.val('');
            track.searchQuery = '';
            $(this).addClass('hideCommon');
            onGetTracklist(1);
        });

        // 点击track实体
        $trackList.on('click', '.monitorListItem1, .monitorListItem0', function(){
            $monitorListItems.removeClass('monitorSelect');
            $(this).addClass('monitorSelect');
        });

        $trackList.on('click', '.monitorListItem0', function(){
            var name = $(this).attr('data-name');
            onSelecttrack(name);
        });

    }

// =============================  实体track列表

    /**
     * 输入页码跳转
     * 
     * @returns
     */
    function onJumpPage(){
        var page = parseInt($inputPage.val()) || 1;
            if(page === track.currentTrackPageIndex){
                $inputPage.val(page);
                return;
            };
            if(page < 1 || page > track.trackPageTotal){
                page = 1;
                $inputPage.val(page);
            }
            onGetTracklist(page);
    }
    /**
     * 查询轨迹查询数据前处理
     * 
     * @param {any} page
     */
    function onGetTracklist(page){
        track.currentTrackPageIndex = page;
        $inputPage.val(page);
        onChangedatetime($datetimeInput.val());
        getTracklist();
    }

    /**
     *  轨迹查询数据
     **/
    function getTracklist() {
        var datetimeInput = $datetimeInput.val(),
            parmas = {
                service_id: service_id,
                ak: ak,
                query: track.searchQuery,
                page_size: track.size,
                page_index: track.currentTrackPageIndex,
                timeStamp: datetimeInput
            };
        
        // 根据关键字搜索entity
        $.ajax({
            type: "GET",  
            url: url+"/entity/search",
            dataType: 'jsonp',
            data: parmas,
            success: function(data){
                setTracklist(data);
                if(data.status === 0) {
                    // 查询某 entity 一段时间内的轨迹里程
                    data.entities.map(function(item) {
                        var paramsd ={
                            service_id: service_id,
                            ak: ak,
                            timeStamp: datetimeInput,
                            'start_time': track.start_time,
                            'end_time': track.end_time,
                            'entity_name': item.entity_name,
                            'is_processed': track.trackProcess.is_processed,
                            'process_option': 'need_denoise=' + track.trackProcess.need_denoise + ','+
                                            'need_vacuate=' + track.trackProcess.need_vacuate + ',' +
                                            'need_mapmatch=' + track.trackProcess.need_mapmatch + ',' +
                                            'transport_mode=' + track.transport_mode[track.trackProcess.transport_mode - 1]
                        };

                         $.ajax({
                            type: "GET",  
                            url: url+"/track/getdistance",
                            dataType: 'jsonp',
                            data: paramsd,
                            success: function(dataa){
                                if(dataa.status === 0) {
                                    var trackDistance = (dataa.distance / 1000).toFixed(1);
                                    setTracklistDistance(trackDistance, item.entity_name);
                                }
                            },
                            error: function(){
                                console.log('获取单个实体的轨迹里程失败');
                            }
                        });
                    });
                }
            },
            error: function(){
                console.log('根据关键字搜索获取实体失败');
            } 
        });
    }


    /**
     * 修改起止时间
     * 
     * @param {any} date
     */
    function onChangedatetime(date) {
        date = new Date(Date.parse(date.replace(/-/g, "/")));
        date = date.getTime() / 1000;
        track.start_time = date;
        track.end_time = date + 86399;
    }
    
    /**
     * 根据查询结果设置tracklist数据
     * 
     * @param {any} tracklist
     */
    function setTracklist(tracklistData){
        track.trackList = [];
        if(tracklistData.status === 0){
            track.trackPageTotal = Math.ceil(tracklistData.total / track.size);
            tracklistData.entities.map(function (item, index) {
                track.trackList.push({
                    name: item.entity_name
                });
            });
        }else{
            track.trackPageTotal = 0;
            $trackList.html('');
        }
        
        $allPage.text(track.trackPageTotal);
        setSwichPageStyle(track.currentTrackPageIndex);
    }
    /**
     * 设置tracklist里程数
     * 
     * @param {any} distance
     * @param {any} name
     */
    function setTracklistDistance(distance, name) {
        track.trackList.map(function(item) {
            if(item.name === name) {
                item.distance = distance;
                item.style = distance > 0 ? 0 : 1;
            }
        });
        $trackList.html(bt('bt-track-list',{"list": track.trackList}));
        $monitorListItems = $('.monitorListItem0, .monitorListItem1');
        $monitorListItems0 = $('.monitorListItem0');
    }


    /**
     * 设置翻页按钮样式
     *
     * @param {number} jumpPage 要跳转到的页 
     */
    function setSwichPageStyle(jumpPage) {
        $prevPage.removeClass('lastPageOff').addClass('lastPageOn');
        $nextPage.removeClass('nextPageOff').addClass('nextPageOn');

        if(jumpPage === 1) {
            $prevPage.removeClass('lastPageOn').addClass('lastPageOff');
        }
        
        if(jumpPage === track.trackPageTotal) {
            $nextPage.removeClass('nextPageOn').addClass('nextPageOff');
        }
        
    }
    /**
     * 设置搜索关键字删除按钮的隐藏与显示
     * 
     * @param {any} search
     */
    function setSwichSearchStyle(search) {
        if(search && $clearSearchBtnMonitor.hasClass('hideCommon')){
            $clearSearchBtnMonitor.removeClass('hideCommon');
        }
        if(!search) $clearSearchBtnMonitor.addClass('hideCommon');
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




    // =============================  轨迹
    

    /**
     * 选中某个轨迹
     * 
     * @param {any} name
     */
    function onSelecttrack(name){
        if (!name || track.trackSearching === 1)  return;
        track.trackSearching = 1;
        var tempTimeArr = [];
        var partTime = Math.floor((track.end_time - track.start_time) / 6);

        track.trackRoutePointData = [];
        track.trackRouteSortData = [];
        track.trackRouteNoZero = [];
        track.selectTrack = name;

        for(var i = 0; i < 6; i++) {
            tempTimeArr[i] = {
                start_time: track.start_time + i * partTime,
                end_time: track.start_time + (i + 1) * partTime - 1,
                index: i
            }
        }
        tempTimeArr[5].end_time = track.end_time;
        var params = {
           'entity_name': track.selectTrack,
           'service_id': service_id,
           'ak': ak,
           'simple_return': 0,
           'page_size': 5000,
           'is_processed': track.trackProcess.is_processed,
           'process_option': 'need_denoise=' + track.trackProcess.need_denoise + ',' +
                             'need_vacuate=' + track.trackProcess.need_vacuate + ',' +
                             'need_mapmatch=' + track.trackProcess.need_mapmatch + ',' +
                             'transport_mode=' + track.transport_mode[track.trackProcess.transport_mode - 1]
        };

        var count = 1;
        tempTimeArr.map(function (item){
            params.start_time = item.start_time;
            params.end_time = item.end_time;
            reTrackRoute(params, 1, count++);
            reTrackRoute(params, 2, count++);
        }); 
        
    }

    /**
     * 重新绘制路线
     * 
     * @param {any} paramsr
     * @param {any} page_index
     */
    function reTrackRoute(paramsr, page_index, count){
        paramsr.page_index = page_index;
        $.ajax({
            type: "GET",  
            url: url+"/track/gettrack",
            dataType: 'jsonp',
            data: paramsr,
            success: function(data){
                track.trackRouteDataCount = track.trackRouteDataCount + 1;
                if(data.status === 0) {
                    track.trackRouteSortData.push({index: count, track: data});
                    if(track.trackRouteDataCount === 12) {
                        track.trackRouteDataCount = 0;
                        track.trackRouteSortData.sort(function(a,b){return a.index - b.index});

                        for(var i = 0; i < 12; i++) {
                            track.trackRoutePointData = track.trackRoutePointData.concat(track.trackRouteSortData[i].track.points);
                        }
                        track.trackRoutePointData.map(function(item){
                            if (item.longitude > 1 && item.latitude > 1) {
                                track.trackRouteNoZero.push(item);
                            }  
                        });
                        draw.first = true;
                        track.trackSearching = 0;
                        drawTrack(track.trackRouteNoZero);
                        listenTrackRoute(track.trackRouteNoZero);
                    }
                }
                if (track.trackRouteDataCount === 12) {
                    track.trackRouteDataCount = 0;
                    track.trackSearching = 0;
                     
                }
            },
            error: function(){
                console.log('获取绘制路线失败');
            }
        });
    }

    
    /**
     * 绘制轨迹线路
     * 
     * @param {Array} data 轨迹数据 可选
     * @param {number} starttime 时间区间起点 可选
     * @param {number} endtime 时间区间终点 可选
     */
    function drawTrack(data, starttime, endtime) {
        if (!data) {
            data = track.trackRouteNoZero;
        }
        var totalPoints = [];
        var viewportPoints = [];

        if (data.length === 0) return;
        if (!starttime) starttime = data[0].loc_time;
        if (!endtime) endtime = data[data.length -  1].loc_time;
        draw.starttime = starttime;
        draw.endtime = endtime;

        for (var i = 0; i < data.length; i++) {
            if (data[i].loc_time >= starttime && data[i].loc_time <= endtime) {
                var tempPoint = new BMap.Point(data[i].longitude, data[i].latitude);
                tempPoint.speed = data[i].speed ? data[i].speed : 0;
                tempPoint.loc_time = data[i].loc_time;
                tempPoint.height = data[i].height || 0;
                tempPoint.radius = data[i].radius;
                tempPoint.print = track.selectTrack;
                tempPoint.printTime = commonfun.getLocalTime(data[i].loc_time);
                tempPoint.printSpeed = commonfun.getSpeed(data[i].speed);
                tempPoint.lnglat = data[i].longitude.toFixed(2) + ',' + data[i].latitude.toFixed(2);
                totalPoints.push(tempPoint);
            }
        }
        draw.totalPoints = totalPoints;
        if (draw.first) {
            map.setViewport(totalPoints, {margins: [80, 0, 0, 200]});
        }
        

        if (totalPoints.length > 0) {
            if(typeof(canvasLayer) !== 'undefined' || typeof(canvasLayerBack) !== 'undefined' || typeof(CanvasLayerPointer) !== 'undefined') {
                map.removeOverlay(CanvasLayerPointer);
                map.removeOverlay(canvasLayer);
                map.removeOverlay(canvasLayerBack);

            }
            window.canvasLayerBack =  new CanvasLayer({
                map: map,
                update: updateBack
            });
            window.canvasLayer =  new CanvasLayer({
                map: map,
                update: update
            });
            window.CanvasLayerPointer =  new CanvasLayer({
                map: map,
                update: updatePointer
            });

        }
        
        mapControl.removeBehaviorOverlay();
        onBehavioranalysis();
        onGetstaypoint();

        if (typeof(pointCollection) !== 'undefined') {
            map.removeOverlay(pointCollection);
        }
        var options = {
            size: BMAP_POINT_SIZE_HUGE,
            shape: BMAP_POINT_SHAPE_CIRCLE,
            color: 'rgba(0, 0, 0, 0)'
        };
        window.pointCollection = new BMap.PointCollection(totalPoints, options);  // 初始化PointCollection
        pointCollection.addEventListener('mouseover', function (e) {
            mapControl.addTrackPointOverlay(e.point, 'trackpointOverlay');
        });
        pointCollection.addEventListener('mouseout', function (e) {
            mapControl.removeTrackPointOverlay('trackpointOverlay');
        });
        pointCollection.addEventListener('click', function (e) {
            mapControl.removeTrackInfoBox();
            onGetaddress(e.point);
            mapControl.removeTrackPointOverlay('trackpointonOverlay');
            mapControl.addTrackPointOverlay(e.point, 'trackpointonOverlay');
            
        });

        map.addOverlay(pointCollection);  // 添加Overlay
        
    }

    /**
     * CanvasLayer 函数
     * 
     * @returns
     */
    function updatePointer() {
        var starttime = draw.starttime;
        var endtime = draw.endtime;
        var totalPoints = draw.totalPoints;
        var nextArray = [];
        var ctx = this.canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (totalPoints.length !== 0) {
            var lines = 1;
            var lineObj = {};
            var pixelPart = 0;
            var pixelPartUnit = 40;
            for (var i = 0, len = totalPoints.length; i < len - 1; i = i + 1) {
                var pixel = map.pointToPixel(totalPoints[i]);
                var nextPixel = map.pointToPixel(totalPoints[i + 1]);
                pixelPart = pixelPart + Math.pow(Math.pow(nextPixel.x - pixel.x, 2) + Math.pow(nextPixel.y - pixel.y, 2), 0.5);
                if (pixelPart <= pixelPartUnit) {
                    continue;
                }
                pixelPart = 0;
                ctx.beginPath();

                if (totalPoints[i + 1].loc_time - totalPoints[i].loc_time <= 5 * 60) {
                    // 箭头一共需要5个点：起点、终点、中心点、箭头端点1、箭头端点2

                    var midPixel = new BMap.Pixel(
                        (pixel.x + nextPixel.x) / 2,
                        (pixel.y + nextPixel.y) / 2
                    );

                    // 起点终点距离
                    var distance = Math.pow((Math.pow(nextPixel.x - pixel.x, 2) + Math.pow(nextPixel.y - pixel.y, 2)), 0.5);
                    // 箭头长度
                    var pointerLong = 4;
                    var aPixel = {};
                    var bPixel = {};
                    if (nextPixel.x - pixel.x === 0) {
                        if (nextPixel.y - pixel.y > 0) {
                            aPixel.x = midPixel.x - pointerLong * Math.pow(0.5, 0.5);
                            aPixel.y = midPixel.y - pointerLong * Math.pow(0.5, 0.5);
                            bPixel.x = midPixel.x + pointerLong * Math.pow(0.5, 0.5);
                            bPixel.y = midPixel.y - pointerLong * Math.pow(0.5, 0.5);
                        } else if (nextPixel.y - pixel.y < 0) {
                            aPixel.x = midPixel.x - pointerLong * Math.pow(0.5, 0.5);
                            aPixel.y = midPixel.y + pointerLong * Math.pow(0.5, 0.5);
                            bPixel.x = midPixel.x + pointerLong * Math.pow(0.5, 0.5);
                            bPixel.y = midPixel.y + pointerLong * Math.pow(0.5, 0.5);
                        } else {
                            continue;
                        }
                    } else {
                        var k0 = ((-Math.pow(2, 0.5) * distance * pointerLong + 2 * (nextPixel.y - pixel.y) * midPixel.y) / (2 * (nextPixel.x - pixel.x))) + midPixel.x;
                        var k1 = -((nextPixel.y - pixel.y) / (nextPixel.x - pixel.x));
                        var a = Math.pow(k1, 2) + 1;
                        var b = 2 * k1 * (k0 - midPixel.x) - 2 * midPixel.y;
                        var c = Math.pow(k0 - midPixel.x, 2) + Math.pow(midPixel.y, 2) - Math.pow(pointerLong, 2);

                        aPixel.y = (-b + Math.pow(b * b - 4 * a * c, 0.5)) / (2 * a);
                        bPixel.y = (-b - Math.pow(b * b - 4 * a * c, 0.5)) / (2 * a);
                        aPixel.x = k1 * aPixel.y + k0;
                        bPixel.x = k1 * bPixel.y + k0;
                    }
                    ctx.moveTo(aPixel.x, aPixel.y);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#eee';
                    ctx.lineTo(midPixel.x, midPixel.y);
                    ctx.lineTo(bPixel.x, bPixel.y);
                    ctx.lineCap = 'round';
                }
                if (totalPoints[i].loc_time >= starttime && totalPoints[i + 1].loc_time <= endtime) {
                    ctx.stroke();
                }
            }
        }
    }

    function updateBack() {
        var starttime = draw.starttime;
        var endtime = draw.endtime;
        var totalPoints = draw.totalPoints;
        var nextArray = [];
        var ctx = this.canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (totalPoints.length !== 0) {
            var lines = 1;
            var lineObj = {};

            for (var i = 0, len = totalPoints.length; i < len - 1; i++) {

                var pixel = map.pointToPixel(totalPoints[i]);
                var nextPixel = map.pointToPixel(totalPoints[i + 1]);
                ctx.beginPath();

                ctx.moveTo(pixel.x, pixel.y);
                if (totalPoints[i + 1].loc_time - totalPoints[i].loc_time <= 5 * 60) {
                    // 绘制轨迹的时候绘制两次line，一次是底色，一次是带速度颜色的。目的是实现边框效果
                    ctx.lineWidth = 10;
                    ctx.strokeStyle = '#8b8b89';
                    ctx.lineTo(nextPixel.x, nextPixel.y);
                    ctx.lineCap = 'round';

                } else {
                    lines = lines + 1;
                    var lineNum = lines;
                    nextArray.push([pixel, nextPixel]);
                }
                if (totalPoints[i].loc_time >= starttime && totalPoints[i + 1].loc_time <= endtime) {
                    ctx.stroke();
                }

            }
        }
    }

    function update() {
        var starttime = draw.starttime;
        var endtime = draw.endtime;
        var totalPoints = draw.totalPoints;
        var nextArray = [];
        var ctx = this.canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        if (totalPoints.length !== 0) {
            var lines = 1;
            var lineObj = {};
            for (var i = 0, len = totalPoints.length; i < len - 1; i++) {

                var pixel = map.pointToPixel(totalPoints[i]);
                var nextPixel = map.pointToPixel(totalPoints[i + 1]);
                ctx.beginPath();
                ctx.moveTo(pixel.x, pixel.y);
                if (totalPoints[i + 1].loc_time - totalPoints[i].loc_time <= 5 * 60) {
                    // 绘制带速度颜色的轨迹
                    ctx.lineCap = 'round';
                    ctx.lineWidth = 8;
                    var grd = ctx.createLinearGradient(pixel.x, pixel.y, nextPixel.x, nextPixel.y);
                    var speed = totalPoints[i].speed;
                    var speedNext = totalPoints[i + 1].speed;
                    grd.addColorStop(0, getColorBySpeed(speed));
                    grd.addColorStop(1, getColorBySpeed(speedNext));
                    ctx.strokeStyle = grd;
                    ctx.lineTo(nextPixel.x, nextPixel.y);
                } else {
                    lines = lines + 1;
                    var lineNum = lines;
                    // lineObj['l' + i] = lines;
                    nextArray.push([pixel, nextPixel]);
                    if (totalPoints[i + 1].loc_time >= starttime && totalPoints[i + 1].loc_time <= endtime) {
                        var partImgStart = new Image();
                        partImgStart.src = __uri('/static/images/startpoint.png');
                        var next = nextPixel;
                        partImgStart.onload = function () {
                            var width = [4, 8];
                            ctx.drawImage(partImgStart, next.x - 10, next.y - 30);
                            ctx.font = 'lighter 14px arial';
                            ctx.fillStyle = 'white';
                            ctx.fillText(lineNum, next.x - width[lineNum >= 10 ? 1 : 0], next.y - 15);
                        };
                    }
                    if (totalPoints[i].loc_time >= starttime && totalPoints[i].loc_time <= endtime) {
                        var current = pixel;
                        var partImgEnd = new Image();
                        partImgEnd.src = __uri('/static/images/endpoint.png');
                        partImgEnd.onload = function () {
                            var width = [4, 8];
                            ctx.drawImage(partImgEnd, current.x - 10, current.y - 30);
                            ctx.font = 'lighter 14px arial';
                            ctx.fillStyle = 'white';
                            ctx.fillText(lineNum - 1, current.x - width[lineNum >= 10 ? 1 : 0], current.y - 15);
                        };
                    }
                }
                if (totalPoints[i].loc_time >= starttime && totalPoints[i + 1].loc_time <= endtime) {
                    ctx.stroke();
                }

            }
        }

        if (totalPoints[0].loc_time >= starttime) {
            var imgStart = new Image();
            imgStart.src = '../../static/images/startpoint.png';
            imgStart.onload = function () {
                var width = [4, 8];
                ctx.drawImage(imgStart, map.pointToPixel(totalPoints[0]).x - 10, map.pointToPixel(totalPoints[0]).y - 30);
                ctx.font = 'lighter 14px arial';
                ctx.fillStyle = 'white';
                ctx.fillText('1', map.pointToPixel(totalPoints[0]).x - width[lines >= 10 ? 1 : 0], map.pointToPixel(totalPoints[0]).y - 15);
            };
        }
        if (totalPoints[totalPoints.length - 1].loc_time <= endtime) {
            var imgEnd = new Image();
            imgEnd.src = '../../static/images/endpoint.png';
            imgEnd.onload = function () {
                var width = [4, 8];
                ctx.drawImage(imgEnd, map.pointToPixel(totalPoints[totalPoints.length - 1]).x - 10, map.pointToPixel(totalPoints[totalPoints.length - 1]).y - 30);
                ctx.font = 'lighter 14px arial';
                ctx.fillStyle = 'white';
                ctx.fillText(lines, map.pointToPixel(totalPoints[totalPoints.length - 1]).x - width[lines >= 10 ? 1 : 0], map.pointToPixel(totalPoints[totalPoints.length - 1]).y - 15);
            };
        }
    }


    function getColorBySpeed(speed) {
        var color = '';
        var red = 0;
        var green = 0;
        var blue = 0;
        speed = speed > 100 ? 100 : speed;
        switch (Math.floor(speed / 25)) {
            case 0:
                red = 187;
                green = 0;
                blue = 0;
            break;
            case 1:
                speed = speed - 25;
                red = 187 + Math.ceil((241 - 187) / 25 * speed);
                green = 0 + Math.ceil((48 - 0) / 25 * speed);
                blue = 0 + Math.ceil((48 - 0) / 25 * speed);
            break;
            case 2:
                speed = speed - 50;
                red = 241 + Math.ceil((255 - 241) / 25 * speed);
                green = 48 + Math.ceil((200 - 48) / 25 * speed);
                blue = 48 + Math.ceil((0 - 48) / 25 * speed);
            break;
            case 3:
                speed = speed - 75;
                red = 255 + Math.ceil((22 - 255) / 25 * speed);
                green = 200 + Math.ceil((191 - 200) / 25 * speed);
                blue = 0 + Math.ceil((43 - 0) / 25 * speed);
            break;
            case 4:
                red = 22;
                green = 191;
                blue = 43;
            break;
        }

        red = red.toString(16).length === 1 ? '0' + red.toString(16) : red.toString(16);
        green = green.toString(16).length === 1 ? '0' + green.toString(16) : green.toString(16);
        blue = blue.toString(16).length === 1 ? '0' + blue.toString(16) : blue.toString(16);
        color = '#' + red + green + blue;
        return color;
    }





    // =============================  时间轴
    
    /**
     * 初始化时间轴
     *
     */
    function initTimeLine() {
        var temp = [];
        for(var i = 0; i < 24; i++){
            temp[i] = i;
        }
        timeline.timeCount = temp;
        timeline.timeNumber = temp.concat([24]);
        $timelineMain.prepend(bt('bt-timeline', timeline));
        
        // 播放暂停
        $timelinePlay.on('click', function(e){
            handlePlayOrPause(e);
        });

        // 进度条
        $timelineProgress.on('mousedown', function(e){
            timeline.initMouseX = e.clientX;
            $document.on('mousemove', onProgessDrag);
            $document.on('mouseup', onProgressDragMouseUp);
        });

        // 提示时间
        $timelineMain.on('mouseover', function(e){
            handleHoverLabel(e);
        })
        .on('mouseout', function(){
            $timelineLabel.removeClass('block').addClass('blank');
        })
        .on('click', function(e){
            handleTimelineClick(e);
        });
            
        // 进度条快进放慢
        $('#timelineSlow').on('click', function(e){
            handleSlow(e);
        });
        $('#timelineQuick').on('click', function(e){
            handleQuick(e);
        });

        // 卡尺移动
        $('#caliperPointerA, #caliperPointerB').on('mousedown', function(e){
            handleCaliperDragStart(e);
        });
        
    }
    
    /**
     * 点击卡尺
     *
     * @param {Object} event 事件对象
     */
    function handleCaliperDragStart(event) {
        if (track.trackRouteNoZero.length === 0) return;
        var caluperCurrent = event.target.parentElement.className;
        timeline.caluperCurrent = caluperCurrent
        
        $document.on('mousemove', handleCaliperDrag);
        $document.on('mouseup', handleCaliperDragEnd);
        $('body').css('user-select', 'none');
    }

    /**
     * 拖动卡尺
     *
     * @param {Object} event 事件对象
     */
    function handleCaliperDrag(event) {
        var x = event.clientX - $timelineMain.offset().left;
        if (x < 0 || x > timeline.timelineLong) return;
        var caluperCurrent = timeline.caluperCurrent;
        if (caluperCurrent === 'caliperA' && x < timeline.caliperBPosition) {
            timeline.caliperAPosition = x;
            $caliperA.css({'left': x + 'px'});
            $caliperPartA.css({'width': x + 'px'});
        } else if (caluperCurrent === 'caliperB' && x > timeline.caliperAPosition) {
            timeline.caliperBPosition = x;
            $caliperB.css({'left': x + 'px'});
            $caliperPartB.css({'width': timeline.timelineLong - x + 'px'});
        }
        handleHoverLabel(event);
    }

    /**
     * 抬起卡尺
     *
     * @param {Object} event 事件对象
     */
    function handleCaliperDragEnd(event) {
        var x = event.clientX - $timelineMain.offset().left;
        var clientx = event.clientX;
        if (x < 0) {
            x = 0;
            clientx = $timelineMain.offset().left;
        } else if (x >= timeline.timelineLong) {
            x = timeline.timelineLong;
            clientx = $timelineMain.offset().left + timeline.timelineLong;
        }
        // 设置卡尺位置
        var caluperCurrent = timeline.caluperCurrent;
        if (caluperCurrent === 'caliperA' && x < timeline.caliperBPosition) {
            timeline.caliperAPosition = x;
            $caliperA.css({'left': x + 'px'});
            $caliperPartA.css({'width': x + 'px'});
            var starttime = getTimeByPx(x);
            var endtime = getTimeByPx(timeline.caliperBPosition);
            drawTrack(null, starttime, endtime);
        } else if (caluperCurrent === 'caliperB' && x > timeline.caliperAPosition) {
            timeline.caliperBPosition = x;
            $caliperB.css({'left': x + 'px'});
            $caliperPartB.css({'width': timeline.timelineLong - x + 'px'});

            var starttime = getTimeByPx(timeline.caliperAPosition);
            var endtime = getTimeByPx(x);
            drawTrack(null, starttime, endtime);
        }

        $('body').css('user-select', 'text');
        $document.off('mousemove', handleCaliperDrag);
        $document.off('mouseup', handleCaliperDragEnd);


        // 控制播放进度跳转
        if (timeline.caluperCurrent === 'caliperA') {
            jumpTime(clientx);
        } else {
            jumpTime(timeline.caliperAPosition + $timelineMain.offset().left);
        }

        // 暂定播放
        handlePlayOrPause({
            target: {
                className: 'timelinePause'
            }
        });
    }

    /**
     * 绘制时间轴
     *
     * @param {data} 轨迹数据
     */
    function listenTrackRoute(data) {
        // this.initCaliper();
        if (data.length === 0) return;
        var timePart = [{}];
        var pxPart = [{}];
        var j = 0;
        var date = new Date(data[0].loc_time * 1000);
        timeline.initTimeStamp = data[0].loc_time - (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds());
        timePart[j].start_time = data[0].loc_time;
        pxPart[j].start_time = getPxByTime(data[0].loc_time);
        for (var i = 0; i < data.length - 1; i++) {
            if (data[i + 1].loc_time - data[i].loc_time <= 5 * 60) {
                timePart[j].end_time = data[i + 1].loc_time;
                pxPart[j].end_time = getPxByTime(data[i + 1].loc_time);
            } else {
                j++;
                timePart[j] = {};
                timePart[j].start_time = data[i + 1].loc_time;
                pxPart[j] = {};
                pxPart[j].start_time = getPxByTime(data[i + 1].loc_time);
            }
        }

        timeline.dataPart = pxPart;
        timeline.progress = pxPart[0].start_time - 0;
        timeline.currentProgress = pxPart[0].start_time - 0;
        timeline.initMouseX = $timelineProgress.offset().left + 20;
        timeline.currentPageX = $timelineProgress.offset().left + 20;
        $timelineProgress.css('left', timeline.progress);
        $runPart.css({'left': pxPart[0].start_time + 'px', 'width': pxPart[0].end_time - pxPart[0].start_time + 'px'});
        
        if (typeof(canvasLayerRunning) != "undefined") {
            map.removeOverlay(canvasLayerRunning);
            canvasLayerRunning = undefined;
        }
        setRunningPointByProgress(pxPart[0].start_time - 0);
    }
    
    
    /**
     * 点击时间轴跳跃时间
     *
     * @param {object} event 事件对象 
     */
    function handleTimelineClick(event) {
        if (track.trackRouteNoZero.length === 0) return;
        if (event.target.className === 'timelineProgress' || event.target.className.indexOf('caliperPointer') > -1)  return;
        jumpTime(event.clientX);
    }
     /**
     * 点击时间轴跳跃时间
     *
     * @param {number} clientx 偏移
     */
    function jumpTime(clientx) {
        var x = clientx - $timelineMain.offset().left;
        timeline.progress = x;
        timeline.currentProgress = x;
        timeline.currentPageX = clientx;
        $timelineProgress.css('left', timeline.currentProgress);
        setRunningPointByProgress(x);
    }
    /**
     * 加速播放
     *
     * @param {object} event 事件对象 
     */
    function handleQuick(event) {
        if (track.trackRouteNoZero.length === 0) return;
        if (timeline.playSpeedIndex < 10)  timeline.playSpeedIndex += 1;
    }
    /**
     * 减速播放
     *
     * @param {object} event 事件对象 
     */
    function handleSlow(event) {
        if (track.trackRouteNoZero.length === 0) return;
        if (timeline.playSpeedIndex > 0)  timeline.playSpeedIndex -= 1;
    }

    /**
     * 拖动事件监听
     *
     * @param {object} event 事件对象 
     */
    function onProgessDrag(event) {
        if (track.trackRouteNoZero.length === 0) return;
        var x = event.clientX - timeline.initMouseX;
        var newProgress = x + timeline.currentProgress;
        
        if (newProgress >= 0 && newProgress <= timeline.timelineLong) {
            timeline.progress = newProgress;
            $timelineProgress.css('left', newProgress);
        }
    
        setRunningPointByProgress(newProgress);
        handleHoverLabel(event);
    }

    /**
     *  拖动抬起鼠标
     *
     * @param {object} event 事件对象 
     */
    function onProgressDragMouseUp (event) {
        handleProgressDragEnd(event);
        timeline.currentPageX = event.clientX;
    }

      /**
     * 拖动时间轴位置
     *
     * @param {object} event 事件对象 
     */
    function handleProgressDragEnd(event) {
        if (track.trackRouteNoZero.length === 0) return;
        $document.off('mousemove', onProgessDrag);
        $document.off('mouseup', onProgressDragMouseUp);
        timeline.currentProgress = timeline.progress;
        setRunningPointByProgress(timeline.currentProgress)
    }
    /**
     * 鼠标浮动到时间轴上后显示事件label
     *
     * @param {Object} event 事件对象
     */
    function handleHoverLabel(event) {
        if (event.target.className.indexOf('caliperPointer') > -1) return;
        var x = event.clientX - $timelineMain.offset().left;
        // 一像素两分钟
        var time = x * 120;
        var hour = parseInt(time / (60 * 60), 10);
        var min = parseInt(time % (60 * 60) / 60, 10);
        $timelineLabel.removeClass('blank').addClass('block');
        if (hour >= 0 && hour <= 24 && min >= 0 && min <= 59 && hour * 100 + min <= 2400) {
            min = min >= 10 ? min : '0' + min;

            $timelineLabel.css('left', x).find('.timelineLabelcontent').text(hour + ':' + min);
        }
    }

    /**
     * 播放停止轨迹
     * 
     * @param {any} event
     * @returns
     */
    function handlePlayOrPause(event) {
        if (track.trackRouteNoZero.length === 0) return;
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        var step = function(timestamp) {
            var speed = timeline.playSpeed[timeline.playSpeedIndex];
            timeline.currentProgress += speed;
            timeline.progress += speed;
            timeline.currentPageX += speed;
            $timelineProgress.css('left', timeline.progress);
            setRunningPointByProgress(timeline.progress + speed);
            if (timeline.progress + speed > timeline.caliperBPosition) {
                $timelinePlay.removeClass('timelinePause').addClass('timelinePlay');
                return;
            }
            if ($timelinePlay.hasClass('timelinePause')) {
                requestAnimationFrame(step);
            } 
        }
        if (event.target.className === 'timelinePause') {
            $timelinePlay.removeClass('timelinePause').addClass('timelinePlay');
        } else {
            $timelinePlay.removeClass('timelinePlay').addClass('timelinePause');
            requestAnimationFrame(step);
        }
    }

    /**
     * 根据时间轴位置设置轨迹点位置
     *
     * @param {number} progress 时间戳 
     */
    function setRunningPointByProgress(progress) {
        var point = getPointByTime(getTimeByPx(progress + 0));
        if (point.loc_time !== undefined){
            setRunningPoint(point);
        }
    }

    /**
     *  根据时间戳获取时间轴像素位置
     *
     * @param {number} time 时间戳 
     * @return {number} 像素位置
     */
    function getPxByTime(time) {
        var px = 0;
        // 像素 = (当前时间戳 + （北京时区 * 60 * 60））% 一天的秒) / (一个时间轴像素代表的秒数)
        px = (time + 28800) % 86400 / 120;
        return px;
    }

    /**
     * 根据时间轴位置获取对应数据中时间点
     *
     * @param {number} px 像素位置 
     * @return {number} 时间戳
     */
    function getTimeByPx(px) {
        var time = 0;
        time = (px) * 120 + timeline.initTimeStamp;
        return time;
    }

    /**
     * 根据时间获取数据点
     *
     * @param {number} time 时间戳 
     * @return {object} 数据点
     */
    function getPointByTime(time) {
        var point = {};
        var totalPoint = draw.totalPoints;
        if (time < totalPoint[0].loc_time) {
            point = totalPoint[0];
            return point;
        }
        if (time > totalPoint[totalPoint.length - 1].loc_time) {
            point = totalPoint[totalPoint.length - 1];
            return point;
        }
        for (var i = 0; i < totalPoint.length - 1; i++){

            if (time >= totalPoint[i].loc_time && time <= totalPoint[i + 1].loc_time) {
                point = totalPoint[i];
                break;
            }
        }
        return point;
    }

     /**
     * 根据数据点绘制实时位置
     *
     * @param {object} data 数据点 
     */
    function setRunningPoint(data) {
        var update = function () {
            var ctx = this.canvas.getContext("2d");
            if (!ctx)  return;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            var point = new BMap.Point(data.lng, data.lat);
            var pixel = map.pointToPixel(point);
            
            ctx.beginPath();
            ctx.strokeStyle = '#d0d4d7'
            ctx.arc(pixel.x, pixel.y, 35, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = 'rgba(35, 152, 255, 0.14)';
            ctx.arc(pixel.x, pixel.y, 34, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = '#c2c2c4';
            ctx.arc(pixel.x, pixel.y, 8, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(pixel.x, pixel.y, 7, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = '#1496ff';
            ctx.arc(pixel.x, pixel.y, 2.6, 0, 2 * Math.PI);
            ctx.fill();
        }
        if(typeof(canvasLayerRunning) != 'undefined') {
            canvasLayerRunning.options.update = update;
            canvasLayerRunning._draw();
            return;
        }
        window.canvasLayerRunning =  new CanvasLayer({
            map: map,
            update: update,
            zIndex: 10
        });

    }


   


    // ======================== 轨迹纠偏，驾驶行为分析
     function initSpeedControl() {
        setTimeout(function(){
            mapControl.showSpeedControl();
        },3000);
    }

    function initTrackAnalysis(){
        // 展开关闭
        $analysis.on('click', function(e){
            handleTogglePanel($analysis, $(this));
        });
        $analysisTitle.on('click', function(e){
            handleTogglePanel($analysisTitle, $(this));
        });
        $('.closePanel').on('click', function(e){
            $(this).parent().removeClass('visible').addClass('hidden');
            $analysis.removeClass('analysisHeaderPointOffUp').addClass('analysisHeaderPointOffDown')
        });

        // 选择选项初始化
        $('.processControl input, .behaviorControl input').iCheck({
            checkboxClass: 'icheckbox_square-blue',
            radioClass: 'iradio_square-blue',
            increaseArea: '20%' // optional
        });

        // 轨迹纠偏,选择选项
        $('.processSwitchOff').on('click', function(e){
            handleProcessSwitch($(this));
        });

        $('#denoise').on('ifChecked', function(event){
            track.trackProcess.need_denoise = '1';
            updateTrackProcess();
        })
        .on('ifUnchecked', function(event){
            track.trackProcess.need_denoise = '0';
            updateTrackProcess();
        });

        $('#vacuate').on('ifChecked', function(event){
            track.trackProcess.need_vacuate = '1';
            updateTrackProcess();
        })
        .on('ifUnchecked', function(event){
            track.trackProcess.need_vacuate = '0';
            updateTrackProcess();
        });

        $('#mapmatch').on('ifChecked', function(event){
            track.trackProcess.need_mapmatch = '1';
            updateTrackProcess();
        })
        .on('ifUnchecked', function(event){
            track.trackProcess.need_mapmatch = '0';
            updateTrackProcess();
        });

        $('#byCar').on('ifChecked', function(event){
            track.trackProcess.transport_mode = '1';
            updateTrackProcess();
        });
        $('#byBike').on('ifChecked', function(event){
            track.trackProcess.transport_mode = '2';
            updateTrackProcess();
        });
        $('#byWalk').on('ifChecked', function(event){
            track.trackProcess.transport_mode = '3';
            updateTrackProcess();
        });

        // 驾驶行为分析,选择选项
        $('.behaviorSwitchOff').on('click', function(e){
            handleBehaviorSwitch($(this));
        });

        $('#speeding').on('ifChecked', function(event){
            track.behaviorCheck[0] = '1';
            $controlItemNum.eq(0).removeClass('controlItemNumOff').addClass('controlItemNumOn');
            updateAnalysisBehavior();
        })
        .on('ifUnchecked', function(event){
             track.behaviorCheck[0] = '0';
            $controlItemNum.eq(0).removeClass('controlItemNumOn').addClass('controlItemNumOff');
            updateAnalysisBehavior();
        });
        
        $('#acceleration').on('ifChecked', function(event){
            track.behaviorCheck[1] = '1';
            $controlItemNum.eq(1).removeClass('controlItemNumOff').addClass('controlItemNumOn');
            updateAnalysisBehavior();
        })
        .on('ifUnchecked', function(event){
             track.behaviorCheck[1] = '0';
            $controlItemNum.eq(1).removeClass('controlItemNumOn').addClass('controlItemNumOff');
            updateAnalysisBehavior();
        });
        
        $('#steering').on('ifChecked', function(event){
            track.behaviorCheck[2] = '1';
            $controlItemNum.eq(2).removeClass('controlItemNumOff').addClass('controlItemNumOn');
            updateAnalysisBehavior();
        })
        .on('ifUnchecked', function(event){
             track.behaviorCheck[2] = '0';
            $controlItemNum.eq(2).removeClass('controlItemNumOn').addClass('controlItemNumOff');
            updateAnalysisBehavior();
        });
        
        $('#staypoint').on('ifChecked', function(event){
            track.behaviorCheck[3] = '1';
            $controlItemNum.eq(3).removeClass('controlItemNumOff').addClass('controlItemNumOn');
            updateAnalysisBehavior();
        })
        .on('ifUnchecked', function(event){
            track.behaviorCheck[3] = '0';
            $controlItemNum.eq(3).removeClass('controlItemNumOn').addClass('controlItemNumOff');
            updateAnalysisBehavior();
        });
    }


    /**
     * 开关轨迹纠偏, 驾驶行为分析面板
     *
     * @param {object} event 事件对象 
     */
    function handleTogglePanel($dom, $this) {
        var index = $dom.index($this);
        var $trackPanelCurrent = $trackPanel.eq(index);
        if($trackPanelCurrent.hasClass('hidden')){
            $trackPanel.removeClass('visible').addClass('hidden');
            $trackPanelCurrent.removeClass('hidden').addClass('visible');
            $analysis.removeClass('analysisHeaderPointOffUp').addClass('analysisHeaderPointOffDown')
                .eq(index).removeClass('analysisHeaderPointOffDown').addClass('analysisHeaderPointOffUp');
        }else{
            $trackPanelCurrent.addClass('hidden').removeClass('visible');
            $analysis.eq(index).addClass('analysisHeaderPointOffDown').removeClass('analysisHeaderPointOffUp');
        }
    }

    /**
     * 切换轨迹纠偏总开关
     *
     * @param {object} event 事件对象 
     */
    function handleProcessSwitch($this) {
        if($this.hasClass('processSwitchOff')){
            $analysisTitle.eq(0).removeClass('analysisHeaderTitle1Off').addClass('analysisHeaderTitle1On');
            $this.removeClass('processSwitchOff').addClass('processSwitchOn');
            $processInput.iCheck('enable');
            track.trackProcess.is_processed = '1';
            updateTrackProcess();
        }else{
            $analysisTitle.eq(0).removeClass('analysisHeaderTitle1On').addClass('analysisHeaderTitle1Off');
            $this.removeClass('processSwitchOn').addClass('processSwitchOff');
            $processInput.iCheck('disable');
            track.trackProcess.is_processed = '0';
            updateTrackProcess();
        }
    }


    /**
     * 切换驾驶分析总开关
     *
     * @param {object} event 事件对象 
     */
    function handleBehaviorSwitch($this) {
        if($this.hasClass('behaviorSwitchOff')){
            $analysisTitle.eq(1).removeClass('analysisHeaderTitle2Off').addClass('analysisHeaderTitle2On');
            $this.removeClass('behaviorSwitchOff').addClass('behaviorSwitchOn');
            $behaviorInput.iCheck('enable');
            updateAnalysisBehavior();
        }else{
            $analysisTitle.eq(1).removeClass('analysisHeaderTitle2On').addClass('analysisHeaderTitle2Off');
            $this.removeClass('behaviorSwitchOn').addClass('behaviorSwitchOff');
            $behaviorInput.iCheck('disable');
            updateAnalysisBehavior(['0','0','0','0']);
        }

    }

    /**
     * 修改纠偏选项后重新加载路径
     *
     * @param {object} 更新轨迹纠偏状态
     */ 
    function updateTrackProcess() {
        onSelecttrack(track.selectTrack);
        getTracklist();
    }

    /**
     * 更新驾驶行为分析显示
     *
     * @param {array} 显示状态
     */
    function updateAnalysisBehavior(data) {
        data = data || track.behaviorCheck;
        mapControl.updataBehaviorDisplay(data);
    }


    /**
     * getstaypoint，获取停留点
     *
     */
    function onGetstaypoint() {
        if (track.selectTrack === '' || track.staypointSearching === 1) return;
        track.staypointSearching = 1;
        var entity_name = track.selectTrack;
        var tempTimeArr = [];
        track.trackStayRouteSortData = [];
        track.trackStayRoutePointData = [];
        var partTime = Math.floor((track.end_time - track.start_time) / 6);
        for(var i = 0; i < 6; i++) {
            tempTimeArr[i] = {
                start_time: track.start_time + i * partTime,
                end_time: track.start_time + (i + 1) * partTime - 1,
                index: i
            }
        }
        tempTimeArr[5].end_time = track.end_time;
        var params = {
            'entity_name': track.selectTrack,
            'service_id': service_id,
            'ak': ak
        };
        var count = 1;
        var reTrackRoute = function (paramsr) {

            var newParams = {
                'service_id': paramsr.service_id,
                'ak': paramsr.ak,
                'entity_name': paramsr.entity_name,
                'start_time': paramsr.start_time,
                'end_time': paramsr.end_time,
                'process_option': 'need_denoise=' + track.trackProcess.need_denoise + ','
                                  + 'need_vacuate=' + track.trackProcess.need_vacuate + ','
                                  + 'need_mapmatch=' + track.trackProcess.need_mapmatch + ','
                                  + 'transport_mode=' + track.transport_mode[track.trackProcess.transport_mode - 1]
            };
            var search = function (paramsearch, counta) {
                $.ajax({
                    type: "GET",  
                    url: url3+"/analysis/staypoint",
                    dataType: 'jsonp',
                    data: paramsearch,
                    success: function(data){
                        if(data.status === 0) {
                            track.trackStayRouteSortData.push({index: counta, data: data});
                            if(++track.trackStayRouteDataCount === 6) {
                                track.trackStayRouteDataCount = 0;
                                track.trackStayRouteSortData.sort(function(a,b){return a.index - b.index});

                                for(var i = 0; i < 6; i++) {
                                    if (track.trackStayRouteSortData[i].data.stay_points !== undefined) {
                                        track.trackStayRoutePointData = track.trackStayRoutePointData.concat(track.trackStayRouteSortData[i].data.stay_points);
                                    }
                                }
                                drawStaypoint(track.trackStayRoutePointData);
                                track.staypointSearching = 0;
                            }
                        }
                    },
                    error: function(){
                        console.log('获取单个实体的轨迹里程停留点失败');
                    }
                });
                
            };
            search(newParams, count++);
        };
        tempTimeArr.map(function (item){
            params.start_time = item.start_time;
            params.end_time = item.end_time;
            reTrackRoute(params);
        }); 
    }

    /**
     * 绘制轨迹停留点
     *
     * @param {Array} data 轨迹数据 可选
     * @param {number} starttime 时间区间起点 可选
     * @param {number} endtime 时间区间终点 可选
     */
    function drawStaypoint(data) {
        if (!data) data = track.trackStayRoutePointData;
        var starttime = draw.starttime;
        var endtime = draw.endtime;
        $controlItemNum.eq(3).text(data.length);

        var points = [];
        for (var i = 0;i < data.length; i++) {
            points[i] = {
                latitude: data[i].stay_point.latitude,
                longitude: data[i].stay_point.longitude
            }
            var point = new BMap.Point(points[i].longitude, points[i].latitude);
            var during = data[i].end_time - data[i].start_time;
            var hour = during / 3600 >= 1 ? Math.floor(during / 3600) + '小时' : '';
            var minute = (during % 3600 / 60).toFixed(0) + '分钟';
            var value = '停留' + hour + minute;
            if (starttime <= data[i].start_time && data[i].end_time <= endtime) {
                mapControl.addBehaviorOverlay(point, 'behaviorPlace', value);
            }
        }
        updateAnalysisBehavior(track.behaviorCheck);
    }
    /**
     *  behavioranalysis，驾驶分析
     *
     */
    function onBehavioranalysis() {
        if (track.selectTrack === '' || track.analysisbehaviorSearching === 1) return;
        track.analysisbehaviorSearching = 1;
        var entity_name = track.selectTrack;
        var tempTimeArr = [];
        track.trackBehaviorSortData = [];
        track.trackBehaviorPointData = {
            harsh_acceleration: [],
            harsh_breaking: [],
            harsh_steering: [],
            speeding: []
        };
        var partTime = Math.floor((track.end_time - track.start_time) / 6);
        for(var i = 0; i < 6; i++) {
            tempTimeArr[i] = {
                start_time: track.start_time + i * partTime,
                end_time: track.start_time + (i + 1) * partTime - 1,
                index: i
            }
        }
        tempTimeArr[5].end_time = track.end_time;
        var params = {
            'entity_name': track.selectTrack,
            'service_id': service_id,
            'ak': ak
        };
        var count = 1;
        var reBehavior = function (paramsr) {
            var newParams = {
                'service_id': paramsr.service_id,
                'ak': paramsr.ak,
                'entity_name': paramsr.entity_name,
                'start_time': paramsr.start_time,
                'end_time': paramsr.end_time,
                'process_option': 'need_denoise=' + track.trackProcess.need_denoise + ','
                                  + 'need_vacuate=' + track.trackProcess.need_vacuate + ','
                                  + 'need_mapmatch=' + track.trackProcess.need_mapmatch + ','
                                  + 'transport_mode=' + track.transport_mode[track.trackProcess.transport_mode - 1]
            };
            var search = function (paramsearch, counta) {
                $.ajax({
                    type: "GET",  
                    url: url3+"/analysis/drivingbehavior",
                    dataType: 'jsonp',
                    data: paramsearch,
                    success: function(data){
                        if(data.status === 0) {
                            track.trackBehaviorSortData.push({index: counta, data: data});
                            if(++track.trackBehaviorDataCount === 6) {
                                track.trackBehaviorDataCount = 0;
                                track.trackBehaviorSortData.sort(function(a,b){return a.index - b.index});

                                for(var i = 0; i < 6; i++) {
                                    track.trackBehaviorPointData.harsh_acceleration = track.trackBehaviorPointData.harsh_acceleration.concat(
                                        track.trackBehaviorSortData[i].data.harsh_acceleration
                                    );
                                    track.trackBehaviorPointData.harsh_breaking = track.trackBehaviorPointData.harsh_breaking.concat(
                                        track.trackBehaviorSortData[i].data.harsh_breaking
                                    );
                                    track.trackBehaviorPointData.harsh_steering = track.trackBehaviorPointData.harsh_steering.concat(
                                        track.trackBehaviorSortData[i].data.harsh_steering
                                    );
                                    track.trackBehaviorPointData.speeding = track.trackBehaviorPointData.speeding.concat(
                                        track.trackBehaviorSortData[i].data.speeding
                                    );
                                }
                                drawAnalysisBehavior(track.trackBehaviorPointData);
                                track.analysisbehaviorSearching = 0;
                            }
                        }
                    },
                    error: function(){
                        console.log('获取单个实体的轨迹里程驾驶分析失败');
                    }
                });
            };
            search(newParams, count++);
        };
        tempTimeArr.map(function (item){
            params.start_time = item.start_time;
            params.end_time = item.end_time;
            reBehavior(params);
        }); 
    }

    /**
     * 绘制轨迹分析点
     *
     * @param {Array} data 轨迹数据 可选
     * @param {number} starttime 时间区间起点 可选
     * @param {number} endtime 时间区间终点 可选
     */
    function drawAnalysisBehavior(data) {
        if (!data) data = track.trackBehaviorPointData;
        var starttime = draw.starttime;
        var endtime = draw.endtime;

        track.behavior.behaviorSpeeding = data.speeding.length;
        track.behavior.behaviorAcceleration = data.harsh_acceleration.length + data.harsh_breaking.length;
        track.behavior.behaviorSteering = data.harsh_steering.length;
        $controlItemNum.eq(0).text(track.behavior.behaviorSpeeding);
        $controlItemNum.eq(1).text(track.behavior.behaviorAcceleration);
        $controlItemNum.eq(2).text(track.behavior.behaviorSteering);


        var accelerationPoints = [];
        for (var i = 0;i < data.harsh_acceleration.length; i++) {
            accelerationPoints[i] = {
                latitude: data.harsh_acceleration[i].latitude,
                longitude: data.harsh_acceleration[i].longitude
            }
            var point = new BMap.Point(accelerationPoints[i].longitude, accelerationPoints[i].latitude);
            var value = '急加速';
            let loc_time = data.harsh_acceleration[i].loc_time;
            if (starttime <= loc_time && loc_time <= endtime) {
                mapControl.addBehaviorOverlay(point, 'behaviorAccelecation', value);
            }
        }
        var breakingPoints = [];
        for (let i = 0;i < data.harsh_breaking.length; i++) {
            breakingPoints[i] = {
                latitude: data.harsh_breaking[i].latitude,
                longitude: data.harsh_breaking[i].longitude
            }
            var point = new BMap.Point(breakingPoints[i].longitude, breakingPoints[i].latitude);
            var value = '急减速';
            let loc_time = data.harsh_breaking[i].loc_time;
            if (starttime <= loc_time && loc_time <= endtime) {
                mapControl.addBehaviorOverlay(point, 'behaviorBreaking', value);
            }
        }
        var steeringPoints = [];
        for (let i = 0;i < data.harsh_steering.length; i++) {
            steeringPoints[i] = {
                latitude: data.harsh_steering[i].latitude,
                longitude: data.harsh_steering[i].longitude
            }
            var point = new BMap.Point(steeringPoints[i].longitude, steeringPoints[i].latitude);
            var value = '急转弯';
            let loc_time = data.harsh_steering[i].loc_time;
            if (starttime <= loc_time && loc_time <= endtime) {
                mapControl.addBehaviorOverlay(point, 'behaviorSteering', value);
            }
        }
        var speekingPoints = [];
        for (let i = 0;i < data.speeding.length; i++) {
            speekingPoints[i] = {
                latitude: data.speeding[i].speeding_points[0].latitude,
                longitude: data.speeding[i].speeding_points[0].longitude
            }
            var point = new BMap.Point(speekingPoints[i].longitude, speekingPoints[i].latitude);
            var value = '超速 ' + Math.floor(data.speeding[i].speeding_points[0].actual_speed) + ' | 限速 ' + data.speeding[i].speeding_points[0].limit_speed;
            let loc_time = data.speeding[i].speeding_points[0].loc_time;
            if (starttime <= loc_time && loc_time <= endtime) {
                mapControl.addBehaviorOverlay(point, 'behaviorSpeeking', value);
            }
        }
        updateAnalysisBehavior(track.behaviorCheck);
    }

    
    /**
     * 进行地址解析
     *
     * @param {Object} point 点对象
     */
    function onGetaddress(point) {
        var parmas = {
            location: point.lat + ',' + point.lng,
            output: 'json',
            service_id: service_id,
            ak: ak,
        };

        $.ajax({
            type: "GET",  
            url: url2+'/',
            dataType: 'jsonp',
            data: parmas,
            timeStamp:1495504132465,
            success: function(data){
                var infoBoxObject = getTrackPointInfo(data, point);
                mapControl.setTrackInfoBox(infoBoxObject);
            },
            error: function(){
                console.log('获取信息地址失败');
            } 
        });
    }
    
    /**
     * 整合轨迹点信息窗口的数据格式
     *
     * @param {Object} data 逆地址解析返回的结果
     * @param {Object} point 轨迹点对象数据
     *
     * @return {Object} 轨迹点信息窗口所需数据
     */
    function getTrackPointInfo(data, point) {
        var address = '';
        if (data.status === 0) {
            if (data.result.formatted_address !== '') {
                address = data.result.formatted_address;
            } else {
                address = data.result.addressComponent.city + ', ' + data.result.addressComponent.country;
            }
        } else {
            address = '地址未解析成功';
        }
        var infoBoxObject = {
            point: point,
            print: point.print,
            infor: [
                ['定位:', point.lnglat],
                ['地址:', address],
                ['速度:', point.printSpeed],
                ['时间:', point.printTime],
                ['高度:', point.height + '米'],
                ['精度:', point.radius + '米']
            ]
        };
        return infoBoxObject;
    }

});