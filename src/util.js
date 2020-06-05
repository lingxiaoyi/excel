module.exports = {
  /**
   * 异步延迟
   * @param {number} time 延迟的时间,单位毫秒
   */
  sleep(time = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  },
  outputSheetData(resData) {
    let merges = [];
    let output = resData
      .map((v, i) => {
        return v.map((k, j) => {
          let positionString = '';
          let remainderNum = j % 26; //余数
          let interNum = Math.floor(j / 26); //取整
          if (interNum > 0) {
            positionString = String.fromCharCode(64 + interNum) + String.fromCharCode(65 + remainderNum);
          } else {
            positionString = String.fromCharCode(65 + j);
          }
          return { c: j, r: i, position: positionString + (i + 1), ...k };
        });
      })
      .reduce((prev, next) => prev.concat(next))
      .reduce((prev, next) => {
        let fill = next.bgColor ? { fgColor: { rgb: next.bgColor } } : { fgColor: { rgb: 'ffffff' } };
        let font = next.font
          ? next.font
          : {
              name: '宋体',
              sz: 9,
            };
        let border = next.border
          ? next.border
          : {
              //单元格外侧框线
              left: {
                style: 'thin',
              },
              top: {
                style: 'thin',
              },
              bottom: {
                style: 'thin',
              },
              right: {
                style: 'thin',
              },
            };
        //合并的merges
        if (next.merges === 'bottom') {
          //往只能下合并
          let index = merges.findIndex((item) => {
            return item.e.c === next.c && item.e.r === next.r;
          });
          if (index === -1) {
            merges.push({
              s: { c: next.c, r: next.r },
              e: { c: next.c, r: next.r + 1 },
            });
          } else {
            merges[index] = {
              s: merges[index].s,
              e: { c: next.c, r: next.r + 1 },
            };
          }
        } else if (next.merges === 'right') {
          //往右合并
          let index = merges.findIndex((item) => {
            return item.e.c === next.c && item.e.r === next.r;
          });
          if (index === -1) {
            merges.push({
              s: { c: next.c, r: next.r },
              e: { c: next.c + 1, r: next.r },
            });
          } else {
            merges[index] = {
              s: merges[index].s,
              e: { c: next.c + 1, r: next.r },
            };
          }
        }
        let c = [{ a: 'SheetJS', t: "I'm a little comment, short and stout!" }];
        c.hidden = true;
        return {
          ...prev,
          ...{
            [next.position]: {
              v: next.name,
              s: {
                alignment: {
                  horizontal: next.horizontal ? next.horizontal : 'center',
                  vertical: 'center',
                  wrapText: next.wrapText,
                },
                fill,
                font,
                border,
              } /* ,
              c, //注释
              l:{ Target:"http://sheetjs.com", Tooltip:"Find us @ SheetJS.com!" }, //超链 */,
            },
          },
        };
      }, {});
    // 获取所有单元格的位置
    const outputPos = Object.keys(output);
    // 计算出范围
    const ref = outputPos[0] + ':' + outputPos[outputPos.length - 1];
    return {
      ...output,
      '!ref': ref,
      '!merges': merges,
    };
  },
  outputSheetDataForExceljs(resData) {
    let merges = [];
    let output = resData
      .map((v, i) => {
        return v.map((k, j) => {
          let positionString = '';
          let remainderNum = j % 26; //余数
          let interNum = Math.floor(j / 26); //取整
          if (interNum > 0) {
            positionString = String.fromCharCode(64 + interNum) + String.fromCharCode(65 + remainderNum);
          } else {
            positionString = String.fromCharCode(65 + j);
          }
          //console.log('r', i, j );
          return { c: j, r: i, position: positionString + (i + 1), ...k };
        });
      })
      .reduce((prev, next) => prev.concat(next))
      .reduce((prev, next) => {
        let fill = next.bgColor
          ? {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: next.bgColor },
            }
          : {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: 'ffffff',
              },
            };
        let font = next.font
          ? next.font
          : {
              name: '宋体',
              size: 9,
            };
        let border = next.border
          ? next.border
          : {
              //单元格外侧框线
              left: {
                style: 'thin',
              },
              top: {
                style: 'thin',
              },
              bottom: {
                style: 'thin',
              },
              right: {
                style: 'thin',
              },
            };
        //合并的merges
        if (next.merges === 'bottom') {
          //往只能下合并
          let index = merges.findIndex((item) => {
            return item.e.c === next.c && item.e.r === next.r;
          });
          if (index === -1) {
            merges.push({
              s: { c: next.c, r: next.r },
              e: { c: next.c, r: next.r + 1 },
            });
          } else {
            merges[index] = {
              s: merges[index].s,
              e: { c: next.c, r: next.r + 1 },
            };
          }
        } else if (next.merges === 'right') {
          //往右合并
          let index = merges.findIndex((item) => {
            return item.e.c === next.c && item.e.r === next.r;
          });
          if (index === -1) {
            merges.push({
              s: { c: next.c, r: next.r },
              e: { c: next.c + 1, r: next.r },
            });
          } else {
            merges[index] = {
              s: merges[index].s,
              e: { c: next.c + 1, r: next.r },
            };
          }
        }
        let c = [{ a: 'SheetJS', t: "I'm a little comment, short and stout!" }];
        c.hidden = true;
        let noteOpt = next.note ? { note: next.note } : {};
        return {
          ...prev,
          ...{
            [next.position]: {
              value: next.name,
              alignment: {
                horizontal: next.horizontal ? next.horizontal : 'center',
                vertical: 'middle',
                wrapText: next.wrapText,
                textRotation: next.textRotation ? next.textRotation: 0
              },
              fill,
              font,
              border,
              ...noteOpt,
            },
          },
        };
      }, {});
    // 获取所有单元格的位置
    const outputPos = Object.keys(output);
    // 计算出范围
    const refs = outputPos[0] + ':' + outputPos[outputPos.length - 1];
    return {
      output,
      refs,
      merges,
    };
  },
};
