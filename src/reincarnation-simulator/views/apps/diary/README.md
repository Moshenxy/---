# 日记 (Diary) 应用模块

本模块实现了“天华校园”智能平板中的“日记”应用，其核心功能是作为游戏过程的记忆和叙事系统，设计灵感来源于《归墟》的分段记忆和大小总结系统。

## 核心功能

1.  **三层记忆模型**:
    *   **分段正文 (近期回忆)**: 展示最近 `X` 条的详细游戏日志 (`校园日志-主`)，让玩家可以回顾近期发生的具体事件。
    *   **小总结 (中期提要)**: 对紧接着的 `Y` 条日志进行AI概括，提炼出关键事件、人物和情感转折。
    *   **大总结 (往事概览)**: 对更早的所有历史日志进行宏观总结，形成角色的背景故事和主要人生轨迹。

2.  **AI智能总结**:
    *   用户可以手动或自动触发AI，为中远期记忆生成“小总结”和“大总结”。
    *   Prompt经过精心设计，以确保AI能准确把握总结的重点。

3.  **反向数据流**:
    *   本模块最核心的创新之一。用户可以编辑AI生成的总结。
    *   当用户保存编辑后的总结时，系统会调用AI，智能地分析修改内容，并将这些事实性变更**反向更新**到最原始的`校园日志-主`条目中，从而实现记忆的闭环和自我修正。

4.  **自动化**:
    *   提供“自动更新总结”的选项。开启后，系统会通过轮询服务 (`diaryPollingService`) 在后台定期、静默地为玩家生成和保存最新的日记总结。

## 文件结构

*   `DiaryApp.vue`: 应用的主入口和布局容器。
*   `DiaryTimeline.vue`: 负责渲染“分段正文”的时间线组件。
*   `SummaryPanel.vue`: 展示“小总结”和“大总结”的面板，并提供生成、编辑、保存等操作的入口。
*   `SummaryEditorModal.vue`: 一个模态框组件，用于编辑总结内容，是“反向数据流”的起点。
*   `diary.scss`: 本应用的专属SCSS样式文件。
*   `diaryService.ts`: 核心服务，封装了所有与AI交互的逻辑，包括生成总结和反向更新日志。
*   `diaryPollingService.ts`: 轮询服务，负责实现总结的自动化更新。

## 数据流

1.  **正向流程**:
    *   `actions.fetchDiaryEntries` 从 `校园日志-主` 读取数据。
    *   数据被分割成 X, Y, Z 三部分，并存入 `store.diary`。
    *   `DiaryTimeline` 渲染 X 部分。
    *   用户点击生成 -> `actions.generateDiarySummary` -> `diaryService.generateSummary` -> AI返回总结 -> 更新 `store.diary.smallSummary/largeSummary` -> `SummaryPanel` 显示总结。
    *   用户点击保存 -> `actions.saveDiarySummaries` -> 写入 `日记总结-小-主` / `日记总结-大-主`。

2.  **反向流程**:
    *   用户点击编辑 -> `SummaryEditorModal` 弹出。
    *   用户保存编辑 -> `handleSaveFromEditor` 触发 `actions.updateLogFromSummary`。
    *   `actions.updateLogFromSummary` -> `diaryService.updateLogFromSummary` -> AI返回MVU指令 -> `invokeMvuScript` 执行指令，修改 `校园日志-主`。
    *   `actions.fetchDiaryEntries` 被再次调用，刷新整个数据流。