# 人物志 (Character Annals) App

“人物志”是“天华校园”智能平板中的一个核心应用，旨在为玩家提供一个全面、可视化的人际关系和角色信息管理中心。

## 功能

- **角色列表**: 在左侧栏展示所有已解锁的角色，方便玩家快速切换查看。
- **详情展示**: 中间主区域展示选定角色的详细信息，包括核心属性、学业、技能、天赋、秘密和装备。
- **关系图谱**: 在“关系”标签页中，以当前选定角色为中心，通过 D3.js 动态生成一个力导向图，可视化地展示其所有的人际关系网络。
    - **交互性**:
        - **双击节点**: 切换到对应角色的详情页面。
        - **单击节点**: 在底部滑出“关系时间轴”，展示与该角色的关键互动事件。
        - **单击连线**: 在连线中点处，以气泡形式短暂显示当前角色对目标角色的“印象标签”。
- **关系时间轴**: 以列表形式，倒序展示当前角色与目标角色的所有“关系事件”，帮助玩家回顾关系发展历程。

## 组件结构

-   `CharacterAnnalsApp.vue`: 应用的根组件，管理整体布局（角色列表侧边栏、主内容区）和角色选择的状态。
-   `CharacterListView.vue`: 左侧的角色列表，负责渲染所有可查看的角色，并向上抛出角色选择事件。
-   `CharacterDetailView.vue`: 右侧的角色详情面板，包含标签页切换逻辑，并根据当前激活的标签页展示不同的信息面板。
-   `components/`: 存放“人物志”专用的子组件。
    -   `RelationshipGraph.vue`: 核心的关系图谱组件。使用 D3.js 渲染节点和连线，并处理所有图谱相关的交互逻辑（单击、双击等）。
    -   `RelationshipTimeline.vue`: 关系事件时间轴组件。以抽屉面板的形式，从底部滑出，展示格式化的事件列表。
-   `styles/`:
    -   `character-annals.scss`: “人物志”App的专属SCSS样式文件。

## 数据流

1.  `CharacterAnnalsApp.vue` 维护一个 `selectedCharacterId` 状态。
2.  `CharacterListView.vue` 中点击角色后，通过 `emit` 事件更新父组件的 `selectedCharacterId`。
3.  `CharacterAnnalsApp.vue` 将 `selectedCharacterId` 作为 `prop` 传递给 `CharacterDetailView.vue`。
4.  `CharacterDetailView.vue` 根据 `characterId` 从 Pinia `store` 的 `getters` 中获取该角色的所有详细信息并渲染。
5.  当用户切换到“关系”标签页时，`CharacterDetailView.vue` 会渲染 `RelationshipGraph.vue`，并将 `characterId` 继续作为 `prop` 传递下去。
6.  `RelationshipGraph.vue` 同样根据 `characterId` 从 `getters` 中获取构建图谱所需的关系数据，并进行渲染和交互处理。