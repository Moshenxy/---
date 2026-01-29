# 世界日志与化身系统 V1

本系统旨在实现一个动态、非破坏性的世界设定管理流程。其核心是围绕一个名为“化身世界”的临时世界书条目，对轮回中的世界演化进行“沙箱”操作。

## 核心组件

-   **`[系统]世界生成及演化规则.txt`**: 定义了AI生成世界设定的新XML标签格式，如 `<主世界>`, `<新世界>`, `<化身世界>`。
-   **`lorebookService.ts`**: 系统的核心服务，负责所有与世界书的交互。
    -   `handleMainWorld`: 处理 `<主世界>` 标签，创建或更新一个常驻开启的“主世界”条目。
    -   `handleNewWorld`: 处理 `<新世界>` 标签，为每个新世界创建以其ID命名的、默认关闭的条目。
    -   `appendToEntry`: 向“世界日志”条目追加流水事件。
    -   `startAvatarSimulation`: 轮回开始时，将源世界设定复制到“化身世界”条目中，并激活它。
    -   `endAvatarSimulation`: 轮回结束时，将“化身世界”条目中的最新设定覆盖回源世界条目，然后清空并禁用“化身世界”。
-   **`actions.ts`**: 在 `processAiResponse` 方法中，解析AI响应中的XML标签，并调用 `lorebookService` 中对应的处理函数。

## 工作流程

1.  **开局**: AI生成 `<主世界>` 和多个 `<新世界>` 标签。`lorebookService` 据此创建好所有世界书条目的初始状态。
2.  **选择化身**: 玩家选择某个世界（如 `world_A`）进行轮回。UI（未实现）调用 `lorebookService.startAvatarSimulation('world_A')`。
3.  **数据迁移**: `startAvatarSimulation` 将 `world_A` 的内容复制到“化身世界”条目，并激活“化身世界”。
4.  **轮回中**: 玩家在化身世界中的所有行动，如果导致世界设定变化，AI会生成 `<化身世界>` 标签，由 `lorebookService.handleAvatarWorldUpdate` (待实现) 更新“化身世界”条目的内容。
5.  **轮回结束**: 玩家死亡或主动结束。UI（未实现）调用 `lorebookService.endAvatarSimulation()`。
6.  **数据回写**: `endAvatarSimulation` 将“化身世界”的最终内容写回 `world_A` 条目，并清空“化身世界”。

此系统确保了世界设定的持久化演进，同时隔离了不同轮回之间的影响。