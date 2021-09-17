
$(function () {

    var navbar = $('#navbar'),
        navbarBurgers = navbar.find('.navbar-burger');

    navbarBurgers.click(function (e) {
        navbarBurgers.toggleClass('is-active');
        document.getElementById(navbarBurgers.data('target')).classList.toggle('is-active');
    });

    // 滚动时自动隐藏/显示导航栏
    var lastY = window.scrollY;
    $(window).scroll(function () {
        var currentY = window.scrollY;

        if (currentY > lastY) {
            if (navbar.is(":visible") && currentY - lastY > 20) {
                navbar.hide()
            };
        } else {
            if (!navbar.is(":visible")) {
                navbar.show()
            };
        }
        lastY = currentY;
    });


    
});
function setCookie(name, value, days=30) {
    var exp = new Date();
    exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
}
function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1)
                c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return ""
}
apikey = () => getCookie('api_key');
getQueryString = (name, search) => {
    search = search || window.location.search.substr(1) || window.location.hash.split("?")[1] || '';
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let r = search.match(reg);
    if (r != null) return decodeURI(r[2]); return null;
}

window.hashchangetrigger = function(){}
$(window).bind('hashchange', () => window.hashchangetrigger());

function dateFormat(fmt, date) {
    let ret;
    let opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}