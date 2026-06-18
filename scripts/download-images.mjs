/**
 * 从 Pexels 批量下载图片并上传到 Supabase Storage，更新数据库 image_path
 *
 * 使用方式：node scripts/download-images.mjs
 * 可选参数：
 *   --dry-run         仅打印搜索结果，不上传
 *   --id=animal-cat   只处理指定题目 ID（多个用逗号分隔）
 *   --skip-uploaded   跳过已有 image_path 的题目（默认行为）
 *   --force           强制覆盖已有图片
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ──────────────────────────────────────────────
// 1. 读取 .env
// ──────────────────────────────────────────────
function loadEnv(filePath) {
  try {
    const text = readFileSync(filePath, 'utf-8')
    const env = {}
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      env[key] = val
    }
    return env
  } catch {
    return {}
  }
}

const env = loadEnv(join(ROOT, '.env'))
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY
const PEXELS_KEY   = env.VITE_PEXELS_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请检查 .env 文件')
  process.exit(1)
}
if (!PEXELS_KEY) {
  console.error('❌ 缺少 VITE_PEXELS_KEY，请检查 .env 文件')
  process.exit(1)
}

// ──────────────────────────────────────────────
// 2. 解析命令行参数
// ──────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN       = args.includes('--dry-run')
const FORCE         = args.includes('--force')
const SKIP_UPLOADED = !FORCE  // 默认跳过已上传的

const idArg = args.find(a => a.startsWith('--id='))
const FILTER_IDS = idArg ? idArg.replace('--id=', '').split(',').map(s => s.trim()) : null

// ──────────────────────────────────────────────
// 3. 初始化 Supabase
// ──────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

// ──────────────────────────────────────────────
// 4. 从数据库读取题目列表
// ──────────────────────────────────────────────
async function fetchQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, name, name_en, image_keywords, image_path')
    .order('sort_order', { ascending: true })

  if (error || !data) {
    console.error('❌ 查询题目失败:', error?.message)
    process.exit(1)
  }
  return data
}

// ──────────────────────────────────────────────
// 5. Pexels 搜索
// ──────────────────────────────────────────────
async function searchPexels(keywords) {
  // 依次尝试每个关键词，找到第一张图就返回
  for (const kw of keywords) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(kw)}&per_page=3&size=medium&orientation=square`,
        { headers: { Authorization: PEXELS_KEY } }
      )
      if (!res.ok) {
        console.warn(`  ⚠️  Pexels 请求失败 (${res.status}) 关键词: ${kw}`)
        continue
      }
      const json = await res.json()
      const photos = json.photos
      if (photos && photos.length > 0) {
        const photo = photos[0]
        // 优先 medium，再 large，再 original
        const url = photo.src?.medium || photo.src?.large || photo.src?.original
        if (url) {
          return { url, keyword: kw, photoId: photo.id }
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  Pexels 搜索异常 关键词: ${kw}`, e.message)
    }
  }
  return null
}

// ──────────────────────────────────────────────
// 6. 下载图片为 Buffer
// ──────────────────────────────────────────────
async function downloadImage(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arrayBuf = await res.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuf),
    contentType: res.headers.get('content-type') || 'image/jpeg',
  }
}

// ──────────────────────────────────────────────
// 7. 上传到 Supabase Storage
// ──────────────────────────────────────────────
async function uploadToStorage(questionId, buffer, contentType) {
  // 根据 contentType 确定扩展名
  const ext = contentType.includes('png') ? 'png'
    : contentType.includes('webp') ? 'webp'
    : 'jpg'
  const path = `${questionId}.${ext}`

  const { error } = await supabase.storage
    .from('images')
    .upload(path, buffer, {
      upsert: true,
      contentType,
    })

  if (error) throw new Error(error.message)
  return path
}

// ──────────────────────────────────────────────
// 8. 更新数据库 image_path
// ──────────────────────────────────────────────
async function updateImagePath(questionId, path) {
  const { error } = await supabase
    .from('questions')
    .update({ image_path: path })
    .eq('id', questionId)

  if (error) throw new Error(error.message)
}

// ──────────────────────────────────────────────
// 9. 主流程
// ──────────────────────────────────────────────
async function main() {
  console.log('🚀 开始从 Pexels 批量下载图片...')
  console.log(`   模式: ${DRY_RUN ? 'Dry Run（不上传）' : '正式上传'}，${FORCE ? '强制覆盖' : '跳过已上传'}`)
  console.log()

  const questions = await fetchQuestions()

  // 筛选
  const targets = questions.filter(q => {
    if (FILTER_IDS && !FILTER_IDS.includes(q.id)) return false
    if (SKIP_UPLOADED && q.image_path) return false
    return true
  })

  console.log(`📋 共 ${questions.length} 道题，待处理 ${targets.length} 道`)
  if (targets.length === 0) {
    console.log('✅ 无需处理（所有题目已有图片）。如需强制覆盖请加 --force 参数')
    return
  }
  console.log()

  let successCount = 0
  let failCount = 0

  for (const q of targets) {
    const keywords = Array.isArray(q.image_keywords) && q.image_keywords.length > 0
      ? q.image_keywords
      : [q.name_en]

    process.stdout.write(`[${q.id}] ${q.name}（${q.name_en}）关键词: ${keywords.join(', ')} ...`)

    // 5a. 搜索图片
    const result = await searchPexels(keywords)
    if (!result) {
      console.log(` ❌ 未找到图片`)
      failCount++
      continue
    }

    console.log(` 找到 "${result.keyword}" Photo#${result.photoId}`)

    if (DRY_RUN) {
      console.log(`   🔍 [dry-run] 图片地址: ${result.url}`)
      successCount++
      continue
    }

    // 5b. 下载
    let buffer, contentType
    try {
      ;({ buffer, contentType } = await downloadImage(result.url))
      console.log(`   ⬇️  已下载 ${(buffer.length / 1024).toFixed(1)} KB (${contentType})`)
    } catch (e) {
      console.log(`   ❌ 下载失败: ${e.message}`)
      failCount++
      continue
    }

    // 5c. 上传
    let storagePath
    try {
      storagePath = await uploadToStorage(q.id, buffer, contentType)
      console.log(`   ☁️  已上传 → images/${storagePath}`)
    } catch (e) {
      console.log(`   ❌ 上传失败: ${e.message}`)
      failCount++
      continue
    }

    // 5d. 更新数据库
    try {
      await updateImagePath(q.id, storagePath)
      console.log(`   ✅ 已更新 image_path = ${storagePath}`)
      successCount++
    } catch (e) {
      console.log(`   ❌ 更新数据库失败: ${e.message}`)
      failCount++
    }

    // 避免 Pexels API 限流（每分钟 200 请求）
    await new Promise(r => setTimeout(r, 500))
  }

  console.log()
  console.log('─────────────────────────────')
  console.log(`✅ 成功: ${successCount}  ❌ 失败: ${failCount}  总计: ${targets.length}`)
}

main().catch(e => {
  console.error('❌ 脚本异常:', e)
  process.exit(1)
})
