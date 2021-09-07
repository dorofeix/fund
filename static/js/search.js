$(function () {
    var $searchInput = $('.search-area input'),
        $searchButton = $('.search-area button'),
        $resultList = $('.result-list tbody');
    function renderList(data) {
        $resultList.html('');
        for (let item of data) {
            $tr = $('<tr></tr>').data('fundcode', item[0]);
            $td1 = $('<td></td>').appendTo($tr);
            $('<span></span>').text(item[0] + ' ').appendTo($td1);
            $('<br class="is-hidden-desktop"/>').appendTo($td1);
            $('<span></span>').text(item[1]).appendTo($td1);
            $('<td></td>').text(item[2]).appendTo($tr);
            $td3 = $('<td></td>').appendTo($tr);
            $buttons = $('<span class="buttons has-addons"></span>').appendTo($td3);
            // $('<button class="button is-small">加自选</button>').appendTo($buttons);
            $('<a class="button is-small" target="_blank">去下单</a>').attr('href', './order.html?fund=' + item[0].toString()).appendTo($buttons);
            $tr.appendTo($resultList);
        }
    }
    function doSearch(keyword, limit=50) {
        keyword && (keyword=keyword.toUpperCase());
        let result = [];
        for (let arr of window.r) {
            for (let i of arr) {
                if (i.search(keyword)!==-1) {
                    result.push([arr[0], arr[2], arr[3]]);
                    break;
                }
            }
            if (result.length>=limit) {
                break;
            }
        }
        renderList(result);
    }
    window.searchKeyword = '';
    window.hashchangetrigger = function () {
        keyword = getQueryString('keyword');
        if (keyword != window.searchKeyword) {
            window.searchKeyword = keyword;
            doSearch(keyword);
        }
    }
    window.hashchangetrigger();
    window.searchKeyword && $searchInput.val(window.searchKeyword);
    var inputStr = '';
    $searchInput.keyup(function () {
        currInput = $searchInput.val();
        if (currInput !== inputStr) {
            (() => {
                let curr = currInput;
                setTimeout(() => {
                    curr == $searchInput.val() && doSearch(curr);
                }, 500);
            })();
            inputStr = currInput;
        }
    });
    $searchButton.click(() => {
        doSearch($searchInput.val());
    })
})