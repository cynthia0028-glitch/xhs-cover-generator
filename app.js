const canvas = document.querySelector("#coverCanvas");
const ctx = canvas.getContext("2d");

const imageInput = document.querySelector("#imageInput");
const thumbStrip = document.querySelector("#thumbStrip");
const titleInput = document.querySelector("#titleInput");
const subtitleInput = document.querySelector("#subtitleInput");
const generateBtn = document.querySelector("#generateBtn");
const downloadBtn = document.querySelector("#downloadBtn");
const aiGenerateBtn = document.querySelector("#aiGenerateBtn");
const copyPromptBtn = document.querySelector("#copyPromptBtn");
const shuffleBtn = document.querySelector("#shuffleBtn");
const statusText = document.querySelector("#statusText");
const promptOutput = document.querySelector("#promptOutput");
const styleHint = document.querySelector("#styleHint");
const segments = [...document.querySelectorAll(".segment")];

const W = canvas.width;
const H = canvas.height;
const AI_IMAGE_ENDPOINT = "/api/generate-cover";
const DEFAULT_IMPACT = 72;
const DEFAULT_IMAGE_RATIO = 58;
let uploadedImages = [];
let uploadedFiles = [];
let activeStyle = "collage";
const activeLettering = "marker";

const previewImages = {
  collage: "./assets/collage-preview.png",
  handwrite: "./assets/handwrite-preview.png",
  cinema: "./assets/cinema-preview.png",
  impact: "./assets/impact-preview.png",
  guofeng: "./assets/guofeng-preview.png"
};

const previewCache = {};

const palettes = {
  handwrite: {
    bg: ["#d9c1c4", "#8797c1", "#f3eee6"],
    ink: "#ffffff",
    dark: "#171717",
    pop: "#f6e84d",
    soft: "#fd5a91",
    glow: "#111111",
    label: "手写自然"
  },
  collage: {
    bg: ["#f1e8df", "#c7d8ef", "#f7f7f1"],
    ink: "#103b4d",
    dark: "#111111",
    pop: "#ff4f9a",
    soft: "#21b68a",
    glow: "#fff4a8",
    label: "拼贴拙趣"
  },
  cinema: {
    bg: ["#1f2c25", "#c4a16d", "#0e1318"],
    ink: "#fff4db",
    dark: "#111111",
    pop: "#e8c857",
    soft: "#ffffff",
    glow: "#2f493d",
    label: "胶片质感"
  },
  impact: {
    bg: ["#fff044", "#ff8d22", "#111111"],
    ink: "#fff044",
    dark: "#111111",
    pop: "#ff3131",
    soft: "#00a7ff",
    glow: "#111111",
    label: "大字冲击"
  },
  guofeng: {
    bg: ["#f4ead8", "#a63f2d", "#17251f"],
    ink: "#f7efd8",
    dark: "#1f1712",
    pop: "#b92f24",
    soft: "#2f6b55",
    glow: "#d8b66a",
    label: "古典国风"
  }
};

const stylePrompts = {
  collage: `请根据用户上传的照片生成一张小红书竖版封面，比例 3:4。

封面风格参考：手写拼贴冒险风。画面以真实户外照片为主体，保留照片的真实光线和随拍感，不要做成商业海报。整体像博主自己手工制作的小红书封面，有轻松、真实、冒险、亲近自然的感觉。

画面构图： 将用户照片作为中心主体，照片可以略微倾斜摆放，像贴在深色纸板或手账背景上。四周加入手绘贴纸、白色纸片、胶带感边框、橙色小圆点、星星、箭头、弯曲线条等装饰。主体人物要清晰，表情和动作要有感染力。

标题文字： 主标题为「{主标题}」。使用手写风中文艺术字，文字像用马克笔或水彩笔写在白色黄色或棕色纹理纸片上，颜色为彩色，像用多色粉笔或者蜡笔书写。每一个字或者几个字可以根据语义拆成独立的小纸条，错落排布在画面上方和右侧。重点词可以放大、加粗、用描边或手写字突出。

辅助文字： 辅助文字为「{辅助文字}」。可以放在画面底部或左下角，使用手写字，像博主昵称、标签或话题标记。

色彩： 整体配色需要跟随用户上传照片的色系自动生成。请先观察照片中的主要颜色、背景颜色和人物服饰颜色，再选择 2-3 个协调的文字和装饰色。 文字主色优先选择与照片形成清晰对比但仍协调的颜色，
例如： 如果照片偏绿色/森林/草地，可以使用白色、浅黄色、浅蓝色或低饱和暖色；
如果照片偏蓝色/天空/海边，可以使用白色、明黄色、珊瑚色或浅粉色；
如果照片偏暖色/室内/夕阳，可以使用白色、奶油色、棕红色或浅青色；
如果照片偏暗色/夜景，可以使用白色、荧光黄、亮蓝色或浅粉色。
不要固定使用某一种颜色。所有手写字、纸片描边、圆点、箭头和贴纸装饰，都要从照片色系中延展出来，保证像是为这张照片专门设计的封面。

细节： 加入少量手绘感小图标，例如小星星、感叹号、弯曲箭头、涂鸦线、圆点、贴纸边框。画面要有手工拼贴感，排版可以错落但必须清晰可读。

输出： 生成完整小红书封面图，不要输出说明文字，不要加额外白边。不要做成精致商业海报，不要使用规整印刷体，不要过度科技感，不要赛博朋克，不要高级杂志大片感，不要让文字遮挡人物脸部，不要让画面过于干净空旷，不要生成无关人物，不要改变上传照片主体。

{主标题} = （为用户输入的标题）
{辅助文字} = （为用户输入的辅助文字）`,
  handwrite: `请根据用户上传的照片生成一张小红书竖版封面，比例 3:4。

封面风格参考：百万博主手写 Vlog 封面。整体要像真实小红书博主自己制作的生活类 vlog 封面，而不是商业海报。保留照片的真实生活感、随拍感和人物情绪。

画面构图：
以用户上传照片中的人物、场景或关键物品为主体。可以将人物或重要主体轻微抠出并添加白色手工描边，让主体从背景中跳出来。画面边角可以保留圆角卡片感。背景可以轻微压暗、增加胶片颗粒或网点纹理，让白色手写字更清晰。

标题文字：
主标题为「{主标题}」。使用自然手写风中文艺术字，像用马克笔、粉笔或手写笔直接写在照片上。字形不要太规整，大小、倾斜角度和间距可以略有差异。标题可以拆成 2-4 行，错落排列在画面左上、右上或主体旁边，形成随手记录感。

字体设计：
标题文字要有真实手写痕迹，笔画边缘略粗糙，不要像系统字体。可以使用白色为主色，也可以根据照片色系自动选择 1-2 个强调色。强调色应来自照片本身或与照片协调，例如衣服、天空、室内灯光、植物、道具中的颜色。不要固定使用某一种颜色。

装饰元素：
加入少量手绘涂鸦元素，例如小星星、问号、箭头、短线、波浪线、爱心、手绘圆点、胶带、贴纸、小英文备注或日期。装饰要像博主随手画上去的，不要过度整齐。可以在角落加入一个类似视频播放按钮的小标识，但不要出现真实平台 logo。

图片处理：
保留照片真实质感，可以轻微增加对比度、暗角、颗粒感或网点纹理。人物脸部和核心主体必须清晰，不要被文字遮挡。允许做轻微拼贴，例如重复出现小尺寸人物、局部小图、或把照片中的一部分做成贴纸。

色彩：
整体配色必须跟随用户上传照片自动生成。先观察照片主色、背景色和人物服饰色，再选择协调的文字色和装饰色。文字需要清晰可读，同时看起来像专门为这张照片设计的。不要固定使用橙红、粉色或荧光色。

不要预设固定色系，不要默认使用橙红、粉色、黄色、蓝色或任何固定爆款色。所有文字颜色、贴纸颜色、描边颜色、涂鸦颜色和强调色，都必须根据用户上传照片自动提取和延展。
请先分析照片色彩：
1. 识别照片的主色，例如天空蓝、草地绿、室内暖黄、夜景黑、雪地白、城市灰等。
2. 识别人物服饰、道具或背景中最有记忆点的颜色。
3. 从照片里选择 1 个主文字色、1 个强调色、1 个辅助装饰色。
4. 文字颜色必须与背景有足够对比，保证一眼可读。
5. 强调色要像是从照片里自然长出来的，而不是额外贴上去的固定色。

如果照片偏暗，优先使用高亮但协调的浅色文字；
如果照片偏亮，优先使用深色描边或半透明暗色底增强可读性；
如果照片颜色丰富，减少额外装饰色，只保留照片中最突出的 1-2 个颜色；
如果照片颜色低饱和，文字和装饰也保持低饱和，只用少量高亮色做重点。

整体色彩要与原照片统一，像专门为这张照片设计的封面，而不是套模板。

整体感觉：
真实、松弛、有生活感、有个人特色，像百万博主的 vlog 封面。排版可以错落但不能混乱，标题必须一眼能读懂，画面要有“想点进去看”的故事感。

输出要求：
只生成完整封面图，不要输出说明文字，不要额外加白边，不要生成九宫格合集。

不要做成商业广告海报，不要使用规整印刷字体，不要使用默认系统字体，不要过度精致，不要让画面像电商封面，不要固定套用橙红色或粉色，不要让文字遮挡人物脸部，不要生成无关人物，不要改变上传照片主体身份，不要出现真实小红书 logo，不要出现水印，不要做成九宫格截图合集。不要使用固定色系，不要无视照片颜色强行添加橙红、粉色、荧光黄、亮蓝等固定装饰色。`,
  cinema: `请根据用户上传的 3 张照片生成一张小红书竖版封面，比例 3:4。

封面风格参考：电影质感拼接 Vlog 封面。整体像生活纪录片、胶片电影分镜或安静的 vlog 封面，不要做成商业海报，也不要做成强营销封面。

画面构图：
将用户上传的 3 张照片拼接成竖版封面。每张照片作为一个横向电影分镜，占据画面的一部分。可以采用上下三段三等分式横幅拼接，也可以采用一张主图较大，放在中间、上下两张辅助图较小的电影分镜拼接，但整体必须保持 3:4 竖版比例。

拼接要求：
照片之间可以没有分割直接拼接，也可以使用细窄间距、轻微白边、黑边或胶片分隔线。不要做成九宫格，不要做成杂乱拼贴。每张照片都要保留原本的真实画面和主体，不要过度重绘，不要改变人物身份和场景内容。

视觉质感：
整体增加电影感、胶片感、低饱和、轻微颗粒、柔和对比、轻微暗角。可以根据照片内容统一色调，例如绿色森林感、城市灰蓝感、夕阳暖色感、室内暖黄感或夜景暗调。封面要有安静、克制、真实、叙事感。

色彩规则：
不要使用固定色系。请先分析三张照片的整体色调和共同色彩，从照片中提取主色、辅助色和强调色。文字、线条、日期、小英文、装饰色都必须跟随照片色系生成。不要默认使用橙红、粉色、荧光黄或亮蓝。
如果照片整体偏冷，文字可以使用白色、灰白、淡蓝、浅青或照片中已有的冷色；
如果照片整体偏暖，文字可以使用奶油白、暖黄、浅棕、淡金或照片中已有的暖色；
如果照片整体偏暗，文字需要有足够亮度和对比；
如果照片整体偏亮，文字可以加轻微阴影、描边或半透明暗色底保证可读性。
整体色彩要像专门为这三张照片统一调色后的封面。

标题文字：
主标题为「{主标题}」。标题应该像电影片名、vlog 标题或日记标题，可以巨大居中，可以放在其中一张照片的留白处，也可以跨越两张照片边界，如果遮盖了图片主体，可以与图片主题有穿插，做出被图片主体遮挡效果。中文字体可以是复古电影字幕字或轻微书法感字体，英文字体可以是油墨打印或者复古衬线。

辅助文字：
辅助文字为「{辅助文字}」。中文字体可以是复古电影字幕字或轻微书法感字体，英文字体可以是油墨打印或者复古衬线。可以使用小号英文、日期、地点、时间、vlog 标签或一句短句作为装饰，例如 “daily vlog”、“in the afternoon”、“quiet life”、“travel diary”。辅助文字要少量、克制，不要喧宾夺主。

排版特点：
允许少量小字、英文、日期、手写线条、胶片字幕、括号、引号、定位符号、拍摄时间、章节编号。文字应该像电影画面中的字幕或手写备注，分布在照片留白处。排版要有呼吸感，不要塞满画面。

主体保护：
人物脸部、重要物品、关键动作不能被文字遮挡。三张照片都要清晰可见。如果某张照片主体很弱，可以通过裁切、放大或局部取景增强画面叙事，但不要改变照片真实内容。

整体感觉：
安静、真实、电影分镜、胶片、生活纪录片、日常 vlog、松弛、带一点情绪和故事感。封面要让人感觉这是一个值得点开的生活片段，而不是教程封面或广告图。

输出要求：
只生成一张完整小红书 3:4 竖版封面，不要输出说明文字，不要生成九宫格合集，不要额外白边。

不要做成九宫格，不要做成强营销海报，不要使用超大爆款字体，不要使用固定橙红或粉色装饰，不要过度涂鸦，不要赛博朋克，不要电商感，不要过度锐化，不要过度美颜，不要改变人物身份，不要生成无关人物，不要让文字遮挡人物脸部，不要让三张照片风格割裂。`,
  impact: `请根据用户上传的照片生成一张小红书竖版封面，比例 3:4。

封面风格参考：大字冲击型小红书封面。画面以真实照片为基础，使用超大中文标题作为视觉核心，标题要有强烈冲击力和记忆点，一眼就能读懂主题。

画面构图：
保留用户照片中的人物、场景和主体。人物或主体可以位于画面中心、下方、侧边或被大标题环绕。标题文字需要和照片主体产生互动关系，例如压在草地上、围绕人物、贴着建筑、顺着画面透视、沿着人物动作方向排列。

主标题：
主标题为「{主标题}」。标题必须非常大，占据画面 35%-60% 的视觉面积。可以拆成 2-5 个大字块，错落排布、倾斜排布、纵向排布或沿画面空间透视排布。不要排得太工整，要有手写、刷字、海报字或街头标语感。如果遮盖了图片主体，可以与图片主题有穿插，做出被图片主体遮挡效果。

字体设计：
标题字体要粗、有力量、有手工感，可以像粗马克笔、刷子字、手写海报字、剪贴大字或略微变形的艺术字。笔画可以有轻微不规则边缘，但必须清晰可读。不要使用普通系统字体，不要太细，不要像正式商务海报。

色彩规则：
不要固定使用某一种颜色。请先分析用户上传照片的主色、背景色、人物服饰色和环境色，再从照片中提取或延展 2-3 个适合的文字颜色。

如果照片背景偏绿色、草地、森林或植物，文字可以使用照片中协调的白色、深绿、浅黄、奶油色或低饱和暖色；
如果照片背景偏浅色、天空、白墙或高亮环境，文字可以使用深色、墨绿、深蓝、棕色或照片中的深色元素；
如果照片背景偏暗，文字可以使用高亮但协调的浅色，并加阴影或描边；
如果照片中已有明显服饰色或道具色，可以把它作为标题强调色。

文字颜色必须与照片背景形成足够对比，但整体要像从照片色系里自然长出来的，不要强行套用固定爆款色。

辅助文字：
辅助文字为「{辅助文字}」。辅助文字可以很小，放在角落、标题旁边或画面留白处。可以使用手写小字、英文小字、弯曲排列或短标签，例如 “vlog tips”、“how to”、“daily vlog”、“怎么做”。辅助文字不能抢主标题。

装饰元素：
装饰要少而有力。可以加入少量手绘线条、箭头、下划线、感叹号、问号、弯曲小字、短英文或小图标。不要做成复杂拼贴，不要贴满贴纸。重点必须是大标题和照片主体。

画面处理：
可以适当增强照片对比度、清晰度和色彩层次，让大字更突出。人物脸部和关键主体不能被遮挡。如果标题压在人物附近，需要通过描边、阴影或空间避让保证人物可见。

整体感觉：
大胆、直接、有态度、有冲击力，像小红书上让人停下来看的爆款封面。标题要有视觉压迫感，但画面不能脏乱。真实照片感要保留，不要变成纯平面海报。

输出要求：
只生成一张完整的小红书 3:4 竖版封面，不要输出说明文字，不要加额外白边，不要做成九宫格。

不要使用普通系统字体，不要小标题弱视觉，不要文字太细，不要排版过于规整，不要做成商务海报，不要做成电商广告，不要固定使用黄色、红色、粉色或橙色，不要无视照片色系，不要让文字遮挡人物脸部，不要生成无关人物，不要改变上传照片主体，不要贴满装饰，不要做成九宫格合集。`,
  guofeng: `请根据用户上传的照片生成一张小红书竖版封面，比例 3:4。

封面风格参考：古典国风电影拼接封面。整体要有东方古典美学、电影分镜感和诗意叙事感，不要做成廉价古风贴纸海报。

画面构图：
使用用户上传的照片作为主体素材，可以将画面处理成 2-3 个横向电影分镜，上下拼接成竖版封面。每个分镜都保留真实照片质感，像一组东方电影片段。人物、风景、建筑、水面、窗景或光影细节要清晰可见。

如果只有一张照片，可以将同一张照片进行不同裁切，形成远景、中景、特写三段式构图：
第一段展示环境和氛围；
第二段展示人物或关键主体；
第三段展示情绪、细节或光影。

视觉气质：
整体要有古典、安静、诗意、东方、含蓄、电影感。画面可以带轻微胶片颗粒、柔和对比、淡淡暗角和水墨感层次。不要过度锐化，不要过度美颜，不要过度鲜艳。

标题文字：
主标题为「{主标题}」。标题使用书法感中文艺术字，可以是大号毛笔字、行书感、墨迹字或现代国风手写字。标题可以竖排，也可以横跨画面一侧，像写在照片上的墨迹。字形要有笔锋、停顿和墨色浓淡变化，但必须清晰可读。

文字排版：
主标题可以拆成 2-4 个大字，分布在画面左右两侧或跨越不同分镜。不要把标题全部排成普通横排。可以加入少量小字作为题跋、诗句、日期、地点或英文注释，放在画面角落或留白处，像电影片尾字幕或古典画作题字。

色彩规则：
不要使用固定色系。请先分析用户上传照片的主色、背景色、人物服饰色、环境光和画面情绪，再从照片中提取并延展 2-3 个国风色彩。

如果照片偏水面、天空、城市远景，可以延展为黛蓝、青灰、月白、墨绿、淡金；
如果照片偏暖光、室内、夕阳，可以延展为米白、茶色、胭脂、朱砂、暖金；
如果照片偏绿色、山水、植物，可以延展为青绿、竹青、墨色、米白；
如果照片偏暗，可以使用米白、淡金、月白作为文字色，并用墨色或阴影增强层次。

所有文字、墨迹、印章、线条和装饰色都必须跟随照片色系生成，像是从照片本身延伸出来的。不要固定使用红色印章或黑色大字；只有当照片色调适合时才使用。

装饰元素：
可以加入少量宣纸肌理、墨迹晕染、淡淡山水纹样、细线边框、手写题跋、印章感小块、窗棂线条或云纹。装饰要克制，不能喧宾夺主。印章、墨迹和纹理要像自然融入画面，不要像贴纸。

人物保护：
人物脸部、眼睛、手部和关键动作不能被大字遮挡。文字可以靠近人物或与人物形成视觉关系，但要保留人物情绪和照片真实感。

整体感觉：
像一张有东方电影感的小红书封面，古典但不老气，国风但不廉价，安静但有记忆点。画面要有留白、有层次、有故事感，适合让用户停下来点开。

输出要求：
只生成一张完整的小红书 3:4 竖版封面，不要输出说明文字，不要额外白边，不要做成九宫格合集。

不要做成廉价古风贴纸，不要过度使用红色印章，不要固定黑色毛笔字，不要无视照片色系，不要使用塑料感古风素材，不要赛博朋克，不要电商广告感，不要过度饱和，不要让文字遮挡人物脸部，不要改变上传照片主体身份，不要生成无关人物，不要做成九宫格合集。`
};

const styleHints = {
  collage: "适合户外、旅行、冒险、手账、拼贴等素材",
  handwrite: "适合自然、户外、清新、风景、手写等素材",
  cinema: "适合日常、城市、旅行、生活碎片、电影感等素材",
  impact: "适合教程、避坑、观点、强情绪、大标题等素材",
  guofeng: "适合国风、古镇、山水、东方美学、诗意人像等素材"
};

function setStatus(text) {
  statusText.textContent = text;
}

function buildAiPrompt() {
  const title = (titleInput.value || "普通照片也能做出爆款封面").trim();
  const subtitle = (subtitleInput.value || "上传图片｜输入标题｜直接出图").trim();
  const imageCount = uploadedFiles.length || uploadedImages.length || 1;
  const stylePrompt = stylePrompts[activeStyle]
    .replaceAll("{主标题}", title)
    .replaceAll("{辅助文字}", subtitle)
    .replace("（为用户输入的标题）", title)
    .replace("（为用户输入的辅助文字）", subtitle);

  if (activeStyle === "collage") {
    return [
      stylePrompt,
      "",
      `参考图片数量：${imageCount} 张。请优先保留参考图里的主体人物、物品、场景和真实生活氛围，不要改变主体身份。`
    ].join("\n");
  }

  return [
    "请根据用户上传的参考图片生成一张小红书封面完整设计图。",
    "画幅比例：3:4，竖版，最终画面适合 1080×1440。",
    `主标题：${title}`,
    `辅助文字：${subtitle}`,
    `参考图片数量：${imageCount} 张。请优先保留参考图里的主体人物、物品、场景和真实生活氛围，不要改变主体身份。`,
    `封面风格：${palettes[activeStyle].label}。${stylePrompt}`,
    "排版要求：标题必须清晰可读，放大情绪和视觉记忆点；文字可以压在照片上，但不要遮挡人物五官和核心物品；整体像真实小红书爆款封面，不要像商业广告模板。",
    "细节要求：加入适量手绘线条、贴纸、描边、纸张纹理、英文小字或日期；颜色要鲜明但不脏；保留照片真实质感。",
    "输出要求：只输出完整封面图，不要输出多图排版说明，不要加额外白边。"
  ].join("\n");
}

function refreshPrompt() {
  promptOutput.value = buildAiPrompt();
}

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    if (previewCache[src]) {
      resolve(previewCache[src]);
      return;
    }
    const img = new Image();
    img.onload = () => {
      previewCache[src] = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function drawCoverImage(img, x, y, w, h, radius = 36) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;

  ctx.save();
  roundedRect(x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawImageCoverToCanvas(img) {
  const scale = Math.max(W / img.width, H / img.height);
  const sw = W / scale;
  const sh = H / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(text, maxWidth, size, weight = 900) {
  const cleanText = (text || "输入标题生成爆款封面").trim();
  ctx.font = `${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  const lines = [];
  let line = "";

  for (const char of cleanText) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function jitterText(line, maxWidth, size, palette) {
  let cursor = 0;
  for (const char of line) {
    const jitterY = Math.sin(cursor * .07 + char.charCodeAt(0)) * 8;
    const tilt = ((char.charCodeAt(0) % 9) - 4) * .008;
    ctx.save();
    ctx.translate(cursor, jitterY);
    ctx.rotate(tilt);
    ctx.strokeStyle = activeLettering === "casual" ? "rgba(255,255,255,.88)" : palette.glow;
    ctx.lineWidth = activeLettering === "casual" ? 7 : 18;
    ctx.strokeText(char, 0, 0, maxWidth);
    ctx.fillText(char, 0, 0, maxWidth);
    ctx.restore();
    cursor += ctx.measureText(char).width * .92;
  }
}

function drawPaperText(line, maxWidth, palette) {
  ctx.save();
  ctx.font = ctx.font;
  const textWidth = Math.min(ctx.measureText(line).width, maxWidth);
  roundedRect(-18, -10, textWidth + 36, Number.parseInt(ctx.font, 10) + 30, 8);
  ctx.fillStyle = "#fffdf2";
  ctx.fill();
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = palette.pop;
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = 2;
  ctx.strokeText(line, 0, 0, maxWidth);
  ctx.fillText(line, 0, 0, maxWidth);
  ctx.restore();
}

function drawArtText(text, x, y, maxWidth, palette, impact) {
  const baseSize = activeLettering === "film" ? 58 + impact * .2 : 92 + impact * 0.45;
  let size = baseSize;
  let lines = wrapText(text, maxWidth, size);
  while (lines.length > 3 && size > 56) {
    size -= 7;
    lines = wrapText(text, maxWidth, size);
  }

  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  lines.forEach((line, index) => {
    const lineGap = activeLettering === "film" ? 1.2 : 1.06;
    const yy = y + index * size * lineGap;
    const skew = index % 2 ? 20 : -4;

    ctx.save();
    ctx.translate(x + skew, yy);
    ctx.rotate(activeLettering === "film" ? 0 : index % 2 ? -0.045 : 0.028);
    const family = activeLettering === "film"
      ? '"Times New Roman", "SimSun", serif'
      : '"Microsoft YaHei", "PingFang SC", sans-serif';
    const weight = activeLettering === "film" ? 500 : 950;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.strokeStyle = palette.glow || "#111";
    ctx.lineWidth = activeStyle === "impact" ? 32 : 18;

    if (activeLettering === "paper") {
      drawPaperText(line, maxWidth, palette);
    } else if (activeLettering === "casual") {
      ctx.fillStyle = "#fff";
      jitterText(line, maxWidth, size, palette);
    } else if (activeLettering === "film") {
      ctx.strokeStyle = "rgba(0,0,0,.28)";
      ctx.lineWidth = 3;
      ctx.strokeText(line, 0, 0, maxWidth);
      ctx.fillStyle = palette.ink;
      ctx.fillText(line, 0, 0, maxWidth);
    } else {
      ctx.strokeText(line, 0, 0, maxWidth);
      if (activeStyle !== "handwrite") {
        ctx.strokeStyle = palette.pop;
        ctx.lineWidth = 8;
        ctx.strokeText(line, 0, 0, maxWidth);
      }
      ctx.fillStyle = index % 2 && activeStyle === "impact" ? palette.pop : palette.ink;
      ctx.fillText(line, 0, 0, maxWidth);
    }

    if (activeLettering === "marker") {
      ctx.globalAlpha = .18;
      ctx.strokeStyle = palette.pop;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, size * (.32 + i * .1));
        ctx.lineTo(Math.min(ctx.measureText(line).width, maxWidth), size * (.28 + i * .1));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  });
  return y + lines.length * size * (activeLettering === "film" ? 1.2 : 1.06);
}

function drawBackground(palette) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, palette.bg[0]);
  grad.addColorStop(.55, palette.bg[1]);
  grad.addColorStop(1, palette.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = activeStyle === "cinema" ? .22 : .58;
  for (let i = 0; i < 18; i += 1) {
    ctx.fillStyle = i % 2 ? palette.soft : palette.pop;
    ctx.beginPath();
    ctx.arc((i * 137) % W, (i * 211) % H, 10 + (i % 5) * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawImageLayout(images, palette, imageRatio) {
  const imgAreaH = Math.round(H * (imageRatio / 100));
  const top = 70;

  if (!images.length) {
    ctx.fillStyle = "rgba(255,255,255,.48)";
    roundedRect(70, top, W - 140, imgAreaH - 50, 48);
    ctx.fill();
    ctx.strokeStyle = palette.pop;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = palette.ink;
    ctx.font = '800 42px "Microsoft YaHei", sans-serif';
    ctx.fillText("上传图片后生成封面视觉", 146, top + 250);
    return top + imgAreaH - 20;
  }

  if (activeStyle === "cinema" && images.length >= 2) {
    const gap = 18;
    const frameH = 300;
    const x = 58;
    const w = W - 116;
    const count = Math.min(images.length, 3);
    for (let i = 0; i < count; i += 1) {
      drawCoverImage(images[i], x, top + i * (frameH + gap), w, frameH, 4);
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fillRect(x, top + i * (frameH + gap), w, frameH);
    }
    return top + count * frameH + (count - 1) * gap;
  }

  const mainW = W - 128;
  const mainH = Math.min(imgAreaH - 20, 850);
  const radius = activeStyle === "impact" ? 8 : 34;
  drawCoverImage(images[0], 64, top, mainW, mainH, radius);

  ctx.strokeStyle = activeStyle === "handwrite" ? "#fff" : palette.glow;
  ctx.lineWidth = activeStyle === "handwrite" ? 7 : 10;
  roundedRect(64, top, mainW, mainH, radius);
  ctx.stroke();

  const extra = images.slice(1, 4);
  extra.forEach((img, index) => {
    const size = activeStyle === "collage" ? 250 : 210;
    const x = activeStyle === "collage" ? 92 + index * 280 : 720 - index * 250;
    const y = activeStyle === "collage" ? top + mainH - 120 + (index % 2) * 28 : top + mainH - 130 + (index % 2) * 34;
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate((index - 1) * .08);
    drawCoverImage(img, -size / 2, -size / 2, size, size, 28);
    ctx.strokeStyle = index % 2 ? palette.pop : "#fff";
    ctx.lineWidth = activeStyle === "collage" ? 12 : 8;
    roundedRect(-size / 2, -size / 2, size, size, 28);
    ctx.stroke();
    ctx.restore();
  });

  return top + mainH - 8;
}

function drawBadges(palette) {
  if (activeStyle === "cinema") return;
  ctx.save();
  ctx.translate(70, 62);
  ctx.fillStyle = activeStyle === "handwrite" ? "rgba(0,0,0,.55)" : palette.pop;
  roundedRect(0, 0, 220, 58, 29);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = '900 28px "Microsoft YaHei", sans-serif';
  ctx.fillText("今日灵感", 34, 13);
  ctx.restore();

  ctx.save();
  ctx.translate(760, 70);
  ctx.rotate(.08);
  ctx.fillStyle = palette.glow;
  roundedRect(0, 0, 230, 74, 18);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = '950 32px "Microsoft YaHei", sans-serif';
  ctx.fillText("收藏级", 52, 18);
  ctx.restore();
}

function drawDoodles(palette) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = activeStyle === "impact" ? palette.pop : "#ffffff";
  ctx.lineWidth = activeStyle === "impact" ? 10 : 7;
  ctx.globalAlpha = .9;
  for (let i = 0; i < 4; i += 1) {
    const x = 96 + i * 238;
    const y = 220 + (i % 2) * 310;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 46, y - 48, x + 112, y + 8);
    ctx.quadraticCurveTo(x + 148, y + 38, x + 190, y - 12);
    ctx.stroke();
  }
  ctx.fillStyle = activeStyle === "cinema" ? palette.pop : palette.soft;
  ctx.font = '900 46px "Comic Sans MS", "Microsoft YaHei", sans-serif';
  ctx.fillText("wow", 790, 205);
  ctx.fillText("!!", 840, 1020);
  ctx.restore();
}

function drawCutoutLabel(text, x, y, palette, rotate = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.font = '900 48px "Microsoft YaHei", sans-serif';
  const width = Math.min(ctx.measureText(text).width + 48, 430);
  roundedRect(0, 0, width, 78, 10);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = palette.pop;
  ctx.fillText(text, 24, 13, width - 44);
  ctx.restore();
}

function drawSubtitle(text, y, palette) {
  const subtitle = (text || "一键排版｜艺术字｜小红书比例").trim();
  const maxWidth = W - 150;
  ctx.font = '700 34px "Microsoft YaHei", sans-serif';
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = .86;
  ctx.fillText(subtitle, 76, Math.min(y + 22, H - 160), maxWidth);
  ctx.globalAlpha = 1;
}

function drawTexture() {
  ctx.save();
  ctx.globalAlpha = .08;
  for (let y = 0; y < H; y += 12) {
    ctx.fillStyle = y % 24 ? "#000" : "#fff";
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

async function drawDefaultPreviewIfNeeded() {
  if (uploadedImages.length) return false;

  const previewSrc = previewImages[activeStyle];
  if (!previewSrc) return false;

  const image = await loadImageFromSrc(previewSrc);
  drawImageCoverToCanvas(image);
  refreshPrompt();
  setStatus(`${palettes[activeStyle].label} 示例`);
  return true;
}

async function generateCover() {
  if (await drawDefaultPreviewIfNeeded()) return;

  const palette = palettes[activeStyle];
  const impact = DEFAULT_IMPACT;
  const imageRatio = DEFAULT_IMAGE_RATIO;
  drawBackground(palette);
  drawBadges(palette);
  const textTop = drawImageLayout(uploadedImages, palette, imageRatio);
  drawDoodles(palette);

  if (activeStyle === "collage") {
    drawCutoutLabel("VLOG", 76, Math.max(textTop - 88, 705), palette, -.06);
    drawCutoutLabel("真实感", 650, Math.max(textTop - 54, 740), palette, .08);
  }

  if (activeStyle !== "impact") {
    ctx.save();
    ctx.fillStyle = activeStyle === "cinema" ? "rgba(0,0,0,.34)" : "rgba(255,255,255,.36)";
    roundedRect(46, Math.max(textTop - 28, 720), W - 92, H - Math.max(textTop - 28, 720) - 50, activeStyle === "cinema" ? 4 : 30);
    ctx.fill();
    ctx.restore();
  }

  const titleY = activeStyle === "impact" ? 130 : Math.max(textTop + 18, 760);
  const afterTitle = drawArtText(titleInput.value, 70, titleY, W - 140, palette, impact);
  drawSubtitle(subtitleInput.value, afterTitle, palette);
  drawTexture();
  refreshPrompt();
  setStatus(`${palette.label} 已生成`);
}

async function handleFiles(event) {
  const files = [...event.target.files].slice(0, 6);
  uploadedFiles = files;
  uploadedImages = await Promise.all(files.map(loadImage));
  thumbStrip.innerHTML = "";
  files.forEach((file) => {
    const img = document.createElement("img");
    img.className = "thumb";
    img.alt = "上传图片缩略图";
    img.src = URL.createObjectURL(file);
    thumbStrip.appendChild(img);
  });
  generateCover();
}

function setActiveStyle(style) {
  activeStyle = style;
  segments.forEach((button) => {
    button.classList.toggle("active", button.dataset.style === style);
  });
  styleHint.textContent = styleHints[style] || "";
  generateCover();
}

function shuffleStyle() {
  const styles = Object.keys(palettes);
  const next = styles[(styles.indexOf(activeStyle) + 1 + Math.floor(Math.random() * (styles.length - 1))) % styles.length];
  setActiveStyle(next);
}

function downloadCover() {
  generateCover();
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.download = `xhs-cover-${date}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function copyPrompt() {
  refreshPrompt();
  try {
    await navigator.clipboard.writeText(promptOutput.value);
  } catch (error) {
    promptOutput.focus();
    promptOutput.select();
    document.execCommand("copy");
  }
  setStatus("提示词已复制");
}

async function generateAiCover() {
  refreshPrompt();
  if (!AI_IMAGE_ENDPOINT) {
    setStatus("等待接入AI");
    alert("AI完整出图需要先配置图片生成接口。当前已生成内置提示词，可先复制到图像模型使用。");
    return;
  }

  if (!uploadedFiles.length) {
    setStatus("请先上传图片");
    alert("请先上传至少一张参考图片，再使用 AI 完整出图。");
    return;
  }

  const images = await Promise.all(uploadedFiles.map(fileToDataUrl));

  setStatus("AI生成中");
  const response = await fetch(AI_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: promptOutput.value,
      style: activeStyle,
      images
    })
  });
  if (!response.ok) {
    setStatus("生成失败");
    const detail = await response.text();
    throw new Error(detail || "AI image generation failed");
  }

  const result = await response.json();
  const image = await loadImageFromSrc(result.image);
  drawImageCoverToCanvas(image);
  setStatus("AI封面已生成");
}

imageInput.addEventListener("change", handleFiles);
generateBtn.addEventListener("click", generateCover);
downloadBtn.addEventListener("click", downloadCover);
aiGenerateBtn.addEventListener("click", generateAiCover);
copyPromptBtn.addEventListener("click", copyPrompt);
shuffleBtn.addEventListener("click", shuffleStyle);
titleInput.addEventListener("input", generateCover);
subtitleInput.addEventListener("input", generateCover);
segments.forEach((button) => {
  button.addEventListener("click", () => setActiveStyle(button.dataset.style));
});

titleInput.value = "普通照片也能做出爆款封面";
subtitleInput.value = "上传图片｜输入标题｜直接出图";
generateCover();
