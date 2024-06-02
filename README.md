#  EBook Code

EPUB文档编辑器，目前正在开发中。

## Features

* 支持ePub 2.0和ePub 3.0
* 代码高亮、代码提示和补全。
* 实时预览
* 全书搜索、替换，支持正则搜索、全文字搜索、纯文本搜索。但目前只支持单行匹配。
* 增、删、改以及重命名ePub内的文件。
* 编辑元数据、封面、目录等等
* 内置几十种界面主题

## TODO

* 插件
* 多行搜索
* 自定义主题各部分的颜色
* 字体子集化
* 文件分割
* 代码片段
* 自动检测更新
* 多文件处理、例如重命名

## Run the app

### Install the dependencies

```bash
pnpm install
```

### Start the app in development mode

```bash
pnpm tauri:dev
```

### Lint the files

```bash
pnpm lint
```

### Build the app

```bash
pnpm tauri:build
```