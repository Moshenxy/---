# 轮回模拟器 - 前端界面

本项目是“轮回-诸天万界”世界观的前端UI实现，基于Vue 3、TypeScript和SCSS构建，旨在提供一个沉浸式、数据驱动的交互体验。

## 近期重要更新 (V8.0 - 布局系统重构)

1.  **【核心】布局引擎迁移**:
    *   **从 `dock-spawn-ts` 迁移至 `Golden Layout`**: 为了解决旧布局库的兼容性问题并提升稳定性，整个面板管理系统已重构，现在基于功能更强大、社区更活跃的 `golden-layout` 库。
    *   **重构 `DockManagerService.ts`**: 完全重写了该服务，以适配 `golden-layout` 的 API，包括面板的注册、创建、布局保存与恢复等核心功能。
    *   **增强布局持久化**: 优化了布局保存机制，现在可以更可靠地记录和恢复用户自定义的面板布局，即使在刷新页面后也能保持一致。

2.  **【功能】世界详情面板增强**:
    *   在 `WorldDetailsPanel.vue` 中新增了“**世界摘要**”标签页。
    *   该标签页会读取并展示名为“主世界摘要”的世界书条目内容，为玩家提供一个更宏观的世界概览。

## 近期重要更新 (V7.0 - 世界沙盘)

1.  **【核心】世界沙盘 (World Sandbox) 可视化**:
    *   **新增 `WorldSandboxPanel`**: 引入了一个全新的、基于 `D3.js` 的交互式星图，用于可视化世界中的“空间实体”及其层级关系。
    *   **核心服务**:
        *   `CoordinateService.ts`: 负责将世界书中的“相对坐标”（如 `方位: "['东北', 45]"`）解析为屏幕上的精确 `(x, y)` 坐标。
        *   `WorldMapParser.ts`: 为沙盘功能定制的、用于解析世界书 `自动化规则` 文本的非标准YAML解析器。
        *   `WorldMapLayoutService.ts`: 核心布局算法服务，使用力导向图模拟，根据实体间的“所属”关系和相对坐标，计算出最终的节点位置，确保了星图的动态性和可读性。
    *   **数据流**: `LorebookService` -> `WorldMapParser` -> `WorldMapLayoutService` -> `WorldMapView (D3.js)`，实现了从原始文本到可视化视图的完整数据转换与渲染。

## 项目结构

* **/components**: 存放Vue通用组件。
  * `TopStatusBar.vue`: 顶部状态栏，显示世界时间等核心信息。
  * `SideMenuButton.vue` & `RadialMenu.vue`: **轮盘菜单系统**。
  * `DockManager.vue`: 基于 `golden-layout` 的核心布局管理器。
  * `InputHistoryPopup.vue`: 输入历史记录组件。
  * `/panels`: 存放所有可停靠的功能面板组件。
    * `CharacterPanel.vue`: “命盘”形式的角色核心属性面板。
    * `InventoryPanel.vue`: 分类展示玩家的物品。
    * `SkillsPanel.vue`: 展示角色已掌握的“技艺”及其“技能”。
    * `ImprintsPanel.vue`: “九宫格”布局的轮回烙印面板。
    * `WorldDetailsPanel.vue`: **（增强）** 现在包含“纪元详情”和“世界摘要”两个标签页。
    * `ReincarnationPanel.vue`: 轮回操作的核心面板。
* **/core**: 包含项目核心加载与初始化逻辑。
* **/services**: 存放与后端和数据处理相关的服务。
  * `DockManagerService.ts`: **（重构）** 封装 `golden-layout` 的所有操作。
  * `usePanelManager.ts`: 集中管理所有面板的注册信息和开启逻辑。
  * `InputHistoryService.ts`: 负责管理输入框的历史记录。
  * `LorebookService.ts`: 提供读写世界书的接口。
  * `NpcService.ts`: 提供NPC数据的查询和处理服务。
* **/store**: 状态管理中心。
* **/styles**: 存放全局SCSS样式文件。
* **/types**: **核心类型定义中心**，使用 Zod 定义了整个应用的数据结构，并负责在运行时进行数据校验和转换。
* `app.vue`: 应用的根组件。
* `index.ts`: 项目主入口文件。
* `index.html`: UI的HTML入口。

## 开发规范

* **类型优先**: 所有核心数据结构都必须在 `/types` 目录中定义清晰的TypeScript接口。
* **逻辑分离**: 业务逻辑、数据获取和转换应尽可能放在 `store/actions.ts` 和 `store/getters.ts` 中。共享的UI逻辑（如面板管理）应抽象为Composable。
* **注释清晰**: 所有新添加的文件和复杂逻辑都应有清晰的JSDoc注释。
