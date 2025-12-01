# 众生名录 (NpcDirectoryPanel) - 功能与实现解析

“众生名录”是一个强大的UI面板，旨在为用户提供一个集中、高效的方式来浏览、搜索和管理在所有世界中出现过的NPC。

## 一、核心功能

1.  **三栏式布局**:
    *   **左栏 (世界列表)**: 默认隐藏，可通过左上角的“世界”按钮展开。它会显示所有包含NPC的世界的真实名称。
    *   **中栏 (NPC列表)**: 显示当前选中世界的所有NPC。支持按姓名进行实时搜索。
    *   **右栏 (NPC详情)**: 动态地、美观地展示当前选中NPC的所有详细信息。

2.  **动态数据加载**:
    *   面板在加载时，会异步地从世界书中解析所有世界的真实名称和地点信息，并将其缓存，以实现流畅的浏览体验。

3.  **关注系统**:
    *   在NPC列表的每个条目右侧，都有一个星形“关注”按钮。
    *   点击此按钮可以高亮标记某个NPC，方便用户快速找到他们关心的角色。
    *   关注列表会自动保存到浏览器的 `localStorage` 中，实现持久化。

4.  **精细化详情展示**:
    *   NPC的详情信息被拆分为多个子组件，以实现更美观、更具信息层级感的布局。
    *   `基础潜力` 和 `世界专属属性` 使用两列网格布局，清晰明了。
    *   `持有物品` 使用五列网格布局，直观地展示了NPC的背包。
    *   `人际关系` 默认只显示角色名和标签，点击后可展开，通过进度条来可视化地展示信赖、利益和情感轴。

## 二、核心实现逻辑

### 1. 数据服务 (`NpcService.ts`)

这是整个功能的数据中枢。

-   `initializeWorldAndLocationData()`: 这是一个核心的**异步函数**。它在应用启动时被调用，负责：
    1.  一次性获取所有世界书条目。
    2.  遍历并解析每一个条目，提取出**世界ID**和**世界名称**。
    3.  同时，它还会深入解析每个世界书条目中的 `内容.空间实体`，在内存中建立一个全局的、从**地点ID**到**地点名称**的映射缓存 (`locationNameCache`)。
-   `getLocationName(id)`: 一个**同步函数**，它从内存中的 `locationNameCache` 快速查找并返回地点名称。

### 2. UI 面板 (`NpcDirectoryPanel.vue`)

-   **数据获取**: 在 `onMounted` 钩子中，调用并 `await` `npcService.initializeWorldAndLocationData()`，获取包含ID和名称的世界列表。
-   **响应式更新**:
    -   `selectedWorldNpcs`: 这是一个**计算属性**。当用户在左栏点击不同的世界时，它会自动重新计算，调用 `npcService.getNpcsByWorld()` 来获取新世界对应的NPC列表。
    -   **动态地点名称**: 在 `selectedWorldNpcs` 计算属性的内部，它会遍历NPC列表，并为每个NPC对象动态添加一个 `locationName` 属性，其值是通过 `npcService.getLocationName()` 查询得到的。模板直接渲染这个 `locationName` 属性。
-   **搜索与关注**:
    -   搜索功能通过 `computed` 属性实现，对世界列表和NPC列表进行实时过滤。
    -   关注功能则由独立的 `FollowButton.vue` 和 `useFollowSystem.ts` Composable来管理，实现了逻辑的解耦和复用。

### 3. 子组件化 (`NpcDetailDisplay.vue` 及其他)

-   `NpcDetailDisplay.vue` 作为主容器，它会遍历NPC对象的所有属性。
-   根据属性的 `key`（例如 `基础潜力`、`持有物品`、`人际关系`），它会条件性地渲染不同的、专门为此属性定制的子组件 (`AttributeGrid.vue`, `InventoryGrid.vue`, `RelationsDisplay.vue`)，从而实现了高度灵活和可扩展的详情展示。