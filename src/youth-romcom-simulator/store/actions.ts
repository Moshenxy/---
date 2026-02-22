import { cloneDeep, get, set } from 'lodash';
import { z } from 'zod';
import { contextService } from '../services/ContextService';
import { lorebookService } from '../services/LorebookService';
import { memoryService } from '../services/MemoryService';
import { notificationService } from '../services/NotificationService';
import { serviceLocator } from '../services/service-locator';
import { tavernService } from '../services/tavern';
import { workflowService } from '../services/WorkflowService';
import { worldEvolutionService } from '../services/WorldEvolutionService';
import { storylineService, DisplayStoryStage } from '../services/StorylineService';
import { diarySynthesisService } from '../services/DiarySynthesisService';
import { EvolutionaryPressure } from '../types/evolution';
import { processTags } from '../utils/tagProcessor';
import { store, USER_ID } from './state';
import type { DiaryEntry, WeeklyReview, 游戏世界状态, 主角, Npc, DiaryFragment, DirectorLog } from '../types';

/**
 * Sanitize incoming data from Tavern to ensure it points to the actual state object,
 * handling cases where `stat_data` root may or may not be present.
 */
function sanitizeStateData(data: any): any {
  if (!data) return null;
  return data.stat_data || data;
}

let lastProcessedMessageId: string | null = null;
let isLogHistoryLoaded = false;
const ZOD_ERROR_NOTIFIED_KEY = 'zodErrorNotified';
let isZodErrorNotified = sessionStorage.getItem(ZOD_ERROR_NOTIFIED_KEY) === 'true';

function checkForChangesAndNotify(oldState: any, newState: any) {
  if (!oldState || !newState) return;

  const oldChars = get(oldState, '角色列表', {});
  const newChars = get(newState, '角色列表', {});
  for (const charId in newChars) {
    if ((!oldChars[charId] || oldChars[charId] === '待初始化') && typeof newChars[charId] === 'object') {
      const char = newChars[charId];
      notificationService.info('新角色登场', `你遇到了 ${char.名称}。`);
    }
  }

  const oldInventory = get(oldState, '主角.物品栏', {});
  const newInventory = get(newState, '主角.物品栏', {});
  if (oldInventory && newInventory) {
    const allItemIds = new Set([...Object.keys(oldInventory), ...Object.keys(newInventory)]);
    for (const itemId of allItemIds) {
      const oldQty = oldInventory[itemId]?.数量 || 0;
      const newQty = newInventory[itemId]?.数量 || 0;
      const diff = newQty - oldQty;
      if (diff !== 0) {
        const itemName = itemId;
        const action = diff > 0 ? '获得' : '失去';
        notificationService.success('物品变更', `${action} ${itemName} x${Math.abs(diff)}`);
      }
    }
  }
  
  const oldUser = get(oldState, '主角', {});
  const newUser = get(newState, '主角', {});
  if(oldUser && newUser) {
      const compareAndNotify = (path: string, name: string) => {
        const oldVal = get(oldUser, path);
        const newVal = get(newUser, path);
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          notificationService.info('属性变化', `${name} 发生了变化。`);
        }
      };

      if (oldUser.属性 && newUser.属性) {
          const allAttributes = new Set([...Object.keys(oldUser.属性), ...Object.keys(newUser.属性)]);
          for (const attr of allAttributes) {
              compareAndNotify(`属性.${attr}`, `属性[${attr}]`);
          }
      }
  }
}

function parseBlock(block: string): { [key: string]: any } {
    const data: { [key: string]: any } = {};
    const lines = block.trim().split('\n');
    let currentKey: string | null = null;
    let isParsingMultiLine = false;
    let multiLineContent: any = null;

    for (const line of lines) {
        if (line.trim() === '---') {
            isParsingMultiLine = false;
            currentKey = null;
            continue;
        }

        if (!isParsingMultiLine) {
            const separatorIndex = line.indexOf('|');
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex).trim();
                const value = line.substring(separatorIndex + 1).trim();
                data[key] = value;
                currentKey = key;

                if (['【表·世界日志】', '【里·导演剪辑室】', '【校园BBS】', '【下回合展望】', '【一周热点追击】', '【本周人物风云榜】', '【关系蛛网变动】', '【世界线收束与发散】'].includes(key)) {
                    isParsingMultiLine = true;
                    multiLineContent = {};
                    data[key] = multiLineContent;
                } else if (['人物弧光', 'NPC表演分析', '镜头语言分析', '世界演化'].includes(key)) {
                    isParsingMultiLine = true;
                    multiLineContent = [];
                    data[key] = multiLineContent;
                }
            }
        } else if (currentKey) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- ')) {
                const itemContent = trimmedLine.substring(2).trim();
                if (Array.isArray(data[currentKey])) {
                    data[currentKey].push(itemContent);
                } else if (typeof data[currentKey] === 'object') {
                    const itemSeparatorIndex = itemContent.indexOf(':');
                    if (itemSeparatorIndex !== -1) {
                        const itemKey = itemContent.substring(0, itemSeparatorIndex).trim();
                        const itemValue = itemContent.substring(itemSeparatorIndex + 1).trim();
                        if (!data[currentKey][currentKey]) {
                            data[currentKey][currentKey] = [];
                        }
                        data[currentKey][currentKey].push({[itemKey]: itemValue});
                    }
                }
            } else if (trimmedLine) {
                 if (typeof data[currentKey] === 'object' && !Array.isArray(data[currentKey])) {
                    const itemSeparatorIndex = trimmedLine.indexOf(':');
                     if (itemSeparatorIndex !== -1) {
                        const itemKey = trimmedLine.substring(0, itemSeparatorIndex).trim();
                        const itemValue = trimmedLine.substring(itemSeparatorIndex + 1).trim();
                        data[currentKey][itemKey] = itemValue;
                     }
                 }
            }
        }
    }
    return data;
}

// 专为日记片段设计的、更健壮的解析器
function parseDiaryFragment(block: string): Partial<DiaryFragment> {
  const fragment: Partial<DiaryFragment> = {};
  const sections = block.split('\n---\n');
  
  // 解析第一部分的 key|value
  const headerLines = sections[0]?.trim().split('\n') || [];
  for (const line of headerLines) {
    const separatorIndex = line.indexOf('|');
    if (separatorIndex !== -1) {
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      switch (key) {
        case '序号':
          fragment.序号 = parseInt(value, 10);
          break;
        case '日期':
          fragment.日期 = value;
          break;
        case '时间片段':
          fragment.时间片段 = value;
          break;
        case '标题':
          fragment.标题 = value;
          break;
      }
    }
  }

  // 解析后续的【】块
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();
    const headerMatch = section.match(/^【(.+?)】\n?/);
    if (!headerMatch) continue;

    const header = headerMatch[1];
    const content = section.substring(headerMatch[0].length).trim();
    
    switch (header) {
      case '事件概要': {
        const summaryMatch = content.match(/^概要\|(.+)/s);
        if (summaryMatch) fragment.事件概要 = summaryMatch[1].trim();
        break;
      }
      case '我的抉择': {
        fragment.我的抉择 = content;
        break;
      }
      case '关系变动': {
        // 这是一个简单的解析，可以根据需要变得更复杂
        fragment.关系变动 = content;
        break;
      }
      case '属性成长': {
        fragment.属性成长 = content;
        break;
      }
    }
  }

  return fragment;
}

async function loadWeeklyReviewsFromLorebook() {
  try {
    const reviewContent = await lorebookService.readFromLorebook('周刊');
    if (!reviewContent || !reviewContent.trim()) {
      store.weeklyReviews = [];
      return;
    }
    const reviewBlocks = reviewContent.split('\n\n===\n\n');
    const allReviews = reviewBlocks.map(block => parseBlock(block) as unknown as WeeklyReview);
    store.weeklyReviews = allReviews.sort((a, b) => a.刊号 - b.刊号);
    console.log(`[Store] Loaded ${store.weeklyReviews.length} weekly reviews.`);
  } catch (error) {
    console.error('Error loading weekly reviews from lorebook:', error);
    store.weeklyReviews = [];
  }
}

async function loadDiaryFromLorebook() {
  try {
    const diaryContent = (await lorebookService.readFromLorebook('日记')) || '';
    const archiveContent = (await lorebookService.readFromLorebook('日记-禁开')) || '';
    const combinedContent = diaryContent + '\n\n---\n\n' + archiveContent;

    if (!combinedContent.trim()) {
      store.diary = [];
      return;
    }
    const logBlocks = combinedContent.split(/\n\n---\n\n|\n\n===\[存档分割线\]===\n\n/g);
    const allLogs = logBlocks
      .map(block => {
        if (!block.trim()) return null;
        try {
          return parseBlock(block) as unknown as DiaryEntry;
        } catch (e) {
          console.error('Failed to parse diary block:', block, e);
          return null;
        }
      })
      .filter((log): log is DiaryEntry => log !== null && !!log.日期);

    const uniqueLogsMap = new Map<string, DiaryEntry>();
    for (const log of allLogs) {
      if(log.日期) {
        uniqueLogsMap.set(log.日期, log);
      }
    }
    const uniqueLogs = Array.from(uniqueLogsMap.values());
    store.diary = uniqueLogs.sort((a, b) => new Date(a.日期).getTime() - new Date(b.日期).getTime());
    console.log(`[Store] Loaded and deduplicated ${store.diary.length} entries from "日记" and "日记-禁开".`);
  } catch (error) {
    console.error('Error loading diary from lorebook:', error);
    store.diary = [];
  }
}

async function loadDiaryFragmentsFromLorebook() {
  try {
    const fragmentContent = (await lorebookService.readFromLorebook('日记片段')) || '';
    const archiveContent = (await lorebookService.readFromLorebook('日记片段-禁开')) || '';
    const combinedContent = fragmentContent + '\n\n---\n\n' + archiveContent;

    if (!combinedContent.trim()) {
      store.diaryFragments = [];
      return;
    }
    const fragmentBlocks = combinedContent.split('\n\n---\n\n');
    const allFragments = fragmentBlocks
      .map(block => {
        if (!block.trim()) return null;
        try {
          // 使用新的专用解析器
          return parseDiaryFragment(block) as DiaryFragment;
        } catch (e) {
          console.error('Failed to parse diary fragment block:', block, e);
          return null;
        }
      })
      .filter((frag): frag is DiaryFragment => frag !== null && frag.序号 !== undefined);

    const uniqueFragmentsMap = new Map<number, DiaryFragment>();
    for (const frag of allFragments) {
      uniqueFragmentsMap.set(frag.序号, frag);
    }
    store.diaryFragments = Array.from(uniqueFragmentsMap.values()).sort((a, b) => a.序号 - b.序号);
    console.log(`[Store] Loaded and deduplicated ${store.diaryFragments.length} fragments.`);
  } catch (error) {
    console.error('Error loading diary fragments:', error);
    store.diaryFragments = [];
  }
}

async function loadDirectorLogsFromLorebook() {
    try {
        const logContent = await lorebookService.readFromLorebook('导演场记');
        if (!logContent || !logContent.trim()) {
            store.directorLogs = [];
            return;
        }
        const logBlocks = logContent.split('\n\n---\n\n');
        const allLogs = logBlocks.map(block => parseBlock(block) as unknown as DirectorLog);
        store.directorLogs = allLogs.sort((a, b) => parseInt(a.剧本ID, 10) - parseInt(b.剧本ID, 10));
        console.log(`[Store] Loaded ${store.directorLogs.length} director logs.`);
    } catch (error) {
        console.error('Error loading director logs from lorebook:', error);
        store.directorLogs = [];
    }
}

async function fetchCoreData() {
  try {
    const messages = await tavernService.fetchTavernData();
    if (messages && messages.length > 0 && messages[0].data) {
      const rawStateData = sanitizeStateData(messages[0].data);
      const fullMessageContent = messages[0].message;
      const currentMessageId = messages[0].id;
      const oldState = JSON.parse(JSON.stringify(store.worldState));

      try {
        store.worldState = rawStateData as any;
        if (isZodErrorNotified) {
          sessionStorage.removeItem(ZOD_ERROR_NOTIFIED_KEY);
          isZodErrorNotified = false;
        }
      } catch (error) {
        console.warn('[Zod-AutoFix] Initial parsing failed. Attempting to auto-fix...', error);
        const fixedData = cloneDeep(rawStateData);
        if (error instanceof z.ZodError) {
          for (const issue of error.issues) {
            if (issue.code === 'invalid_type' && 'received' in issue && issue.received === 'undefined') {
              let defaultValue: any = '';
              if (issue.expected === 'number') defaultValue = 0;
              else if (issue.expected === 'boolean') defaultValue = false;
              else if (issue.expected === 'object') defaultValue = {};
              else if (issue.expected === 'array') defaultValue = [];
              set(fixedData, issue.path, defaultValue);
            }
          }
          try {
            store.worldState = fixedData as any;
            notificationService.success('数据自动修复', '部分数据格式已自动修正。');
            if (isZodErrorNotified) {
              sessionStorage.removeItem(ZOD_ERROR_NOTIFIED_KEY);
              isZodErrorNotified = false;
            }
          } catch (finalError) {
            if (!isZodErrorNotified) {
              const finalZodError = finalError as z.ZodError;
              const firstIssue = finalZodError.issues[0];
              const errorMessage = `路径 [${firstIssue.path.join(' -> ')}] 发生错误: ${firstIssue.message}。`;
              console.error('Zod validation failed even after auto-fixing:', finalError);
              notificationService.error('数据校验失败', `自动修复失败: ${errorMessage}`);
              sessionStorage.setItem(ZOD_ERROR_NOTIFIED_KEY, 'true');
              isZodErrorNotified = true;
            }
            store.worldState = fixedData as any;
          }
        } else {
          store.worldState = rawStateData as any;
          if (!isZodErrorNotified) {
            console.error('Validation failed with non-Zod error:', error);
            notificationService.error('数据错误', '发生了一个未知的数据格式错误。');
            sessionStorage.setItem(ZOD_ERROR_NOTIFIED_KEY, 'true');
            isZodErrorNotified = true;
          }
        }
      }
      
      checkForChangesAndNotify(oldState, store.worldState);

      const gameTextContent = fullMessageContent?.match(/<gametxt>([\s\S]*?)<\/gametxt>/i)?.[1].trim();

      if (gameTextContent) {
        store.mainWorldNarrative = gameTextContent;
      }
      
      if (fullMessageContent && currentMessageId !== lastProcessedMessageId) {
        lastProcessedMessageId = currentMessageId;
        // await memoryService.updateMemory(store.diary); // FIXME: This method does not exist on MemoryService
      }
    }
  } catch (error) {
    console.error('获取核心数据时出错:', error);
  }
}

async function loadAllData() {
  if (!isLogHistoryLoaded) {
    await Promise.all([
      loadDiaryFromLorebook(),
      loadWeeklyReviewsFromLorebook(),
      loadDiaryFragmentsFromLorebook(),
      loadDirectorLogsFromLorebook(),
    ]);
    isLogHistoryLoaded = true;
  }
  await fetchCoreData();
  await lorebookService.getEntries(true);
  store.isReady = true;
  console.log('[Store] Core data loaded and lorebook cache refreshed.');
}

async function processAiResponse(response: string, prefixedInput: string) {
  if (!response) return;

  const gameTextMatch = response.match(/<gametxt>([\s\S]+?)<\/gametxt>/i);
  const narrative = gameTextMatch ? gameTextMatch[1].trim() : null;

  if (narrative) {
    store.mainWorldNarrative = narrative;
  }

  const updateScriptMatch = response.match(/<UpdateVariable>([\s\S]+?)<\/UpdateVariable>/i);
  let updateScript = updateScriptMatch ? updateScriptMatch[1].trim() : null;

  if (updateScript) {
    const jsonPatchMatch = updateScript.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i);
    if (jsonPatchMatch && jsonPatchMatch[1]) {
      store.lastGeneratedPatch = jsonPatchMatch[1].trim();
      console.log('[Actions] Cached last generated patch.');
    }
  }

  if (narrative) {
    workflowService.cacheNarrative(narrative);
  }
  if (updateScript) {
    workflowService.cacheUpdateScript(updateScript);
  }

  if (updateScript) {
    const latestState = (await tavernService.fetchTavernData())?.[0]?.data ?? store.worldState;
    const oldState = JSON.parse(JSON.stringify(store.worldState));
    const newVariables = await tavernService.invokeMvuScript(updateScript, latestState);
    if (newVariables) {
      const sanitizedVars = sanitizeStateData(newVariables);
      try {
        store.worldState = sanitizedVars as any;
        isZodErrorNotified = false;
      } catch (error) {
        if (!isZodErrorNotified) {
          const zodError = error as z.ZodError;
          const firstIssue = zodError.issues[0];
          const errorMessage = `路径 [${firstIssue.path.join(' -> ')}] 发生错误: ${firstIssue.message}。`;
          console.error('Zod validation failed for newVariables from MVU script:', error);
          notificationService.error('数据校验失败', errorMessage);
          isZodErrorNotified = true;
        }
        store.worldState = sanitizedVars as any;
      }
      checkForChangesAndNotify(oldState, store.worldState);
    }
  }
}

async function updateLastPatchFromHistory() {
  try {
    const messages = await tavernService.fetchTavernData();
    if (messages && messages.length > 0) {
      const lastAiMessage = [...messages].reverse().find(m => !m.is_user);
      if (!lastAiMessage) return;

      const lastMessage = lastAiMessage;
      const updateScriptMatch = lastMessage.message?.match(/<UpdateVariable>([\s\S]+?)<\/UpdateVariable>/i);
      const updateScript = updateScriptMatch ? updateScriptMatch[1].trim() : null;
      const jsonPatchMatch = updateScript?.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i);

      if (jsonPatchMatch && jsonPatchMatch[1]) {
        const patchContent = jsonPatchMatch[1].trim();
        store.lastGeneratedPatch = patchContent;
      } else {
         store.lastGeneratedPatch = null;
      }
    }
  } catch (error) {
    console.error('Failed to silently update patch from history:', error);
  }
}

async function handleAction(actionText: string, isReroll = false) {
  const saveLoadService = serviceLocator.get('saveLoadService');
  if (!actionText.trim()) return;
  if (!store.isReady) await loadAllData();

  if (!isReroll) {
    await saveLoadService.saveStateForReroll();
  }

  store.isGenerating = true;
  try {
    await updateLastPatchFromHistory();

    console.log('[EvoSys] Executing Pre-Action Deduction...');
    const pressures = worldEvolutionService.applyPressure(store.worldState);
    const reactions = worldEvolutionService.simulateReactions(pressures, store.worldState);
    for (const event of reactions) {
      worldEvolutionService.propagateRipples(event, store.worldState);
    }
    const availableRipples = worldEvolutionService.getAvailableRipples(Date.now());
    const currentState = workflowService.getCurrentState();
    const intent = contextService.analyzeUserIntent(actionText, store.worldState, availableRipples);
    const { sceneContext, worldContext } = await contextService.buildLeanContext(
      intent,
      actionText,
      store.mainWorldNarrative, // 传递上文的 gametxt
      store.worldState,
      store.userId,
      store.diaryFragments, // 传递日记片段
    );

    console.log('[Actions] Generating AI response with modular context.');
    
    const buildXmlTag = (tagName: string, content: any) => {
      if (!content || (Array.isArray(content) && content.length === 0) || (typeof content === 'object' && Object.keys(content).length === 0)) {
        return '';
      }
      return `<${tagName}>\n${JSON.stringify(content, null, 2)}\n</${tagName}>\n\n`;
    };
    
    const worldContextData = worldContext as any;

    const synthesisRequest = diarySynthesisService.getSynthesisRequest();

    const aiInput = `<previous_patch>
${store.lastGeneratedPatch || '无'}
</previous_patch>

${buildXmlTag('当前场景', sceneContext)}
${buildXmlTag('主角', worldContextData.主角)}
${buildXmlTag('在场人物', worldContextData.在场人物)}
${buildXmlTag('非在场人物摘要', worldContextData.非在场人物摘要)}
${buildXmlTag('关系网络', worldContextData.关系网络)}
${buildXmlTag('导演指令', worldContextData.导演指令)}
${buildXmlTag('补充情景', { 短期记忆: worldContextData.短期记忆, 相关记忆: worldContextData.相关记忆 })}
${synthesisRequest ? `\n${synthesisRequest}\n` : ''}
<user_input>
${actionText}
</user_input>`;

    console.log('[SUBMIT_DEBUG] Submitting to AI with combined input:', aiInput);

    const rawAiResponse = await tavernService.generateAiResponse(aiInput);
    const aiResponseString = processTags(rawAiResponse);
    const preservedContent = workflowService.popPreservedContent();
    const finalResponseString = aiResponseString + preservedContent;

    await processAiResponse(finalResponseString, actionText);

    const messages = await tavernService.fetchTavernData();
    if (messages && messages.length > 0) {
      const messageZero = messages[0];
      messageZero.message = finalResponseString;
      const newData = messageZero.data || {};
      newData.stat_data = JSON.parse(JSON.stringify(store.worldState));
      messageZero.data = newData;
      await TavernHelper.setChatMessages([messageZero], { refresh: 'none' });
    }

    await saveLoadService.performAutoSave();

    console.log('[EvoSys] Executing Post-Action Deduction...');
    const actionAsPressure: EvolutionaryPressure = {
      type: 'custom',
      source: { type: 'npc', id: store.userId },
      intensity: 75,
      description: `天命之人执行了行动: "${actionText}"`,
      intent: actionText,
    };
    const actionReactions = worldEvolutionService.simulateReactions([actionAsPressure], store.worldState);
    for (const event of actionReactions) {
      worldEvolutionService.propagateRipples(event, store.worldState);
    }

  } catch (error) {
    console.error('处理动作时出错:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    store.generationError = `AI响应失败: ${errorMessage}`;
    notificationService.error('操作失败', '与AI交互失败，请检查控制台。');
  } finally {
    if (store.generationError) {
      setTimeout(() => {
        store.isGenerating = false;
        store.generationError = null;
      }, 5000);
    } else {
      store.isGenerating = false;
    }
  }
}

export const actions = {
  loadAllData,
  handleAction,
  loadFutureStorylines: async () => {
    if (!store.worldState) {
      return;
    }
    try {
      const storylines = await storylineService.getDisplayTimeline(store.worldState);
      store.futureStorylines = storylines as any;
    } catch (error) {
      console.error('Failed to load future storylines:', error);
      notificationService.error('加载主线失败', '无法获取未来的主线剧情。');
    }
  },
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
};
