const fs = require('fs');
const rp = require('request-promise-native');
let proxyList = [
  // '167.114.250.199:80',
  // '220.73.175.122:808',
  // '89.218.22.178:8080',
  // '81.30.18.121:8080',
  // '212.178.1.131:53281',
  // '117.90.137.194:9000',
  // '107.174.26.51:1080',
  // '112.250.65.222:53281',
  // '213.136.69.28:3128',
  // '45.55.27.88:3128',
  // '67.205.154.3:80',
  // '200.122.211.14:8080',
  // '115.229.119.109:9000',
  // '119.57.112.181:8080',
  // '103.248.248.235:53281'
]
let flag = false;
let fail = 0;
let success = 0;
async function req() {
  let jar = rp.jar();
  if (!proxyList.length && !flag) {
    flag = true;
    proxyList = await getProxyList();
    flag = false;
  }
  await check(() => proxyList.length);
  let url = 'https://jinshuju.net/f/8Oui0T';
  // let proxy = 'http://' + proxyList[Math.floor(Math.random() * proxyList.length)];
  let proxy = 'http://' + proxyList.pop();
  let timeout = 6000;
  console.log(proxy);
  let phone = gPhone();
  let coin = gCoin();
  let entry = {
    field_1: phone,
    field_2: coin
  }
  rp.get(url, { jar, proxy, timeout }, (a, b, c, d) => {
    if (a) return console.log(a.message);
    console.log('发送数据', entry);
    rp.post(url, {
      proxy,
      timeout,
      jar, form: {
        authenticity_token: getAuthenticityToken(c),
        utf8: '✓',
        entry
      },
      headers: {
        // ":authority:": "jinshuju.net",
        // ":method": "POST",
        // ":path": "/f/8Oui0T",
        // ":scheme": "https",
        "upgrade-insecure-requests": 1,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
        "Accept": "*/*",
        "Origin": "https://jinshuju.net",
        "Referer": "https://jinshuju.net/f/8Oui0T"
      }
    }).then(data => {
      console.log(data);
    }).catch(e => {
      if (e.statusCode == 302) {
        success++;
        console.log('当前成功\t' + success + ' 条');
        fs.writeFileSync('./postform.txt', `发送数据: \t 号码: ${phone}\t 币: ${coin}, 代理: ${proxy}`, { flag: 'a' });
        rp.get(e.error.match('<a href="(.*)">redirected</a>')[1], {
          jar,
          proxy,
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
            "Accept": "*/*",
            "Origin": "https://jinshuju.net",
            "Referer": "https://jinshuju.net/f/8Oui0T"
          }
        })
      } else {
        console.log('错误消息:' + e.code);
        fail++;
        console.log('当前失败\t' + fail + ' 条');
      }
      console.log(e)
    })
  })
}

async function go() {
  let count = 0;
  while (count++ < 1000) {
    setTimeout(() => {
      req()
    }, 0);
  }
}

go();

function getAuthenticityToken(c) {
  console.log('\n\n 页面内容\n\t' + c);
  return c.match(/name="authenticity_token" value="(.*)"/)[1];
}

function gPhone() {
  let phone = '1';
  for (let i = 0; i < 10; ++i) {
    phone += parseInt(Math.random() * 9)
  }
  return phone;
}

function gCoin() {
  return parseInt(Math.random() * 400) * 5 + Math.round(Math.random());
}


async function getProxyList() {
  let url = 'http://api.ip.data5u.com/api/get.shtml?order=8d4552df4d73e81f6474d1cab0d9570c&num=10000&carrier=0&protocol=0&an1=1&an2=2&an3=3&sp1=1&sp2=2&sp3=3&sort=1&system=1&distinct=0&rettype=1&seprator=%0D%0A';
  let options = {
    url,
    gzip: true,
    encoding: null,
    headers: {},
    order: '8d4552df4d73e81f6474d1cab0d9570c',
  }
  let r = '';
  try {
    r = await rp.get(url, options);
  } catch (error) {
    console.log(error)
  }
  console.log('getting proxylist');
  ret = (r + '').match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/g);
  // ret = JSON.parse(r + '').data.map(el => el.ip+':'+el.port)
  console.log(ret)
  return ret;
}



function check(fn) {
  return new Promise((res, rej) => {
    let time = 0;
    let id = setInterval(() => {
      if (fn()) {
        res();
        clearInterval(id);
      }
      else if (time >= 30000) {
        rej('超时');
        clearInterval(id);
      }
      time += 300;
    }, 300)
  })
}