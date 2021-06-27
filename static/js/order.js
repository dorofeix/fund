$(function(){
    var $main = $('.main'),
        $loading = $('.loading'),
        $records_li = $main.find('.records-li').hide(),
        $pager = $main.find('.pager').hide(),
        $pager_li = $pager.find('.pagination-list'),
        $pager_nums = null;

    (function () {
        var $loading_dot = $loading.find('.dot'),
            a = 0;
        setInterval(() => {
            $loading_dot.text(new Array(a % 4 + 1).join('.'));
            a = a + 1;
        }, 500);
    })();

    var all_records = [],
        all_records_page_num = 0,
        records_page_size = 10,
        records_curr_page = 1,
        edited = false;
    function render_page(page) {
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
                <div class="direction"></div>
                <div class="fund">
                    <div class="code">-</div>
                    <div class="name">-</div>
                </div>
                <div class="del">
                    <a class="delete"></a>
                </div>
                <div class="amount">
                    <div class="price">-</div>
                    <div class="hb">-</div>
                </div>
                <div class="is-clearfix"></div>
                <div class="notification is-link is-light" style="display: none"></div>
            </div>
        `;
        $records_li.html('');
        let x = (page - 1) * records_page_size,
            y = x + records_page_size,
            data = all_records.slice(x, y);
        
        for (let n1 in data) {
            arr = data[n1];
            if (arr[0] === '1980-01-01') { continue; }
            let $day = $('<div class="day"></div>').
                append($(tpl_btn).attr('dt', arr[0])).
                append($('<div class="dt"></div>').text(arr[0])).
                appendTo($records_li);
            let $records = $('<div class="records"></div>').appendTo($day);
            let d = {};
            for (let n2 in arr[1]) {
                let r = arr[1][n2];
                let k = '交易平台：' + (r[4].trim() || '其他');
                if (!(k in d)) { d[k] = []; }
                d[k].push(r.concat([parseInt(n1)+x, n2]));
            }
            for (let k in d) {
                $records.append($('<div style="padding-left: 5px"></div>').text(k));
                d[k].forEach(r => {
                    let $record = $(tpl_record).appendTo($records);
                    $record.find('a.delete').attr('n1', r[6]).attr('n2', r[7]);
                    $record.find('.fund>.code').text(r[0]);
                    $record.find('.fund>.name').text(r[1]);
                    let $amount = $record.find('.amount');
                    let $direction = $record.find('.direction');
                    if (r[2] > 0) {
                        $direction.append($('<span class="has-text-danger">买入</span>'));
                        if (r[3] > 0) {
                            $amount.find('.price').text(r[2].toString() + '元');
                            $amount.find('.hb').text('+' + r[3].toString() + '元红包');
                        } else {
                            $amount.html('').text(r[2].toString() + '元');
                        }
                    } else if (r[2] < 0) {
                        $direction.append($('<span class="has-text-primary">卖出</span>'));
                        $amount.html('').text(r[2].toString() + '份');
                    }
                    r[5] = r[5].trim();
                    if (r[5]) { $record.find('.notification').show().text('备注：' + r[5]); }
                });
            }
        }
    }
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
    $records_li.on('click', 'a.delete', e => {
        if (!confirm('移除此条记录？')){ return; }
        let $e = $(e.currentTarget),
            n1 = parseInt($e.attr('n1')),
            n2 = parseInt($e.attr('n2')),
            page = Math.ceil((n1 + 1) / records_page_size),
            page_n = parseInt(n1 + records_page_size - page * records_page_size);
        all_records[n1][1].splice(n2, 1);
        edited = true;
        change_page(page, false);
        $records_li.find('button.btn-toggle').eq(page_n).click();
    });
    function change_page(page, check_curr_page=true) {
        if ((page < 1) || (page > all_records_page_num)) { return; }
        if (check_curr_page && (page == records_curr_page)) { return; }
        render_page(page);
        records_curr_page = page;
        ($pager_nums || $pager_li.find('a')).
            removeClass('is-current').
            filter('[num=' + page.toString() + ']').
            addClass('is-current');
    }
    function pager_resize(curr=1) {
        let num = Math.ceil((all_records.length-1) / records_page_size);
        if (num == all_records_page_num) {
            $pager_li.find('a').
                removeClass('is-current').
                filter('[num=' + curr.toString() + ']').
                addClass('is-current');
            return;
        }
        all_records_page_num = num;
        $pager_li.html('');
        for (let i = 1; i <= all_records_page_num; i++) {
            $('<li></li>').appendTo($pager_li).append(
                $('<a class="pagination-link"></a>').text(i).attr('num', i)
            );
        }
        $pager_li.find('a[num=' + curr.toString() + ']').addClass('is-current');
    }
    $main.find('.pagination>a').click(e => {
        change_page(records_curr_page + ($(e.currentTarget).hasClass('pagination-previous') ? -1 : 1));
    });
    $pager_li.on('click', 'a', e => {
        change_page(parseFloat($(e.currentTarget).attr('num')));
    });
    function refresh_data() {
        records_curr_page = 1;
        $loading.show();
        $main.hide();
        $pager.hide();
        $.getJSON('./data/records.json', (data) => {
            let tmp = {};
            data.forEach(arr => {
                if (!(arr[0] in tmp)) {
                    tmp[arr[0]] = [];
                }
                tmp[arr[0]].push(arr.slice(1));
            });
            tmp = Object.keys(tmp).map(x => [x, tmp[x]]).sort((a, b) => {
                return parseInt(b[0].replace('-', '').replace('-', '')) - parseInt(a[0].replace('-', '').replace('-', ''));
            });
            tmp.push(['1980-01-01', []])
            all_records = tmp;
            pager_resize(1);
            $pager.show();
            $pager_nums = $pager_li.find('a');
            render_page(1);
            $records_li.show();
            $loading.hide();
            $main.show();
            $records_li.find('button.btn-toggle').eq(0).click();
            $level.find('.button,a').attr('disabled', false);
        });
    }
    refresh_data();

    var $level = $main.find('.level');

    $level.find('.btn-unfold-all').click(() => $records_li.find('button.btn-toggle:not(.is-active)').click());
    $level.find('.btn-fold-all').click(() => $records_li.find('button.btn-toggle.is-active').click());

    var $btn_order = $level.find('.btn-order'),
        $btn_save = $level.find('.btn-save'),
        $btn_remake = $level.find('.btn-remake');
    
    $btn_remake.click(() => {
        let data = [];
        all_records.forEach(arr => {
            if (arr[0] !== '1980-01-01') {
                arr[1].forEach(r => data.push([arr[0],].concat(r)));
            }
        });
        var newwindow = window.open();
        newwindow.document.write(JSON.stringify(data));
    });
    
    $btn_save.click(() => {
        let data = [];
        all_records.forEach(arr => {
            if (arr[0] !== '1980-01-01') {
                arr[1].forEach(r => data.push([arr[0],].concat(r)));
            }
        });
        var url = 'data:application/json;charset=utf-8,' + JSON.stringify(data);
        $btn_save.attr('href', url);
    });

    var $modal = $('.modal'),
        $input_dt = $modal.find('input.dt'),
        $input_fund_kw = $modal.find('input.fund-kw'),
        $select_fund = $modal.find('select.fund'),
        $radios_trade = $modal.find('input[name=trade]'),
        $input_trade = $modal.find('input.trade'),
        $trade_unit = $modal.find('a.trade-unit'),
        $field_hb = $modal.find('div.field.hongbao'),
        $input_hb = $field_hb.find('input.hongbao'),
        $input_site = $modal.find('input.site'),
        $select_site = $modal.find('select.site'),
        $textarea_comment = $modal.find('textarea.comment'),
        $btn_confirm = $modal.find('button.btn-confirm');
    $modal.find('.btn-modal-close,.modal-close').click(() => $modal.removeClass('is-active'));

    $btn_confirm.click(() => {
        let $fund_selected = $select_fund.find(':selected'),
            dt = $input_dt.val(),
            fund_name = $fund_selected.text(),
            fund_code = $fund_selected.val(),
            direction = $radios_trade.filter(':checked').val(),
            amount = Math.round(Math.abs(parseFloat($input_trade.val())) * 100 * ( (direction=='buy')?1:-1)) / 100,
            hb = (Math.round(Math.abs(parseFloat($input_hb.val())) * 100) / 100) || 0,
            site = $input_site.val().trim(),
            comment = $textarea_comment.val().trim();
        if ((!dt) || (!fund_code) || (!fund_name)) {return;}
        if (!(amount > 0 || amount < 0)) {return;}
        let insert_data = [fund_code, fund_name, amount, hb, site, comment];
        for (var n in all_records) {
            let dt1 = parseInt(all_records[n][0].replace('-', '').replace('-', '')),
                dt2 = parseInt(dt.replace('-', '').replace('-', ''));
            if (dt1 < dt2) {
                all_records.splice(n, 0, [dt, [insert_data, ], ]);
                break;
            } else if (dt1 === dt2) {
                all_records[n][1].unshift(insert_data);
                break;
            }
        }
        n = parseInt(n);
        let page = Math.ceil((n + 1) / records_page_size),
            page_n = parseInt(n + records_page_size - page * records_page_size);
        pager_resize();
        edited = true;
        change_page(page, false);
        $records_li.find('button.btn-toggle').eq(page_n).click();
        $modal.removeClass('is-active');
    });
    
    $select_site.change(() => $input_site.val($select_site.val()));

    window.search_timeout = null;
    var inputStr = '';
    function do_search(kw, f){
        let result = [];
        for (let arr of window.r) {
            for (let i of arr) {
                if (i.search(kw) !== -1) {
                    result.push([arr[0], arr[2], arr[3]]);
                    break;
                }
            }
            if (result.length >= 10) {
                break;
            }
        }
        $select_fund.html('');
        result.forEach(arr => {
            $('<option></option>').val(arr[0]).text(arr[1]).appendTo($select_fund);
        });
        f && f();
    }
    $input_fund_kw.keyup(() => {
        currInput = $input_fund_kw.val();
        if (currInput !== inputStr) {
            (() => {
                if (window.search_timeout !== null) { clearTimeout(window.search_timeout); }
                let curr = currInput;
                window.search_timeout = setTimeout(() => {
                    curr && (curr == $input_fund_kw.val()) && do_search(curr);
                }, 600);
            })();
            inputStr = currInput;
        }
    });
    $select_fund.change(() => $input_fund_kw.val($select_fund.val()));

    $radios_trade.click(function(){
        if ($(this).val()==='buy') {
            $trade_unit.text('元');
            $field_hb.show();
        } else {
            $trade_unit.text('份');
            $field_hb.hide();
        }
    });
    
    var today = new Date(),
        curr_y = today.getFullYear(),
        curr_m = (today.getMonth() + 1).toString(),
        curr_d = today.getDate().toString(),
        curr_ymd = [
            curr_y,
            (curr_m.length < 2 ? '0' : '') + curr_m,
            (curr_d.length < 2 ? '0' : '') + curr_d,
        ].join('-');
    $input_dt.change(() => { curr_ymd = $input_dt.val(); });

    function new_order(dt, fund_code){
        dt = dt || curr_ymd;
        $input_dt.val(dt);
        $input_trade.val('');
        $textarea_comment.val('');
        $input_hb.val('');
        if (fund_code) {
            $main.hide();
            $loading.show();
            $input_fund_kw.val(fund_code);
            do_search(fund_code, () => {
                $modal.addClass('is-active');
                $main.show();
                $loading.hide();
            });
        } else {
            $modal.addClass('is-active');
        }
    }
    $btn_order.click(() => new_order());

    fund = getQueryString('fund');
    fund && new_order(null, fund.trim());

});