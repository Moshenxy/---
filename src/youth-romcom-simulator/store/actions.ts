import { cloneDeep, get } from 'lodash';
import { z } from 'zod';
import { contextService } from '../services/ContextService';
import { lorebookService } from '../services/LorebookService';
import { notificationService } from '../services/NotificationService';
import { serviceLocator } from '../services/service-locator';
import { tavernService } from '../services/tavern';
import { processTags } from '../utils/tagProcessor';
import type { 游戏世界状态 } from '../types';
import { RootSchema } from '../types';
import { store, USER_ID } from './state';

function sanitizeStateData(data: any): any {
  if (!data) return null;
  return data.stat_data || data;
}

let lastProcessedMessageId: string | null = null;
let isLogHistoryLoaded = false;
const ZOD_ERROR_NOTIFIED_KEY = 'zodErrorNotified';
let isZodErrorNotified = sessionStorage.getItem(ZOD_ERROR_NOTIFIED_KEY) === 'true';

function checkForChangesAndNotify(oldState: 游戏世界状态 | null, newState: 游戏世界状态 | null) {
  if (!oldState || !newState) return;

  // 1. 新角色登场
  const oldCharIds = Object.keys(oldState.角色列表);
  const newCharIds = Object.keys(newState.角色列表);
  for (const charId of newCharIds) {
    if (!oldCharIds.includes(charId)) {
      const newChar = newState.角色列表[charId];
      if (typeof newChar !== 'string') {
        notificationService.info('新角色登场', `你遇到了 ${newChar.名称}。`);
      }
    }
  }

  // 2. 关系变化
  for (const relId in newState.关系) {
    const oldRel = oldState.关系[relId];
    const newRel = newState.关系[relId];
    if (oldRel && newRel && typeof oldRel !== 'string' && typeof newRel !== 'string') {
      if (oldRel.数值.亲密度 !== newRel.数值.亲密度) {
        const targetName = relId.replace(USER_ID, '').replace('-', '');
        notificationService.success('关系变化', `与 ${targetName} 的亲密度变为 ${newRel.数值.亲密度}`);
      }
    }
  }

  // 3. 角色属性变化
  for (const charId in newState.角色列表) {
    const oldChar = oldState.角色列表[charId];
    const newChar = newState.角色列表[charId];
    if (oldChar && newChar && typeof oldChar !== 'string' && typeof newChar !== 'string') {
        if(!oldChar.属性 || !newChar.属性) continue;
      for(const attrKey in newChar.属性) {
        const oldAttr = oldChar.属性[attrKey as keyof typeof oldChar.属性];
        const newAttr = newChar.属性[attrKey as keyof typeof newChar.属性];
        if (oldAttr && newAttr && oldAttr.等级 !== newAttr.等级) {
          notificationService.info('属性成长', `${newChar.名称}的'${attrKey}'提升至 ${newAttr.等级} 级!`);
        }
      }
    }
  }

  // 4. 新卡牌出现
  if(newState.命运卡牌系统 && oldState.命运卡牌系统) {
    const oldCardIds = Object.keys(oldState.命运卡牌系统.卡牌仓库);
    const newCardIds = Object.keys(newState.命运卡牌系统.卡牌仓库);
    for (const cardId of newCardIds) {
        if (!oldCardIds.includes(cardId)) {
        const newCard = newState.命运卡牌系统.卡牌仓库[cardId];
        notificationService.success('获得新卡牌', `你获得了 [${newCard.等级}] ${newCard.名称}。`);
        }
    }
  }

  // 5. 新委托出现
  if(newState.叙事记录 && oldState.叙事记录){
    const oldQuestIds = Object.keys(oldState.叙事记录.委托系统);
    const newQuestIds = Object.keys(newState.叙事记录.委托系统);
    for (const questId of newQuestIds) {
        if (!oldQuestIds.includes(questId)) {
        const newQuest = newState.叙事记录.委托系统[questId];
        notificationService.warn('新的委托', `来自 ${newQuest.委托人} 的新委托: ${newQuest.内容}`);
        }
    }
  }
}

async function loadWorldLogFromLorebook() {
  try {
    const logContent = await lorebookService.readFromLorebook('本世历程');
    if (!logContent || !logContent.trim()) {
      store.worldLog = [];
      return;
    }
    // Log parsing logic needs to be adapted here
  } catch (error) {
    console.error('Error loading world log from lorebook:', error);
    store.worldLog = [];
  }
}

async function fetchCoreData() {
  try {
    const messages = await tavernService.fetchTavernData();
    if (messages && messages.length > 0 && messages[0].data) {
      const rawStateData = sanitizeStateData(messages[0].data);
      const oldState = cloneDeep(store.worldState);
      const parseResult = RootSchema.safeParse(rawStateData);

      if (parseResult.success) {
        store.worldState = parseResult.data;
        if (isZodErrorNotified) sessionStorage.removeItem(ZOD_ERROR_NOTIFIED_KEY);
        isZodErrorNotified = false;
      } else {
        console.error('Zod validation failed:', parseResult.error);
        if (!isZodErrorNotified) {
          const firstIssue = parseResult.error.issues[0];
          const errorMessage = `路径 [${firstIssue.path.join(' -> ')}] 错误: ${firstIssue.message}`;
          notificationService.error('数据校验失败', errorMessage);
          sessionStorage.setItem(ZOD_ERROR_NOTIFIED_KEY, 'true');
          isZodErrorNotified = true;
        }
        store.worldState = rawStateData as 游戏世界状态;
      }
      
      const fullMessageContent = messages[0].message;
      const gameTextContent = fullMessageContent?.match(/<gametxt>([\s\S]*?)<\/gametxt>/i)?.[1].trim();
      if (gameTextContent) {
        store.mainWorldNarrative = gameTextContent;
      }

      checkForChangesAndNotify(oldState, store.worldState);
    }
  } catch (error) {
    console.error('获取核心数据时出错:', error);
  }
}

async function loadAllData() {
  if (!isLogHistoryLoaded) {
    await loadWorldLogFromLorebook();
    isLogHistoryLoaded = true;
  }
  await fetchCoreData();
  store.isReady = true;
  console.log('[Store] Core data for Oregairu-verse loaded.');
}

function parseBlock(block: string): { [key: string]: string } {
    const data: { [key: string]: string } = {};
    const lines = block.trim().split('\n');
    let currentKey = '';
    for (const line of lines) {
      const separatorIndex = line.indexOf('|');
      if (separatorIndex !== -1) {
        const key = line.substring(0, separatorIndex).trim();
        const value = line.substring(separatorIndex + 1).trim();
        if (key) { // Ensure key is not empty
          data[key] = value;
          currentKey = key;
        }
      } else if (currentKey && line.trim()) {
        data[currentKey] += '\n' + line;
      }
    }
    // Trim the final value for each key
    for (const key in data) {
      data[key] = data[key].trim();
    }
    return data;
  }
  
  async function processAiResponse(response: string) {
      if (!response) return;
  
      // 1. 提取并更新叙事文本 <gametxt>
      const gameTextMatch = response.match(/<gametxt>([\s\S]*?)<\/gametxt>/i);
      const narrative = gameTextMatch ? gameTextMatch[1].trim() : "";
      if (narrative || !response.includes('<UpdateVariable>')) {
          store.mainWorldNarrative = narrative || (response.includes('<thinking>') ? '' : response);
      }
  
  
      // 2. 提取并处理日志 <本世历程>
      const logRegex = /<本世历程>([\s\S]+?)<\/本世历程>/g;
      let logMatch;
      while ((logMatch = logRegex.exec(response)) !== null) {
        const block = parseBlock(logMatch[1]);
        if (block && block['序号']) {
            const newLogEntry = {
              序号: parseInt(block['序号'], 10),
              日期: block['日期'] || '未知日期',
              标题: block['标题'] || '无标题',
              地点: block['地点'] || '未知地点',
              人物: block['人物'] || '未知人物',
              描述: block['描述'] || '',
              人物关系: block['人物关系'] || '',
              标签: block['标签'] ? block['标签'].replace(/[[\]"]/g, '').split(',').map(t => t.trim()).filter(Boolean) : [],
              重要信息: block['重要信息'] || '',
              暗线与伏笔: block['暗线与伏笔'] || '',
              天机推演: block['天机推演'] || '',
              自动化系统: block['自动化系统'] || '',
            };
            if (!store.worldLog.some(log => log.序号 === newLogEntry.序号)) {
              store.worldLog.push(newLogEntry as any);
            }
        }
      }
      if (logRegex.test(response)) { // Only sort and save if logs were processed
          store.worldLog.sort((a, b) => a.序号 - b.序号);
          const fullLogContent = store.worldLog.map(log => 
              Object.entries(log).map(([key, value]) => `${key}|${Array.isArray(value) ? value.join(',') : value}`).join('\n')
          ).join('\n\n---\n\n');
          await lorebookService.writeToLorebook('本世历程', fullLogContent, { isEnabled: true, keys: ['本世历程'] });
      }
  
  
      // 3. 提取并执行变量更新脚本 <UpdateVariable>
      const updateScriptMatch = response.match(/<UpdateVariable>([\s\S]+?)<\/UpdateVariable>/i);
      const updateScript = updateScriptMatch ? updateScriptMatch[1].trim() : null;
  
      if (updateScript) {
          const jsonPatchMatch = updateScript.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i);
          if (jsonPatchMatch && jsonPatchMatch[1]) {
              const patchString = jsonPatchMatch[1].trim();
              try {
                  const patch = JSON.parse(patchString);
                  const oldState = cloneDeep(store.worldState);
                  const newVariables = await tavernService.invokeMvuScript(patch, oldState);
                  
                  if (newVariables) {
                      const sanitizedVars = sanitizeStateData(newVariables);
                      const parseResult = RootSchema.safeParse(sanitizedVars);
                      if (parseResult.success) {
                          store.worldState = parseResult.data;
                          if (isZodErrorNotified) sessionStorage.removeItem(ZOD_ERROR_NOTIFIED_KEY);
                          isZodErrorNotified = false;
                      } else {
                          console.error('Zod validation failed after script execution:', parseResult.error);
                          if (!isZodErrorNotified) {
                              const firstIssue = parseResult.error.issues[0];
                              const errorMessage = `路径 [${firstIssue.path.join(' -> ')}] 错误: ${firstIssue.message}`;
                              notificationService.error('数据校验失败', errorMessage);
                              sessionStorage.setItem(ZOD_ERROR_NOTIFIED_KEY, 'true');
                              isZodErrorNotified = true;
                          }
                          store.worldState = sanitizedVars as 游戏世界状态;
                      }
                      checkForChangesAndNotify(oldState, store.worldState);
                  }
              } catch (e) {
                  console.error("Failed to parse JSONPatch or apply it:", e);
                  notificationService.error("变量更新失败", "AI返回的变量格式错误。");
              }
          }
      }
  }

async function handleAction(actionText: string) {
    if (!actionText.trim()) return;
    if (!store.isReady) await loadAllData();
  
    store.isGenerating = true;
    store.lastSubmittedAction = actionText;
  
    try {
      const intent = contextService.analyzeUserIntent(actionText, store.worldState, []);
      const contextVariables = contextService.buildLeanContext(intent, actionText, store.worldState, USER_ID);
  
      console.log('[Actions] Generating AI response with Oregairu context variables.');
      
      const rawAiResponse = await tavernService.generateAiResponse(actionText, contextVariables);
      const aiResponseString = processTags(rawAiResponse);
  
      await processAiResponse(aiResponseString);
  
      const messages = await tavernService.fetchTavernData();
      if (messages && messages.length > 0) {
          const messageZero = messages[0];
          messageZero.message = aiResponseString;
          const newData = messageZero.data || {};
          newData.stat_data = cloneDeep(store.worldState);
          messageZero.data = newData;
          await TavernHelper.setChatMessages([messageZero], { refresh: 'none' });
      }
  
    } catch (error) {
      console.error('处理动作时出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      store.generationError = `AI响应失败: ${errorMessage}`;
      notificationService.error('操作失败', '与AI交互失败，请检查控制台。');
    } finally {
      setTimeout(() => {
          store.isGenerating = false;
          store.generationError = null;
      }, store.generationError ? 5000 : 0);
    }
  }

let isInitialized = false;

function initializeEventListeners() {
  if (isInitialized) return;
  console.log('[Store] Initializing event listeners for Oregairu-verse...');
  
  eventOn(tavern_events.GENERATION_ENDED, () => {
    setTimeout(() => fetchCoreData(), 500);
  });

  isInitialized = true;
  console.log('[Store] Event listeners are active.');
}

export const actions = {
  loadAllData,
  handleAction,
  rerollLastAction: async () => {
    const saveLoadService = serviceLocator.get('saveLoadService');
    console.log('[Actions] Reroll requested.');
    try {
      notificationService.info('正在返回上一轮...', '页面即将刷新。');
      await saveLoadService.loadRerollState();
    } catch (error) {
      console.error('Reroll failed:', error);
      notificationService.error('重来失败', error instanceof Error ? error.message : '未知错误');
    }
  },
  initializeEventListeners,
};
