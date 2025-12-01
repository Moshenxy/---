<template>
  <div class="world-vision-page">
    <WorldVisionInput
      v-if="!displayState.showCustomItems && store.generatedPlans.length === 0"
      @submit="handleSubmit"
    />
    <div v-else-if="displayState.showCustomItems" class="custom-items-display">
      <h3>天衍的新构想</h3>
      <div v-for="(items, category) in customItemsToShow" :key="category" class="category-section">
        <h4>{{ category }}</h4>
        <ul>
          <li v-for="item in items" :key="item.id">
            <strong contenteditable="true" @blur="e => updateItem(item, 'name', e)">{{ item.name }}</strong>:
            <span contenteditable="true" @blur="e => updateItem(item, 'desc', e)">{{ item.desc }}</span>
          </li>
        </ul>
      </div>
      <button @click="backToPlanSelection">返回方案选择</button>
    </div>
    <OptionPlanDisplay
      v-else
      :plans="store.generatedPlans"
      @select="handleSelect"
      @show-details="displayState.showCustomItems = true"
    />
    <button v-if="store.generatedPlans.length > 0" @click="handleReset" class="reset-button">重新构想</button>
  </div>
</template>

<script setup lang="ts">
import toastr from 'toastr';
import { onMounted, reactive, ref } from 'vue';
import * as PresetService from '../services/PresetService';
import { clearTemporaryPlans, loadTemporaryPlans, saveTemporaryPlans } from '../services/TemporaryPlanService';
import * as WorldEvolutionService from '../services/WorldEvolutionService';
import { addCustomItem, store } from '../store';
import OptionPlanDisplay from './OptionPlanDisplay.vue';
import WorldVisionInput from './WorldVisionInput.vue';

interface Plan {
  title: string;
  selections: any;
  [key: string]: any;
}

interface CustomItem {
  id: string;
  name: string;
  desc: string;
  [key: string]: any;
}

const displayState = reactive({
  showCustomItems: false,
});
const customItemsToShow = ref<{ [key: string]: CustomItem[] }>({});

const updateItem = (item: CustomItem, field: 'name' | 'desc', event: Event) => {
  const target = event.target as HTMLElement;
  if (target) {
    item[field] = target.innerText;
  }
};

const extractAndShowCustomItems = (plans: Plan[]) => {
  const customItems: { [key: string]: any[] } = {};
  const keyMapping: { [key: string]: string } = {
    blueprint: '宇宙蓝图',
    tone: '文明基调',
    tags: '衰落之因',
    relics: '文明遗迹',
    identity: '天命身份',
    talents: '天赋异禀',
    past_experiences: '过去经历',
    character_traits: '性格特质',
    core_need: '核心需求',
    arts: '技艺',
    backpack: '开局物品',
  };

  plans.forEach(plan => {
    if (!plan.selections) return;
    for (const key in plan.selections) {
      const categoryName = keyMapping[key];
      if (!categoryName) continue;

      if (!customItems[categoryName]) {
        customItems[categoryName] = [];
      }

      const selectionValue = plan.selections[key];
      const items = Array.isArray(selectionValue) ? selectionValue : [selectionValue];

      items.forEach((item: any) => {
        if (item && item.custom && !customItems[categoryName].some(existing => existing.id === item.id)) {
          customItems[categoryName].push(item);
        }
      });
    }
  });

  customItemsToShow.value = customItems;
  displayState.showCustomItems = true;
};

const backToPlanSelection = () => {
  displayState.showCustomItems = false;
};

async function handleSubmit(visionText: string) {
  store.worldVisionInput = visionText;
  try {
    const response = await WorldEvolutionService.generateEvolutionPlans(visionText);
    console.log('天衍原始回复:', response);
    if (response) {
      const plans = WorldEvolutionService.extractEvolutionPlans(response);
      if (plans && plans.length > 0) {
        store.generatedPlans = plans;
        saveTemporaryPlans(plans);
        extractAndShowCustomItems(plans);
      } else {
        toastr.warning('天衍未能给出有效的演化方案，她似乎对你的构想不太满意。');
      }
    }
  } catch (error) {
    console.error('handleSubmit中的未知错误:', error);
  }
}

const handleSelect = (plan: Plan) => {
  const presetName = prompt('请输入新方案的名称：', plan.title || 'AI生成方案');
  if (!presetName || !presetName.trim()) {
    toastr.info('已取消保存方案。');
    // 注意：这里不清除，因为用户可能只是想取消本次命名，而不是放弃整个方案
    return;
  }

  if (!plan.selections) {
    toastr.error('方案数据结构不完整，缺少 "selections" 字段。');
    return;
  }

  const { selections } = plan;

  // 1. 临时备份当前store状态
  const originalSelections = JSON.parse(JSON.stringify(store.selections));
  const originalPotentials = JSON.parse(JSON.stringify(store.potentialPoints));

  try {
    // 2. 将AI生成的自定义选项动态添加到GAME_DATA
    for (const key in selections) {
      const selectionValue = selections[key];
      const items = Array.isArray(selectionValue) ? selectionValue : [selectionValue];

      items.forEach((item: any) => {
        if (item && item.custom) {
          if (key === 'backpack') {
            // 对于背包物品，我们假设它们已经是完整的项目定义
            // 并且直接添加到 GAME_DATA 中
            const itemCategory = item.type || 'consumables'; // 如果没有type，默认为消耗品
            addCustomItem(itemCategory, item);
          } else {
            // 对于其他自定义选项
            const pluralMap: { [key: string]: string } = {
              blueprint: 'blueprints',
              tone: 'tones',
              identity: 'identities',
              tags: 'tags',
              relics: 'relics',
              talents: 'talents',
              past_experiences: 'past_experiences',
              arts: 'arts',
              character_traits: 'character_traits',
              core_need: 'core_needs',
            };
            const category = pluralMap[key as keyof typeof pluralMap] || key;
            if (category) {
              addCustomItem(category as any, item);
            }
          }
        }
      });
    }

    // 3. 将AI生成的方案应用到store
    store.selections.blueprint = selections.blueprint?.id || '';
    store.selections.tone = selections.tone?.id || '';
    store.selections.tags = selections.tags?.map((t: any) => t.id) || [];
    store.selections.relics = selections.relics?.map((r: any) => r.id) || [];
    store.selections.identity = selections.identity?.id || '';
    store.selections.talents = selections.talents?.map((t: any) => t.id) || [];
    store.selections.past_experiences = selections.past_experiences?.map((p: any) => p.id) || [];
    store.selections.character_traits = selections.character_traits?.map((c: any) => c.id) || [];
    store.selections.core_need = selections.core_need?.id || '';
    store.selections.arts = selections.arts?.map((a: any) => a.id) || [];
    store.selections.backpack = {}; // 清空背包
    if (selections.backpack) {
      selections.backpack.forEach((item: any) => {
        store.selections.backpack[item.id] = 1;
      });
    }

    // 4. 调用保存，此时PresetService会读取到我们刚刚设置好的store
    PresetService.savePreset(presetName.trim());
  } catch (e) {
    toastr.error('保存方案时出错，请检查控制台。');
    console.error(e);
  } finally {
    // 5. 无论如何都恢复store的原始状态
    Object.assign(store.selections, originalSelections);
    Object.assign(store.potentialPoints, originalPotentials);
  }

  // 6. 重置界面
  store.generatedPlans = [];
  clearTemporaryPlans();
  // 清除由AI动态添加的自定义选项，避免污染下一次生成
  // （这里需要一个更完善的逻辑来只移除本次添加的项，暂时简化处理）
};

const handleReset = () => {
  if (confirm('确定要放弃当前方案并重新构想吗？所有未保存的自定义选项将丢失。')) {
    store.generatedPlans = [];
    clearTemporaryPlans();
    displayState.showCustomItems = false;
  }
};

onMounted(() => {
  const loadedPlans = loadTemporaryPlans();
  if (loadedPlans && loadedPlans.length > 0) {
    store.generatedPlans = loadedPlans;
    extractAndShowCustomItems(loadedPlans);
  }
});
</script>

<style lang="scss" scoped>
.world-vision-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.custom-items-display {
  background: rgba(10, 20, 40, 0.85);
  border: 1px solid rgba(180, 160, 120, 0.4);
  backdrop-filter: blur(8px);
  padding: 2rem;
  border-radius: 12px;
  color: #e0e0e0;
  max-height: 85%;
  width: 70%;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);

  h3 {
    color: #f5e8c8;
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }

  h4 {
    color: #d0b888;
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
    border-bottom: 1px solid rgba(180, 160, 120, 0.2);
    padding-bottom: 0.5rem;
  }

  ul {
    list-style: none;
    padding-left: 0;
  }

  li {
    margin-bottom: 0.7rem;
    line-height: 1.6;
    strong {
      color: #c8aa7a;
      cursor: pointer;
    }
    span {
      cursor: pointer;
    }
  }

  button {
    display: block;
    margin: 2rem auto 0;
    padding: 0.8rem 2rem;
    background: rgba(180, 160, 120, 0.2);
    color: #f5e8c8;
    border: 1px solid rgba(180, 160, 120, 0.5);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover {
      background: rgba(180, 160, 120, 0.4);
      box-shadow: 0 0 15px rgba(245, 232, 200, 0.3);
    }
  }
}

.category-section {
  margin-bottom: 1rem;
}

.reset-button {
  position: absolute;
  bottom: 2rem;
  left: 3rem;
  padding: 0.8rem 1.5rem;
  background: transparent;
  color: #a0998f;
  border: 1px solid #5a5245;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(199, 67, 67, 0.1);
    color: #e0dcd1;
    border-color: #c74343;
  }
}
</style>
