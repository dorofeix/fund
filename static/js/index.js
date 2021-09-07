$(function(){
    var $loading = $('.loading'),
        $main = $('.main').hide();
        
    (function(){
        var $loading_dot = $loading.find('.dot'),
            a = 0;
        setInterval(() => {
            $loading_dot.text(new Array(a % 4 + 1).join('.'));
            a = a + 1;
        }, 500);
    })();

    var $site_intro = $('.site-intro.message').hide(),
        $site_intro_body = $site_intro.find('.message-body');
    $site_intro.find('button.delete').click(() => $site_intro.fadeOut(200));
    $.get('./data/msg.txt', data => {
        data = data.trim().split('\n');
        $site_intro.show().find('.message-header>p').text(data[0]);
        data.slice(1).map(l => $('<p></p>').text(l)).forEach($e => $site_intro_body.append($e));
    });

    // summary
    var $summary = $main.find('.summary'),
        $summary_tabs = $summary.find('.tabs li'),
        $summary_areas = $summary.find('.areas'),
        $dgr = $summary.find('.dgr'),
        $daily_income = $summary.find('.daily-income'),
        $dt = $summary.find('.dt'),
        $total_days = $summary.find('.total-days'),
        $total_return = $summary.find('.total-return'),
        $xirr = $summary.find('.xirr'),
        $total_cost = $summary.find('.total-cost'),
        $total_value = $summary.find('.total-value'),
        $total_income = $summary.find('.total-income');

    $summary_tabs.click(e => {
        $ele = $(e.currentTarget);
        $summary_tabs.removeClass('is-active');
        $ele.addClass('is-active');
        $summary_areas.hide();
        chart = trend_charts[$summary_areas.filter($ele.attr('target')).show().data('chart')];
        chart && chart.resize();
    });

    // lists
    var $lists = $main.find('.lists'),
        $lists_tabs = $lists.find('.tabs li'),
        $lists_areas = $lists.find('.areas'),
        $fund_positions = $lists_areas.filter('.fund-positions'),
        $fund_positions_list = $fund_positions.find('.lst'),
        $fund_positions_btn_unfold = $fund_positions.find('.btn-unfold');
    $lists_tabs.click(e => {
        $ele = $(e.currentTarget);
        $lists_tabs.removeClass('is-active');
        $ele.addClass('is-active');
        $lists_areas.hide();
        $lists_areas.filter($ele.attr('target')).show();
    });
    $fund_positions_btn_unfold.click(e => {
        $fund_positions_btn_unfold.hide();
        $fund_positions.removeClass('folded');
    });
    function render_fund_positions(data){
        var tpl = `<div class="item is-size-7-touch">
                        <div class="fund-title">
                            <span class="nm">-</span><small class="code">[-]</small><small class="dt">00-00-00</small>
                        </div>
                        <div class="columns is-mobile">
                            <div class="column">
                                <div class="h">总市值</div>
                                <div class="tot">-</div>
                            </div>
                            <div class="column">
                                <div class="h">净值/成本</div>
                                <div class="nav">-</div>
                                <div class="cost">-</div>
                            </div>

                            <div class="column">
                                <div class="h">总收益/率</div>
                                <div class="tot-profit">-</div>
                                <div class="tot-profit-percent">-</div>
                            </div>
                        </div>
                        <div class="daily">
                            <span class="h">最新收益：</span>
                            <span class="daily-income">-</span>
                            /
                            <span class="dgr">-</span>
                        </div>
                        <div class="is-clearfix"></div>
                    </div>`
        $fund_positions_list.html('');
        data.forEach(arr => {
            if (arr.length !== 17) { return }
            if (parseFloat(arr[6]) < 1) { return }

            $item = $(tpl);
            $item.find('.fund-title>.nm').text(arr[1]);
            $item.find('.fund-title>.code').text(arr[2]);
            $item.find('.fund-title>.dt').text(arr[16]);
            $item.find('.columns .tot').text(arr[6]);
            $item.find('.columns .nav').text(arr[3]);
            $item.find('.columns .cost').text(arr[4]);

            [
                [Math.round(parseFloat(arr[12]) * 100) / 100, $item.find('.columns .tot-profit'), 0],
                [Math.round(parseFloat(arr[13]) * 100) / 100, $item.find('.columns .tot-profit-percent'), 1],
                [Math.round(parseFloat(arr[14]) * 100) / 100, $item.find('.daily>.daily-income'), 0],
                [Math.round(parseFloat(arr[15]) * 10000) / 100, $item.find('.daily>.dgr'), 1],
            ].forEach(arr => {
                arr[1].addClass(arr[0] >= 0 ? 'has-text-danger' : 'has-text-success');
                arr[0] = arr[0] > 0 ? '+' + arr[0].toString() : arr[0].toString();
                arr[2] && (arr[0] = arr[0] + '%');
                arr[1].text(arr[0])
            });
            $item.appendTo($fund_positions_list);
            
        });
    }

    var $records_list = $lists_areas.filter('.records-list'),
        $records_li = $records_list.find('.li'),
        $records_pager = $records_list.find('.pagination').hide(),
        $records_pager_li = $records_pager.find('.pagination-list'),
        $records_pager_nums = null,
        records_page_size = 5,
        records_curr_page = 1;
    $records_li.on('click', 'button.btn-toggle', e => {
        let $e = $(e.currentTarget);
        let $i = $e.find('i');
        if ($i.hasClass('icon-upward')) {
            $i.removeClass('icon-upward').addClass('icon-down');
        } else {
            $i.removeClass('icon-down').addClass('icon-upward');
        }
        $e.toggleClass('is-active');
        $e.parent().find('.records').slideToggle("fast");
    });
    function render_records_li(page){
        page = page || 1;
        var tpl_btn = `
            <button class="button is-outlined is-small btn-toggle">
                <span class="icon is-small">
                    <i class="iconfont icon-upward"></i>
                </span>
            </button>
        `;
        var tpl_record = `
            <div class="record">
                <div class="direction">-</div>
                <div class="fund">
                    <div class="code">-</div>
                    <div class="name">-</div>
                </div>
                <div class="amount">
                    <div class="price">-</div>
                    <div class="hb">-</div>
                </div>
                <div class="is-clearfix"></div>
            </div>
        `;
        $records_li.html('');
        let x = (page - 1) * records_page_size,
            y = x + records_page_size,
            data = window.all_records.slice(x, y);
        data.forEach(arr => {
            let $day = $('<div class="day"></div>').
                append($(tpl_btn)).
                append($('<div class="dt"></div>').text(arr[0])).
                appendTo($records_li);
            let $records = $('<div class="records"></div>').appendTo($day);
            arr[1].forEach(r => {
                let $record = $(tpl_record).appendTo($records);
                $record.find('.fund>.code').text(r[0]);
                $record.find('.fund>.name').text(r[1]);
                $amount = $record.find('.amount');
                if (r[2] > 0) {
                    $record.find('.direction').text('买入').addClass('has-text-danger');
                    if (r[3] > 0) {
                        $amount.find('.price').text( r[2].toString() + '元' );
                        $amount.find('.hb').text( '+'+ r[3].toString() + '元红包' );
                    } else {
                        $amount.html('').text( r[2].toString() + '元' );
                    }
                } else if (r[2] < 0) {
                    $record.find('.direction').text('卖出').addClass('has-text-primary');
                    $amount.html('').text( r[2].toString() + '份');
                }
            });
        });
    }
    function records_li_change_page(page){
        if ((page < 1) || (page > window.all_records_page_num) || (page == records_curr_page) ) { return; }
        render_records_li(page);
        records_curr_page = page;
        ( $records_pager_nums || $records_pager_li.find('a') ).
            removeClass('is-current').
            filter('[num=' + page.toString() + ']').
            addClass('is-current');
    }
    $records_list.find('.pagination>a').click(e => {
        let $e = $(e.currentTarget);
        records_li_change_page(records_curr_page + ($e.hasClass('pagination-previous') ? -1 : 1));
    });
    $records_pager_li.on('click', 'a', e => {
        records_li_change_page(parseFloat($(e.currentTarget).attr('num')));
    });
    $.getJSON('./data/records.json', (data) => {
        let tmp = {};
        data.forEach(arr => {
            if ( !(arr[0] in tmp) ) {
                tmp[arr[0]] = [];
            }
            tmp[arr[0]].push(arr.slice(1));
        });
        tmp = Object.keys(tmp).map(x => [x, tmp[x]] ).sort((a, b) => {
            return parseInt(b[0].replace('-', '').replace('-', '')) - parseInt(a[0].replace('-', '').replace('-', ''));
        });
        for (let i = 0; i < tmp.length; i++) {
            let _tmp = {};
            tmp[i][1].forEach(arr => {
                let _key = arr[0];
                _key += arr[2] > 0 ? '_buy' : '_sell';
                if ( !(_key in _tmp) ) {
                    _tmp[_key] = [arr[0], arr[1], 0, 0];
                }
                _tmp[_key][2] = Math.round((_tmp[_key][2] + arr[2]) * 100) / 100;
                _tmp[_key][3] = Math.round((_tmp[_key][3] + arr[3]) * 100) / 100;
            });
            tmp[i][1] = Object.values(_tmp);
        }
        window.all_records = tmp;
        window.all_records_page_num = Math.ceil(tmp.length / records_page_size);
        $('<li><a class="pagination-link is-current" num="1">1</a></li>').appendTo($records_pager_li.html(''));
        for (let i = 2; i <= window.all_records_page_num; i++) {
            $('<li></li>').appendTo($records_pager_li).append(
                $('<a class="pagination-link"></a>').text(i).attr('num', i)
            );
        }
        $records_pager.show();
        $records_pager_nums = $records_pager_li.find('a');
        render_records_li(1);
        $records_li.find('button.btn-toggle').eq(0).click();
    });

    var $history = $lists_areas.filter('.history'),
        $history_li = $history.find('.li'),
        $history_pager = $history.find('.pagination').hide(),
        $history_pager_li = $history_pager.find('.pagination-list'),
        $history_pager_nums = null,
        history_page_size = 5,
        history_curr_page = 1;
    window.all_history_page_num = 0;
    function render_history_li(page){
        page = page || 1;
        var tpl_history_item = `
            <div class="item is-size-7-mobile">
                <div class="dt">-</div>
                <div class="columns is-mobile">
                    <div class="column">
                        <div class="h">持仓/收益</div>
                        <div class="tot">-</div>
                        <div class="tot-income">-</div>
                    </div>
                    <div class="column">
                        <div class="h">-</div>
                        <div class="h hh">当日数据</div>
                        <div class="h hh">计算红包</div>
                    </div>
                    <div class="column">
                        <div class="h">日收益</div>
                        <div class="daily-income">-</div>
                        <div class="daily-income-hb">-</div>
                    </div>
                    <div class="column">
                        <div class="h">增长率</div>
                        <div class="dgr">-</div>
                        <div class="dgr-hb">-</div>
                    </div>
                </div>
            </div>
        `;
        $history_li.html('');
        let x = (page - 1) * history_page_size,
            y = x + history_page_size,
            data = window.all_history.slice(x, y);
        console.log(data);
        data.forEach(arr => {
            let $item = $(tpl_history_item).appendTo($history_li);
            let _date = new Date(arr[0]);
            let y = _date.getFullYear().toString();
            let m = (_date.getMonth() + 1).toString();
            let d = (_date.getDate()).toString();
            $item.find('.dt').text(`${y}-${m}-${d}`);
            $item.find('.tot').text(arr[1]);
            $item.find('.tot-income').
                addClass(arr[6] < 0 ? 'has-text-success' : 'has-text-danger').
                text( (arr[6] > 0 ? '+' : '') + arr[6].toString() );
            $item.find('.daily-income').
                addClass(arr[2] < 0 ? 'has-text-success' : 'has-text-danger').
                text( (arr[2] > 0 ? '+' : '') + arr[2].toString() );
            $item.find('.daily-income-hb').
                addClass(arr[3] < 0 ? 'has-text-success' : 'has-text-danger').
                text( (arr[3] > 0 ? '+' : '') + arr[3].toString() );
            $item.find('.dgr').
                addClass(arr[4] < 0 ? 'has-text-success' : 'has-text-danger').
                text((arr[4] > 0 ? '+' : '') + arr[4].toString() + '%');
            $item.find('.dgr-hb').
                addClass(arr[5] < 0 ? 'has-text-success' : 'has-text-danger').
                text((arr[5] > 0 ? '+' : '') + arr[5].toString() + '%');


        });

        


    }
    function history_li_change_page(page) {
        if ((page < 1) || (page > window.all_history_page_num) || (page == history_curr_page)) { return; }
        render_history_li(page);
        history_curr_page = page;
        ($history_pager_nums || $history_pager_li.find('a')).
            removeClass('is-current').
            filter('[num=' + page.toString() + ']').
            addClass('is-current');
    }
    $history.find('.pagination>a').click(e => {
        history_li_change_page(history_curr_page + ($(e.currentTarget).hasClass('pagination-previous') ? -1 : 1));
    });
    $history_pager_li.on('click', 'a', e => {
        history_li_change_page(parseFloat($(e.currentTarget).attr('num')));
    });


    // charts
    var $charts = $main.find('.charts'),
        $charts_tabs = $charts.find('.tabs li'),
        $charts_areas = $charts.find('.areas');
    $charts_tabs.click(e => {
        $ele = $(e.currentTarget);
        $charts_tabs.removeClass('is-active');
        $ele.addClass('is-active');
        $charts_areas.hide();
        _charts[$charts_areas.filter($ele.attr('target')).show().find('.view').data('chart')].resize();
    })

    // indicator
    var $indicator = $main.find('.indicator-table');
    function render_indicator(data) {
        $indicator.html('<div class="columns is-mobile"><div class="column"></div><div class="column">实盘</div><div class="column">计红包</div><div class="column">沪深300</div></div>');
        data.forEach(arr => {
            $columns = $('<div class="columns is-mobile"></div>').appendTo($indicator);
            arr.forEach(i => $('<div class="column"></div>').text(i).appendTo($columns));
        });
    }

    // render
    var trend_charts = [],
        _charts = [];
    $(window).resize(() => {
        trend_charts.forEach(c => c.resize());
        _charts.forEach(c => c.resize());
    });
    function render_data() {
        $loading.hide();
        $main.show();
        var data = window.summary_data;
        
        data.history = JSON.parse(data.history) || {};
        var history_keys = Object.keys(data.history.date || {}).sort((a, b) => parseInt(b) - parseInt(a));

        // 概览数据
        if (history_keys.length) {
            var dgr = data.history.netvalue_hongbao[history_keys[0]] / data.history.netvalue_hongbao[history_keys[1]] - 1;
            dgr = Math.round(dgr * 10000) / 100;
            $dgr.addClass(dgr > 0 ? 'has-text-danger' : 'has-text-success');
            dgr = (dgr > 0 ? '+' : '') + dgr.toString() + '%';
            $dgr.text(dgr);

            var daily_income = data.history.profit_hongbao[history_keys[0]] - data.history.profit_hongbao[history_keys[1]];
            daily_income = Math.round(daily_income * 100) / 100;
            $daily_income.addClass(daily_income > 0 ? 'has-text-danger' : 'has-text-success');
            daily_income = (daily_income > 0 ? '+' : '') + daily_income.toString();
            $daily_income.text(daily_income);

            let _date = new Date(data.history.date[history_keys[0]]);
            let y = (_date.getFullYear() - 2000).toString();
            let m = (_date.getMonth() + 1).toString();
            let d = (_date.getDate()).toString();
            $dt.text(`${y}-${m}-${d}`);
        }
        
        var summary_items = data.summary.split('\n'),
            summary_total = summary_items[1].split(','),
            total_value = Math.round(parseFloat(summary_total[6]) * 100) / 100,
            total_cost = Math.round(parseFloat(summary_total[9]) * 100) / 100,
            total_income = (history_keys.length && Math.round(data.history.profit_hongbao[history_keys[0]] * 100) / 100) || '',
            total_return = Math.round((total_income / total_cost) * 10000) / 100,
            xirr = Math.round(data.xirrrate * 10000) / 100,
            total_days = history_keys.length && (data.history.date[history_keys[0]] - data.history.date['0']) / 1000 / (60*60*24);

        $total_days.text(Math.round(total_days));
        $total_return.addClass(total_return > 0 ? 'has-text-danger' : 'has-text-success');
        total_return = (total_return > 0 ? '+' : '') + total_return.toString() + '%';
        $total_return.text(total_return);

        $xirr.addClass(xirr > 0 ? 'has-text-danger' : 'has-text-success');
        xirr = (xirr > 0 ? '+' : '') + xirr.toString() + '%';
        $xirr.text(xirr);
        
        $total_cost.text(total_cost);
        $total_value.text(total_value);

        $total_income.addClass(total_income > 0 ? 'has-text-danger' : 'has-text-success');
        total_income = (total_income > 0 ? '+' : '') + total_income.toString();
        $total_income.text(total_income);

        // 业绩走势图
        function v_trend(datel, valuel, title) {
            let opts = { "animation": true, "animationThreshold": 2000, "animationDuration": 1000, "animationEasing": "cubicOut", "animationDelay": 0, "animationDurationUpdate": 300, "animationEasingUpdate": "cubicOut", "animationDelayUpdate": 0, "color": ["#c23531", "#2f4554", "#61a0a8", "#d48265", "#749f83", "#ca8622", "#bda29a", "#6e7074", "#546570", "#c4ccd3", "#f05b72", "#ef5b9c", "#f47920", "#905a3d", "#fab27b", "#2a5caa", "#444693", "#726930", "#b2d235", "#6d8346", "#ac6767", "#1d953f", "#6950a1", "#918597"], "series": [{ "type": "line", "name": title, "connectNulls": false, "symbolSize": 4, "showSymbol": false, "smooth": false, "step": false, "data": [], "hoverAnimation": true, "label": { "show": true, "position": "top", "margin": 8 }, "lineStyle": { "show": true, "width": 1, "opacity": 1, "curveness": 0, "type": "solid" }, "areaStyle": { "opacity": 0 }, "zlevel": 0, "z": 0 }], "legend": [{ "data": [title,], "selected": {}, "show": true, "padding": 5, "itemGap": 10, "itemWidth": 25, "itemHeight": 14 }], "tooltip": { "show": true, "trigger": "axis", "triggerOn": "mousemove", "axisPointer": { "type": "cross" }, "textStyle": { "fontSize": 14 }, "borderWidth": 0 }, "xAxis": [{ "show": true, "scale": false, "nameLocation": "end", "nameGap": 15, "gridIndex": 0, "inverse": false, "offset": 0, "splitNumber": 5, "minInterval": 0, "splitLine": { "show": false, "lineStyle": { "show": true, "width": 1, "opacity": 1, "curveness": 0, "type": "solid" } }, "data": [] }], "yAxis": [{ "show": true, "scale": false, "nameLocation": "end", "nameGap": 15, "gridIndex": 0, "inverse": false, "offset": 0, "splitNumber": 5, "minInterval": 0, "splitLine": { "show": false, "lineStyle": { "show": true, "width": 1, "opacity": 1, "curveness": 0, "type": "solid" } } }], "title": [{ "padding": 5, "itemGap": 10 }], "dataZoom": [{ "show": true, "type": "slider", "realtime": true, "start": 0, "end": 100, "orient": "horizontal", "zoomLock": false }, { "show": false, "type": "slider", "realtime": true, "start": 0, "end": 100, "orient": "vertical", "zoomLock": false }] };
            opts.legend[0].selected[title] = true;
            datel = datel || {};
            let _keys = Object.keys(datel).sort((a, b) => parseInt(a) - parseInt(b));
            let series_data = [];
            let xAxis_data = [];
            _keys.forEach(k => {
                let _date = new Date(datel[k]);
                let y = (_date.getFullYear() - 2000).toString();
                let m = (_date.getMonth() + 1).toString();
                let d = (_date.getDate()).toString();
                _date = `${y}-${m}-${d}`;
                series_data.push([_date, valuel[k]]);
                xAxis_data.push(_date);
            });
            opts.series[0].data = series_data;
            opts.xAxis[0].data = xAxis_data;
            return opts
        }

        [
            [$summary_areas.filter('.area3'), data.history.date, data.history.profit, '收益'],
            [$summary_areas.filter('.area4'), data.history.date, data.history.tot, '市值'],
            [$summary_areas.filter('.area6'), data.history.date, data.history.profit_hongbao, '计红包收益'],
        ].forEach(arr => {
            let chart = echarts.init(arr[0].find('.view')[0], 'white', { renderer: 'canvas' });
            arr[0].data('chart', trend_charts.length);
            trend_charts.push(chart);
            chart.setOption(v_trend(arr[1], arr[2], arr[3]));
        });

        data.v_netvalue = JSON.parse(data.v_netvalue);
        data.v_netvalue_hongbao = JSON.parse(data.v_netvalue_hongbao);
        [
            [$summary_areas.filter('.area2'), data.v_netvalue],
            [$summary_areas.filter('.area5'), data.v_netvalue_hongbao],
        ].forEach(arr => {
            let chart = echarts.init(arr[0].find('.view')[0], 'white', { renderer: 'canvas' });
            arr[0].data('chart', trend_charts.length);
            trend_charts.push(chart);
            chart.setOption(arr[1]);
        });

        // render_fund_positions
        render_fund_positions(summary_items.slice(2).map(x => x.split(',')));

        // render_history_li
        if (history_keys.length) {
            tmp = [];
            for (let i = 0; i < history_keys.length; i++) {
                let k = history_keys[i],
                    prev_k = history_keys[ (i < (history_keys.length-1)) ? i + 1 : i];
                tmp.push(
                    [
                        window.summary_data.history.date[k],

                        window.summary_data.history.tot[k],

                        window.summary_data.history.profit[k] -
                        window.summary_data.history.profit[prev_k],

                        window.summary_data.history.profit_hongbao[k] -
                        window.summary_data.history.profit_hongbao[prev_k],

                        ( (
                            (
                                window.summary_data.history.profit[k] -
                                window.summary_data.history.profit[prev_k]
                            ) / window.summary_data.history.tot[prev_k]
                        ) * 100 ) || 0,

                        ( (
                            (
                                window.summary_data.history.profit_hongbao[k] -
                                window.summary_data.history.profit_hongbao[prev_k]
                            ) / window.summary_data.history.tot[prev_k]
                        ) * 100 ) || 0,
                        
                        window.summary_data.history.profit_hongbao[k],

                    ].map(x => Math.round(x * 100) / 100)
                );
            }
            window.all_history = tmp;
            window.all_history_page_num = Math.ceil(history_keys.length / history_page_size);
            $('<li><a class="pagination-link is-current" num="1">1</a></li>').appendTo($history_pager_li.html(''));
            for (let i = 2; i <= window.all_history_page_num; i++) {
                $('<li></li>').appendTo($history_pager_li).append(
                    $('<a class="pagination-link"></a>').text(i).attr('num', i)
                );
            }
            $history_pager.show();
            $history_pager_nums = $history_pager_li.find('a');
            render_history_li(1);
        }
        
        // 分析指标数据
        if (data.indicator) {
            let indicator_data = [
                ['最大回撤', data.indicator.max_drawdown[2], data.indicator_hongbao.max_drawdown[2], data.indicator.benchmark_max_drawdown[2]],
                ['波动率', data.indicator.algorithm_volatility, data.indicator_hongbao.algorithm_volatility, data.indicator.benchmark_volatility],
                ['alpla', data.indicator.alpha, data.indicator_hongbao.alpha, '-'],
                ['beta', data.indicator.beta, data.indicator_hongbao.beta, '-'],
                ['夏普比率', data.indicator.sharpe, data.indicator_hongbao.sharpe, data.indicator.benchmark_sharp],
                ['信息比率', data.indicator.information_ratio, data.indicator_hongbao.information_ratio, '-'],
                ['相关系数', data.indicator.correlation_coefficient, data.indicator_hongbao.correlation_coefficient, '1.0'],
            ];
            [1, 2, 3].forEach(i => {
                [0, 1].forEach(ii => {
                    if (typeof indicator_data[ii][i] === 'number') {
                        indicator_data[ii][i] = (Math.round(indicator_data[ii][i] * 10000) / 100).toString() + '%';
                    }
                });
                [2, 3, 4, 5, 6].forEach(ii => {
                    if (typeof indicator_data[ii][i] === 'number') {
                        indicator_data[ii][i] = (Math.round(indicator_data[ii][i] * 100) / 100).toString();
                    }
                });
            });
            render_indicator(indicator_data);
        }
        
        // 分布图
        var $tradevolume = $main.find('.charts .tradevolume .view').data('chart', 2),
            $category_positions = $main.find('.charts .category-positions .view').data('chart', 0),
            $positions = $main.find('.charts .positions .view').data('chart', 1);
        
        // 底层持仓

        v_category_positions = {"animation":true,"animationThreshold":2000,"animationDuration":1000,"animationEasing":"cubicOut","animationDelay":0,"animationDurationUpdate":300,"animationEasingUpdate":"cubicOut","animationDelayUpdate":0,"color":["#c23531","#2f4554","#61a0a8","#d48265","#749f83","#ca8622","#bda29a","#6e7074","#546570","#c4ccd3","#f05b72","#ef5b9c","#f47920","#905a3d","#fab27b","#2a5caa","#444693","#726930","#b2d235","#6d8346","#ac6767","#1d953f","#6950a1","#918597"],"series":[{"type":"pie","name":"总值占比","clockwise":true,"data":[],"radius":["0%","75%"],"center":["50%","50%"],"label":{"show":false,"position":"center","margin":8},"tooltip":{"show":true,"trigger":"item","triggerOn":"mousemove|click","axisPointer":{"type":"line"},"formatter":"{a}<br/>{b}:{c}({d}%)","textStyle":{"fontSize":14},"borderWidth":0},"rippleEffect":{"show":true,"brushType":"stroke","scale":2.5,"period":4}}],"legend":[{"data":[],"selected":{},"type":"scroll","show":true,"left":"left","orient":"vertical","padding":5,"itemGap":10,"itemWidth":25,"itemHeight":14}],"tooltip":{"show":true,"trigger":"item","triggerOn":"mousemove|click","axisPointer":{"type":"line"},"textStyle":{"fontSize":14},"borderWidth":0},"title":[{"padding":5,"itemGap":10}]}

        var chart_category_positions = echarts.init($category_positions[0], 'white', { renderer: 'canvas' });

        var portfolio = [],
            portfolio_keys = [];
        for (let _name in data.portfolio) {
            _v = data.portfolio[_name]
            _dict = {'stock': '股票', 'bond': '债券', 'cash': '存款'};
            _name = (_name in _dict) ? _dict[_name] : _name;
            portfolio_keys.push(_name);
            portfolio.push({name: _name, value: _v});
        }
        v_category_positions['legend'][0]['data'] = portfolio_keys;
        v_category_positions['series'][0]['data'] = portfolio;
        chart_category_positions.setOption(v_category_positions);

        // 基金占比
        var chart_positions = echarts.init($positions[0], 'white', { renderer: 'canvas' });
        data.v_positions = JSON.parse(data.v_positions);
        data.v_positions.series[0].data = data.v_positions.series[0].data.filter(x=>x.value>1);
        chart_positions.setOption(data.v_positions);

        // 交易金额分布
        var chart_tradevolume = echarts.init($tradevolume[0], 'white', { renderer: 'canvas' });
        data.v_tradevolume = JSON.parse(data.v_tradevolume);
        chart_tradevolume.setOption(data.v_tradevolume);

        _charts = [chart_category_positions, chart_positions, chart_tradevolume];
    }

    function fetch_data(){
        $.getJSON('./data/summary.json', (data) => {
            if (data.status !== 'Running') {
                if (window.polling) {
                    clearInterval(window.polling);
                    window.polling = null;
                }
                window.summary_data = data;
                render_data();
                console.log(data);
            } else {
                if (typeof (window.polling) === "undefined") {
                    window.polling = setInterval(fetch_data, 1000);
                }
            }
        });
    }
    fetch_data();
});