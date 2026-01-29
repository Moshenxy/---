# 天华信 (TianhuaChat) App

本目录包含“天华信”App的所有相关组件和视图。

## 结构

-   **`TianhuaChat.vue`**: App的根组件，负责管理主视图（消息、联系人、空间）和聊天视图之间的切换。
-   **/views**:
    -   `MessageView.vue`: “消息”主页面，显示最近的聊天会话列表。
    -   `ContactsView.vue`: “联系人”主页面，显示好友和群组列表。
    -   `MomentsView.vue`: “MX空间”主页面，显示好友动态。
    -   `ChatView.vue`: 聊天界面，用于显示和发送消息。

## 数据流

-   所有核心数据均来自全局的 `store`。
-   视图通过 `getters` 从 `store.worldState` 中派生出所需的数据（如好友列表、聊天记录）。
-   用户的交互操作通过 `actions` 触发，构建指令并发送给AI，再由AI返回更新后的世界状态。
