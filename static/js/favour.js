$(function(){
    $('.main .card-header>button').click(function(){
        $this = $(this);
        $this.find('.iconfont').toggleClass('icon-down').toggleClass('icon-upward');
        $this.parent().parent().find('.card-content').slideToggle(200);
    });

    // 获取当前持仓
    var holdings = [],
        tot_value = 0,
        gz_value = 0;
        gz_time = '-',
        txjj_q = 'jj000001';
    window.testprint = () => console.log({gz_time, tot_value, gz_value, holdings});
    $.getJSON('./data/summary.json', data => {
        data = data.summary.split('\n');
        gz_time = data[1].split(',')[16].trim();
        data.forEach(l => {
            l = l.trim().split(',');
            // arr => [0基金名称, 1基金代码, 2最新净值, 3持有份额, 4持有市值, 5估算净值, 6估值时间, 7净值日期]
            let arr = [l[1], l[2], parseFloat(l[3]), parseFloat(l[5]), parseFloat(l[6]), parseFloat(l[3]), '', l[16]];
            if ( isNaN(arr[3]) || (!(arr[4] > 0.5)) ) { return; }
            tot_value += arr[2] * arr[3];
            holdings.push(arr);
        });
        gz_value = tot_value;
        txjj_q = ['jj000001'];
        holdings.forEach(arr => txjj_q.push('jj' + arr[1]));
        txjj_q = txjj_q.join(',');
        fill_summary();
        render_holding();
        fetch_gz();
    });

    var $radio_data_source = $('.radio-data-source input[name=data-source]'),
        $radio_data_source_label = $('.radio-data-source label.radio');
        gz_funcs = {txjj: fetch_gz_txjj, ttjj: fetch_gz_ttjj};

    var fetch_gz = () => {
        $btn_refresh.addClass('is-loading').removeClass('is-light').removeClass('is-link');
        $radio_data_source_label.attr('disabled', true);
        $radio_data_source.attr('disabled', true);
        gz_funcs[$radio_data_source.filter(':checked').val()]();
    }

    $radio_data_source.click(fetch_gz);

    var $holding = $('.main .card.holding .card-content'),
        $summary = $holding.find('.summary'),
        $btn_refresh = $summary.find('.btn-refresh');
    window.v_jj000001 = null;
    function fetch_gz_txjj(){
        if (window.v_jj000001 !== null) {return; }
        let url = 'https://qt.gtimg.cn/q=' + txjj_q + '&t=' + new Date().getTime().toString();
        $.getScript(url, () => {
            if (window.v_jj000001 === null) {
                console.log('获取估值数据失败');
                return;
            }
            window.v_jj000001 = null;
            gz_value = 0;
            holdings.forEach(arr => {
                // arr => [0基金名称, 1基金代码, 2最新净值, 3持有份额, 4持有市值, 5估算净值, 6估值时间, 7净值日期]
                let k = 'v_jj' + arr[1],
                    gz = null;
                if (k in window) {
                    try {
                        let l = window[k].split('~');
                        arr[6] = l[4];
                        gz = parseFloat(l[2]);

                    } catch (err) { gz = null; }
                }
                if (!isNaN(gz)) {
                    arr[5] = gz;
                }
                if (arr[6].indexOf(arr[7]) === -1) {
                    gz_value += arr[5] * arr[3];
                } else {
                    gz_value += arr[2] * arr[3];
                }
                
            });
            $btn_refresh.removeClass('is-loading').addClass('is-light').addClass('is-link');
            $radio_data_source.removeAttr('disabled');
            $radio_data_source_label.removeAttr('disabled');
            gz_time = dateFormat("YYYY-mm-dd HH:MM:SS", new Date());
            fill_summary();
            render_holding();
            testprint();
        } );
    }

    var ttjj_gz = {};
    window.jsonpgz = data => {
        if (data && data.fundcode) {
            ttjj_gz[data.fundcode] = [data.gsz, data.gztime];
        }
    };
    function fetch_gz_ttjj(){
        var fundcodel = holdings.map(arr => arr[1]);

        function _finish(){
            gz_value = 0;
            holdings.forEach(arr => {
                // arr => [0基金名称, 1基金代码, 2最新净值, 3持有份额, 4持有市值, 5估算净值, 6估值时间, 7净值日期]
                let k = arr[1],
                    gz = null;
                if (k in ttjj_gz) {
                    try {
                        gz = parseFloat(ttjj_gz[k][0]);
                        arr[6] = ttjj_gz[k][1];

                    } catch (err) { gz = null; }
                }
                if (gz&& (!isNaN(gz)) ) {
                    arr[5] = gz;
                }
                if (arr[6].indexOf(arr[7]) === -1) {
                    gz_value += arr[5] * arr[3];
                } else {
                    gz_value += arr[2] * arr[3];
                }
                
            });
            $btn_refresh.removeClass('is-loading').addClass('is-light').addClass('is-link');
            $radio_data_source.removeAttr('disabled');
            $radio_data_source_label.removeAttr('disabled');
            gz_time = dateFormat("YYYY-mm-dd HH:MM:SS", new Date());
            fill_summary();
            render_holding();
            testprint();
        }
        
        function _fetch(i){
            let url = 'https://fundgz.1234567.com.cn/js/' + fundcodel[i] + '.js';
            $.getScript(url, () => {
                i++;
                if (i < fundcodel.length) {
                    _fetch(i);
                } else {
                    _finish();
                }
                
            });
        }
        _fetch(0);
    }
    
    $btn_refresh.click(fetch_gz);
    
    var $gz_dgr = $summary.find('.gz-dgr'),
        $gz_income = $summary.find('.gz-income'),
        $gz_value = $summary.find('.gz-value'),
        $gz_time = $summary.find('.gz-time');
    function fill_summary(){
        let gz_dgr = Math.round( (gz_value - tot_value) / tot_value * 10000 ) / 100,
            gz_income = Math.round( (gz_value - tot_value) * 100 ) / 100;
        [
            [$gz_dgr, gz_dgr, gz_dgr >= 0 ? '+': '', '%', true],
            [$gz_income, gz_income, gz_income >= 0 ? '+': '', '', true],
            [$gz_value, Math.round(gz_value*100) / 100, '', '', false],
        ].forEach(arr => {
           if (arr[4]) {
               arr[0].removeClass('has-text-danger').removeClass('has-text-success').
               addClass(arr[1] >= 0 ? 'has-text-danger': 'has-text-success');
           }
           arr[0].text(arr[2] + arr[1].toString() + arr[3]);
        });
        if (gz_time.length === 19) {
            let arr = gz_time.split(' ');
            $('<span class="is-hidden-mobile"></span>').text(arr[0] + ' ').appendTo($gz_time.html(''));
            $('<span></span>').text(arr[1]).appendTo($gz_time);
        } else {
            $gz_time.html('').text(gz_time);
        }
    }

    var $holding_fund_li = $holding.find('.fund-li'),
        $window = $(window);
    function render_holding(){
        let tpl =  `
            <div class="fund-li-item column is-one-quarter-fullhd is-one-third-widescreen is-half-tablet">
                <div class="fund-li-item-box">
                    <div class="fund-h"> <span class="fund-name">-</span> <small class="fund-code">-</small> </div>
                    <div class="columns is-multiline is-mobile">

                        <div class="h column is-half">估算涨幅</div>
                        <div class="gz-dgr column is-half">-</div>

                        <div class="h column is-half">估算收益</div>
                        <div class="gz-income column is-half">-</div>

                        <div class="h column is-half">估算市值</div>
                        <div class="gz-value column is-half">-</div>

                        <div class="h column is-half is-hidden-mobile">持有市值</div>
                        <div class="curr-value column is-half is-hidden-mobile">-</div>

                        <div class="h column is-half is-hidden-mobile">估算净值</div>
                        <div class="gz-nav column is-half is-hidden-mobile">-</div>
                        
                        <div class="h column is-half is-hidden-mobile">公布净值</div>
                        <div class="curr-nav column is-half is-hidden-mobile">-</div>

                        <div class="h column is-half is-hidden-mobile">净值日期</div>
                        <div class="nav-dt column is-half is-hidden-mobile">-</div>

                        <div class="h column is-half">估值时间</div>
                        <div class="gz-time column is-half">-</div>
                    </div>
                </div>
            </div>
        `;
        $holding_fund_li.html('');
        holdings.forEach(arr => {
            // arr => [0基金名称, 1基金代码, 2最新净值, 3持有份额, 4持有市值, 5估算净值, 6估值时间, 7净值日期]

            let curr_value = Math.round( arr[2] * arr[3] * 100 ) / 100;

            let gz_dgr = Math.round( (arr[5] / arr[2] - 1) * 10000 ) / 100;
            gz_dgr = ( (gz_dgr>=0) ? '+' : '') + gz_dgr.toString() + '%';

            let gz_value = Math.round( arr[5] * arr[3] * 100 ) / 100;

            let gz_income = Math.round( ( gz_value - curr_value ) * 100 ) / 100;
            ( gz_income > 0 ) && ( gz_income = '+' + gz_income.toString() );

            let $item = $(tpl).appendTo($holding_fund_li).find('.fund-li-item-box');
            
            // 估值日期不能和净值日期相同
            // arr[6].indexOf(arr[7]) === -1
            if (arr[6] && (arr[6].indexOf(arr[7])===-1)) {
                $item.addClass(  (gz_income>=0) ? 'has-background-danger' : 'has-background-success');
                gz_time = arr[6];
                gz_nav = arr[5];
            } else {
                $item.addClass('has-background-info-dark');
                gz_time = '无数据';
                gz_dgr = '-';
                gz_income = '-';
                gz_value = '-';
                gz_nav = '-';
            }
            
            [
                [$item.find('.fund-name'), arr[0]],
                [$item.find('.fund-code'), arr[1]],
                [$item.find('.curr-nav'), arr[2]],
                [$item.find('.curr-value'), curr_value],
                [$item.find('.gz-nav'), gz_nav],
                [$item.find('.nav-dt'), arr[7]],
                [$item.find('.gz-dgr'), gz_dgr],
                [$item.find('.gz-income'), gz_income],
                [$item.find('.gz-value'), gz_value],
            ] .forEach( x => x[0].text(x[1]) );

            if (gz_time.length === 19) {
                try {
                    let t = gz_time.split(' ', 2);
                    $item.find('.gz-time').html('').
                        append($('<span class="dt"></span>').text(t[0]+' ')).
                        append($('<span class="tm"></span>').text(t[1]));
                } catch (err) {
                    $item.find('.gz-time').text(gz_time);
                }
            } else {
                $item.find('.gz-time').text(gz_time);
            }
        });
        $window.resize();
    }

    $window.resize(() => {
        try {
            if ($holding_fund_li.find('.fund-li-item:first').width() < 330) {
                $holding_fund_li.find('.gz-time>.dt').hide();
            } else {
                $holding_fund_li.find('.gz-time>.dt').show();
            }
        } catch (err) {}
    });

});