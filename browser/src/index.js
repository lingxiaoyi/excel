// 通过引入css文件，实现了当修改样式时，页面可以热更新
import XLSX from 'xlsx';
import $ from 'jquery';
const _ = require('lodash');
import * as FileSaver from 'file-saver';
import './style.css';
// 通过引入html文件，实现了当修改html文件时，页面可以热更新
import '../index.html';
import './test.xlsx';
let dateUtil = require('../../src/date-picker');
let { outputSheetDataForExceljs } = require('../../src/util.js');
const ExcelJS = require('exceljs');
const readWorkbook = new ExcelJS.Workbook();
const workbook = new ExcelJS.Workbook();
import logo from './logo.png';

function handleFile(e) {
  e.preventDefault();
  var files = e.target.files,
    f = files[0];
  var reader = new FileReader();
  var xlsxData = [];
  reader.onload = async function (e) {
    //var data = new Uint8Array(e.target.result);
    //上传数据并读取
    readWorkbook.xlsx.load(e.target.result).then((res) => {
      //console.log('res', res);
      //遍历所有工作表
      res.worksheets.forEach((worksheet) => {
        // 遍历工作表中的所有行（包括空行）
        let data = [];
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          //console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
          data.push(
            row.values.filter((value, i) => {
              if (i > 0) {
                return value;
              }
            })
          );
        });
        xlsxData.push(data);
      });
      main();
    });

    /* DO SOMETHING WITH workbook HERE */
    function main() {
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

      let bgColor = 'D9D9D9'; //格子背景颜色
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
            return {
              name: item.dayoff,
              bgColor: item.dayoff === '休' ? bgColor : '',
            };
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
              size: 18,
              bold: true,
            },
            border: {},
          },
          ...new Array(daysOptionLength + 10).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === daysOptionLength + 10 - 1 ? '' : 'right',
              border: {},
            };
          }),
        ],
        [
          {
            name: `当前日期：${year} 年 ${month} 月`,
            merges: 'right',
            font: {
              name: '宋体',
              size: 9,
              bold: true,
            },
            border: {},
          },
          ...new Array(daysOptionLength + 10).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === daysOptionLength + 10 - 1 ? '' : 'right',
              border: {},
            };
          }),
        ],
        //行头
        [
          ...['序号', '工号', '姓名', '本休参照日', '本休参照日', '日工作小时数', '排休天数', ''].map((item, i) => {
            if (item === '' || item === '排休天数') {
              return {
                name: item,
                merges: 'bottom',
                bgColor: i === 6 ? bgColor : '',
                wrapText: true,
                note: {
                  texts: [
                    {
                      font: {
                        size: 9,
                        color: { argb: 'FF000000' },
                        name: '宋体',
                        family: 2,
                        scheme: 'none',
                      },
                      text: item
                        ? `Administrator:
                      1、若是做五休二则需要填2个本休参照日；
                      2、若是做六休一则需要填写一个本休参照日，另外一个/；
                      3、若其他特殊岗，做二休一的，则需要制表人按照排班，本休参照日均写/；
                      `
                        : `月初提交排班表            月末提交考勤明细表和汇总表`,
                    },
                  ],
                  margins: {
                    insetmode: 'custom',
                    inset: [0.55, 0.25, 0.55, 0.35],
                  },
                },
              };
            } else {
              return {
                name: item,
                merges: 'bottom',
                bgColor: i === 6 ? bgColor : '',
                wrapText: true,
              };
            }
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
            return {
              name: item,
              merges: i === daysOptionLength + 10 - 1 ? '' : 'right',
            };
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
            return {
              name: item,
              merges: i === daysOptionLength + 3 - 1 - 1 ? '' : 'right',
              border: {},
            };
          }),
        ],
      ];
      let resData2 = [
        [
          {
            name: '融创物业东南区域壹号院案场考勤汇总表',
            merges: 'right',
            font: {
              name: '宋体',
              size: 18,
              bold: true,
            },
            border: {},
          },
          ...new Array(31).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === 31 - 1 ? '' : 'right',
              border: {},
            };
          }),
        ],
        [
          {
            name: `当前日期：${year} 年 ${month} 月`,
            merges: 'right',
            font: {
              name: '宋体',
              size: 9,
              bold: true,
            },
            border: {},
          },
          ...new Array(31).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === 31 - 1 ? '' : 'right',
              border: {},
            };
          }),
        ],
        [
          ...[
            '序号',
            '工号',
            '姓名',
            '入职时间',
            '离职时间',
            '本休参照日',
            '本休参照日',
            '日工作小时数',
            '应出勤（天）',
            '实际出勤（天）',
            '加班小时数',
          ].map((item, i) => {
            let textOpt = {
              '应出勤（天）': `应出勤参考本月的应出勤。如遇到法定假，应出勤需要加上法定假日那天（法定日之前在职的员工也要加上）
              `,
              '实际出勤（天）': `实际出勤如遇到法定假，法定日之前在职的员工，应出勤需要加上法定假日那天；如法定假日之后在职的员工，实际出勤则不加；
              `,
            };
            if (Object.keys(textOpt).includes(item)) {
              return {
                name: item,
                wrapText: true,
                font: {
                  name: '宋体',
                  size: 8,
                  bold: true,
                },
                merges: 'bottom',
                textRotation: 'vertical',
                note: {
                  texts: [
                    {
                      font: {
                        size: 8,
                        color: { argb: 'FF000000' },
                        name: '宋体',
                        family: 2,
                        scheme: 'none',
                      },
                      text: textOpt[item],
                    },
                  ],
                  margins: {
                    insetmode: 'custom',
                    inset: [0.55, 0.25, 0.55, 0.35],
                  },
                },
              };
            } else {
              return {
                name: item,
                wrapText: true,
                textRotation: i >= 8 && i < 30 ? 'vertical' : 0,
                font: {
                  name: '宋体',
                  size: 8,
                  bold: true,
                },
                merges: 'bottom',
              };
            }
          }),
          ...new Array(14).fill('').map((item, i) => {
            return {
              name: i === 0 ? '缺勤事项说明' : item,
              merges: i === 14 - 1 ? '' : 'right',
              font: {
                name: '宋体',
                size: 8,
                bold: true,
              },
            };
          }),
          ...new Array(7).fill('').map((item, i) => {
            return {
              name: i === 0 ? '费用说明' : item,
              merges: i === 7 - 1 ? '' : 'right',
              font: {
                name: '宋体',
                size: 8,
                bold: true,
              },
            };
          }),
        ],
        //行头
        [
          ...new Array(11).fill('').map((item, i) => {
            return {
              name: item,
            };
          }),
          ...[
            '事假（天）',
            '病假（天）',
            '迟到（次数）',
            '早退（小时）',
            '旷工（天）',
            '忘打卡（次数）',
            '调休（天）',
            '年假（天）',
            '婚假（天）',
            '产假（天）',
            '产检假（天）',
            '公出（天）',
            '陪产假（天）',
            '丧假（天）',
            '月度人员费用',
            '加班费用',
            '未打卡扣款',
            '奖励',
            '金额小计',
            '备注',
            '员工签字',
          ].map((item, i) => {
            let textOpt = {
              '迟到（次数）': `作者:
              5分钟至1小时内算迟到
              `,
              '调休（天）': `Administrator:
              以往待调休在本月调休。同周期调休不在此处体现，直接体现在应出勤和实际出勤中。`,
              月度人员费用: `pozhixia:
              =人员单价/应出勤天数*实际出勤天数
              `,
              加班费用: `pozhixia:
              =固定加班费*加班小时数
              `,
              奖励: `pozhixia:
              1.净身高高于1.75米奖励100元
              2.退休军人（有退伍证）奖励200元，可累加
              `,
              金额小计: `Administrator:
              指以往加班未调休的
              `,
            };
            if (Object.keys(textOpt).includes(item)) {
              return {
                name: item,
                wrapText: true,
                font: {
                  name: '宋体',
                  size: 8,
                  bold: true,
                },
                textRotation: 'vertical',
                note: {
                  texts: [
                    {
                      font: {
                        size: 8,
                        color: { argb: 'FF000000' },
                        name: '宋体',
                        family: 2,
                        scheme: 'none',
                      },
                      text: textOpt[item],
                    },
                  ],
                  margins: {
                    insetmode: 'custom',
                    inset: [0.55, 0.25, 0.55, 0.35],
                  },
                },
              };
            } else {
              return {
                name: item,
                wrapText: true,
                textRotation: i < 19 ? 'vertical' : 0,
                font: {
                  name: '宋体',
                  size: 8,
                  bold: true,
                },
              };
            }
          }),
        ],
        //用户信息
        ...infoArray.map(({ index, id, name, restDays, daysOption, workHours }, i) => {
          let OnboardingOpt = {
            //入职时间
            李友芬: '2018/8/1',
            马青秀: '2016/11/7',
            赵六: '2017/8/1',
            李四: '2020/1/1',
          };
          let days = daysOptionLength - 4; //应出勤天数 减去每个月休息4天
          return [
            ...[
              index,
              id,
              name,
              OnboardingOpt[name],
              '',
              i === 0 ? '四' : '三',
              '/',
              '8',
              days,
              daysOptionLength - restDays,
            ].map((item, i) => {
              return {
                name: item,
                bgColor: i === 5 || i === 6 || i === 7 ? bgColor : '',
                font: {
                  name: '宋体',
                  size: 9,
                  bold: i === 1 || i === 2 || i === 3 || i === 4 || i === 5 || i === 6 || i === 7,
                },
              };
            }),
            ...new Array(15).fill('').map((item, i) => {
              return {
                name: item,
              };
            }),
            ...['3500.00', '', '', '', '3500.00', '', ''].map((item, i) => {
              return {
                name: item,
              };
            }),
          ];
        }),
        [
          {
            name: `费用小计`,
            merges: 'right',
            font: {
              name: '宋体',
              size: 9,
              bold: true,
            },
          },
          ...new Array(24).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === 24 - 1 ? '' : 'right',
            };
          }),
          ...[infoArray.length * 3500 + '.00', '', '', '', infoArray.length * 3500 + '.00', '', ''].map((item, i) => {
            return {
              name: item,
              font: {
                name: '宋体',
                size: 9,
                bold: true,
              },
            };
          }),
        ],
        [
          {
            name: `薪资费用合计`,
            merges: 'right',
            font: {
              name: '宋体',
              size: 9,
              bold: true,
            },
          },
          ...new Array(24).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === 24 - 1 ? '' : 'right',
            };
          }),
          ...[infoArray.length * 3500 + '.00', '', '', '', '', '', ''].map((item, i) => {
            return {
              name: item,
              merges: i === 7 - 1 ? '' : 'right',
              font: {
                name: '宋体',
                size: 9,
                bold: true,
              },
            };
          }),
        ],
        [
          {
            name: '备注：保洁工作时间：7：30-17：00，共8个小时',
            merges: 'right',
            horizontal: 'left',
          },
          ...new Array(31).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === 31 - 1 ? '' : 'right',
            };
          }),
        ],
        [
          {
            name: '制表人：',
            merges: 'right',
            border: {},
            font: {
              name: '宋体',
              size: 10,
            },
          },
          ...new Array(7).fill('').map((item, i) => {
            return { name: item, merges: i === 7 - 1 ? '' : 'right', border: {} };
          }),
          {
            name: '案场负责人：',
            merges: 'right',
            border: {},
          },
          ...new Array(23).fill('').map((item, i) => {
            return {
              name: item,
              merges: i === 23 - 1 ? '' : 'right',
              border: {},
              font: {
                name: '宋体',
                size: 10,
              },
            };
          }),
        ],
      ];
      // 构建 workbook 对象
      var worksheet = workbook.addWorksheet('排班考勤明细表');
      var worksheet2 = workbook.addWorksheet('考勤汇总表');

      (function name(params) {
        let { output, refs, merges } = outputSheetDataForExceljs(resData);
        Object.keys(output).forEach((key) => {
          Object.keys(output[key]).forEach((key2) => {
            worksheet.getCell(key)[key2] = output[key][key2];
          });
        });
        // console.log('merges', merges);
        //合并单元格
        merges.forEach((item) => {
          worksheet.mergeCells(item.s.r + 1, item.s.c + 1, item.e.r + 1, item.e.c + 1);
        });
      })();
      (function name(params) {
        let { output, refs, merges } = outputSheetDataForExceljs(resData2);
        Object.keys(output).forEach((key) => {
          Object.keys(output[key]).forEach((key2) => {
            worksheet2.getCell(key)[key2] = output[key][key2];
          });
        });
        // console.log('merges', merges);
        merges.forEach((item) => {
          worksheet2.mergeCells(item.s.r + 1, item.s.c + 1, item.e.r + 1, item.e.c + 1);
        });
      })();

      //设置表格列宽
      let unitNum = 4.7; //表格宽度转化值对应倍数,长按表格列出现宽度厘米
      [
        0.63 * unitNum, //单位厘米
        1.61 * unitNum,
        1.51 * unitNum,
        1.16 * unitNum,
        1.16 * unitNum,
        1.16 * unitNum,
        1.16 * unitNum,
        1.93 * unitNum,
        ...new Array(daysOptionLength).fill(0.56 * unitNum),
        1.14 * unitNum,
        0.74 * unitNum,
        1.69 * unitNum,
      ].forEach((item, i) => {
        worksheet.getColumn(i + 1).width = item;
      });
      unitNum = 4.7;
      [
        0.63 * unitNum,
        1.61 * unitNum,
        1.51 * unitNum,
        2.04 * unitNum,
        1.01 * unitNum,
        1.11 * unitNum,
        1.11 * unitNum,
        1.11 * unitNum,
        ...new Array(17).fill(0.66 * unitNum),
        1.93 * unitNum,
        1.24 * unitNum,
        1.24 * unitNum,
        1.24 * unitNum,
        1.85 * unitNum,
        0.93 * unitNum,
        2.14 * unitNum,
      ].forEach((item, i) => {
        worksheet2.getColumn(i + 1).width = item;
      });
      //设置行高
      [35, 20, 15.75, 15.75, ...new Array(xlsxData.length * 3).fill(15.75), ...new Array(3).fill(15.75), 35].forEach(
        (item, i) => {
          worksheet.getRow(i + 1).height = item;
        }
      );
      [40, 20, 15.75, 116.75, ...new Array(xlsxData.length).fill(30), 22.45, 22.45, 15.75, 35].forEach((item, i) => {
        worksheet2.getRow(i + 1).height = item;
      });

      workbook.eachSheet(function (worksheet, sheetId) {
        //console.log('worksheet', worksheet, sheetId);
        // 在 A1上插入图片
        worksheet.addImage(
          workbook.addImage({
            base64: logo,
            extension: 'png',
          }),
          {
            tl: { col: 0, row: 0 },
            //br: { col: (387 / 92) * 0.7, row: 1 * 0.9 },
            ext: { width: 387 / 2, height: 92 / 2 },
          }
        );

        // 之后调整页面设置配置
        worksheet.pageSetup = {
          margins: {
            //页眉页脚
            left: 0.7,
            right: 0.7,
            top: 0.75,
            bottom: 0.75,
            header: 0.3,
            footer: 0.3,
          },
          paperSize: 9, //A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          //scale: 92,
        };
      });

      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 10000,
          height: 20000,
          firstSheet: 0,
          activeTab: 1, //当前显示的worksheet位置第二个
          visibility: 'visible',
        },
      ];
      const EXCEL_TYPE =
        /* 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' */ 'application/vnd.ms-excel';
      setTimeout(() => {
        workbook.xlsx
          .writeBuffer()
          .then((data) => {
            const blob = new Blob([data], { type: EXCEL_TYPE });
            //FileSaver.saveAs(blob, './test.xlsx');
            const url = URL.createObjectURL(blob);
            let $dom = $('<a class="download">下载已生成的xlsx表格文件</a>').attr({
              download: 'test.xlsx',
              target: 'blank',
              href: url,
            });
            $('body').append($dom);
            //$('#xlsx').attr('src', url);
          })
          .catch((err) => {
            throw err;
          });
      }, 50);
    }
  };
  reader.readAsArrayBuffer(f);
}
$(function () {
  $('#fileUpload').change(handleFile);
});
//通过url生成base64格式图片
function getImgToBase64(url, callback) {
  return new Promise((resolve) => {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);
      var dataURL = canvas.toDataURL('image/png'); //base64格式
      resolve(dataURL);
      canvas = null;
    };
    img.src = url;
  });
}
