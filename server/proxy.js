const request = require('request');
const fs = require('fs');
function Proxy(params = {}) {
    let conf = {
        order: '8d4552df4d73e81f6474d1cab0d9570c',
        targetURL: '',
        testTime: 5,
        sleepTime: 2000,
        ...params
    }
    let apiURL = 
    // let apiURL = 'http://api.ip.data5u.com/dynamic/get.html?order=' + conf.order + '&sep=3';
    // let apiURL = 'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=100&area=%E4%B8%AD%E5%9B%BD&carrier=0&protocol=0&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=1&system=1&distinct=0&rettype=0&seprator=%0D%0A'
    // let apiURL = 'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=100&carrier=0&protocol=0&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=1&system=1&distinct=0&rettype=0&seprator=%0D%0A';
    // 'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=100&carrier=0&protocol=1&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=3&system=1&distinct=0&rettype=1&seprator=%0D%0A'
    // 仅含国内
    'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=10000&area=%E4%B8%AD%E5%9B%BD&carrier=0&protocol=0&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=2&system=1&distinct=0&rettype=1&seprator=%0D%0A';
    // 'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=10000&area=%E4%B8%AD%E5%9B%BD&carrier=0&protocol=0&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=2&system=1&distinct=0&rettype=1&seprator=%0D%0A'
    // 包含海外， 本地开全局代理使用
    'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=100&carrier=0&protocol=1&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=2&system=1&distinct=0&rettype=1&seprator=%0D%0A'
    this.conf = conf;
    this.apiURL = apiURL;
}

Proxy.prototype.getProxyList = function () {
    let ctx = this;
    return new Promise((resolve, reject) => {
        let options = {
            method: 'GET',
            url: ctx.apiURL,
            gzip: true,
            encoding: null,
            headers: {},
        };

        request(options, function (error, response, body) {
            try {
                if (error) throw error;
                var ret = [];
                try {
                     ret = JSON.parse(body + '').data.map(el => el.ip+':'+el.port)
                } catch(e) {
                    ret = (body + '').match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/g);
                }
                ctx.proxyList = ret;
                resolve(ret);
            } catch (e) {
                return reject(e);
            }
        });
    });
}

Proxy.prototype.execute = async function (targetURL, data, proxyUrl, method = 'POST', timeout = 1300) {
    let proxy = '';
    let ctx = this;
    if (!this.proxyList || !this.proxyList.length) {
        await this.getProxyList()
    }
    proxyList = this.proxyList;
    var targetOptions = {
        method,
        url: targetURL,
        timeout: timeout,
        encoding: null,
        form: data
    };

    let proxyurl = proxyUrl || proxyList.shift();

    console.log(`* testing ${proxyurl}`);
    var startTimestamp = (new Date()).valueOf();
    targetOptions.proxy = 'http://' + proxyurl;
    return new Promise((res, rej) => {
        request(targetOptions, function (error, response, body) {
            try {
                if (error) {
                    // throw error;
                    return res(ctx.execute(targetURL, data, null,method, timeout));
                }
                console.log('body: ', body + '');
                body = JSON.parse(body.toString());
                body.proxyurl = proxyurl;
                console.log('proxyurl:\n', proxyurl);
                var endTimestamp = (new Date()).valueOf();
                console.log('  > time ' + (endTimestamp - startTimestamp) + 'ms ' + body);
                res(body);
            } catch (e) {
                fs.writeFileSync('log.html', body);
                console.error(e);
                rej(e);
            }
        });
    })
}

exports = module.exports = Proxy
