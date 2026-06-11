<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { addTenant, deleteTenant, listTenant, updateTenant } from '@/api/system/tenant'
import { formatDateTime } from '@/utils/formatTime'
import type { PageQuery } from '@/types/common'
import type { SysTenantAddDto, SysTenantEditDto, SysTenantVo } from '@/types/system/tenant'

defineOptions({
  name: 'SystemTenant',
})

type DialogMode = 'add' | 'edit'
type TenantStatus = SysTenantVo['status']

interface TenantForm {
  tenantId: string
  tenantName: string
  contact: string
  status: TenantStatus
}

const loading = ref(false)
const rows = ref<SysTenantVo[]>([])
const total = ref(0)
const query = reactive<PageQuery>({
  pageNum: 1,
  pageSize: 10,
})

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('add')
const formRef = ref<FormInstance>()
const form = reactive<TenantForm>({
  tenantId: '',
  tenantName: '',
  contact: '',
  status: '0',
})

const dialogTitle = computed(() => (dialogMode.value === 'add' ? '新增租户' : '编辑租户'))

const rules: FormRules<TenantForm> = {
  tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
}

const resetFormModel = () => {
  form.tenantId = ''
  form.tenantName = ''
  form.contact = ''
  form.status = '0'
  formRef.value?.clearValidate()
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await listTenant(query)
    rows.value = data.rows
    total.value = data.total
  } catch {
    // request 拦截器统一弹出错误；页面只负责回到空列表，避免旧数据误导管理员。
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  resetFormModel()
  dialogVisible.value = true
}

const openEditDialog = (row: SysTenantVo) => {
  dialogMode.value = 'edit'
  resetFormModel()
  form.tenantId = String(row.tenantId)
  form.tenantName = row.tenantName
  form.contact = row.contact ?? ''
  form.status = row.status
  dialogVisible.value = true
}

const handlePageSizeChange = () => {
  query.pageNum = 1
  loadList()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (dialogMode.value === 'add') {
    const dto: SysTenantAddDto = {
      tenantName: form.tenantName,
      contact: form.contact,
      status: form.status,
    }
    await addTenant(dto)
    ElMessage.success('新增成功')
  } else {
    const dto: SysTenantEditDto = {
      tenantId: form.tenantId,
      tenantName: form.tenantName,
      contact: form.contact,
      status: form.status,
    }
    await updateTenant(dto)
    ElMessage.success('修改成功')
  }

  dialogVisible.value = false
  await loadList()
}

const handleDelete = async (row: SysTenantVo) => {
  try {
    await ElMessageBox.confirm(`确认删除租户“${row.tenantName}”？`, '系统提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteTenant(String(row.tenantId))
    ElMessage.success('删除成功')
    await loadList()
  } catch {
    // 取消删除是正常交互，不额外提示。
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <section class="page">
    <div class="page__header">
      <h2 class="page__title">租户管理</h2>
      <el-button v-hasPermi="['system:tenant:add']" type="primary" @click="openAddDialog">
        新增租户
      </el-button>
    </div>

    <el-table v-loading="loading" :data="rows" row-key="tenantId" class="page__table">
      <el-table-column prop="tenantName" label="租户名称" min-width="160" />
      <el-table-column prop="contact" label="联系人" min-width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }: { row: SysTenantVo }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }: { row: SysTenantVo }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }: { row: SysTenantVo }">
          <el-button
            v-hasPermi="['system:tenant:edit']"
            type="primary"
            link
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['system:tenant:remove']"
            type="danger"
            link
            :disabled="String(row.tenantId) === '1'"
            @click="handleDelete(row)"
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" @closed="resetFormModel">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="租户名称" prop="tenantName">
          <el-input v-model="form.tenantName" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
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
</style>
