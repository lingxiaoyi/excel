var path = require('path');
const fs = require('mz/fs');
const xlsx = require('node-xlsx');
const xlsxStyle = require('xlsx');
const _ = require('lodash'); //引入lodash辅助工具
let dateUtil = require('./date-picker');
let { outputSheetData } = require('./util.js');
const xlsxData = [
  xlsx.parse(fs.readFileSync(`${__dirname}/赵六.xlsx`))[0].data,
  xlsx.parse(fs.readFileSync(`${__dirname}/李四.xlsx`))[0]
    .data /* 
  xlsx.parse(fs.readFileSync(`${__dirname}/张三.xlsx`))[0].data,
  xlsx.parse(fs.readFileSync(`${__dirname}/王五.xlsx`))[0].data, */,
];
//整理数据成以时间为对象的格式并选出最大最小时间{'2020-03-31': [ '2020-03-31 06:47:25', '2020-03-31 17:30:32' ]}
let dealXlsxData = xlsxData.map((items) => {
  let obj = {};
  for (const item of items) {
    if (!item[4] || item[4] === '时间') continue;
    let date = item[4].split(' ')[0];
    if (obj[date]) {
      obj[date].push(item[4]);
    } else {
      obj[date] = [item[4]];
    }
  }
  Object.keys(obj).forEach((key) => {
    obj[key] = [_.min(obj[key]), _.max(obj[key])];
  });
  return obj;
});
//创建当月日期
let index = 0;
let year = new Date().getFullYear();
let month = new Date().getMonth() + 1;
let infoArray = xlsxData.map((item, i) => {
  const DATE = new Date(item[3][4]);
  let restDays = 0;
  let workHours = 0;
  year = DATE.getFullYear();
  month = DATE.getMonth() + 1;
  let daysOption = dateUtil.getMonthDaysArray(DATE.getFullYear(), DATE.getMonth() + 1).map((item) => {
    if (dealXlsxData[i][item.date]) {
      item.dayoff = '班';
      let time = dateUtil.countTIme(dealXlsxData[i][item.date][0], dealXlsxData[i][item.date][1]);
      if (time >= 8) {
        item.workTime = 8;
        workHours += 8;
      } else if (time === 0) {
        item.workTime = time;
        item.dayoff = '忘';
      } else {
        item.workTime = time;
      }
    } else {
      item.dayoff = '休';
      item.workTime = 0;
      restDays++;
    }
    return item;
  });
  return {
    daysOption, //获取每个月的每天的配置
    name: item[3][3],
    id: item[3][2],
    index: ++index,
    restDays, // 休息天数
    workHours,
  };
});

let bgColor = 'D9D9D9';
let daysOption = infoArray[0].daysOption; //当月天数
let daysOptionLength = infoArray[0].daysOption.length; //当月天数数组长度
let resUserArray = []; //所有用户组成的数据结果
infoArray.map(({ index, id, name, restDays, daysOption, workHours }, i) => {
  resUserArray.push([
    ...[index, id, name, i === 0 ? '四' : '三', '/', '8', restDays].map((item, i) => {
      return {
        name: item,
        merges: 'bottom',
        bgColor: i === 6 ? bgColor : '',
      };
    }),
    {
      name: '排班',
    },
    ...daysOption.map((item) => {
      return { name: item.dayoff, bgColor: item.dayoff === '休' ? bgColor : '' };
    }),
    ...new Array(3).fill('').map((item, i) => {
      return {
        name: item,
        merges: i === 2 ? 'bottom' : '',
        bgColor: i === 0 ? bgColor : '',
      };
    }),
  ]);
  resUserArray.push([
    ...new Array(7).fill('').map((item, i) => {
      return {
        name: item,
        merges: 'bottom',
        bgColor: i === 6 ? bgColor : '',
      };
    }),
    {
      name: '实际出勤',
    },
    ...daysOption.map((item) => {
      return { name: item.workTime };
    }),
    {
      name: workHours,
      bgColor,
    },
    {
      name: '',
      bgColor: '',
    },
    {
      name: '',
      merges: 'bottom',
      bgColor: '',
    },
  ]);
  resUserArray.push([
    ...new Array(7).fill('').map((item, i) => {
      return {
        name: item,
        merges: 'top',
        bgColor: i === 6 ? bgColor : '',
      };
    }),
    {
      name: '加班小时数',
    },
    ...new Array(daysOptionLength).fill('').map((item) => {
      return { name: item };
    }),
    ...new Array(3).fill('').map((item, i) => {
      return {
        name: item,
        merges: i === 2 ? 'top' : '',
        bgColor: i === 0 ? bgColor : '',
      };
    }),
  ]);
});
//当天出勤人数
let everyDayEmployeesNum = new Array(daysOptionLength).fill(0);
everyDayEmployeesNum.forEach((num, i) => {
  for (const item of infoArray) {
    if (item.daysOption[i].workTime > 0) {
      everyDayEmployeesNum[i]++;
    }
  }
});
//最终数据集合
let resData = [
  [
    {
      name: '融创物业东南区域壹号院案场排班/考勤明细表',
      merges: 'right',
      font: {
        name: '宋体',
        sz: 18,
        bold: true,
      },
      border: {},
    },
    ...new Array(daysOptionLength + 10).fill('').map((item, i) => {
      return { name: item, merges: i === daysOptionLength + 10 - 1 ? '' : 'right', border: {} };
    }),
  ],
  [
    {
      name: `当前日期：${year} 年 ${month} 月`,
      merges: 'right',
      font: {
        name: '宋体',
        sz: 9,
        bold: true,
      },
      border: {},
    },
    ...new Array(daysOptionLength + 10).fill('').map((item, i) => {
      return { name: item, merges: i === daysOptionLength + 10 - 1 ? '' : 'right', border: {} };
    }),
  ],
  //行头
  [
    ...['序号', '工号', '姓名', '本休参照日', '本休参照日', '日工作小时数', '排休天数', ''].map((item, i) => {
      return {
        name: item,
        merges: 'bottom',
        bgColor: i === 6 ? bgColor : '',
        wrapText: true,
      };
    }),
    ...daysOption.map((item) => {
      return {
        name: item.weekDay,
        bgColor,
      };
    }),
    ...['工时小计(h)', '备注', '员工签字'].map((item, i) => {
      return {
        name: item,
        merges: 'bottom',
        bgColor: i === 0 ? bgColor : '',
        wrapText: true,
      };
    }),
  ],
  [
    ...new Array(8).fill('').map((item, i) => {
      return {
        name: item,
        bgColor: i === 6 ? bgColor : '',
      };
    }),
    ...daysOption.map((item) => {
      return {
        name: item.dayNum,
        bgColor,
      };
    }),
    ...new Array(3).fill('').map((item, i) => {
      return {
        name: item,
        bgColor: i === 0 ? bgColor : '',
      };
    }),
  ],
  /* 一个用户开始 */
  ...resUserArray,
  /* 一个用户结束 */
  //当天在职人数
  [
    { name: ++index },
    {
      name: '当天在职人数',
      merges: 'right',
    },
    ...new Array(6).fill('').map((item, i) => {
      return {
        name: item,
        merges: i === 5 ? '' : 'right',
      };
    }),
    ...everyDayEmployeesNum.map((item) => {
      return { name: item };
    }),
    ...new Array(3).fill('').map((item, i) => {
      return {
        name: item,
        bgColor: i === 0 ? bgColor : '',
      };
    }),
  ],
  [
    { name: ++index },
    {
      name: '缺编扣款',
      merges: 'right',
    },
    ...new Array(6).fill('').map((item, i) => {
      return {
        name: item,
        merges: i === 5 ? '' : 'right',
      };
    }),
    ...new Array(daysOptionLength).fill(0).map((item) => {
      return { name: item };
    }),
    ...new Array(3).fill('').map((item, i) => {
      return {
        name: i === 0 ? 0 : item,
        bgColor: i === 0 ? bgColor : '',
      };
    }),
  ],
  [
    {
      name: '备注：保洁工作时间：7：30-17：00，共8个小时',
      merges: 'right',
      horizontal: 'left',
    },
    ...new Array(daysOptionLength + 10).fill('').map((item, i) => {
      return { name: item, merges: i === daysOptionLength + 10 - 1 ? '' : 'right' };
    }),
  ],
  [
    {
      name: '制表人：',
      merges: 'right',
      border: {},
    },
    ...new Array(7).fill('').map((item, i) => {
      return { name: item, merges: i === 7 - 1 ? '' : 'right', border: {} };
    }),
    {
      name: '案场负责人：',
      merges: 'right',
      border: {},
    },
    ...new Array(daysOptionLength + 3 - 1).fill('').map((item, i) => {
      return { name: item, merges: i === daysOptionLength + 3 - 1 - 1 ? '' : 'right', border: {} };
    }),
  ],
];

// 构建 workbook 对象
let unitNum = 2.088;
const wb = {
  SheetNames: ['Sheet'],
  Sheets: {
    Sheet: {
      ...outputSheetData(resData),
      '!cols': [
        { wch: (2.25 / unitNum) * 2 },
        { wch: (6.13 / unitNum) * 2 },
        { wch: (5.63 / unitNum) * 2 },
        { wch: (4.88 / unitNum) * 2 },
        { wch: (4.63 / unitNum) * 2 },
        { wch: (5.63 / unitNum) * 2 },
        { wch: (4.5 / unitNum) * 2 },
        { wch: (8.5 / unitNum) * 2 },
        ...new Array(daysOptionLength).fill({ wch: (2 / unitNum) * 2 }),
        { wch: (4.75 / unitNum) * 2 },
        { wch: (2.88 / unitNum) * 2 },
        { wch: (7.38 / unitNum) * 2 },
        /* { wpx: 23 - 5 },
        { wpx: 54 - unitNum2 },
        { wpx: 50 - unitNum2 },
        { wpx: 44 - unitNum2 },
        { wpx: 42 - unitNum2 },
        { wpx: 50 - unitNum2 },
        { wpx: 41 - unitNum2 },
        { wpx: 73 - unitNum2 },
        ...new Array(daysOptionLength).fill({ wpx: 21 - 3 }),
        { wpx: 43 - unitNum2 },
        { wpx: 28 - unitNum2 },
        { wpx: 64 - unitNum2 }, */
      ],
      '!rows': [
        { hpx: 35.25 },
        { hpx: 20.25 },
        ...new Array(2).fill({ hpx: 15.75 }),
        ...new Array(xlsxData.length * 3).fill({ hpx: 15.75 }),
        ...new Array(3).fill({ hpx: 15.75 }),
        { hpx: 35.25 },
      ],
      '!margins': {
        bottom: 0.747916666666667,
        footer: 0.313888888888889,
        header: 0.313888888888889,
        left: 0.707638888888889,
        right: 0.707638888888889,
        top: 0.747916666666667,
      },
    },
  },
};

xlsxStyle.writeFile(wb, path.resolve(__dirname, '../webpack/test.xlsx'));
