<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type TreeInstance,
} from 'element-plus'
import { listMenu } from '@/api/system/menu'
import {
  addRole,
  assignRoleMenus,
  deleteRole,
  getRoleMenuIds,
  listRole,
  updateRole,
} from '@/api/system/role'
import { formatDateTime } from '@/utils/formatTime'
import type { PageQuery } from '@/types/common'
import type { SysMenuVo } from '@/types/system/menu'
import type { SysRoleAddDto, SysRoleEditDto, SysRoleVo } from '@/types/system/role'

defineOptions({
  name: 'SystemRole',
})

type DialogMode = 'add' | 'edit'
type RoleStatus = SysRoleVo['status']

interface RoleForm {
  roleId: string
  roleName: string
  roleKey: string
  status: RoleStatus
}

const loading = ref(false)
const rows = ref<SysRoleVo[]>([])
const total = ref(0)
const query = reactive<PageQuery>({
  pageNum: 1,
  pageSize: 10,
})

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('add')
const formRef = ref<FormInstance>()
const form = reactive<RoleForm>({
  roleId: '',
  roleName: '',
  roleKey: '',
  status: '0',
})
const assignMenuDialogVisible = ref(false)
const assignMenuLoading = ref(false)
const assignMenuSubmitting = ref(false)
const assignMenuReady = ref(false)
const assignRoleId = ref('')
const assignRoleName = ref('')
const menuTreeRef = ref<TreeInstance>()
const menuTreeData = ref<SysMenuVo[]>([])

const dialogTitle = computed(() => (dialogMode.value === 'add' ? '新增角色' : '编辑角色'))
const assignMenuTitle = computed(() => `分配菜单 - ${assignRoleName.value}`)
const menuTreeProps = {
  label: 'menuName',
  children: 'children',
}

const rules: FormRules<RoleForm> = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleKey: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
}

const resetFormModel = () => {
  form.roleId = ''
  form.roleName = ''
  form.roleKey = ''
  form.status = '0'
  formRef.value?.clearValidate()
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await listRole(query)
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

const openEditDialog = (row: SysRoleVo) => {
  dialogMode.value = 'edit'
  resetFormModel()
  form.roleId = row.roleId
  form.roleName = row.roleName
  form.roleKey = row.roleKey
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
    const dto: SysRoleAddDto = {
      roleName: form.roleName,
      roleKey: form.roleKey,
      status: form.status,
    }
    await addRole(dto)
    ElMessage.success('新增成功')
  } else {
    const dto: SysRoleEditDto = {
      roleId: form.roleId,
      roleName: form.roleName,
      roleKey: form.roleKey,
      status: form.status,
    }
    await updateRole(dto)
    ElMessage.success('修改成功')
  }

  dialogVisible.value = false
  await loadList()
}

const handleDelete = async (row: SysRoleVo) => {
  try {
    await ElMessageBox.confirm(`确认删除角色“${row.roleName}”？`, '系统提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteRole(row.roleId)
    ElMessage.success('删除成功')
    await loadList()
  } catch {
    // 取消删除是用户的正常选择，不需要提示失败，避免把业务取消误当异常展示。
  }
}

const normalizeMenuTree = (menus: SysMenuVo[]): SysMenuVo[] => {
  return menus.map((menu) => ({
    ...menu,
    menuId: String(menu.menuId),
    parentId: String(menu.parentId),
    children: menu.children?.length ? normalizeMenuTree(menu.children) : menu.children,
  }))
}

const resetAssignMenuModel = () => {
  assignRoleId.value = ''
  assignRoleName.value = ''
  menuTreeData.value = []
  assignMenuReady.value = false
  menuTreeRef.value?.setCheckedKeys([])
}

const openAssignMenuDialog = async (row: SysRoleVo) => {
  resetAssignMenuModel()
  assignRoleId.value = row.roleId
  assignRoleName.value = row.roleName
  assignMenuDialogVisible.value = true
  assignMenuLoading.value = true

  try {
    const [menus, currentMenuIds] = await Promise.all([listMenu(), getRoleMenuIds(row.roleId)])
    menuTreeData.value = normalizeMenuTree(menus)
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(currentMenuIds.map((menuId) => String(menuId)))
    assignMenuReady.value = true
  } catch {
    // assignMenu 是覆盖提交，预加载失败时禁止提交，避免未预勾选导致误清空角色菜单。
    menuTreeData.value = []
    assignMenuReady.value = false
  } finally {
    assignMenuLoading.value = false
  }
}

const handleAssignMenuSubmit = async () => {
  if (!assignMenuReady.value) return

  assignMenuSubmitting.value = true
  try {
    const checkedMenuIds =
      menuTreeRef.value?.getCheckedKeys(false).map((menuId) => String(menuId)) ?? []
    await assignRoleMenus(assignRoleId.value, checkedMenuIds)
    ElMessage.success('分配成功，菜单变更需重新登录后生效')
    assignMenuDialogVisible.value = false
  } finally {
    assignMenuSubmitting.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <section class="page">
    <div class="page__header">
      <h2 class="page__title">角色管理</h2>
      <el-button v-hasPermi="['system:role:add']" type="primary" @click="openAddDialog">
        新增角色
      </el-button>
    </div>

    <el-table v-loading="loading" :data="rows" row-key="roleId" class="page__table">
      <el-table-column prop="roleName" label="角色名称" min-width="140" />
      <el-table-column prop="roleKey" label="角色标识" min-width="160" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }: { row: SysRoleVo }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }: { row: SysRoleVo }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }: { row: SysRoleVo }">
          <el-button
            v-hasPermi="['system:role:assignMenu']"
            type="primary"
            link
            @click="openAssignMenuDialog(row)"
          >
            分配菜单
          </el-button>
          <el-button
            v-hasPermi="['system:role:edit']"
            type="primary"
            link
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['system:role:remove']"
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
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="请输入角色标识" />
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
      v-model="assignMenuDialogVisible"
      :title="assignMenuTitle"
      width="560px"
      @closed="resetAssignMenuModel"
    >
      <div v-loading="assignMenuLoading" class="menu-tree">
        <el-tree
          ref="menuTreeRef"
          :data="menuTreeData"
          node-key="menuId"
          show-checkbox
          check-strictly
          default-expand-all
          :props="menuTreeProps"
        />
      </div>
      <template #footer>
        <el-button @click="assignMenuDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="assignMenuSubmitting"
          :disabled="!assignMenuReady || assignMenuLoading"
          @click="handleAssignMenuSubmit"
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
}

.menu-tree {
  min-height: 240px;
  max-height: 420px;
  overflow: auto;
}
</style>
