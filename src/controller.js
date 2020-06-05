//豆瓣删帖
let cheerio = require('cheerio'); //引入cheerio
let constant = require('./constant');
let { req, xml, json_req } = require('./base');
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
let Cookies = '';
//host
let host = constant.API_HOST;
//Origin
let Origin = constant.API_HOME;
//Referer
let Referer = constant.API_GROUP_GROUP;
//参数ck
let ck = '';
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

// 解析收藏列表的链接
_parse_collect_path = function (text) {
  let $ = text;
  let url = $('.doulist-list a').attr('href');
  return url;
};
// 解析收藏列表
_parse_collect_list = function (text) {
  let $ = text;
};
//解析帖子列表
_parse_topic_list = function (text) {
  let $ = text;
  let result = [];
  $('.title a').each(function (index, element) {
    let $element = $(element);
    let href = $element.attr('href');
    let href_item = href.split('/');
    result.push(href_item[5]);
  });
  return result;
};
_parse_img = function (text) {
  let $ = text;
  let url = $('.captcha_image').attr('src');
  return url;
};
//解析帖子列表详情
_parse_topic_all_info_list = function (text) {
  let $ = text;
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
//解析评论列表
_parse_comment_list = function (text) {
  let $ = text;
  let result = [];
  let obj = {};
  $('#comments li').each(function (index, element) {
    let $element = $(element);
    result.push($element.attr('data-cid'));
  });
  let topic = $('.action-react a').attr('data-object_id');
  obj[topic] = result;
  return obj;
};
//获取指定topic id下的评论
get_comments_by_topic = function (topic, start = 0) {
  let url = format(constant.API_GROUP_GET_TOPIC, [topic]);
  return xml(url, 'GET', { start: start }, '', Cookies).then((result) => {
    return _parse_comment_list(result);
  });
};
//删除指定帖子的所有评论
remove_comment_by_topic_and_cid = function (topic, cid, socket) {
  let url = format(constant.API_GROUP_REMOVE_COMMENT, [topic]);
  let data = { cid: cid, ck: ck, reason: 'other_reason', other: 'other_reason', submit: '确定' };
  return req(url, 'POST', { cid: cid }, data, Cookies).then(
    (result) => {
      return result.body;
    },
    (error) => {
      socket.emit(
        'chat message',
        '由于删除操作过于频繁，你的操作被豆瓣认为是机器人，建议用浏览器打开官网后，输入验证码，再重新操作删除'
      );
      console.log('错误', error);
      if (error.response.body.r) {
        req(format(constant.API_GROUP_ADMIN_REMOVE_COMMENT, [topic]), 'POST', '', data, Cookies).then((result) => {
          return result.body;
        });
      } else {
        throw error;
      }
    }
  );
};
//删除指定帖子
remove_topic_by_topicId = function (topic) {
  let url = format(constant.API_GROUP_REMOVE_TOPIC, [topic]);
  let param = { ck: ck };
  return req(url, 'POST', param, '', Cookies).then((result) => {
    console.log('删除结果', result.body);
    return result.body;
  });
};
//获取所有帖子下的回复cid
get_all_publish_topic_cid = async function (body, start = 0) {
  let topicList = await get_all_publish_topic(body, start);
  let allComment = [];
  for (i in topicList) {
    let comment = await get_comments_by_topic(topicList[i], 0);
    allComment.push(comment);
  }
  return allComment;
};
//获取帖子内容识别验证码并添加内容
function identificationCodeAndReply(body, res, start = 0) {
  Cookies = body.Cookies;
  ck = body.ck;
  userId = body.dbcl2;
  topicId = body.topicId;
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
                res.json({ head: { code: 0, msg: 'ok' }, data: result });
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
        res.json({ head: { code: 0, msg: 'ok' }, data: result });
      });
    }
  });
}
module.exports = {
  login(user, psd, source, response) {
    let url = 'https://www.douban.com/accounts/login';
    superagent
      .post(url, { form_email: user, source: source, form_password: psd })
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', host)
      .set('Referer', 'https://www.douban.com')
      .set('Origin', Origin)
      .redirects(0)
      .then((res) => console.log(res))
      .catch((err) => console.log(err.response.text)); // 目标内容
  },
  group: {
    publish: function (body, res, start = 0) {
      //获取个人发布帖子列表
      Cookies = body.Cookies;
      ck = body.ck;
      userId = body.dbcl2;
      param = [userId];
      url = format(constant.API_GROUP_LIST_USER_PUBLISHED_TOPICS, param);
      return xml(url, 'GET', { start: start }, '', Cookies).then((result) => {
        return res.json({ head: { code: 0, msg: 'ok' }, data: _parse_topic_all_info_list(result) });
      });
    },
    reply(body, res, start = 0) {
      //获取所有回复的帖子
      Cookies = body.Cookies;
      ck = body.ck;
      userId = body.dbcl2;
      param = [userId];
      let url = format(constant.API_GROUP_LIST_USER_COMMENTED_TOPICS, param);
      return xml(url, 'GET', { start: start }, '', Cookies).then((result) => {
        return res.json({ head: { code: 0, msg: 'ok' }, data: _parse_topic_all_info_list(result) });
      });
    },
    addComment(body, res, start = 0) {
      identificationCodeAndReply(body, res, (start = 0));
    },
    removeComment(body, res, start = 0) {
      //删除评论
      Cookies = body.Cookies;
      ck = body.ck;
      userId = body.dbcl2;
      topicId = body.topicId;
      get_comments_by_topic(topicId).then(async function (response) {
        let obj = response;
        for (i in obj) {
          for (j in obj[i]) {
            await remove_comment_by_topic_and_cid(i, obj[i][j]);
            console.log('第' + obj[i][j] + '个评论已删除');
          }
        }
      });
    },
    removeTopic(body, res, start = 0) {
      //删除帖子
      Cookies = body.Cookies;
      ck = body.ck;
      userId = body.dbcl2;
      topicId = body.topicId;
      res.json({ head: { code: 0, msg: 'ok' }, data: remove_topic_by_topicId(topicId) });
    },
    deleteAll(socket) {
      socket.on('chat message', async function (body) {
        socket.emit('chat message', '正在获取帖子所有评论，请稍等...');
        console.log('接收到的消息', body);
        Cookies = body.Cookies;
        ck = body.ck;
        userId = body.dbcl2;
        start = body.start;
        param = [userId];
        url = format(constant.API_GROUP_LIST_USER_PUBLISHED_TOPICS, param);
        try {
          let result = await xml(url, 'GET', { start: start }, '', Cookies);
          let topicList = _parse_topic_all_info_list(result);
          let allComment = [];
          for (let o of topicList) {
            let comment = await get_comments_by_topic(o.id, 0);
            allComment.push(comment);
          }
          socket.emit('chat message', '已经获取所有评论完毕，正在删除...');
          console.log('item', allComment);
          for (item of allComment) {
            for (i in item) {
              for (j in item[i]) {
                try {
                  await remove_comment_by_topic_and_cid(i, item[i][j], socket);
                  console.log('第' + item[i][j] + '个评论已删除');
                  socket.emit('chat message', '第' + item[i][j] + '个评论已删除');
                } catch (err) {
                  socket.emit(
                    'chat message',
                    '由于删除操作过于频繁，你的操作被豆瓣认为是机器人，建议用浏览器打开官网后，输入验证码，再重新操作删除'
                  );
                }
              }
            }
          }
          socket.emit('chat message', '已删除完毕，请修改开始条数后再次执行');
        } catch (err) {
          console.log('出现了错误', err);
          socket.emit(
            'chat message',
            '由于删除操作过于频繁，你的操作被豆瓣认为是机器人，建议用浏览器打开官网后，输入验证码，再重新操作删除'
          );
        }
      });
    },
    async deleteAllTopic(socket) {
      socket.on('delete topic', async function (body) {
        let start = body.start;
        let topicList = await get_all_publish_topic_list(body, res, start);
        console.log('帖子列表', topicList);
      });
    },
  },
  user: {
    async collectList(body, res) {
      Cookies = body.Cookies;
      ck = body.ck;
      userId = body.dbcl2;
      param = [userId];
      let url = format(constant.API_PEOPLE_HOME, param);
      xml(url, 'GET', '', '').then((result) => {
        let collectUrl = [_parse_collect_path(result)];
        xml(collectUrl, 'GET').then((collectXml) => {
          let obj = _parse_collect_list(collectXml);
        });
      });
    },
  },
};
