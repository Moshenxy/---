# 天华百货 (MallApp) App 参考文档

本文档详细说明了“天华百货”App的功能、代码结构、数据流和开发计划，为后续的开发和维护提供清晰的指引。

## 1. 功能总览

天华百货是游戏内的电子商务平台，旨在建立玩家核心资源（金钱、物品）的消耗与获取循环。

-   **已实现功能**:
    -   提供一个多标签页（主页、购物车、我的）的购物界面框架。
-   **计划中功能** (参考 [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md)):
    -   从世界书加载并以现代网购风格展示所有可购买的商品。
    -   提供分类筛选和搜索功能。
    -   实现商品详情页。
    -   实现完整的购买、支付和订单处理流程。
    -   提供清晰的UI反馈（如Toastr提示）。

## 2. 视图组件结构

-   **主容器**: [`MallApp.vue`](../views/apps/mall/MallApp.vue)
    -   作为顶层容器，通过 [`TabBar.vue`](../components/mall/TabBar.vue) 组件在三个核心视图间切换。
-   **核心子视图**:
    -   `MallHomeView.vue`: 商城主页，计划用于展示商品列表。
    -   `CartView.vue`: 购物车页面。
    -   `MyMallView.vue`: “我的”页面，用于展示订单、个人信息等。
-   **待开发组件**:
    -   `ProductCard.vue`: 用于展示单个商品的卡片组件。
    -   `CategoryNav.vue`: 用于实现商品分类导航的组件。

## 3. 核心数据流

### 3.1. 数据来源

-   **商品数据**: 所有商品信息完全来源于世界书条目 **`[世界观]商品列表.txt`**。该文件定义了每个商品的ID、名称、价格、分类、库存、描述、效果等所有属性。
-   **解析服务**: 需要一个专门的 `ProductService.ts` (已在 `index.ts` 中引入但尚未查看其实现) 来在前端启动时解析 `[世界观]商品列表.txt`，并将结构化的商品数据存入 `store` 中，供UI组件使用。

### 3.2. 数据更新 (购买流程)

根据设计，一个完整的购买流程应如下：

1.  **用户操作**: 用户在 `MallHomeView` 将商品添加入 `store.cartItems`，并在 `CartView` 点击“结算”。
2.  **触发Action**: “结算”按钮调用 `store/actions.ts` 中的 `checkout` 方法。
3.  **构建指令**: `checkout` 方法计算总价，检查余额，然后构建一个格式化的 `[购物]` 指令字符串，例如：`[购物] 购买了 学生A套餐x1, 能量饮料x2，总价 450`。
4.  **提交指令**: 该指令通过 `actions.handleAction` 发送给AI。
5.  **AI处理与变量更新**: AI接收到指令后，根据 `[系统]AI思考链-校园版.txt` 的规则，在其返回的 `<UpdateVariable>` 块中执行以下操作：
    -   使用 `_.add('角色.{{user}}.金钱', -450);` 扣除玩家金钱。
    -   使用 `_.assign('角色.{{user}}.待收货订单', ...)` 将购买的每个商品作为一个包含送货时间的对象，添加到待收货订单数组中。
6.  **库存更新**: `actions.handleAction` 函数在确认购买成功后，会调用 `lorebookService.updateStock` 方法，更新 `[世界观]商品列表.txt` 中对应商品的库存数量。
7.  **状态刷新**: 前端获取到AI返回的更新后的数据，刷新UI，完成闭环。

## 4. 相关文件

-   **开发计划**:
    -   `src/campus-card-vue/DEVELOPMENT_PLAN.md`
-   **前端Vue组件**:
    -   `src/campus-card-vue/views/apps/mall/MallApp.vue` (及 `mall/` 目录下的其他视图和组件)
-   **状态管理**:
    -   `src/campus-card-vue/store/actions.ts` (特别是 `addToCart` 和 `checkout` 方法)
-   **服务模块**:
    -   `src/campus-card-vue/services/ProductService.ts` (负责解析商品列表)
    -   `src/campus-card-vue/services/LorebookService.ts` (负责更新库存)
-   **世界书**:
    -   `src/天华校园世界书/[世界观]商品列表.txt`