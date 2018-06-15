const fs = require('fs');
const rp = require('request-promise-native');
let proxyList = ['167.114.250.199:80',
  '220.73.175.122:808',
  '89.218.22.178:8080',
  '81.30.18.121:8080',
  '212.178.1.131:53281',
  '117.90.137.194:9000',
  '107.174.26.51:1080',
  '112.250.65.222:53281',
  '213.136.69.28:3128',
  '45.55.27.88:3128',
  '67.205.154.3:80',
  '200.122.211.14:8080',
  '115.229.119.109:9000',
  '119.57.112.181:8080',
  '103.248.248.235:53281'
]
function req() {
  let jar = rp.jar();
  let url = 'https://jinshuju.net/f/8Oui0T';
  let proxy = 'http://' + proxyList[Math.floor(Math.random() * proxyList.length)];
  console.log(proxy);
  let phone = gPhone();
  let coin = gCoin();
  let entry = {
    field_1: phone,
    field_2: coin
  }
  rp.get(url, { jar, proxy }, (a, b, c, d) => {
    console.log('发送数据', entry);
    rp.post(url, {
      proxy,
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
        fs.writeFileSync('./postform.txt', `发送数据: \t 号码: ${phone}\t 币: ${coin}, 代理: ${proxy}`);
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
      }
      console.log(e)
    })
  })
}

let count = 0;
while(count++ < 1 ) {
  req();
}

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
