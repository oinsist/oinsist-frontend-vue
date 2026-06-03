# oinsist-frontend-vue

> 一套**从零精炼重构**的企业级中后台前端，仿照 `RuoYi-Vue-Plus / plus-ui` 的架构思想，
> 但**拒绝过度封装**——直接用原生 Element Plus + Vue3 `<script setup>` 编写业务页，代码可读性优先。
> 核心是一套完整的 **RBAC 双层权限闭环**（菜单级动态路由 + 按钮级指令）+ 多租户隔离底座。

配套后端：`oinsist-backend`（Spring Boot 多模块 + Sa-Token + MyBatis-Plus + PostgreSQL + Redis）。

---

## 技术栈

| 维度 | 选型 |
|---|---|
| 框架 | Vue 3（`<script setup>` 组合式 API） |
| 构建 | Vite 5 |
| 语言 | TypeScript（严禁滥用 `any`，接口/响应均有 `interface`） |
| 状态 | Pinia（模块化：`user` / `permission`） |
| UI | Element Plus 2.14 |
| 路由 | Vue Router 4（history 模式 + 动态路由） |
| 请求 | Axios（统一拦截器，解包后端 `R<T>`） |

---

## 核心特性

- **登录认证闭环**：Sa-Token token 全链路（登录存 token → 拦截器注入 → 401 集中收敛 → 登出清态）。
- **菜单级权限（动态路由）**：登录后消费后端 `/auth/routers`，把"当前账号有权限的菜单树"动态 `addRoute` 注册成路由并渲染侧边栏——无权限的页面侧边栏不出现、地址也进不去。
- **按钮级权限（指令）**：`v-hasPermi` / `v-hasRole` 按权限标识控制页面内按钮的显示/移除，超管 `*:*:*` / `admin` 放行。
- **RBAC 三件套**：用户 / 角色 / 菜单管理，以及「给用户分配角色」「给角色分配菜单」两个关联维护。
- **审计**：操作日志（AOP 自动采集）+ 登录日志，支持查询与批量删除。
- **多租户底座**：后端按 `tenant_id` 行级隔离（前端当前固定单租户运行）。
- **工程化**：Vite 分包（element-plus / vue-vendor 独立缓存）、零构建告警、统一时间格式化、history 部署支持。

---

## 权限闭环原理（理解本项目的钥匙）

```
菜单管理  定义"系统有哪些页面/权限"        （源头数据 sys_menu）
   │ 给角色分配菜单（写 sys_role_menu）
   ▼
角色管理  把权限打包成"身份"
   │ 给用户分配角色（写 sys_user_role）
   ▼
用户管理  把身份发给"人"
   │ 登录
   ▼
该用户 → 后端算出【菜单树 + 权限集】→ 前端：
            ├─ 动态路由 dynamicRoutes  → 决定【侧边栏能看哪些页面】（菜单级）
            └─ v-hasPermi 指令          → 决定【页面内能点哪些按钮】（按钮级）
   │ 操作
   ▼
增删改 → 自动写操作日志；登录 → 自动写登录日志（审计留痕）
```

> 一句话：**「人 ← 身份 ← 权限」三层用两张关联表串起来；登录时后端算出可见范围，前端用"动态路由"管页面、"v-hasPermi"管按钮。**

---

## 目录结构

```
src/
├── api/                      # 接口层（与后端 Controller 一一对应）
│   ├── auth.ts               #   登录/登出/用户信息/动态路由
│   ├── menu.ts               #   /auth/routers
│   └── system/               #   业务模块：user / role / menu / operLog / loginLog
├── directives/               # 自定义指令：hasPermi / hasRole
├── layout/
│   ├── index.vue             # 主框架（顶栏 + 侧边栏 + 内容区）
│   └── components/Sidebar/   # 递归菜单树
├── router/index.ts           # 路由实例 + 常量路由 + resetRouter()
├── permission.ts             # 全局路由守卫（鉴权 + 动态路由注入）
├── store/modules/
│   ├── user.ts               # token / 用户信息 / 角色 / 权限
│   └── permission.ts         # 动态路由 + 菜单树
├── types/                    # TS 类型（request / auth / router / common / system/*）
├── utils/
│   ├── request.ts            # Axios 封装（拦截器 / R<T> 解包 / 401 收敛）
│   ├── dynamicRoutes.ts      # 后端菜单树 → Vue 路由 转换器
│   ├── menuIcon.ts           # RuoYi 图标名 → Element Plus 图标 映射
│   ├── formatTime.ts         # 时间格式化
│   └── errorCode.ts          # HTTP 状态码中文文案
└── views/
    ├── login/ index/ error/  # 登录 / 首页 / 404
    └── system/               # user / role / menu / operlog / loginlog
```

---

## 快速开始

```bash
pnpm install        # 安装依赖（Node >= 18）
pnpm dev            # 启动开发服务器（默认 http://localhost:5173）
pnpm build          # 类型检查 + 生产构建
pnpm preview        # 预览构建产物
pnpm type-check     # 仅类型检查
pnpm lint           # ESLint 修复
pnpm format         # Prettier 格式化
```

默认账号：`admin / admin123`（需后端 `oinsist-backend` 与 PostgreSQL/Redis 已启动）。

---

## 后端对齐约定

- **接口前缀 / 代理**：开发环境 `VITE_APP_BASE_API=/dev-api`，`vite.config.ts` 把 `/dev-api` 代理到后端 `http://localhost:8080` 并去除前缀。
- **统一响应**：后端返回 `R<T> = { code, msg, data }`，`code===200` 为成功；拦截器自动**解包为 `data`**，业务侧直接拿 `T`。
- **鉴权头**：请求拦截器注入 `Authorization: <token>`（**裸 token，无 `Bearer` 前缀**，对齐后端 Sa-Token `token-prefix` 未启用）；另注入 `Tenant-Id`（当前后端从会话派生租户，此头为多租户演进预留）。
- **雪花 ID**：后端主键为雪花算法 Long（19 位），后端已配置「超出 JS 安全整数则序列化为字符串」；**前端所有 ID 字段一律用 `string` 透传**，仅作 key 与路径参数，不做数值运算。

---

## 部署注意

本项目使用 Vue Router history 路由模式。部署到 nginx 时，深链刷新需要回退到
`index.html`，否则直接刷新 `/system/user`、`/system/menu` 等前端路由会返回 404。

最小 nginx 配置示例：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 功能模块

| 模块 | 路径 | 能力 |
|---|---|---|
| 登录 | `/login` | 账号密码登录，token 持久化 |
| 首页 | `/` | 框架首页占位 |
| 用户管理 | `/system/user` | 列表/新增/编辑/删除 + 分配角色 |
| 角色管理 | `/system/role` | 列表/新增/编辑/删除 + 分配菜单 |
| 菜单管理 | `/system/menu` | 树形 CRUD（目录 M / 菜单 C / 按钮 F） |
| 操作日志 | `/system/operlog` | 列表 + 详情 + 批量/单行删除 |
| 登录日志 | `/system/loginlog` | 列表 + 批量/单行删除 |

---

## 设计原则

1. **精炼优先**：用原生 `el-table` / `el-dialog` / `el-form` 直接写业务页，不做二、三层组件深度封装。
2. **类型安全**：全量 TypeScript，接口契约与后端严格对齐。
3. **可教导性**：底层配置（请求拦截器、路由守卫、权限指令、动态路由转换器）均含「为什么这样设计」的中文注释。
