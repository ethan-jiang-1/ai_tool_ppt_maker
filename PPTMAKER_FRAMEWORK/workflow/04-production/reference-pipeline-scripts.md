---
title: 'Reference: Pipeline Script Patterns'
stage: workflow/04-production
position: reference
type: reference
summary: 参考模式。Agent 查阅并适配到具体项目中。
depends_on:
- workflow/04-production/README.md
feeds_into: []
agent_action: copy_and_adapt
---

# Reference: Pipeline Script Patterns

> **此文件保留作为架构参考。** 完整的可运行 Python 实现已移至 `scripts/` ——五个 Stage 的生产脚本，复制到 run bundle 后修改常量即可使用。
>
> 以下是六个关键模式的注释版伪代码——展示每个阶段的核心代码结构和设计决策。读它来理解**为什么这样设计**；用 `scripts/` 来**实际执行**。

---

## Pattern 1: Markdown Parser（Stage 1）

**做什么**：从半结构化 markdown 提取结构化字段。

```python
import re
import json

def parse_slides(md_path: str) -> list[dict]:
    """Parse markdown into slide records."""
    text = open(md_path).read()
    
    # Split by slide marker
    slide_blocks = re.split(r'## Slide \d+:', text)[1:]  # skip preamble
    
    slides = []
    for block in slide_blocks:
        slide = {}
        
        # Extract fields with regex
        slide['id'] = extract_id(block)  # first line after ## Slide NN:
        slide['visual_type'] = extract_field(block, 'VISUAL TYPE')
        slide['kicker'] = extract_field(block, 'KICKER') or ''
        slide['headline'] = extract_field(block, 'TITLE')
        slide['subtitle'] = extract_field(block, 'SUBTITLE') or None
        
        # Extract code block
        slide['image_prompt'] = extract_code_block(block, 'IMAGE PROMPT')
        
        slides.append(slide)
    
    return slides

def extract_field(block: str, field_name: str) -> str:
    """Extract **FIELD_NAME**: value from markdown block."""
    pattern = rf'\*\*{field_name}\*\*:\s*(.+)'
    match = re.search(pattern, block)
    return match.group(1).strip() if match else None

def extract_code_block(block: str, label: str) -> str:
    """Extract content of ``` block after a label."""
    # Find the IMAGE PROMPT label, then extract next ```...``` block
    pattern = rf'\*\*{label}\*\*:.*?\n```\n(.*?)```'
    match = re.search(pattern, block, re.DOTALL)
    return match.group(1).strip() if match else ''
```

**关键设计决策**：
- **宽容解析**：字段缺失时返回 None 而非抛异常——markdown 是人类写的
- **正则 vs 逐行解析**：正则更简洁但脆弱。如果你的 markdown 格式不统一，改用逐行状态机解析
- **`extract_code_block`**：依赖 ``` 标记——确保你的 markdown 约定一致

---

## Pattern 2: Prompt Assembler（Stage 1）

**做什么**：把源 IMAGE PROMPT 和系统级 contracts 组装成完整 prompt。

```python
SYSTEM_HEADER_CONTRACT = """
HEADER CONTRACT (ABSOLUTE):
The top {header_safe_zone}px of this image (y=0 to y={header_safe_zone}) 
is the header zone. Keep this area clean, dark navy (#0a1628), 
with NO text, NO visual elements, NO decorations. 
The header text will be overlaid by a deterministic renderer after generation.
"""

SYSTEM_BODY_TEXT_CONTRACT = """
BODY TEXT CONTRACT:
- All body labels, captions, and callouts must be visually at minimum 26px
- KPI numbers must be visually at minimum 72px
- Callout bar text at bottom must be visually at minimum 32px
- Maximum 3-5 readable text zones per slide (excluding callout bar)
"""

SYSTEM_STYLE_ANCHORING = """
Use the reference image(s) as your EXACT visual style guide.
Match the color palette, typography scale, layout grid, component patterns,
and overall visual language precisely. Only change the slide content, not the style.
"""

def assemble_prompt(source_prompt: str, layout_contract: dict, is_full_page: bool) -> str:
    """Assemble full generation prompt from source prompt and system contracts."""
    if is_full_page:
        # Image-direct: AI generates everything including title
        contract = "IMAGE-DIRECT EXCEPTION: Render the complete slide including all text."
    else:
        contract = (
            SYSTEM_HEADER_CONTRACT.format(
                header_safe_zone=layout_contract['header_safe_zone']
            )
            + SYSTEM_BODY_TEXT_CONTRACT
        )
    
    return f"{contract}\n\n---\n\n{source_prompt}\n\n---\n\n{SYSTEM_STYLE_ANCHORING}"
```

**关键设计决策**：
- **Contracts 是常量**：在脚本顶部定义，方便统一修改。不要让不稳定的文字散落在各处
- **IMAGE_DIRECT 例外**：跳过 header contract——AI 渲染完整画面
- **Layout contract 参数化**：`header_safe_zone` 等值从 layout_contract 传入，而非硬编码

---

## Pattern 3: Async Image Generator（Stage 2）

**做什么**：Submit → poll → download，skip-if-exists，mirror fallback。

```python
import time, json, requests

MIRRORS = [
    "https://api.primary.com/v1",
    "https://api.fallback1.com/v1",
    "https://api.fallback2.com/v1",
]
MAX_POLLS = 120       # 10 min max at 5s interval
POLL_INTERVAL = 5     # seconds

def generate_image(prompt: str, output_path: str, 
                   model: str = "gpt-image-2",
                   size: str = "16:9", 
                   resolution: str = "2k") -> dict:
    """Generate one image. Skip if output exists."""
    
    if os.path.exists(output_path):
        print(f"  Skip — already exists: {output_path}")
        return None
    
    task_id = None
    for mirror in MIRRORS:
        try:
            resp = requests.post(
                f"{mirror}/images/generations",
                json={"prompt": prompt, "model": model, 
                      "size": size, "resolution": resolution},
                headers={"Authorization": f"Bearer {API_KEY}"}
            )
            task_id = resp.json()["task_id"]
            break
        except (ConnectionError, KeyError):
            continue
    
    if not task_id:
        raise Exception("All mirrors failed for task submission")
    
    # Poll until complete
    for poll_count in range(MAX_POLLS):
        status = get_task_status(task_id, MIRRORS)
        if status == "completed":
            download_result(task_id, output_path, MIRRORS)
            break
        if status == "failed":
            raise Exception(f"Task {task_id} failed")
        time.sleep(POLL_INTERVAL)
    
    # Save trace
    trace = {
        "task_id": task_id,
        "model": model, "size": size, "resolution": resolution,
        "prompt_chars": len(prompt),
        "poll_count": poll_count + 1,
        "total_seconds": (poll_count + 1) * POLL_INTERVAL
    }
    with open(output_path.replace('.png', '.apimart-task.json'), 'w') as f:
        json.dump(trace, f, indent=2)
    
    return trace
```

**关键设计决策**：
- **Mirror 列表外部化**：放在脚本顶部或 config 文件——方便添加/删除 mirror
- **Skip-if-exists**：恢复运行默认跳过已有图片；明确刷新单页用 `--only`（统一管线自动 force），全量刷新用 `--force-images`
- **Trace 文件**：每个图片配一个——调试时 invaluable

---

## Pattern 4: Header Overlay（Stage 3）

**做什么**：Python/Pillow 在 AI 生成的画面上叠加 header 文字。

```python
from PIL import Image, ImageDraw, ImageFont

# Fonts — resolved cross-platform by _load_font (bundled fonts/ → $PPT_FONT_DIR →
# OS dirs), with a size-respecting fallback and a hard abort if nothing is usable.
# Never ImageFont.load_default() — it ignores size and prints garbled headers.
FONT_KICKER = _load_font("SourceSansPro-Semibold.otf", 22)
FONT_TITLE = _load_font("SourceSansPro-Bold.otf", 46)
FONT_SUBTITLE = _load_font("SourceSansPro-Regular.otf", 27)

KICKER_POS = (46, 24)
TITLE_POS = (46, 58)
KICKER_COLOR = (190, 203, 218)   # #becbda
TITLE_COLOR = (244, 248, 252)    # #f4f8fc
SUBTITLE_COLOR = (164, 184, 204) # #a4b8cc

CANVAS_SIZE = (1672, 941)

def lock_header(img_path: str, slide_plan: dict, output_path: str):
    """Overlay header text on AI-generated image."""
    
    if slide_plan['render_mode'] == 'full-page':
        # Pass-through — just resize if needed
        img = Image.open(img_path).convert('RGBA')
        img = img.resize(CANVAS_SIZE, Image.LANCZOS)
        img.save(output_path, 'PNG', quality=94)
        print(f"  PASS-THROUGH: {slide_plan['id']}")
        return
    
    # Normal slide — draw header text
    img = Image.open(img_path).convert('RGBA')
    img = img.resize(CANVAS_SIZE, Image.LANCZOS)
    draw = ImageDraw.Draw(img)
    
    # Draw kicker
    kicker = slide_plan.get('kicker', '')
    if kicker and kicker != '(无)' and kicker != '(none)':
        draw.text(KICKER_POS, kicker.upper(), 
                  font=FONT_KICKER, fill=KICKER_COLOR)
    
    # Draw title (with word wrap if needed)
    title = slide_plan['headline']
    wrapped_lines = word_wrap(title, FONT_TITLE, max_width=CANVAS_SIZE[0] - 92)
    y = TITLE_POS[1]
    for line in wrapped_lines:
        draw.text((TITLE_POS[0], y), line, 
                  font=FONT_TITLE, fill=TITLE_COLOR)
        y += 52  # line height
    
    # Draw subtitle if present
    subtitle = slide_plan.get('subtitle')
    if subtitle:
        y += 8  # extra spacing
        draw.text((TITLE_POS[0], y), subtitle, 
                  font=FONT_SUBTITLE, fill=SUBTITLE_COLOR)
    
    img.save(output_path, 'PNG', quality=94)
    print(f"  DREW HEADER: {slide_plan['id']}")

def word_wrap(text: str, font: ImageFont, max_width: int) -> list[str]:
    """Simple word wrapping for Pillow text."""
    lines = []
    words = text.split()
    current_line = words[0]
    for word in words[1:]:
        test_line = current_line + ' ' + word
        bbox = font.getbbox(test_line)
        if bbox[2] <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    return lines
```

**关键设计决策**：
- **Font resolution (fail-loud)**：跨平台查找目标字体(bundled `fonts/` → `$PPT_FONT_DIR` → 系统目录);缺失则降级到**字号正确**的后备 sans 并打响亮 warning;毫无可用字体才硬中止。**绝不** `ImageFont.load_default()`——它忽略字号,会产出错字号的乱标题。
- **Word wrap**：Title 可能超过一行——必须 wrap。用 `font.getbbox()` 测量文字实际宽度
- **full-page = pass-through**：不画任何东西——AI 生成的完整画面直接保存

---

## Pattern 5: PPTX Builder（Stage 4）

**做什么**：把最终 PNG 按顺序装入 PPTX 容器。

```python
from pptx import Presentation
from pptx.util import Inches

SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

def build_pptx(slide_plan_path: str, images_dir: str, output_path: str):
    """Build PPTX from final slide images."""
    
    with open(slide_plan_path) as f:
        plan = json.load(f)
    
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT
    
    blank_layout = prs.slide_layouts[6]  # Blank layout
    
    for i, slide in enumerate(plan['slides']):
        new_slide = prs.slides.add_slide(blank_layout)
        
        filename = f"{i+1:02d}_{slide['id']}.png"
        img_path = os.path.join(images_dir, filename)
        
        new_slide.shapes.add_picture(
            img_path,
            left=Inches(0),
            top=Inches(0),
            width=SLIDE_WIDTH,
            height=SLIDE_HEIGHT
        )
    
    prs.save(output_path)
    print(f"PPTX saved: {output_path} ({len(plan['slides'])} slides)")
```

**关键设计决策**：
- **Blank layout**：`slide_layouts[6]`——避免任何占位符干扰
- **图片 aspect ratio**：1672×941 渲染到 13.333"×7.5" 是精确匹配（约 125 DPI），不会拉伸
- **文件大小**：19 张 2K PNG → ~30 MB PPTX。如果需要更小，可以用 JPEG 压缩（trade-off 画质）

---

## Pattern 6: Notes Injector（Stage 5）

**做什么**：从 markdown 提取 SPEAKER NOTE，注入 PPTX notes 面板。

```python
import re
from pptx import Presentation

def extract_notes(md_path: str) -> list[str]:
    """Extract SPEAKER NOTE from each slide block in markdown."""
    text = open(md_path).read()
    slide_blocks = re.split(r'## Slide \d+:', text)[1:]
    
    notes_list = []
    for block in slide_blocks:
        # Find SPEAKER NOTE section (blockquote after SPEAKER NOTE marker)
        pattern = r'> \*\*SPEAKER NOTE\*\*\s*\n((?:> .*\n?)*)'
        match = re.search(pattern, block)
        if match:
            # Strip "> " prefix from each line
            note_text = re.sub(r'^> ?', '', match.group(1), flags=re.MULTILINE)
            notes_list.append(note_text.strip())
        else:
            notes_list.append('')  # No notes for this slide
    
    return notes_list

def inject_notes(pptx_path: str, notes_list: list[str]):
    """Inject speaker notes into PPTX. Modifies file in place."""
    prs = Presentation(pptx_path)
    
    assert len(notes_list) == len(prs.slides), \
        f"Notes count ({len(notes_list)}) != slides count ({len(prs.slides)})"
    
    for slide, notes_text in zip(prs.slides, notes_list):
        if notes_text:
            notes_slide = slide.notes_slide
            text_frame = notes_slide.notes_text_frame
            text_frame.clear()
            text_frame.text = notes_text
    
    prs.save(pptx_path)
    print(f"Notes injected into {pptx_path}")
```

**关键设计决策**：
- **原地修改**：这是唯一修改输入文件的阶段——务必先备份
- **Assert 数量匹配**：如果 notes 数和 slides 数不一致，立即报错——说明解析或 markdown 有问题
- **Notes 为空时 skip**：不是每个 slide 都需要 speaker notes

---

## 在你的项目中适配这些模式

这些伪代码展示的是**结构**和**设计决策**——不是可以直接运行的完整脚本。适配时：

1. **修改常量**：canvas size、header safe zone、font paths、API credentials——这些都是项目特定的
2. **替换 API 调用**：把 `requests.post(f"{mirror}/images/generations")` 替换为你的实际 image generation API
3. **添加错误处理**：伪代码省略了 retry logic、timeout handling、partial failure recovery
4. **选择脚本语言**：Python 是推荐（Pillow 和 python-pptx 是生态标准），但模式和逻辑与语言无关

完整的生产实现参考：`scripts/` 目录（通过 `unified_pipeline.mjs --run-dir` 就地运行，不复制进 run bundle）。历史案例 T10 当年把脚本放在 `session_ppt_flow_T10/v3/scripts/`——那是本框架成形前的做法，当前布局已改为脚本就地运行、产物统一写入 `_generated/`。
