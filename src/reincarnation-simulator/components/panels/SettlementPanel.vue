<template>
  <div v-if="ripplesData" class="settlement-overlay">
    <div class="settlement-panel">
      <div class="settlement-header">
        <h2>第 {{ ripplesData.第x世 }} 世 - 往世涟漪</h2>
      </div>
      <div class="settlement-content">
        <div class="content-grid">
          <div class="grid-item full-width">
            <h3>本世概述</h3>
            <p>{{ ripplesData.本世概述 }}</p>
          </div>
          <div class="grid-item">
            <h3>事件脉络</h3>
            <p>{{ ripplesData.事件脉络 }}</p>
          </div>
          <div class="grid-item">
            <h3>本世成就</h3>
            <p>{{ ripplesData.本世成就 }}</p>
          </div>
          <div class="grid-item">
            <h3>本世遗珍</h3>
            <p>{{ ripplesData.本世遗珍 }}</p>
          </div>
          <div class="grid-item">
            <h3>红尘羁绊</h3>
            <p>{{ ripplesData.红尘羁绊 }}</p>
          </div>
          <div class="grid-item full-width">
            <h3>陨落之因</h3>
            <p class="cause-of-death">{{ ripplesData.陨落之因 }}</p>
          </div>
          <div class="grid-item full-width">
            <h3>真我一念</h3>
            <p>{{ ripplesData.真我一念 }}</p>
          </div>
          <div class="grid-item full-width">
            <h3>涟漪余波</h3>
            <p class="evaluation">{{ ripplesData.涟漪余波 }}</p>
          </div>
        </div>
      </div>
      <div class="settlement-footer">
        <button @click="closeSettlement">尘埃落定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store, actions } from '../../store';
import { ripples as ripplesData } from '../../store/getters';

function closeSettlement() {
  actions.clearSettlementData();
}
</script>

<style lang="scss" scoped>
.settlement-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.settlement-panel {
  width: 90%;
  max-width: 800px;
  height: 90vh;
  background: #1a1a1a;
  color: #e0e0e0;
  border-radius: 12px;
  border: 1px solid #444;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.settlement-header {
  padding: 1.5rem;
  border-bottom: 1px solid #444;
  text-align: center;

  h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 300;
    color: #00aaff;
  }
}

.settlement-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.grid-item {
  background: #2b2b2b;
  padding: 1.5rem;
  border-radius: 8px;

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: #00aaff;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.7;
    color: #c5c5c5;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.cause-of-death {
  color: #ff4d4d;
  font-weight: bold;
}

.evaluation {
  font-style: italic;
  color: #00ffcc;
}

.settlement-footer {
  padding: 1.5rem;
  border-top: 1px solid #444;
  text-align: center;

  button {
    padding: 0.75rem 2.5rem;
    border: 1px solid #00aaff;
    border-radius: 25px;
    background: transparent;
    color: #00aaff;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #00aaff;
      color: #1a1a1a;
      box-shadow: 0 0 15px #00aaff;
    }
  }
}
</style>
