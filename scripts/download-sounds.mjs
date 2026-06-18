/**
 * 从 Freesound 批量下载声音并上传到 Supabase Storage，更新数据库 sound_path
 *
 * 使用方式：node scripts/download-sounds.mjs
 * 可选参数：
 *   --dry-run         仅打印搜索结果，不上传
 *   --id=animal-cat   只处理指定题目 ID（多个用逗号分隔）
 *   --force           强制覆盖已有声音（默认跳过已上传）
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
const SUPABASE_URL    = env.VITE_SUPABASE_URL
const SUPABASE_KEY    = env.VITE_SUPABASE_ANON_KEY
const FREESOUND_TOKEN = env.VITE_FREESOUND_TOKEN

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请检查 .env 文件')
  process.exit(1)
}
if (!FREESOUND_TOKEN) {
  console.error('❌ 缺少 VITE_FREESOUND_TOKEN，请检查 .env 文件')
  process.exit(1)
}

// ──────────────────────────────────────────────
// 2. 解析命令行参数
// ──────────────────────────────────────────────
const args    = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const FORCE   = args.includes('--force')

const idArg      = args.find(a => a.startsWith('--id='))
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
    .select('id, name, name_en, sound_keywords, sound_path')
    .order('sort_order', { ascending: true })

  if (error || !data) {
    console.error('❌ 查询题目失败:', error?.message)
    process.exit(1)
  }
  return data
}

// ──────────────────────────────────────────────
// 5. Freesound 搜索 — 返回 { previewUrl, soundId, name, keyword }
// ──────────────────────────────────────────────
async function searchFreesound(keywords) {
  for (const kw of keywords) {
    // 只用英文关键词搜索（Freesound 中文效果差）
    if (!/^[a-zA-Z0-9\s\-]/.test(kw)) continue

    try {
      const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(kw)}&page_size=5&fields=id,name,previews,duration&filter=duration:[0.5 TO 5]`
      const res = await fetch(url, {
        headers: { Authorization: `Token ${FREESOUND_TOKEN}` },
      })

      if (!res.ok) {
        console.warn(`  ⚠️  Freesound 请求失败 (${res.status}) 关键词: ${kw}`)
        continue
      }

      const json = await res.json()
      const results = json.results
      if (!results || results.length === 0) continue

      for (const r of results) {
        const previewUrl = r.previews?.['preview-hq-mp3'] ?? r.previews?.['preview-lq-mp3']
        if (previewUrl) {
          return { previewUrl, soundId: r.id, name: r.name, keyword: kw }
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  Freesound 搜索异常 关键词: ${kw}`, e.message)
    }
  }
  return null
}

// ──────────────────────────────────────────────
// 6. 下载音频为 Buffer
// ──────────────────────────────────────────────
async function downloadAudio(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Token ${FREESOUND_TOKEN}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arrayBuf = await res.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuf),
    contentType: res.headers.get('content-type') || 'audio/mpeg',
  }
}

// ──────────────────────────────────────────────
// 7. 上传到 Supabase Storage
// ──────────────────────────────────────────────
async function uploadToStorage(questionId, buffer, contentType) {
  const ext = contentType.includes('ogg') ? 'ogg'
    : contentType.includes('wav') ? 'wav'
    : 'mp3'
  const path = `${questionId}.${ext}`

  const { error } = await supabase.storage
    .from('sounds')
    .upload(path, buffer, { upsert: true, contentType })

  if (error) throw new Error(error.message)
  return path
}

// ──────────────────────────────────────────────
// 8. 更新数据库 sound_path
// ──────────────────────────────────────────────
async function updateSoundPath(questionId, path) {
  const { error } = await supabase
    .from('questions')
    .update({ sound_path: path })
    .eq('id', questionId)

  if (error) throw new Error(error.message)
}

// ──────────────────────────────────────────────
// 9. 主流程
// ──────────────────────────────────────────────
async function main() {
  console.log('🔊 开始从 Freesound 批量下载声音...')
  console.log(`   模式: ${DRY_RUN ? 'Dry Run（不上传）' : '正式上传'}，${FORCE ? '强制覆盖' : '跳过已上传'}`)
  console.log()

  const questions = await fetchQuestions()

  // 筛选
  const targets = questions.filter(q => {
    if (FILTER_IDS && !FILTER_IDS.includes(q.id)) return false
    if (!FORCE && q.sound_path) return false
    return true
  })

  console.log(`📋 共 ${questions.length} 道题，待处理 ${targets.length} 道`)
  if (targets.length === 0) {
    console.log('✅ 无需处理（所有题目已有声音）。如需强制覆盖请加 --force 参数')
    return
  }
  console.log()

  let successCount = 0
  let failCount    = 0

  for (const q of targets) {
    // 构建关键词列表：先用 sound_keywords 中的英文词，再用 name_en
    const rawKeywords = Array.isArray(q.sound_keywords) ? q.sound_keywords : []
    const keywords    = [
      ...rawKeywords.filter(k => /^[a-zA-Z0-9\s\-]/.test(k)),
      q.name_en,
    ]

    process.stdout.write(`[${q.id}] ${q.name}（${q.name_en}）关键词: ${keywords.join(', ')} ...`)

    // 搜索
    const result = await searchFreesound(keywords)
    if (!result) {
      console.log(` ❌ 未找到声音`)
      failCount++
      continue
    }

    console.log(` 找到 "${result.keyword}" → #${result.soundId} "${result.name}"`)

    if (DRY_RUN) {
      console.log(`   🔍 [dry-run] 预览地址: ${result.previewUrl}`)
      successCount++
      continue
    }

    // 下载
    let buffer, contentType
    try {
      ;({ buffer, contentType } = await downloadAudio(result.previewUrl))
      console.log(`   ⬇️  已下载 ${(buffer.length / 1024).toFixed(1)} KB (${contentType})`)
    } catch (e) {
      console.log(`   ❌ 下载失败: ${e.message}`)
      failCount++
      continue
    }

    // 上传
    let storagePath
    try {
      storagePath = await uploadToStorage(q.id, buffer, contentType)
      console.log(`   ☁️  已上传 → sounds/${storagePath}`)
    } catch (e) {
      console.log(`   ❌ 上传失败: ${e.message}`)
      failCount++
      continue
    }

    // 更新数据库
    try {
      await updateSoundPath(q.id, storagePath)
      console.log(`   ✅ 已更新 sound_path = ${storagePath}`)
      successCount++
    } catch (e) {
      console.log(`   ❌ 更新数据库失败: ${e.message}`)
      failCount++
    }

    // 避免 Freesound API 限流（每日 2000 次，每秒不超过 60 次）
    await new Promise(r => setTimeout(r, 600))
  }

  console.log()
  console.log('─────────────────────────────')
  console.log(`✅ 成功: ${successCount}  ❌ 失败: ${failCount}  总计: ${targets.length}`)
}

main().catch(e => {
  console.error('❌ 脚本异常:', e)
  process.exit(1)
})
