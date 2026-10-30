# Fairy — DeepSeek Harness 主题插件

把《绝区零》里 H.D.D. 的 AI「Fairy」搬进 DeepSeek Harness 的 Web 界面：**皮肤 + 开屏动画 + 可选的人设预设 + 可选的本地语音朗读**。

> 非官方同人作品。角色与相关设定版权归 miHoYo / 米哈游所有，本仓库不含任何游戏资源文件。

## 功能

| 模块 | 说明 | 依赖 |
|---|---|---|
| 皮肤 | 深海军蓝底、56px 细网格、冷光暗角；左上角品牌位换成 Fairy 徽记 +「Ⅲ型总序式集成泛用人工智能」 | 无 |
| 开屏 | H.D.D. 启动画面 → 白闪 → 徽记居中 + 三句问候 → 缩到左下角；点击任意处跳过，约 12 秒 | 无 |
| 人设 | 一个叫 `Fairy` 的 agent preset：称「主人」、三拍冷面、档案体 | 无 |
| 语音 | 点「朗读」用 GPT-SoVITS 念出最近一条回答 | Python + 本地模型 |

没有语音运行时的时候，语音按钮**不会出现**，不会留下点了没反应的死按钮。

## 安装

1. 下载本仓库，或 `git clone`
2. 在 Harness 里：设置 → 插件 → 从目录安装，指向本目录
3. 刷新页面

开屏动画每次刷新都会播；点一下屏幕可以跳过。

## 启用 Fairy 人设

插件安装后，新建会话时在预设列表里选 **Fairy**。

想让新会话默认就是她：把 `cordis.patch.yml` 里 `preset-fairy` 那一段改成覆盖 `preset-standard`（把 `- insert:` 包裹去掉，改成 `- id: preset-standard`，`config.id` 改成 `standard`），重装即可。注意这会替换掉原本的 standard 预设。

## 语音（可选）

语音不在插件里，需要本机准备：

1. Python 3.9 + PyTorch（CPU 或 CUDA）+ GPT-SoVITS 推理环境
2. GPT 权重 `.ckpt`、SoVITS 权重 `.pth`、一段参考音频
3. 一个 `fairy_tts.py` 推理脚本，接受 `--serve`（stdin/stdout JSON 行协议）或 `--text`

用环境变量告诉插件它们在哪：

| 变量 | 作用 | 默认 |
|---|---|---|
| `FAIRY_PYTHON` | Python 解释器 | `E:/python3.9/python.exe`（不存在则用 PATH 里的 `python`） |
| `FAIRY_SCRIPT` | 推理脚本 | `../fairy-voice/fairy_tts.py`（相对插件目录） |
| `FAIRY_OUT` | 音频输出目录 | `../fairy-voice/out` |

- 「朗读」念最近一条回答；播放时再点一次停止
- 「释放」立即结束引擎进程、让出显存
- 4 分钟无操作也会自动释放
- 开屏问候需要一段预生成音频 `<FAIRY_OUT>/greeting.wav`；没有就只显示文字

## 自己构建 client.js

`client.js` 是构建产物。开屏用的背景图**不随仓库分发**（版权原因）：

```bash
node scripts/build.mjs          # 没有 assets/orb.jpg 时用纯渐变背景
```

把你的图片放到 `assets/orb.jpg` 再执行一次，就会内联进构建结果。

## 许可

代码 MIT。角色形象、名称属于米哈游；GPT-SoVITS 为其作者所有，均不包含在本仓库中。
