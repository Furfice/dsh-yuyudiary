# 手绘风格涂鸦资产

以下插画由 AI 参考使用者提供的蓝发鲸鱼娘人设图生成。“手绘风格”描述视觉效果，不表示人工绘制。角色署名分别记录为上善无形（原始鲸鱼娘形象）、ZipZipPipe（DeepSeek 女仆版设计）、这个刀子真甜（Q 版人设设计）。项目维护者已确认所提供的参考素材可用于本项目的创作与分享；本说明记录制作过程，上游素材仍遵循各原作者的适用许可。完整署名及来源记录见 `THIRD_PARTY_NOTICES.md`。

## 1.2.0 扩充：共 60 张，每日一张

本次通过内置 `image_gen` 新增 36 张，保留之前全部 24 张。六次调用完整提示词与场景顺序在 `assets/generation-prompts-60.json`，每次均设置 `transparent_background: true`。

下列图集均为 1254 × 1254 RGBA PNG，每份三列两行、六个独立场景，随插件存放在 `assets/` 下。

| 图集 | 场景（从左到右、从上到下） |
| --- | --- |
| `yuyu-doodles-treats.png` | 擀面团、捏饭团、翻煎饼、吃西瓜、草莓蛋糕、倒花茶 |
| `yuyu-doodles-crafts.png` | 画水彩、织围巾、绣星星、贴手账、系礼物丝带、折纸鹤 |
| `yuyu-doodles-outdoors.png` | 骑小车、提野餐篮、看蝴蝶、吹泡泡、堆雪人、捡贝壳 |
| `yuyu-doodles-play.png` | 玩手柄、摇铃鼓、戴纸王冠、放纸飞机、想棋局、转小风车 |
| `yuyu-doodles-moods.png` | 伸懒腰、鼓脸颊、拆惊喜信、害羞捧花、挽袖加油、探头看你 |
| `yuyu-doodles-dreams.png` | 坐月亮、抱海洋瓶、钓玩具鱼、坐游泳圈、抛小星星、看沙漏 |

当前规则：每天一张，放在从左页连续写到右页的正文末尾；每轮六十个日期用完 60 张。旧版保存了多张的页面仅展示第一张。原始透明 PNG 不重新处理，通过 CSS 裁切单格，图片按需读取。

## 1.1.0 扩充：共 24 张

这次使用内置 `image_gen` 新增 18 张，保留最初六张。三次调用的完整提示词与场景顺序保存在 `assets/generation-prompts.json`，每次均设置 `transparent_background: true`。

| 新增图集 | 实际尺寸 | 场景（按从左到右、从上到下） |
| --- | --- | --- |
| `assets/yuyu-doodles-daily.png` | 1536 × 1024 | 吃米饭、煮饭、读书、听音乐、浇花、裹毯子 |
| `assets/yuyu-doodles-curious.png` | 1536 × 1024 | 观察小虫、转魔方、搭积木、整理卡片、看星星、折纸船 |
| `assets/yuyu-doodles-moments.png` | 1254 × 1254 | 撑伞、拍照、放风筝、围巾与落叶、庆祝小进展、得意地点赞 |

三份最终 PNG 均保存在 `assets/` 下，随插件一并分发。都保留生成时的原始 RGBA 像素，未进行程序抠图。图集尺寸有所不同，构建脚本读取实际宽高，前端按对应单格比例显示。

1.1.0 当时的规则是每页三张、每轮八个日期使用 24 张。1.2.0 已改为上述每天一张规则，保留这些原图和编号。

## 1.0.0 原始六张

生成方式：Codex 内置 `image_gen` 工具，不使用 API/CLI 备用方案。

- 最终保存：`assets/yuyu-doodles.png`
- 规格：1280 × 1280 PNG，透明背景，三列两行，共六个独立场景。
- 场景：写日记、使用笔记本电脑、抱鲸鱼玩偶、打盹、查看任务清单、喝茶。

以下保存的是复现用最终美术提示词，不是原始调用日志：

```text
Use case: illustration-story / identity-preserve
Asset type: transparent doodle atlas for the left page of a diary plugin.
Input image: the DeepSeek whale-girl character reference.
Preserve the recognizable blue hair, blue eyes, white maid headband,
navy-and-white maid outfit and whale details from the reference.
Draw six small charming colored-pencil and hand-drawn doodles:
writing in a diary, working on a laptop, hugging a whale plush,
sleeping peacefully, checking a task list, and holding a cup of tea.
Use soft blue accents, gentle sketch lines, light pencil texture,
slightly imperfect handmade shapes, and consistent character proportions.
Arrange a clean 3-column by 2-row atlas on a square canvas.
Center one complete character vignette inside each equal cell.
Keep ample transparent padding around every vignette, with no artwork
crossing cell boundaries. No panel borders, text, labels or watermark.
The background must be truly transparent, including between doodles.
```

原始透明像素保持不变。前端通过 CSS 裁切图集；当前版本用日期确定一天的一张图和轻微倾角。背景纸张、横线、书脊和书签由插件 CSS 绘制。
