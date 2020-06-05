//豆瓣删帖
let cheerio = require('cheerio'); //引入cheerio
let constant = require('./constant');
let { req, xml, json_req } = require('./base');
let Ut = require('./util.js');
let fs = require('fs');
let superagent = require('superagent');
var AipOcrClient = require('baidu-aip-sdk').ocr;
const schedule = require('node-schedule');
// 设置APPID/AK/SK
var APP_ID = '19570004';
var API_KEY = 'dMa7CsqcnWj1syEdLdUwBtG0';
var SECRET_KEY = 'IHQm0j2sCwL45q5UTXkcFLcINQmU2x0p';

// 新建一个对象，建议只保存一个对象调用服务接口
var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);
//Cookie
let Cookies =
  'bid=ovvb6QFGLeI; douban-fav-remind=1; ll="108296"; _vwo_uuid_v2=D12BE3C958B87D3ABE8DF623577BA72DD|dccbd0fc97a40270fd1b26fe26c1e6d8; douban-profile-remind=1; _ga=GA1.2.1174928006.1577267740; __utmz=30149280.1586339764.11.6.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); ct=y; push_doumail_num=0; __utmc=30149280; _gid=GA1.2.1538104771.1587561905; push_noty_num=0; _pk_ref.100001.8cb4=%5B%22%22%2C%22%22%2C1587643241%2C%22https%3A%2F%2Fwww.google.com.hk%2F%22%5D; _pk_ses.100001.8cb4=*; __utma=30149280.1174928006.1577267740.1587633023.1587643242.41; ap_v=0,6.0; __utmt=1; dbcl2="215729416:YODA8bDr/h4"; ck=WpsL; __utmv=30149280.21572; __utmb=30149280.178.5.1587646704194; _pk_id.100001.8cb4=431714bd955288d0.1577267738.44.1587646710.1587636849.';
//host
let host = constant.API_HOST;
//Origin
let Origin = constant.API_HOME;
//Referer
let Referer = constant.API_GROUP_GROUP;
//参数ck
let ck = getCookies(Cookies, ' ck');
let dbcl2 = getCookies(Cookies, ' dbcl2').split(':')[0].replace('"', '');
let userId = '';

function getQueryString(url, name) {
  var reg = new RegExp('(^|&|\\?)' + name + '=([^&]*)(&|$)', 'i');
  var r = url.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}
function findLongestWord(str) {
  var newArr = str.split(' '),
    maxStr = newArr[0];
  for (var i = 0; i < newArr.length; i++) {
    if (newArr[i].length > maxStr.length) maxStr = newArr[i];
  }

  return maxStr;
}
/**填充占位符*/
format = function (source, params) {
  if (arguments.length == 1)
    return function () {
      let args = $.makeArray(arguments);
      args.unshift(source);
      return format.apply(this, args);
    };
  if (arguments.length > 2 && params.constructor != Array) {
    params = $.makeArray(arguments).slice(1);
  }
  if (params.constructor != Array) {
    params = [params];
  }
  params.forEach(function (i, n) {
    source = source.replace(new RegExp('\\%s'), i);
  });
  return source;
};
function getCookies(strcookie, matchcookie) {
  var getMatchCookie;
  var arrCookie = strcookie.split(';');
  for (var i = 0; i < arrCookie.length; i++) {
    var arr = arrCookie[i].split('=');
    if (matchcookie == arr[0]) {
      getMatchCookie = arr[1];
      break;
    }
  }
  return getMatchCookie;
}
async function runTask() {
  url = format(constant.API_GROUP_LIST_USER_PUBLISHED_TOPICS, [dbcl2]);
  let $ = await xml(url, 'GET', { start: 0 }, '', Cookies);
  let result = _parse_topic_all_info_list($); //进入我的豆瓣小组发起的帖子列表
  for (const item of result) {
    let count = (await get_comments_by_topic(item.id)).length; //循环进入每一个topic帖子
    let newCount = '';
    await Ut.sleep(1000);
    for (let index = 0; index < 5; index++) {
      //不成功重试五次
      await Ut.sleep(5000);
      await errForRetry(identificationCodeAndReply.bind(item.id));

      await Ut.sleep(5000);
      newCount = (await get_comments_by_topic(item.id)).length; //查询回复数
      console.log('newCount', newCount);
      if (newCount > count) {
        //新值大就说明回复成功了
        break;
      }
    }
  }
}
try {
  runTask();
} catch (error) {
  console.log('error', error);
}

async function errForRetry(identificationCodeAndReply) {
  try {
    let res = await identificationCodeAndReply(); //发言回复
    if (res) return;
  } catch (error) {
    console.log('error', error);
    await Ut.sleep(10000);
    await errForRetry(); //发言回复
  }
}
const scheduleCronstyle = () => {
  //每分钟的第30秒定时执行一次:
  schedule.scheduleJob('1 * * * * *', async () => {
    console.log('scheduleCronstyle:' + new Date());
    //获取个人发布帖子列表
    //runTask();
  });
};

scheduleCronstyle();
//解析评论列表
_parse_comment_list = function (text) {
  let $ = text;
  let result = [];
  $('#comments li').each(function (index, element) {
    let $element = $(element);
    result.push($element.attr('data-cid'));
  });
  let topic = $('.action-react a').attr('data-object_id');
  return result;
};
//获取指定topic id下的评论
async function get_comments_by_topic(topic, start = 0) {
  let url = format(constant.API_GROUP_GET_TOPIC, [topic]);
  let result = await xml(url, 'GET', { start: start }, '', Cookies);
  return _parse_comment_list(result);
}
//解析帖子列表详情
_parse_topic_all_info_list = function ($) {
  let result = [];
  $('.olt tr').each(function (index, element) {
    var obj = {};
    let $element = $(element);
    let href = $element.find('.title a').attr('href');
    let href_item = href.split('/');
    obj.id = href_item[5];
    obj.title = $element.find('.title a').attr('title');
    obj.replyCount = $element.find('.td-reply').text().replace('回应', '');
    obj.date = $element.find('.td-time').text();
    result.push(obj);
  });
  return result;
};

//获取帖子内容识别验证码并添加内容
function identificationCodeAndReply(topicId, start = 0) {
  return new Promise(function (resolve, reject) {
    let url = format(constant.API_GROUP_ADD_COMMENT, [topicId]); //添加评论的api
    let API_GROUP_GET_TOPIC_URL = format(constant.API_GROUP_GET_TOPIC, [topicId]); //获取帖子的api
    //todo  随机数字
    let data = { ck: ck, img: '', rv_comment: '133', start: '0', submit_btn: '发送' };
    //获取主题帖子的内容
    xml(API_GROUP_GET_TOPIC_URL + `?start=${start}`, 'GET', { start: start }, '', Cookies).then(($) => {
      let src = $('.captcha_image').attr('src');
      if (src) {
        reqbase64Img(src, Cookies).then((base64Img) => {
          //有图片就接入第三方验证识别
          // 调用通用文字识别, 图片参数为远程url图片
          // 如果有可选参数
          var options = {};
          options['language_type'] = 'ENG';
          client
            .accurateBasic(base64Img, options)
            .then(function (result) {
              if (result.error_code) {
                console.log(JSON.stringify(result));
              } else {
                console.log(JSON.stringify(result));
                data['captcha-solution'] = findLongestWord(result.words_result[0].words.toLowerCase()); //验证码
                data['captcha-id'] = getQueryString(src, 'id'); //验证码对应的id
                //验证码提交
                req(url, 'POST', {}, data, Cookies).then((result) => {
                  //res.json({ head: { code: 0, msg: 'ok' }, data: result });
                  resolve(true);
                });
              }
            })
            .catch(function (err) {
              // 如果发生网络错误
              console.log(err);
            });
        });
      } else {
        //没有就直接提交
        req(url, 'POST', {}, data, Cookies).then((result) => {
          //res.json({ head: { code: 0, msg: 'ok' }, data: result });
          resolve(true);
        });
      }
    });
  });
}
