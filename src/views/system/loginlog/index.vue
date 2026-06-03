<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteLoginLog, listLoginLog } from '@/api/system/loginLog'
import { formatDateTime } from '@/utils/formatTime'
import type { PageQuery } from '@/types/common'
import type { SysLoginLogVo } from '@/types/system/log'

defineOptions({
  name: 'SystemLoginLog',
})

const loading = ref(false)
const rows = ref<SysLoginLogVo[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])
const query = reactive<PageQuery>({
  pageNum: 1,
  pageSize: 10,
})

const hasSelection = computed(() => selectedIds.value.length > 0)

const loadList = async () => {
  loading.value = true
  try {
    const data = await listLoginLog(query)
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

const handleSelectionChange = (selection: SysLoginLogVo[]) => {
  selectedIds.value = selection.map((row) => row.loginId)
}

const statusText = (status: number) => (status === 0 ? '成功' : '失败')
const statusTagType = (status: number) => (status === 0 ? 'success' : 'danger')

const handleDelete = async (ids: string[], label: string) => {
  if (!ids.length) return

  try {
    await ElMessageBox.confirm(`确认删除${label}？`, '系统提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteLoginLog(ids)
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
      <h2 class="page__title">登录日志</h2>
      <el-button
        v-hasPermi="['system:loginLog:remove']"
        type="danger"
        :disabled="!hasSelection"
        @click="handleDelete(selectedIds, `选中的 ${selectedIds.length} 条登录日志`)"
      >
        批量删除
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="rows"
      row-key="loginId"
      class="page__table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="登录账号" min-width="140" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }: { row: SysLoginLogVo }">
          <el-tag :type="statusTagType(row.status)">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" min-width="130" show-overflow-tooltip />
      <el-table-column prop="msg" label="提示消息" min-width="180" show-overflow-tooltip />
      <el-table-column prop="userAgent" label="浏览器" min-width="240" show-overflow-tooltip />
      <el-table-column label="登录时间" min-width="180">
        <template #default="{ row }: { row: SysLoginLogVo }">
          {{ formatDateTime(row.loginTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }: { row: SysLoginLogVo }">
          <el-button
            v-hasPermi="['system:loginLog:remove']"
            type="danger"
            link
            @click="handleDelete([row.loginId], `登录日志“${row.username}”`)"
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
</style>
