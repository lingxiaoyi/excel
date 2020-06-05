//豆瓣删帖
let $ = require('cheerio'); //引入cheerio
let { request } = require('./base');
let Ut = require('./util.js');
let fs = require('fs');
var AipOcrClient = require('baidu-aip-sdk').ocr;
const schedule = require('node-schedule');
// 设置APPID/AK/SK
var APP_ID = '19570004';
var API_KEY = 'dMa7CsqcnWj1syEdLdUwBtG0';
var SECRET_KEY = 'IHQm0j2sCwL45q5UTXkcFLcINQmU2x0p';

// 新建一个对象，建议只保存一个对象调用服务接口
var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);

async function runTask() {
  /* let res = await request('http://tieba.baidu.com/i/i/my_reply', 'GET');
  console.log('res', res);
  cheerio.load(res.text) */
  /* let result = _parse_topic_all_info_list($); //进入我的豆瓣小组发起的帖子列表
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
  } */
  let res = await request('https://tieba.baidu.com/f/commit/post/delete', 'POST',{}, {
    ie: 'utf-8',
    tbs: '07a52f51fd44d1301588157432',
    kw: '大话西游2',
    fid: '1450927',
    tid: '3688788852',
    user_name: 'Q1277341979',
    delete_my_post: 1,
    delete_my_thread: 0,
    is_vipdel: 0,
    pid: 67806328845,
    is_finf: 1 ,
  });
  console.log('res');
}
try {
  runTask();
} catch (error) {
  console.log('error', error);
}

const scheduleCronstyle = () => {
  //每分钟的第30秒定时执行一次:
  schedule.scheduleJob('1 * * * * *', async () => {
    console.log('scheduleCronstyle:' + new Date());
    //获取个人发布帖子列表
    //runTask();
  });
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
