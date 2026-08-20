# Image2 Lab (_lab)

**这里放什么:** 这份 Run Bundle 的 Image2 Call Shape 实验隔间。Session B 只在这里证明候选怎么打、能不能拿到可通过生产 inspector 的 PNG。

**不放什么 / 去哪放:**
| 东西 | 放哪 |
|------|------|
| 已确认的生产打法 | `2_backbone/visual-style/image2-provider-profile.yaml`（或版本 override） |
| 正式出图 | `image2 generate` → `_generated/` |
| 跨 session 人读结论 | 现有 `lessons.mjs add` 写 `_lessons/`（只引用 trial id/hash） |
| 临时垃圾 | 版本 `_scratch/` |

**边界:** 空 scaffold（没有 trial）不挡 PPT flow。生产 generate / probe **不读**这里。`--new-version` 不拷贝、不删除 trial。大文件默认被本目录 `.gitignore` 忽略。
