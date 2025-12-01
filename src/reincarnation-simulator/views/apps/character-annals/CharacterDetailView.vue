<template>
  <div class="character-detail-view-root" v-if="character">
    <div class="detail-header">
      <div class="header-main">
        <div class="character-info">
          <h1>{{ character.name }}</h1>
          <div class="reputation">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2L9 9l-7 1 5 5-1 7 6-4 6 4-1-7 5-5-7-1z"></path>
            </svg>
            <span>声望: {{ character.reputation }}</span>
          </div>
        </div>
        <div class="avatar-container">
          <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" class="character-avatar" />
          <div v-else class="character-avatar-placeholder">
            <span>{{ character.name.charAt(0) }}</span>
          </div>
        </div>
      </div>
      <p class="signature">"{{ character.signature }}"</p>
      <div class="tags">
        <span class="tag class-tag">{{ character.class }}</span>
        <span v-for="identity in character.identities" :key="identity" class="tag identity-tag">{{ identity }}</span>
      </div>
    </div>

    <div class="detail-tabs">
      <div class="tab-item" :class="{ active: activeTab === 'attributes' }" @click="activeTab = 'attributes'">属性</div>
      <div class="tab-item" :class="{ active: activeTab === 'talents' }" @click="activeTab = 'talents'">天赋与技能</div>
      <div class="tab-item" :class="{ active: activeTab === 'secrets' }" @click="activeTab = 'secrets'">秘密</div>
      <div class="tab-item" :class="{ active: activeTab === 'equipment' }" @click="activeTab = 'equipment'">装备</div>
      <div class="tab-item" :class="{ active: activeTab === 'relationships' }" @click="activeTab = 'relationships'">
        关系
      </div>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'attributes'" class="attributes-panel">
        <div class="info-card">
          <h3 class="section-heading">核心属性</h3>
          <div class="attribute-grid core-attributes">
            <div v-for="(value, key) in character.baseAttributes" :key="key" class="attribute-item">
              <span class="attribute-name">{{ key }}</span>
              <div class="attribute-value-bar">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${(value.经验值 / value.经验上限) * 100}%` }"></div>
                </div>
                <span class="attribute-text">{{ value.值 }} / {{ value.软上限 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="section-heading">学业</h3>
          <div class="attribute-grid core-attributes">
            <div v-for="(value, key) in character.subjects" :key="key" class="attribute-item">
              <span class="attribute-name">{{ key }}</span>
              <div class="attribute-value-bar">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${(value.经验值 / value.经验上限) * 100}%` }"></div>
                </div>
                <span class="attribute-text">{{ value.知识水平 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'talents'" class="talents-panel">
        <div class="info-card">
          <h3 class="section-heading">天赋特长</h3>
          <ul class="talent-list">
            <li v-for="talent in character.talents" :key="talent.名称" class="talent-item">
              <strong class="talent-name">{{ talent.名称 }}</strong>
              <p class="talent-desc">{{ talent.描述 }}</p>
            </li>
          </ul>
        </div>
        <div class="info-card">
          <h3 class="section-heading">技能与知识</h3>
          <div class="attribute-grid">
            <div v-for="(value, key) in character.skills" :key="key" class="attribute-item">
              <span class="attribute-name">{{ key }}</span>
              <div class="attribute-value-bar">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${(value.经验值 / value.经验上限) * 100}%` }"></div>
                </div>
                <span class="attribute-text">Lv.{{ value.等级 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'secrets' && character.secrets && character.secrets.length > 0" class="secrets-panel">
        <div v-for="secret in character.secrets" :key="secret.ID" class="info-card secret-item">
          <h3 class="section-heading">{{ secret.标题 }}</h3>
          <p>{{ secret.内容 }}</p>
          <div class="secret-footer">
            <span>状态: {{ secret.揭露状态 }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="activeTab === 'secrets'" class="no-data">
        <p>没有发现任何秘密。</p>
      </div>
      <div v-if="activeTab === 'equipment'" class="equipment-panel">
        <div class="equipment-grid">
          <div v-for="(itemId, slot) in character.equipment" :key="slot" class="equipment-item">
            <span class="equipment-slot">{{ slot }}</span>
            <span class="equipment-name">{{ productService.getProductNameById(itemId) || '无' }}</span>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'relationships'" class="relationships-panel">
        <RelationshipGraph :character-id="props.characterId" @node-selected="handleNodeSelection" />
      </div>
    </div>
  </div>
  <div v-else class="loading">
    <p>加载中...</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { avatarService } from '../../../services/AvatarService';
import { productService } from '../../../services/ProductService';
import { getters } from '../../../store';
import RelationshipGraph from './components/RelationshipGraph.vue';

const props = defineProps<{
  characterId: string;
}>();

const activeTab = ref('attributes');
const avatarUrl = ref('');

const emit = defineEmits(['character-selected']);

function handleNodeSelection(characterId: string) {
  emit('character-selected', characterId);
}

const character = computed(() => {
  if (!props.characterId) return null;
  const details = getters.getFormattedCharacterDetails(props.characterId).value;
  if (details) {
    // Ensure secrets is an array
    details.secrets = Array.isArray(details.secrets) ? details.secrets : [];
  }
  return details;
});

async function fetchAvatar(id: string) {
  if (!id) {
    avatarUrl.value = '';
    return;
  }
  try {
    const url = await avatarService.getAvatarUrl(id);
    if (url) {
      avatarUrl.value = url;
    } else {
      // Fallback to the main character avatar if lorebook entry not found
      const mainAvatar = await TavernHelper.getCharData(id);
      avatarUrl.value = typeof mainAvatar === 'string' ? mainAvatar : '';
    }
  } catch (error) {
    console.error(`Failed to fetch avatar for ${id}:`, error);
    avatarUrl.value = ''; // Reset on error
  }
}

onMounted(() => {
  fetchAvatar(props.characterId);
});

watch(
  () => props.characterId,
  newId => {
    fetchAvatar(newId);
  },
);
</script>

&lt;style lang="scss" scoped&gt; .detail-header { .header-main { display: flex; justify-content: space-between;
align-items: flex-start; gap: 1rem; } .character-info { flex-grow: 1; } .reputation { display: flex; align-items:
center; gap: 0.5rem; font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem; } .avatar-container { flex-shrink: 0; }
.character-avatar, .character-avatar-placeholder { width: 40px !important; height: 50px !important; object-fit: cover;
border-radius: 8px; border: 2px solid #e9ecef; } .character-avatar-placeholder { display: flex; justify-content: center;
align-items: center; background-color: #e9ecef; color: #495057; font-size: 1.5rem; font-weight: bold; } } &lt;/style&gt;
