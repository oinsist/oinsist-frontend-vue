<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { addMenu, deleteMenu, listMenu, updateMenu } from '@/api/system/menu'
import { resolveMenuIcon } from '@/utils/menuIcon'
import type {
  SysMenuAddDto,
  SysMenuEditDto,
  SysMenuStatus,
  SysMenuType,
  SysMenuVisible,
  SysMenuVo,
} from '@/types/system/menu'

defineOptions({
  name: 'SystemMenu',
})

type DialogMode = 'add' | 'edit'
type OptionalVisible = SysMenuVisible | ''
type OptionalStatus = SysMenuStatus | ''

interface MenuForm {
  menuId: string
  menuName: string
  parentId: string
  orderNum?: number
  path: string
  component: string
  perms: string
  menuType: SysMenuType
  visible: OptionalVisible
  status: OptionalStatus
  icon: string
}

interface MenuTreeSelectNode {
  label: string
  value: string
  children?: MenuTreeSelectNode[]
}

const loading = ref(false)
const menuTree = ref<SysMenuVo[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('add')
const formRef = ref<FormInstance>()
const form = reactive<MenuForm>({
  menuId: '',
  menuName: '',
  parentId: '0',
  orderNum: 0,
  path: '',
  component: '',
  perms: '',
  menuType: 'M',
  visible: '0',
  status: '0',
  icon: '',
})

const dialogTitle = computed(() => (dialogMode.value === 'add' ? '新增菜单' : '编辑菜单'))
const showRouteFields = computed(() => form.menuType === 'M' || form.menuType === 'C')
const showPermissionField = computed(() => form.menuType === 'C' || form.menuType === 'F')
const showComponentField = computed(() => form.menuType === 'C')

const treeSelectProps = {
  label: 'label',
  value: 'value',
  children: 'children',
}

const rules: FormRules<MenuForm> = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
}

const buildTreeSelectNodes = (menus: SysMenuVo[], excludedMenuId = ''): MenuTreeSelectNode[] => {
  return menus.flatMap((menu) => {
    if (excludedMenuId && String(menu.menuId) === excludedMenuId) return []

    const node: MenuTreeSelectNode = {
      label: menu.menuName,
      value: String(menu.menuId),
    }
    if (menu.children?.length) {
      node.children = buildTreeSelectNodes(menu.children, excludedMenuId)
    }
    return [node]
  })
}

const excludedParentMenuId = computed(() => {
  return dialogMode.value === 'edit' ? form.menuId : ''
})

const menuTreeOptions = computed<MenuTreeSelectNode[]>(() => [
  {
    label: '顶级',
    value: '0',
    children: buildTreeSelectNodes(menuTree.value, excludedParentMenuId.value),
  },
])

const resetFormModel = () => {
  form.menuId = ''
  form.menuName = ''
  form.parentId = '0'
  form.orderNum = 0
  form.path = ''
  form.component = ''
  form.perms = ''
  form.menuType = 'M'
  form.visible = '0'
  form.status = '0'
  form.icon = ''
  formRef.value?.clearValidate()
}

const cleanFieldsByMenuType = () => {
  if (form.menuType === 'M') {
    form.component = ''
    form.perms = ''
    if (!form.visible) form.visible = '0'
    if (!form.status) form.status = '0'
    return
  }

  if (form.menuType === 'C') {
    if (!form.visible) form.visible = '0'
    if (!form.status) form.status = '0'
    return
  }

  // 按钮只承担权限标识，不参与路由和侧栏展示；清空隐藏字段，避免编辑菜单后切换类型时提交残留值。
  form.path = ''
  form.component = ''
  form.icon = ''
  form.visible = ''
  form.status = ''
}

watch(
  () => form.menuType,
  () => {
    cleanFieldsByMenuType()
  },
)

const loadList = async () => {
  loading.value = true
  try {
    menuTree.value = await listMenu()
  } catch {
    // request 拦截器已经负责错误提示；这里仅保证树表加载失败时页面状态可恢复。
    menuTree.value = []
  } finally {
    loading.value = false
  }
}

const openAddDialog = (parentId = '0') => {
  dialogMode.value = 'add'
  resetFormModel()
  form.parentId = parentId
  dialogVisible.value = true
}

const openEditDialog = (row: SysMenuVo) => {
  dialogMode.value = 'edit'
  resetFormModel()
  form.menuId = row.menuId
  form.menuName = row.menuName
  form.parentId = String(row.parentId)
  form.orderNum = row.orderNum
  form.path = row.path ?? ''
  form.component = row.component ?? ''
  form.perms = row.perms ?? ''
  form.menuType = row.menuType
  form.visible = row.visible ?? '0'
  form.status = row.status ?? '0'
  form.icon = row.icon ?? ''
  cleanFieldsByMenuType()
  dialogVisible.value = true
}

const normalizeText = (value: string) => value.trim()

const buildSubmitPayload = (): SysMenuAddDto => {
  const base: SysMenuAddDto = {
    menuName: normalizeText(form.menuName),
    parentId: form.parentId || '0',
    orderNum: form.orderNum,
    menuType: form.menuType,
  }

  if (form.menuType === 'M') {
    return {
      ...base,
      path: normalizeText(form.path),
      visible: form.visible || '0',
      status: form.status || '0',
      icon: normalizeText(form.icon),
    }
  }

  if (form.menuType === 'C') {
    return {
      ...base,
      path: normalizeText(form.path),
      component: normalizeText(form.component),
      perms: normalizeText(form.perms),
      visible: form.visible || '0',
      status: form.status || '0',
      icon: normalizeText(form.icon),
    }
  }

  return {
    ...base,
    perms: normalizeText(form.perms),
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  cleanFieldsByMenuType()

  if (dialogMode.value === 'add') {
    await addMenu(buildSubmitPayload())
    ElMessage.success('新增成功，菜单变更需重新登录后生效')
  } else {
    const dto: SysMenuEditDto = {
      menuId: form.menuId,
      ...buildSubmitPayload(),
    }
    await updateMenu(dto)
    ElMessage.success('修改成功，菜单变更需重新登录后生效')
  }

  dialogVisible.value = false
  await loadList()
}

const handleDelete = async (row: SysMenuVo) => {
  try {
    await ElMessageBox.confirm(`确认删除菜单“${row.menuName}”？`, '系统提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteMenu(row.menuId)
    ElMessage.success('删除成功，菜单变更需重新登录后生效')
    await loadList()
  } catch {
    // 取消删除是用户的正常选择；后端拒绝删除含子节点菜单时，request 拦截器会展示业务错误。
  }
}

const menuTypeText = (menuType: SysMenuType) => {
  const map: Record<SysMenuType, string> = {
    M: '目录',
    C: '菜单',
    F: '按钮',
  }
  return map[menuType]
}

const menuTypeTagType = (menuType: SysMenuType) => {
  const map: Record<SysMenuType, 'primary' | 'success' | 'info'> = {
    M: 'primary',
    C: 'success',
    F: 'info',
  }
  return map[menuType]
}

const menuStatusText = (status?: SysMenuStatus) => {
  if (!status) return '-'
  return status === '0' ? '正常' : '停用'
}

const menuStatusTagType = (status?: SysMenuStatus) => {
  if (!status) return 'info'
  return status === '0' ? 'success' : 'danger'
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <section class="page">
    <div class="page__header">
      <h2 class="page__title">菜单管理</h2>
      <el-button v-hasPermi="['system:menu:add']" type="primary" @click="openAddDialog('0')">
        新增菜单
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="menuTree"
      row-key="menuId"
      :tree-props="{ children: 'children' }"
      default-expand-all
      class="page__table"
    >
      <el-table-column label="菜单名称" min-width="180">
        <template #default="{ row }: { row: SysMenuVo }">
          <span class="menu-name">
            <el-icon class="menu-name__icon">
              <component :is="resolveMenuIcon(row.icon)" />
            </el-icon>
            <span>{{ row.menuName }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90">
        <template #default="{ row }: { row: SysMenuVo }">
          <el-tag :type="menuTypeTagType(row.menuType)">
            {{ menuTypeText(row.menuType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" label="排序" width="90" />
      <el-table-column prop="perms" label="权限标识" min-width="180" show-overflow-tooltip />
      <el-table-column label="路由/组件" min-width="220" show-overflow-tooltip>
        <template #default="{ row }: { row: SysMenuVo }">
          <div class="route-cell">
            <span>{{ row.path || '-' }}</span>
            <span>{{ row.component || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }: { row: SysMenuVo }">
          <el-tag :type="menuStatusTagType(row.status)">
            {{ menuStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }: { row: SysMenuVo }">
          <el-button
            v-hasPermi="['system:menu:add']"
            type="primary"
            link
            @click="openAddDialog(row.menuId)"
          >
            新增子菜单
          </el-button>
          <el-button
            v-hasPermi="['system:menu:edit']"
            type="primary"
            link
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['system:menu:remove']"
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" @closed="resetFormModel">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">目录</el-radio>
            <el-radio value="C">菜单</el-radio>
            <el-radio value="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="menuTreeOptions"
            :props="treeSelectProps"
            node-key="value"
            check-strictly
            default-expand-all
            placeholder="请选择上级菜单"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number
            v-model="form.orderNum"
            :min="0"
            :step="1"
            controls-position="right"
            placeholder="请输入显示排序"
          />
        </el-form-item>
        <el-form-item v-if="showRouteFields" label="路由地址" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item v-if="showComponentField" label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item v-if="showPermissionField" label="权限标识" prop="perms">
          <el-input v-model="form.perms" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item v-if="showRouteFields" label="菜单图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标名，如 user/system" />
        </el-form-item>
        <el-form-item v-if="showRouteFields" label="显示状态" prop="visible">
          <el-radio-group v-model="form.visible">
            <el-radio value="0">显示</el-radio>
            <el-radio value="1">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="showRouteFields" label="菜单状态" prop="status">
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
}

.menu-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &__icon {
    color: #606266;
  }
}

.route-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;
}
</style>
