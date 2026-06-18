<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchResourceStatus,
  uploadSound,
  uploadImage,
  createQuestion,
  updateQuestion,
  toggleQuestionActive,
  deleteQuestion,
  type QuestionResource,
  type CreateQuestionInput,
  type UpdateQuestionInput,
} from '@/services/resource-admin.service'
import { supabase } from '@/services/supabase.client'

const router = useRouter()
const resources = ref<QuestionResource[]>([])
const loading = ref(true)
const uploadingId = ref<string | null>(null)
const uploadingType = ref<'sound' | 'image' | null>(null)

// 图片预览
const previewUrl = ref('')
const previewName = ref('')
const showPreview = ref(false)

// 当前播放的音频
let currentAudio: HTMLAudioElement | null = null

// 新增资源弹窗
const showAddModal = ref(false)
const adding = ref(false)
const addForm = ref<CreateQuestionInput>({
  category_id: 'vehicle',
  name: '',
  name_en: '',
  difficulty: 1,
  sound_keywords: [],
  image_keywords: [],
})
const addFormErrors = ref<Record<string, string>>({})

// 关键词输入（逗号分隔的字符串）
const soundKeywordsInput = ref('')
const imageKeywordsInput = ref('')

// 筛选
const filterCategory = ref<string>('all')
const filterKeyword = ref('')

/** 筛选后的资源列表 */
const filteredResources = computed(() => {
  let list = resources.value
  if (filterCategory.value !== 'all') {
    list = list.filter((r) => r.category_id === filterCategory.value)
  }
  const kw = filterKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.name_en.toLowerCase().includes(kw) ||
        r.id.toLowerCase().includes(kw),
    )
  }
  return list
})

onMounted(async () => {
  await loadResources()
})

async function loadResources() {
  loading.value = true
  resources.value = await fetchResourceStatus()
  loading.value = false
}

/** 试听声音 */
function playSound(url: string, name: string) {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  currentAudio = new Audio(url)
  currentAudio.play().catch((err) => {
    console.warn(`试听 ${name} 失败:`, err)
  })
  currentAudio.onended = () => {
    currentAudio = null
  }
}

/** 停止播放 */
function stopSound() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

/** 预览图片 */
function openPreview(url: string, name: string) {
  previewUrl.value = url
  previewName.value = name
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
}

/** 处理声音上传 */
async function handleSoundUpload(questionId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingId.value = questionId
  uploadingType.value = 'sound'
  const ok = await uploadSound(questionId, file)
  uploadingId.value = null
  uploadingType.value = null

  if (ok) {
    await loadResources()
  } else {
    alert('声音上传失败，请检查网络或文件格式')
  }
  // 重置 input 以便重复选择同一文件
  input.value = ''
}

/** 处理图片上传 */
async function handleImageUpload(questionId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingId.value = questionId
  uploadingType.value = 'image'
  const ok = await uploadImage(questionId, file)
  uploadingId.value = null
  uploadingType.value = null

  if (ok) {
    await loadResources()
  } else {
    alert('图片上传失败，请检查网络或文件格式')
  }
  input.value = ''
}

function goHome() {
  stopSound()
  router.push('/')
}

/** 打开新增弹窗 */
function openAddModal() {
  addForm.value = {
    category_id: 'vehicle',
    name: '',
    name_en: '',
    difficulty: 1,
    sound_keywords: [],
    image_keywords: [],
  }
  soundKeywordsInput.value = ''
  imageKeywordsInput.value = ''
  addFormErrors.value = {}
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

/** 解析逗号分隔的关键词字符串 */
function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 校验并提交新增表单 */
async function handleAdd() {
  const errors: Record<string, string> = {}
  if (!addForm.value.name.trim()) errors.name = '请填写中文名称'
  if (!addForm.value.name_en.trim()) errors.name_en = '请填写英文名称'
  addFormErrors.value = errors
  if (Object.keys(errors).length) return

  addForm.value.sound_keywords = parseKeywords(soundKeywordsInput.value)
  addForm.value.image_keywords = parseKeywords(imageKeywordsInput.value)

  adding.value = true
  const result = await createQuestion(addForm.value)
  adding.value = false

  if (result) {
    showAddModal.value = false
    await loadResources()
  } else {
    alert('新增题目失败，可能是 ID 重复，请修改英文名称后重试')
  }
}

/** 删除题目（二次确认） */
async function handleDelete(questionId: string, questionName: string) {
  if (!confirm(`确定要删除「${questionName}」吗？此操作不可恢复。`)) return
  const ok = await deleteQuestion(questionId)
  if (ok) {
    await loadResources()
  } else {
    alert('删除失败，请检查网络')
  }
}

// ──── 编辑弹窗 ────
const showEditModal = ref(false)
const saving = ref(false)
const editForm = ref<UpdateQuestionInput & { id: string }>({
  id: '',
  name: '',
  name_en: '',
  category_id: 'vehicle',
  difficulty: 1,
  sound_keywords: [],
  image_keywords: [],
})
const editSoundKeywordsInput = ref('')
const editImageKeywordsInput = ref('')
const editFormErrors = ref<Record<string, string>>({})

/** 资源状态文案 */
function statusText(res: QuestionResource): string {
  return res.is_active ? '启用' : '停用'
}

/** 资源状态 CSS 类 */
function statusClass(res: QuestionResource): string {
  return res.is_active ? 'status-active' : 'status-disabled'
}

/** 切换启用/停用 */
async function handleToggleActive(res: QuestionResource) {
  const newActive = !res.is_active
  const ok = await toggleQuestionActive(res.id, newActive)
  if (ok) {
    await loadResources()
  } else {
    alert('切换状态失败，请检查网络')
  }
}

/** 打开编辑弹窗 */
function openEditModal(res: QuestionResource) {
  editForm.value = {
    id: res.id,
    name: res.name,
    name_en: res.name_en,
    category_id: res.category_id,
    difficulty: res.difficulty,
    sound_keywords: [...res.sound_keywords],
    image_keywords: [...res.image_keywords],
  }
  editSoundKeywordsInput.value = res.sound_keywords.join(', ')
  editImageKeywordsInput.value = res.image_keywords.join(', ')
  editFormErrors.value = {}
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

/** 提交编辑 */
async function handleEdit() {
  const errors: Record<string, string> = {}
  if (!editForm.value.name?.trim()) errors.name = '请填写中文名称'
  if (!editForm.value.name_en?.trim()) errors.name_en = '请填写英文名称'
  editFormErrors.value = errors
  if (Object.keys(errors).length) return

  editForm.value.sound_keywords = parseKeywords(editSoundKeywordsInput.value)
  editForm.value.image_keywords = parseKeywords(editImageKeywordsInput.value)

  saving.value = true
  const { id, ...input } = editForm.value
  const result = await updateQuestion(id, input)
  saving.value = false

  if (result) {
    showEditModal.value = false
    await loadResources()
  } else {
    alert('保存失败，请检查网络后重试')
  }
}

/** 分类中文映射 */
const catNames: Record<string, string> = {
  vehicle: '🚗 交通工具',
  animal: '🐰 动物',
}

/** 分类选项 */
const categoryOptions = [
  { value: 'vehicle', label: '🚗 交通工具' },
  { value: 'animal', label: '🐰 动物' },
]

/** 难度选项 */
const difficultyOptions = [
  { value: 1, label: '⭐ 简单' },
  { value: 2, label: '⭐⭐ 中等' },
  { value: 3, label: '⭐⭐⭐ 困难' },
]

const isSupabaseReady = !!supabase
</script>

<template>
  <div class="admin-screen">
    <!-- 顶栏 -->
    <header class="admin-header">
      <button class="back-btn" @click="goHome">← 返回</button>
      <h1 class="admin-title">🔧 资源管理</h1>
      <div class="header-spacer" />
      <button
        v-if="isSupabaseReady && !loading"
        class="add-btn"
        @click="openAddModal"
      >＋ 新增</button>
    </header>

    <!-- 未连接提示 -->
    <div v-if="!isSupabaseReady" class="no-supabase">
      <p>⚠️ Supabase 未配置，无法使用资源管理功能</p>
      <p class="hint">请在 .env 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY</p>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="loading">加载中...</div>

    <!-- 资源表格 -->
    <div v-else class="table-wrap">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-chips">
          <button
            class="filter-chip"
            :class="{ active: filterCategory === 'all' }"
            @click="filterCategory = 'all'"
          >📋 全部</button>
          <button
            v-for="opt in categoryOptions"
            :key="opt.value"
            class="filter-chip"
            :class="{ active: filterCategory === opt.value }"
            @click="filterCategory = opt.value"
          >{{ opt.label }}</button>
        </div>
        <div class="filter-search">
          <input
            v-model="filterKeyword"
            class="search-input"
            placeholder="🔍 搜索题目名称..."
            type="text"
          />
          <button
            v-if="filterKeyword"
            class="search-clear"
            @click="filterKeyword = ''"
          >✕</button>
        </div>
      </div>

      <table class="res-table">
        <thead>
          <tr>
            <th>#</th>
            <th>题目</th>
            <th>分类</th>
            <th>状态</th>
            <th>图片</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, idx) in filteredResources" :key="res.id">
            <td class="col-idx">{{ idx + 1 }}</td>
            <td class="col-name">
              <span class="q-name">{{ res.name }}</span>
              <span class="q-id">{{ res.id }}</span>
            </td>
            <td class="col-cat">{{ catNames[res.category_id] || res.category_id }}</td>

            <!-- 状态 -->
            <td class="col-status-combined">
                <!-- 启用/停用滑块 -->
                <label class="toggle-switch" :title="res.is_active ? '点击停用' : '点击启用'">
                  <input
                    type="checkbox"
                    :checked="res.is_active"
                    class="toggle-input"
                    @change="handleToggleActive(res)"
                  />
                  <span class="toggle-slider"></span>
                </label>
            </td>

            <!-- 图片缩略图 -->
            <td class="col-thumb">
              <img
                v-if="res.imageUploaded"
                :src="res.imageUrl"
                :alt="res.name"
                class="thumb-img"
                @click="openPreview(res.imageUrl, res.name)"
              />
              <span v-else class="thumb-placeholder">无</span>
            </td>

            <!-- 操作 -->
            <td class="col-action-wide">
              <div class="action-group">
                <!-- 声音 -->
                <button
                  v-if="res.soundUploaded"
                  class="btn-sm btn-play"
                  @click="playSound(res.soundUrl, res.name)"
                >▶ 试听</button>
                <label
                  class="btn-sm btn-upload"
                  :class="{ disabled: uploadingId === res.id && uploadingType === 'sound' }"
                >
                  {{ res.soundUploaded ? '🔄 声音' : '📤 声音' }}
                  <input
                    type="file"
                    accept="audio/*"
                    class="hidden-input"
                    :disabled="uploadingId === res.id && uploadingType === 'sound'"
                    @change="handleSoundUpload(res.id, $event)"
                  />
                </label>
                <!-- 图片上传 -->
                <label
                  class="btn-sm btn-upload"
                  :class="{ disabled: uploadingId === res.id && uploadingType === 'image' }"
                >
                  {{ res.imageUploaded ? '🔄 图片' : '📤 图片' }}
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden-input"
                    :disabled="uploadingId === res.id && uploadingType === 'image'"
                    @change="handleImageUpload(res.id, $event)"
                  />
                </label>
                <!-- 编辑 & 删除 -->
                <button class="btn-sm btn-edit" @click="openEditModal(res)">✏️ 编辑</button>
                <button class="btn-sm btn-delete" @click="handleDelete(res.id, res.name)">🗑 删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPreview" class="preview-overlay">
          <div class="preview-card">
            <img :src="previewUrl" :alt="previewName" class="preview-img" />
            <p class="preview-name">{{ previewName }}</p>
            <button class="btn-sm btn-close" @click="closePreview">关闭</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 新增资源弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddModal" class="preview-overlay">
          <div class="add-card">
            <h2 class="add-title">➕ 新增题目</h2>

            <div class="add-form">
              <!-- 分类 -->
              <label class="field-label">分类</label>
              <div class="cat-chips">
                <button
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  class="cat-chip"
                  :class="{ active: addForm.category_id === opt.value }"
                  @click="addForm.category_id = opt.value"
                >{{ opt.label }}</button>
              </div>

              <!-- 中文名称 -->
              <label class="field-label">中文名称 <span class="required">*</span></label>
              <input
                v-model="addForm.name"
                class="field-input"
                placeholder="如：小猴子"
              />
              <span v-if="addFormErrors.name" class="field-error">{{ addFormErrors.name }}</span>

              <!-- 英文名称 -->
              <label class="field-label">英文名称 <span class="required">*</span></label>
              <input
                v-model="addForm.name_en"
                class="field-input"
                placeholder="如：monkey"
              />
              <span v-if="addFormErrors.name_en" class="field-error">{{ addFormErrors.name_en }}</span>
              <span class="field-hint">ID 将自动生成为: {{ addForm.category_id }}-{{ addForm.name_en.toLowerCase().replace(/\s+/g, '-') || '?' }}</span>

              <!-- 难度 -->
              <label class="field-label">难度</label>
              <div class="cat-chips">
                <button
                  v-for="opt in difficultyOptions"
                  :key="opt.value"
                  class="cat-chip"
                  :class="{ active: addForm.difficulty === opt.value }"
                  @click="addForm.difficulty = opt.value as 1 | 2 | 3"
                >{{ opt.label }}</button>
              </div>

              <!-- 声音关键词 -->
              <label class="field-label">声音关键词</label>
              <input
                v-model="soundKeywordsInput"
                class="field-input"
                placeholder="逗号分隔，如：monkey-chatter, 猴子叫"
              />

              <!-- 图片关键词 -->
              <label class="field-label">图片关键词</label>
              <input
                v-model="imageKeywordsInput"
                class="field-input"
                placeholder="逗号分隔，如：monkey, 猴子"
              />
            </div>

            <div class="add-actions">
              <button class="btn-sm btn-cancel" @click="closeAddModal">取消</button>
              <button
                class="btn-sm btn-confirm"
                :class="{ disabled: adding }"
                :disabled="adding"
                @click="handleAdd"
              >{{ adding ? '提交中...' : '确认新增' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 编辑资源弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="preview-overlay">
          <div class="add-card">
            <h2 class="add-title">✏️ 编辑题目</h2>

            <div class="add-form">
              <!-- ID（只读） -->
              <label class="field-label">ID</label>
              <input
                :value="editForm.id"
                class="field-input field-readonly"
                readonly
              />

              <!-- 分类 -->
              <label class="field-label">分类</label>
              <div class="cat-chips">
                <button
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  class="cat-chip"
                  :class="{ active: editForm.category_id === opt.value }"
                  @click="editForm.category_id = opt.value"
                >{{ opt.label }}</button>
              </div>

              <!-- 中文名称 -->
              <label class="field-label">中文名称 <span class="required">*</span></label>
              <input
                v-model="editForm.name"
                class="field-input"
              />
              <span v-if="editFormErrors.name" class="field-error">{{ editFormErrors.name }}</span>

              <!-- 英文名称 -->
              <label class="field-label">英文名称 <span class="required">*</span></label>
              <input
                v-model="editForm.name_en"
                class="field-input"
              />
              <span v-if="editFormErrors.name_en" class="field-error">{{ editFormErrors.name_en }}</span>

              <!-- 难度 -->
              <label class="field-label">难度</label>
              <div class="cat-chips">
                <button
                  v-for="opt in difficultyOptions"
                  :key="opt.value"
                  class="cat-chip"
                  :class="{ active: editForm.difficulty === opt.value }"
                  @click="editForm.difficulty = opt.value as 1 | 2 | 3"
                >{{ opt.label }}</button>
              </div>

              <!-- 声音关键词 -->
              <label class="field-label">声音关键词</label>
              <input
                v-model="editSoundKeywordsInput"
                class="field-input"
                placeholder="逗号分隔"
              />

              <!-- 图片关键词 -->
              <label class="field-label">图片关键词</label>
              <input
                v-model="editImageKeywordsInput"
                class="field-input"
                placeholder="逗号分隔"
              />
            </div>

            <div class="add-actions">
              <button class="btn-sm btn-cancel" @click="closeEditModal">取消</button>
              <button
                class="btn-sm btn-confirm"
                :class="{ disabled: saving }"
                :disabled="saving"
                @click="handleEdit"
              >{{ saving ? '保存中...' : '保存' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-screen {
  min-height: 100vh;
  min-height: 100dvh;
  background: #f5f5f5;
}

.admin-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
}

.back-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #666;
}

.back-btn:hover { background: #e0e0e0; }

.admin-title {
  font-size: 22px;
  font-weight: 800;
  color: #333;
  margin: 0;
}

.header-spacer { flex: 1; }

.no-supabase {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.no-supabase .hint {
  font-size: 14px;
  color: #bbb;
  margin-top: 8px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  color: #999;
}

.table-wrap {
  overflow-x: auto;
  padding: 16px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip.active {
  border-color: #1976D2;
  background: #E3F2FD;
  color: #1565C0;
}

.filter-search {
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 320px;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}

.search-input:focus { border-color: #1976D2; }

.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  color: #999;
  padding: 2px 4px;
  line-height: 1;
}

.search-clear:hover { color: #666; }

.res-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  min-width: 700px;
}

.res-table th {
  background: #fafafa;
  padding: 14px 12px;
  font-size: 14px;
  font-weight: 700;
  color: #888;
  text-align: center;
  border-bottom: 2px solid #eee;
  white-space: nowrap;
}

.res-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
  vertical-align: middle;
}

.col-idx {
  font-weight: 700;
  color: #ccc;
  width: 40px;
}

.col-name {
  text-align: left;
}

.q-name {
  display: block;
  font-weight: 700;
  color: #444;
  font-size: 16px;
}

.q-id {
  display: block;
  font-size: 12px;
  color: #bbb;
  font-family: monospace;
}

.col-cat {
  font-size: 14px;
  white-space: nowrap;
}

.col-status-combined {
  width: 100px;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.status-active {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-disabled {
  background: #ECEFF1;
  color: #546E7A;
}

/* 图片缩略图列 */
.col-thumb {
  width: 72px;
  text-align: center;
  vertical-align: middle;
}

.thumb-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.thumb-img:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  border-color: #1976D2;
}

.thumb-placeholder {
  display: inline-block;
  width: 56px;
  height: 56px;
  line-height: 56px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #bbb;
  font-size: 14px;
}

.col-action-wide {
  min-width: 280px;
}

.action-group {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 12px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-play {
  background: #E3F2FD;
  color: #1976D2;
}

.btn-play:hover { background: #BBDEFB; }

.btn-upload {
  background: #E8F5E9;
  color: #388E3C;
  position: relative;
  overflow: hidden;
}

.btn-upload:hover { background: #C8E6C9; }
.btn-upload.disabled { opacity: 0.5; cursor: not-allowed; }

.hidden-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  font-size: 0;
}

.btn-close {
  background: #f0f0f0;
  color: #666;
  margin-top: 12px;
}

.btn-close:hover { background: #e0e0e0; }

/* 图片预览弹窗 */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.preview-card {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  max-width: 420px;
  width: 100%;
}

.preview-img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 12px;
}

.preview-name {
  margin: 12px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #444;
}

.modal-enter-active { transition: all 0.3s ease; }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* 新增按钮 */
.add-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 12px;
  background: #4CAF50;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover { background: #388E3C; }

/* 滑块开关 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background: #4CAF50;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-input:focus-visible + .toggle-slider {
  outline: 2px solid #1976D2;
  outline-offset: 2px;
}

/* 删除按钮 */
.btn-delete {
  background: #FFEBEE;
  color: #D32F2F;
}

.btn-delete:hover { background: #FFCDD2; }

/* 编辑按钮 */
.btn-edit {
  background: #FFF8E1;
  color: #F57F17;
}

.btn-edit:hover { background: #FFECB3; }

/* 新增弹窗 */
.add-card {
  background: #fff;
  border-radius: 24px;
  padding: 28px 24px;
  max-width: 440px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.add-title {
  font-size: 22px;
  font-weight: 800;
  color: #333;
  margin: 0 0 20px;
  text-align: center;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 14px;
  font-weight: 700;
  color: #555;
  margin-top: 12px;
  margin-bottom: 4px;
}

.required { color: #D32F2F; }

.field-input {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.field-input:focus { border-color: #4CAF50; }

.field-error {
  font-size: 12px;
  color: #D32F2F;
  margin-top: 2px;
}

.field-hint {
  font-size: 12px;
  color: #999;
  font-family: monospace;
  margin-top: 2px;
}

.cat-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cat-chip {
  padding: 6px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: #fafafa;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-chip.active {
  border-color: #4CAF50;
  background: #E8F5E9;
  color: #2E7D32;
}

.add-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
  padding: 10px 20px;
}

.btn-cancel:hover { background: #e0e0e0; }

.btn-confirm {
  background: #4CAF50;
  color: #fff;
  padding: 10px 20px;
}

.btn-confirm:hover { background: #388E3C; }
.btn-confirm.disabled { opacity: 0.5; cursor: not-allowed; }

/* 只读输入框 */
.field-readonly {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}
</style>
