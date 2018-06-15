
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const router = new Router();
const app = new Koa();
const rp = require('request-promise-native');
const cors = require('@koa/cors');
const fs = require('fs');
const crypto = require('crypto');
const Buffer = require('buffer');
const Proxy = require('./proxy');
const util = require('util');


const dzBaseUrl =
  // 'https://www.okex.com/api/v1/'
  // 'https://chosan.cn:3000/api/'
  'http://api.jmyzm.com/http.do'
let referrer = '15683351915',
  uid = 'zhang179817004',
  pwd = '查看 qq 空间';

let successList = [];
let failList = [];

router.get('/okex/:path', async (ctx, next) => {
  let qs = ctx.query;
  let rs = await rp.get(`${okexBaseUrl}${ctx.params.path}`, {
    qs
  });
  ctx.body = rs;
})

router.post('/robot', async (ctx, next) => {
  let form = ctx.request.body;
  let robot = form.robot;
  form.referrer = form.referrer || referrer;
  await getRecievedList(ctx);
  // 获取手机号
  if (ctx.dzMobile && ctx.dzMobile.length) {
    //
  } else {
    await getMobilenum(ctx);
  }
  let phone = ctx.dzMobile.shift();
  // 发送验证码
  let proxyurl = await reqCode(ctx, phone, robot);
  if (proxyurl === -1) {
    return console.error(`手机号${phone}已经注册!`);
  } else {
    // while(!proxyurl) {
      // console.error(`返回状态${proxyurl}, 继续使用手机号 ${phone} 进行注册!`);
      // proxyurl = await reqCode(ctx, phone, robot);
    // }
  }
  if (proxyurl) {

    // 获取验证码
    let vericode = '';
    let tmp = '';
    do {
      await wait(2000);
      tmp = await getCode(ctx, phone);
      if (tmp.mobile !== 'not_receive' && !tmp.code){
        return console.error('账户状态异常!异常信息: \t' + tmp.mobile);
      }
    } while (tmp && (tmp.mobile === 'not_receive') || tmp.code === 'to_fast_try_again');

    console.log('tmp,  tmp.code: ', tmp, tmp.code)
    vericode = tmp.code.match(/code is (\d*)/)[1];
    console.log(`手机号\t${phone}, 验证码：\t${vericode} \n`);
    let data = {
      vericode,
      user: phone,
      pwd: sha512(sha512('qwerty' + "隔壁老王") + "很强壮"),  // boc 的密码加密就是加的"隔壁老王很强壮""
      phone,
      referrer,  // 全局 referrer
      ...form
    }
    let url = mkUrl('http://47.75.30.77:30309/user/register', data);
    // let rs = await rp.post(url, {
    //   form: data
    // });
    let rs = await ctx.proxy.execute(url, data, proxyurl);
    if (rs.message === 'success') {
      let output = phone + '\t' + proxyurl + '\n';
      fs.writeFileSync('./ip.txt', output, { flag: 'a' });
      successList.push(output);
      console.log(`\n\n-----------------\n完成注册！\n, 手机号 \t ${phone}, 代理地址: ${proxyurl}\n\n-----------------`);
    } else {
      console.error('错误：\t', rs.message);
    }
    ctx.body = rs;
  } else {
    ctx.body = '发送验证码失败';
  }
})

router.get('/', async (ctx, next) => {
  ctx.response.type = 'text/html; charset=utf-8';
  let filestr = '';
  try {
    filestr = fs.readFileSync('../index.html') + '';
  } catch (error) {
    filestr = fs.readFileSync('./index.html') + '';
  }
  let result = '';
  successList.forEach(el => {
    result+=`<li>${el}</li>`
  });
  successList = [];
  ctx.body = filestr
    .replace('{% result %}', result + `<li>${ctx.dzInfo&&ctx.dzInfo.token}</li>`)
    .replace('{%phone%}', ctx.query.referrer || referrer);
})

router.get('/getMobileNum', async ctx => {
  let data = await getMobilenum(ctx);
  ctx.body = data;
})

router.get('/getCode', async ctx => {
  let mobile = '';
  if (ctx.dzMobile && ctx.dzMobile.length) { } else {
    await getMobilenum(ctx);
  }
  mobile = ctx.dzMobile.shift();
  let data = '';
  do {
    await wait(2000);
    data = await getCode(ctx, mobile);
  } while (data && data.mobile === 'not_receive');
  let code = data.code.match(/code is (\d*)/)[1];
  ctx.body = data.code;
})

router.get('/test', async ctx => {
  ctx.body = util.inspect(process.argv);
})

app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())

app.context.proxy = new Proxy();
app.listen(3000);

// 获取 dztoken
!async function getToken() {
  let data = await rp.get(dzBaseUrl, {
    qs: {
      action: 'loginIn',
      uid,
      pwd
    }
  });
  let dzInfo = String(data).split('|');
  app.context.dzInfo = {
    token: dzInfo[1],
    uid: dzInfo[0]
  }
  console.log(app.context.dzInfo)
}()

// 获取手机号, 一次获取 size 个
async function getMobilenum(ctx, size = 10) {
  let data = await rp.get(dzBaseUrl, {
    qs: {
      action: 'getMobilenum',
      ...ctx.dzInfo,
      size,
      pid: 45669
    }
  })
  let MobileInfo = String(data).split('|');
  app.context.dzMobile = app.context.dzMobile || [];
  app.context.dzMobile.push(...MobileInfo[0].split(';'));
  return app.context.dzMobile;
}

async function getCode(ctx, mobile) {
  let data = await rp.get(dzBaseUrl, {
    qs: {
      action: 'getVcodeAndReleaseMobile',
      mobile,
      author_uid: 'zhang179817004',
      ...ctx.dzInfo
    }
  })
  let codeInfo = data.split('|');
  return app.context.codeInfo = {
    mobile: codeInfo[0],
    code: codeInfo[1]
  }
}

async function reqCode(ctx, phone, robot) {
  let data = {
    vericode: 'sendcode',
    user: phone,
    pwd: 'qwerty',
    phone,
    robot
  }
  let url = mkUrl('http://47.75.30.77:30309/user/register', data);

  // let rs = await rp.post(url, {
  //   form: data
  // });

  let rs = await ctx.proxy.execute(url, data)

  rs = typeof rs === 'string' ? JSON.parse(rs) : rs;
  if (rs.message === 'success') {
    return rs.proxyurl;
  } else if (rs.message === 'phoneExists') {
    console.error('用户名已存在！');
    return -1;
  } else {
    console.error(rs.message || '错误！');
    return false;
  }
}

async function getRecievedList(ctx) {
  let data = await rp.get(dzBaseUrl, {
    qs: {
      action: 'getRecvingInfo',
      ...ctx.dzInfo,
      pid: 45669
    }
  });

  if (data) {
    console.log(data);
  data = data.match(/Recnum\":\"([0-9]*)/g).map(el => el.match(/([0-9]+)/)[0]);
    app.context.dzMobile = data;
  } else {
    console.error('//');
  }
}

function mkUrl(baseUrl, query = {}) {
  let url = baseUrl.split('?')[0];
  url += '?';
  for (let kv of Object.entries(query)) {
    url += `${kv[0]}=${kv[1]}&`;
  }
  return url;
}

function wait(time) {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
}

function sha512(str) {
  var sha1 = crypto.createHash("sha512");
  sha1.update(str);
  var res = sha1.digest("hex");
  return res;
}
