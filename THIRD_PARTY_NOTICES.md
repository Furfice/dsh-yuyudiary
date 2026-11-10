# 第三方与素材来源

本插件自己编写的代码与文档自 1.12.10 起采用根目录 `LICENSE` 中的“鱼鱼日记许可协议 1.0”，作者署名为 Furfice：允许商业使用，禁止未经另行授权的收费转售。该代码许可证不替代以下第三方许可，也不自动涵盖原始人设参考图及基于它生成的角色插画。

## html-to-image

PNG 导出使用随包提供的 `html-to-image` 1.11.13，许可为 MIT。

- 上游：https://github.com/bubkoo/html-to-image/tree/v1.11.13
- 运行文件：`assets/vendor/html-to-image.js`
- 原始许可全文：`assets/vendor/html-to-image.LICENSE`
- 来源与下载完整性记录：`assets/vendor/source.json`

分发该文件时保留其原始版权与许可声明。本插件自己的许可证不替代这份第三方许可。

## DSH 运行时

`@deepseek-ai/cordis`、`@deepseek-ai/schemastery` 和 `@deepseek-ai/dsh-typert-protocol` 由使用者安装的 DSH 宿主提供，通过可选 peerDependencies 声明；本包不包含它们的运行时副本。源项目为 https://github.com/deepseek-ai/deepseek-harness 。

## 涂鸦和角色参考

`assets/yuyu-doodles*.png` 共十份图集、60 张涂鸦，在开发期间使用内置 `image_gen` 工具，参考使用者提供的蓝发鲸鱼娘人设图生成。它们是 AI 生成的手绘风格插画，不是人工自绘。生成提示词和场景记录见 `IMAGE-PROMPT.md`、`assets/generation-prompts.json` 与 `assets/generation-prompts-60.json`。

### 角色与素材致谢

- **原始鲸鱼娘形象：** [上善无形（上善）](https://space.bilibili.com/4456176)（B站）。
- **DeepSeek 娘形象设计（女仆版）：** [ZipZipPipe](https://space.bilibili.com/4168597)（B站）。
- **Q 版人设设计：** 这个刀子真甜（B站）。
- **本插件涂鸦：** 参考上述角色设计，使用 AI 工具生成手绘风格插画。

感谢原作者的创作。角色及参考图的权利归相应权利人所有，素材许可与本插件代码许可分别说明。

项目维护者确认了本插件所用参考图的女仆版设计与 Q 版设计署名。更早的角色来源参考 [社区署名记录](https://github.com/xiaoweigen/deepseek-dafeiyu-assets/blob/main/NOTICE.md)，该记录区分上善无形的原始角色与 ZipZipPipe 的女仆版二次设计。

项目维护者已确认所提供的角色参考素材可用于本项目的创作与分享。角色参考和上游素材仍遵循各原作者的适用许可；本插件的代码许可不替代美术素材自身的许可。本包没有附带使用者提供的原始参考图。

`assets/diary-preview.png` 是项目维护者提供的界面截图，展示模拟日记，仅用于项目介绍。

另查阅了 [TreapGoGo/deepseek-whale-girl](https://github.com/TreapGoGo/deepseek-whale-girl)；其 README 明确将角色设定图排除在网站代码的 MIT 许可之外，因此不将该仓库的代码许可作为本插件插画的授权依据。

## 人设写作参考

社区项目与写作资料的链接、参考范围和取舍记录在 `PERSONA.md`。这些参考链接不表示相关项目或 DeepSeek 官方为本插件提供授权、维护或背书。
