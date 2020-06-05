> 最近碰到个需要自动生成表格的任务，作为前端的我，就想在 node 和浏览器中生成强大的表格，所以特此研究了很多关于表格的 npm 库

## 支持读写 Excel 的 node.js 模块

- node-xlsx: 基于 Node.js 解析 excel 文件数据及生成 excel 文件，仅支持 xlsx 格式文件
- js-xlsx: 目前 Github 上 star 数量最多的处理 Excel 的库，支持解析多种格式表格 XLSX / XLSM / XLSB / XLS / CSV，解析采用纯 js 实现，写入需要依赖 nodejs 或者 FileSaver.js 实现生成写入 Excel，可以生成子表 Excel，功能强大，但上手难度稍大。不提供基础设置 Excel 表格 api 例单元格宽度，文档有些乱，不适合快速上手；普通版本不支持定义字体、颜色、背景色等，有这个功能需要的可以使用 pro 版，是要联系客服收费的，害我照着 API 设置调试了好多次都失败。样式设置问题本人已解决，见根目录本人修改的 xlsx.js
- xlsx-style 基于 xlsx 封装的样式库，可以在 xlsx 的基础上设置样式。样式不全，宽度都设置不了，好多年前作者就不维护了.宽度设置问题本人已解决了，见修改的 xlsx-style.js 文件
- exceljs 在此之前花费了很大的精力，用以上库做好了表格，但是发现不能设置页眉页脚，添加图片，打印选项设置等等，直到发现了这个库，文档齐全，功能无比强大，并且还免费.本教程主要针对这个库

## 代码库地址

- [https://github.com/lingxiaoyi/excel](https://github.com/lingxiaoyi/excel)

## 安装

`npm install`

`npm install -g nodemon`

调试使用，替代 node 命令，实现保存文件，node 自动重新启动执行，必须全局安装才能运行

## 使用

`nodemon app.js`

- js-xlsx 具体 api 使用方法请参考 main.js demo 使用，app.js 中修改为 require('./src/main.js');
- exceljs 具体 api 使用方法请参考 main-exceljs.js demo 使用，app.js 中修改为 require('./src/main-exceljs.js');

因为每次生成完表格，每次都需要打开表格查看样式，在 windows 电脑中，打开表格之后就锁定不能生成新文件了，本来想着能导出一个 html 文件对应表格的样式

## node 调试

vscode 中打开调试右侧设置编辑，将下方代码复制进去，点 nodemon 启动就可以进行 debug 调试了

```js
{
      "type": "node"，
      "request": "launch"，
      "name": "nodemon"，
      "runtimeExecutable": "nodemon"，
      "program": "${workspaceFolder}/app.js"，
      "restart": true，
      "console": "integratedTerminal"，
      "internalConsoleOptions": "neverOpen"，
      "skipFiles": ["<node_internals>/**"]
    }，
```

## webpack 目录的作用

每次生成完新表格，都需要重新打开表格查看样式，在 windows 电脑中，打开表格之后就锁定了，再次生成新表格就会报错，文件已锁定，不能写入，对于想偷懒的我，能不能实现像 webpack 热更新功能那种，修改样式 js 页面自动更新呢?

wps 自带另存 html 文件功能，但是没找到 api 接口.网上也搜索不到对应的转换功能.
本来以为自己要实现一套表格转 html 的功能.通过不断尝试.偶然间发现手机浏览器可以直接打开预览 xlsx 文件，内心狂喜啊.

### 使用方法

进入 webpack 目录安装依赖包，安装好之后执行

`npm run dev`

启动成功之后，会自动打开带有 ip 地址的预览地址，此时在电脑浏览器会自动下载 xlsx 文件，忽略不管，用手机直接打开此地址，就能看到 xlsx 表格的内容了，并且每次新修改内容和样式，都会自动刷新页面显示新表格.

### 小技巧

谷歌浏览器:

- [生成二维码的插件](https://chrome.google.com/webstore/detail/%E4%BA%8C%E7%BB%B4%E7%A0%81qr%E7%A0%81%E7%94%9F%E6%88%90%E5%99%A8qr-code-generato/pflgjjogbmmcmfhfcnlohagkablhbpmg)生成二维码方便手机扫描
- [划词翻译](https://chrome.google.com/webstore/detail/%E5%88%92%E8%AF%8D%E7%BF%BB%E8%AF%91/ikhdkkncnoglghljlkmcimlnlhkeamad) 用来翻译一些看不懂的英文文档

## browser 目录

浏览器中实现生成 xlsx 表格方法

进入 browser 目录安装依赖包，安装好之后执行

`npm run dev`

启动成功之后，拖动根目录 src 下的李四表格到页面上的输入框里，成功生成表格之后会生成一个下载链接地址，右键在新标签页打开链接，即会生成一个新的表格文件出来，完整 api 使用和 demo 文件请参考 index.js

vue 和 react 用法可以参考此例子，如果有必要也可以此版本库的例子

## 一些概念

在使用这个库之前，先介绍库中的一些概念。

- workbook 对象，指的是整份 Excel 文档。我们在使用 js-xlsx 读取 Excel 文档之后就会获得 workbook 对象。
- worksheet 对象，指的是 Excel 文档中的表。我们知道一份 Excel 文档中可以包含很多张表，而每张表对应的就是 worksheet 对象。
- cell 对象，指的就是 worksheet 中的单元格，一个单元格就是一个 cell 对象。

## xlsx 使用注意事项

```js
constXLSX = require('xlsx');
let html = XLSX.utils.sheet_to_html(workbook.Sheets.Sheet1);
```

生成 html 的用法，并且不会有任何样式

## exceljs 使用注意

### 读取文件问题

因为 exceljs 读取文件不支持 sync 同步读取，给的实例也是 await 例子.导致我读取完遇到一个问题，就是老是生成不成功，最后发现必须要把所有逻辑全部放入函数中，像下方这样

```js
(async function (params) {
  let res = await workbook.xlsx.readFile(`${__dirname}/赵六.xlsx`);
  //执行所有数据处理逻辑
  //执行写的逻辑
  workbook.xlsx.writeFile(path.resolve(__dirname， '../webpack/test222.xlsx'));
});
```

> 所有逻辑全部要写入这个函数中，这样本来是可以的，但是出错调试几率较大，并且读取到的数据庞大还需要额外处理，所以我读取数据逻辑就用的 node-xlsx，十分简单方便，如果你用的 exceljs 读取文件数据出现问题，大概率是异步同步逻辑搞错了，多加注意即可

### 宽度设置

列宽不知道是以什么为单位，反正不是像素(已测量)，例子中是以厘米为单位再乘以 4.7 的结果设置的，4.7 是不断测试的结果.
快捷查看列宽的方法，打开 wps 表格，长按列与列字母间的竖线，就能看到列宽，取厘米的单位即可.见下图

![](https://user-gold-cdn.xitu.io/2020/6/5/172845ef6b0d9f28?w=283&h=160&f=jpeg&s=14690)

### 前景色

> 前景色设置必须右键单元格选择设置单元格格式，然后选择图案样式选择颜色，就可以前景色填充

`worksheet.getCell('A2').fill = { type: 'pattern'， pattern:'darkTrellis'， fgColor:{argb:'FFFFFF00'}， bgColor:{argb:'FF0000FF'} };`

### 背景色

`worksheet.getCell('A2').fill = { type: "pattern"， pattern: "solid"， fgColor: { argb: next.bgColor }， }`

## 排版不一致的问题

> 解决 Mac 下编辑 Microsoft Office Word 文档与 Windows 排版不一致的问题，，不同的系统用 wps 打开相同的表格，打印预览的时候，表格宽度显示不一样

[问题详细说明地址](https://support.office.com/zh-cn/article/excel-2011-for-mac-%E4%B8%8E%E6%9B%B4%E9%AB%98%E7%89%88%E6%9C%AC%E4%B9%8B%E9%97%B4%E7%9A%84%E5%88%97%E5%AE%BD%E5%B7%AE%E5%BC%82-beec11ce-aea9-4c67-9a23-dfa458e01b9c)

我的解决办法就是 mac 下显示正常，按 mac 下的宽度来设置就可以了

## 参考资料

- [exceljs](https://github.com/exceljs/exceljs/blob/HEAD/README_zh.md)
- [node-xlsx](https://github.com/mgcrea/node-xlsx#readme)
- [js-xlsx](https://github.com/SheetJS/sheetjs)

~
创作不易，如果对你有帮助，请给个星星 star✨✨ 谢谢，地址[https://github.com/lingxiaoyi/excel](https://github.com/lingxiaoyi/excel)
~
