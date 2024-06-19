#  Ebook Code

EPUB文档编辑器，目前正在开发中。

# Preview

![pre01.jpg](./res/pre01.jpg)
![pre02.jpg](./res/pre02.jpg)
![pre03.gif](./res/pre03.gif)
![pre04.gif](./res/pre04.gif)

## Features

* 支持创建ePub2和ePub3。
* 代码高亮、代码提示和补全。
* 实时预览。
* 全书搜索、替换，支持正则搜索、全文字搜索、纯文本搜索。但目前只支持单行匹配。
* 增、删、改以及重命名ePub内的文件。
* 编辑元数据、封面、目录等等。
* 内置几十种界面主题。
* ePub3兼容ePub2。

## TODO

* 多文件批量处理
* 自动生成目录
* 支持插件
* 多行搜索
* 字体子集化
* 自定义主题颜色
* 文件分割、合并
* 代码片段
* 自动检测更新

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