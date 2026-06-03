<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteOperLog, listOperLog } from '@/api/system/operLog'
import type { PageQuery } from '@/types/common'
import type { SysOperLogVo } from '@/types/system/log'

defineOptions({
  name: 'SystemOperLog',
})

const businessTypeMap: Record<number, string> = {
  0: '其他',
  1: '新增',
  2: '修改',
  3: '删除',
  4: '导出',
  5: '导入',
  6: '授权',
  7: '强退',
}

const loading = ref(false)
const rows = ref<SysOperLogVo[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])
const detailVisible = ref(false)
const currentDetail = ref<SysOperLogVo>()
const query = reactive<PageQuery>({
  pageNum: 1,
  pageSize: 10,
})

const hasSelection = computed(() => selectedIds.value.length > 0)

const loadList = async () => {
  loading.value = true
  try {
    const data = await listOperLog(query)
    rows.value = data.rows
    total.value = data.total
  } catch {
    // request 拦截器已经负责错误提示；这里吞掉列表异常，避免分页和删除后刷新链路被异常打断。
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = () => {
  query.pageNum = 1
  loadList()
}

const handleSelectionChange = (selection: SysOperLogVo[]) => {
  selectedIds.value = selection.map((row) => row.operId)
}

const openDetailDialog = (row: SysOperLogVo) => {
  currentDetail.value = row
  detailVisible.value = true
}

const statusText = (status: number) => (status === 0 ? '成功' : '异常')
const statusTagType = (status: number) => (status === 0 ? 'success' : 'danger')
const businessTypeText = (businessType: number) => businessTypeMap[businessType] ?? '未知'

const handleDelete = async (ids: string[], label: string) => {
  if (!ids.length) return

  try {
    await ElMessageBox.confirm(`确认删除${label}？`, '系统提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteOperLog(ids)
    ElMessage.success('删除成功')
    selectedIds.value = []
    await loadList()
  } catch {
    // 取消删除是用户的正常选择；接口失败时 request 拦截器会展示后端错误。
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <section class="page">
    <div class="page__header">
      <h2 class="page__title">操作日志</h2>
      <el-button
        v-hasPermi="['system:operLog:remove']"
        type="danger"
        :disabled="!hasSelection"
        @click="handleDelete(selectedIds, `选中的 ${selectedIds.length} 条操作日志`)"
      >
        批量删除
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="rows"
      row-key="operId"
      class="page__table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="模块标题" min-width="120" />
      <el-table-column label="业务类型" width="100">
        <template #default="{ row }: { row: SysOperLogVo }">
          <el-tag>{{ businessTypeText(row.businessType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="requestMethod" label="请求方式" width="100" />
      <el-table-column prop="username" label="操作人" min-width="120" />
      <el-table-column prop="ip" label="IP" min-width="130" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }: { row: SysOperLogVo }">
          <el-tag :type="statusTagType(row.status)">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="耗时" width="100">
        <template #default="{ row }: { row: SysOperLogVo }">{{ row.duration }}ms</template>
      </el-table-column>
      <el-table-column prop="operTime" label="操作时间" min-width="180" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }: { row: SysOperLogVo }">
          <el-button type="primary" link @click="openDetailDialog(row)">详情</el-button>
          <el-button
            v-hasPermi="['system:operLog:remove']"
            type="danger"
            link
            @click="handleDelete([row.operId], `操作日志“${row.title}”`)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.pageNum"
      v-model:page-size="query.pageSize"
      class="page__pagination"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="loadList"
      @size-change="handlePageSizeChange"
    />

    <el-dialog v-model="detailVisible" title="操作日志详情" width="760px">
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="日志ID">{{ currentDetail.operId }}</el-descriptions-item>
        <el-descriptions-item label="模块标题">{{ currentDetail.title }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">
          {{ businessTypeText(currentDetail.businessType) }}
        </el-descriptions-item>
        <el-descriptions-item label="请求方式">
          {{ currentDetail.requestMethod }}
        </el-descriptions-item>
        <el-descriptions-item label="操作方法" :span="2">
          <span class="detail-text">{{ currentDetail.method }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求URL" :span="2">
          <span class="detail-text">{{ currentDetail.requestUrl }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <span class="detail-text">{{ currentDetail.requestParam || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ statusText(currentDetail.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="错误消息">
          <span class="detail-text">{{ currentDetail.errorMsg || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentDetail.userId }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentDetail.username }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentDetail.ip }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentDetail.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">
          {{ currentDetail.operTime }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.page {
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  &__table {
    margin-top: 16px;
  }

  &__pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.detail-text {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
