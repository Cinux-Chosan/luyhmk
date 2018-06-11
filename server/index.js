
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

const dzBaseUrl =
  // 'https://www.okex.com/api/v1/'
  // 'https://chosan.cn:3000/api/'
  'http://api.jmyzm.com/http.do'

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
  // 获取手机号
  if (ctx.dzMobile && ctx.dzMobile.length) {
    //
  } else {
    await getMobilenum(ctx);
  }
  let phone = ctx.dzMobile.shift();
  // 发送验证码
  let proxyurl = await reqCode(ctx, phone, robot); 
  if (proxyurl) {

    // 获取验证码
    let vericode = '';
    let tmp = '';
    do {
      await wait(2000);
      tmp = await getCode(ctx, phone);
    } while (tmp && tmp.mobile === 'not_receive');
    console.log('tmp,  tmp.code: ', tmp, tmp.code)
    vericode = tmp.code.match(/code is (\d*)/)[1];
    console.log(`手机号\t${phone}, 验证码：\t${vericode} \n`);
    let data = {
      vericode,
      user: phone,
      pwd: sha512(sha512('qwerty' + "隔壁老王") + "很强壮"),
      phone,
      referrer: '17782369765',
      ...form
    }
    let url = mkUrl('http://47.75.30.77:30309/user/register', data);
    // let rs = await rp.post(url, {
    //   form: data
    // });
    let rs = await ctx.proxy.execute(url, data, proxyurl);
    fs.writeFileSync('./ip.txt', proxyurl + '\n', { flag: 'a' })
    console.log('完成注册！');
    ctx.body = rs;
  } else {
    ctx.body = '发送验证码失败';
  }
})

router.get('/', async (ctx, next) => {
  ctx.response.type = 'text/html; charset=utf-8';
  try {
    ctx.body = fs.readFileSync('../index.html');
  } catch (error) {
    ctx.body = fs.readFileSync('./index.html');
  }
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

app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())

app.context.proxy = new Proxy();
app.listen(3000);

// 获取 dztoken
!async function getToken(uid = 'qq179817004', pwd = 'qq179817004*') {
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
async function getMobilenum(ctx, size = 1) {
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
    return false;
  } else {
    return false;
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
