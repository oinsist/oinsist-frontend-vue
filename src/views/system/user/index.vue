<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { listRole } from '@/api/system/role'
import {
  addUser,
  assignUserRoles,
  deleteUser,
  getUserRoleIds,
  listUser,
  updateUser,
} from '@/api/system/user'
import { formatDateTime } from '@/utils/formatTime'
import type { PageQuery } from '@/types/common'
import type { SysRoleVo } from '@/types/system/role'
import type { SysUserAddDto, SysUserEditDto, SysUserVo } from '@/types/system/user'

defineOptions({
  name: 'SystemUser',
})

type DialogMode = 'add' | 'edit'
type UserStatus = SysUserVo['status']

interface UserForm {
  userId: string
  username: string
  nickname: string
  password: string
  status: UserStatus
}

const loading = ref(false)
const rows = ref<SysUserVo[]>([])
const total = ref(0)
const query = reactive<PageQuery>({
  pageNum: 1,
  pageSize: 10,
})

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('add')
const formRef = ref<FormInstance>()
const form = reactive<UserForm>({
  userId: '',
  username: '',
  nickname: '',
  password: '',
  status: '0',
})

const dialogTitle = computed(() => (dialogMode.value === 'add' ? '新增用户' : '编辑用户'))
const isEdit = computed(() => dialogMode.value === 'edit')

const assignDialogVisible = ref(false)
const assignLoading = ref(false)
const assignSubmitting = ref(false)
const assignReady = ref(false)
const assignUserId = ref('')
const assignUsername = ref('')
const roleOptions = ref<SysRoleVo[]>([])
const selectedRoleIds = ref<string[]>([])

const rules: FormRules<UserForm> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const resetFormModel = () => {
  form.userId = ''
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.status = '0'
  formRef.value?.clearValidate()
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await listUser(query)
    rows.value = data.rows
    total.value = data.total
  } catch {
    // request 拦截器已经负责错误提示；这里吞掉列表异常，避免刷新失败反向污染 mounted/分页/提交按钮事件。
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

const openEditDialog = (row: SysUserVo) => {
  dialogMode.value = 'edit'
  resetFormModel()
  form.userId = row.userId
  form.username = row.username
  form.nickname = row.nickname
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
    const dto: SysUserAddDto = {
      username: form.username,
      nickname: form.nickname,
      password: form.password,
      status: form.status,
    }
    await addUser(dto)
    ElMessage.success('新增成功')
  } else {
    // 编辑接口只允许改昵称和状态，用户名/密码不提交，避免前端越权改动账号核心标识。
    const dto: SysUserEditDto = {
      userId: form.userId,
      nickname: form.nickname,
      status: form.status,
    }
    await updateUser(dto)
    ElMessage.success('修改成功')
  }

  dialogVisible.value = false
  await loadList()
}

const handleDelete = async (row: SysUserVo) => {
  try {
    await ElMessageBox.confirm(`确认删除用户“${row.username}”？`, '系统提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUser(row.userId)
    ElMessage.success('删除成功')
    await loadList()
  } catch {
    // 取消删除是用户的正常选择，不需要提示失败，避免把业务取消误当异常展示。
  }
}

const resetAssignModel = () => {
  assignUserId.value = ''
  assignUsername.value = ''
  roleOptions.value = []
  selectedRoleIds.value = []
  assignReady.value = false
}

const openAssignRoleDialog = async (row: SysUserVo) => {
  resetAssignModel()
  assignUserId.value = row.userId
  assignUsername.value = row.username
  assignDialogVisible.value = true
  assignLoading.value = true

  try {
    const [rolePage, currentRoleIds] = await Promise.all([
      listRole({ pageNum: 1, pageSize: 500 }),
      getUserRoleIds(row.userId),
    ])
    roleOptions.value = rolePage.rows
    // 后端 Long 在 JSON 中可能表现为 number 或 string；统一转字符串，保证 el-select 预勾选用 === 能匹配。
    selectedRoleIds.value = currentRoleIds.map((roleId) => String(roleId))
    assignReady.value = true
  } catch {
    // 分配角色是覆盖提交，预加载失败时禁止提交，避免未预勾选导致误清空用户角色。
    roleOptions.value = []
    selectedRoleIds.value = []
    assignReady.value = false
  } finally {
    assignLoading.value = false
  }
}

const handleAssignSubmit = async () => {
  if (!assignReady.value) return

  assignSubmitting.value = true
  try {
    await assignUserRoles(assignUserId.value, selectedRoleIds.value)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
  } finally {
    assignSubmitting.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <section class="page">
    <div class="page__header">
      <h2 class="page__title">用户管理</h2>
      <el-button v-hasPermi="['system:user:add']" type="primary" @click="openAddDialog">
        新增用户
      </el-button>
    </div>

    <el-table v-loading="loading" :data="rows" row-key="userId" class="page__table">
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="nickname" label="昵称" min-width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }: { row: SysUserVo }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }: { row: SysUserVo }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }: { row: SysUserVo }">
          <el-button
            v-hasPermi="['system:user:edit']"
            type="primary"
            link
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['system:user:assignRole']"
            type="primary"
            link
            @click="openAssignRoleDialog(row)"
          >
            分配角色
          </el-button>
          <el-button
            v-hasPermi="['system:user:remove']"
            type="danger"
            link
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
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

    <el-dialog
      v-model="assignDialogVisible"
      title="分配角色"
      width="520px"
      @closed="resetAssignModel"
    >
      <el-form v-loading="assignLoading" label-width="88px">
        <el-form-item label="用户">
          <el-input :model-value="assignUsername" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="selectedRoleIds"
            multiple
            clearable
            filterable
            :disabled="!assignReady"
            placeholder="请选择角色"
            class="page__select"
          >
            <el-option
              v-for="role in roleOptions"
              :key="String(role.roleId)"
              :label="role.roleName"
              :value="String(role.roleId)"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="assignSubmitting"
          :disabled="!assignReady"
          @click="handleAssignSubmit"
        >
          确定
        </el-button>
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

  &__select {
    width: 100%;
  }
}
</style>
