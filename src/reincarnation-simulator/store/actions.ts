import { get } from 'lodash';
import { commandService } from '../services/CommandService';
import { lorebookService } from '../services/LorebookService';
import { memoryService } from '../services/MemoryService';
import { notificationService } from '../services/NotificationService';
import { tavernService } from '../services/tavern';
import { workflowService } from '../services/WorkflowService';
import { worldUpdateService } from '../services/WorldUpdateService';
import type { WorldbookEntry } from '../types';
import { WorldStateSchema } from '../types/schema';
import { parseSimpleYaml } from '../utils/yamlParser';
import { isSimulationRunning } from './getters';
import { store } from './state';

let lastProcessedMessageId: string | null = null; // 使用消息ID来防止重复处理
let isLogHistoryLoaded = false; // Flag to ensure history is loaded only once

/**
 * Compares old and new game states and triggers notifications for changes.
 * @param oldState The game state before the update.
 * @param newState The game state after the update.
 */
function checkForChangesAndNotify(oldState: any, newState: any) {
  if (!oldState || !newState) return;

  // 1. Inventory Change Notification
  const oldInventory = get(oldState, `角色.${store.userId}.背包`, {});
  const newInventory = get(newState, `角色.${store.userId}.背包`, {});
  const allItemIds = new Set([...Object.keys(oldInventory), ...Object.keys(newInventory)].filter(id => id !== '$meta'));

  for (const itemId of allItemIds) {
    const oldQty = oldInventory[itemId] || 0;
    const newQty = newInventory[itemId] || 0;
    const diff = newQty - oldQty;
    if (diff !== 0) {
      const itemName = store.getItemNameById(itemId) || itemId;
      const action = diff > 0 ? '获得' : '失去';
      notificationService.success('物品变更', `${action} ${itemName} x${Math.abs(diff)}`);
    }
  }

  // 2. Relationship Change Notification
  const oldWeb = get(oldState, '因果之网', {});
  const newWeb = get(newState, '因果之网', {});
  const allSubjects = new Set([...Object.keys(oldWeb), ...Object.keys(newWeb)]);

  for (const subjectId of allSubjects) {
    const oldRelations = oldWeb[subjectId] || {};
    const newRelations = newWeb[subjectId] || {};
    const allObjects = new Set([...Object.keys(oldRelations), ...Object.keys(newRelations)]);

    for (const objectId of allObjects) {
      const oldCloseness = get(oldRelations, `${objectId}.情感层.亲近感[0]`, 0);
      const newCloseness = get(newRelations, `${objectId}.情感层.亲近感[0]`, 0);
      const closenessDiff = newCloseness - oldCloseness;

      if (closenessDiff !== 0) {
        const subjectName = get(newState, `角色.${subjectId}.姓名[0]`, subjectId);
        const objectName = get(newState, `角色.${objectId}.姓名[0]`, objectId);
        const action = closenessDiff > 0 ? '提升' : '下降';
        notificationService.info(
          '人际关系',
          `${subjectName} 对 ${objectName} 的亲近感${action}了 ${Math.abs(closenessDiff)}`,
        );
      }
    }
  }
}

async function loadWorldLogFromLorebook() {
  try {
    const logContent = await lorebookService.readFromLorebook('本世历程');
    if (!logContent || !logContent.trim()) {
      console.log('[Store] "本世历程" lorebook is empty. Skipping log population.');
      store.worldLog = []; // Ensure log is cleared if entry is empty
      return;
    }

    const logBlocks = logContent.split('\n\n---\n\n');
    const allLogs = logBlocks
      .map(block => {
        if (!block.trim()) return null;
        try {
          const parsed = parseBlock(block);
          if (!parsed || !parsed['序号']) return null;
          // Ensure all properties of WorldLogEntry are present
          return {
            序号: parseInt(parsed['序号'], 10),
            日期: parsed['日期'] || '未知日期',
            标题: parsed['标题'] || '无标题',
            地点: parsed['地点'] || '未知地点',
            人物: parsed['人物'] || '未知人物',
            描述: parsed['描述'] || '',
            人物关系: parsed['人物关系'] || '',
            标签: parsed['标签']
              ? parsed['标签']
                  .replace(/[[\]"]/g, '')
                  .split(',')
                  .map(t => t.trim())
                  .filter(t => t)
              : [],
            重要信息: parsed['重要信息'] || '',
            暗线与伏笔: parsed['暗线与伏笔'] || '',
            自动化系统: parsed['自动化系统'] || '',
          };
        } catch (e) {
          console.error('Failed to parse log block:', block, e);
          return null;
        }
      })
      .filter(log => log && !isNaN(log.序号));

    // De-duplication
    const uniqueLogs = [];
    const seenIds = new Set();
    for (const log of allLogs) {
      if (log && !seenIds.has(log.序号)) {
        seenIds.add(log.序号);
        uniqueLogs.push(log);
      }
    }

    store.worldLog = uniqueLogs.sort((a, b) => a.序号 - b.序号);
    console.log(`[Store] Loaded ${store.worldLog.length} entries from "本世历程" lorebook.`);
  } catch (error) {
    console.error('Error loading world log from lorebook:', error);
    store.worldLog = []; // Reset on error
  }
}

async function fetchCoreData() {
  try {
    const messages = await tavernService.fetchTavernData();
    if (messages && messages.length > 0 && messages[0].data) {
      const rawStateData = messages[0].data.stat_data || messages[0].data;
      const fullMessageContent = messages[0].message;
      const currentMessageId = messages[0].id;
      const oldState = JSON.parse(JSON.stringify(store.worldState)); // Capture state before update

      // 动态识别 userId
      const characters = get(rawStateData, '角色');
      if (characters) {
        const characterIds = Object.keys(characters).filter(id => id && id !== '$meta' && id !== 'sample_npc_id');
        if (characterIds.length > 0) {
          store.userId = characterIds[0];
        }
      }

      try {
        store.worldState = WorldStateSchema.parse(rawStateData) as any;
      } catch (error) {
        console.error('Zod validation failed for rawStateData:', error);
        notificationService.error('数据校验失败', '从后端接收的世界数据格式不正确，请检查控制台。');
        // 即使校验失败，也可能需要保留部分数据以供调试
        store.worldState = rawStateData as any;
      }

      store.character = get(store.worldState, ['角色', store.userId]) || null;

      // After updating the state, compare with the old state for notifications
      checkForChangesAndNotify(oldState, store.worldState);

      const gameTextContent = fullMessageContent?.match(/<gametxt>([\s\S]*?)<\/gametxt>/i)?.[1].trim();

      // 根据当前激活的视图来决定更新哪个叙事状态
      if (gameTextContent) {
        if (store.activeView === 'mainWorld') {
          store.mainWorldNarrative = gameTextContent;
        } else if (store.activeView === 'avatarWorld') {
          store.avatarWorldNarrative = gameTextContent;
        } else {
          // 如果没有明确的视图，默认更新主世界
          store.mainWorldNarrative = gameTextContent;
        }
      }

      // 只有当消息内容发生变化时，才处理所有响应解析
      // 核心修复：只有当消息ID是新的时，才处理所有副作用（如写入世界书）
      if (fullMessageContent && currentMessageId !== lastProcessedMessageId) {
        // 提取并显示所有摘要
        // --- 摘要处理 (新旧格式兼容) ---
        const summaryRegex = /<摘要 a_id="(.+?)">([\s\S]+?)<\/摘要>/g;
        const mainWorldSummaryRegex = /<主世界摘要>([\s\S]+?)<\/主世界摘要>/g;
        const avatarWorldSummaryRegex = /<化身世界摘要>([\s\S]+?)<\/化身世界摘要>/g;
        let match;

        const formatWorldTime = (time: any): string => {
          if (!time) return new Date().toLocaleString('zh-CN', { hour12: false }); // Fallback

          const era = get(time, '纪元名称', '');
          const year = get(time, '年', '----');
          const month = String(get(time, '月', '--')).padStart(2, '0');
          const day = String(get(time, '日', '--')).padStart(2, '0');
          const hour = String(get(time, '时', '--')).padStart(2, '0');
          const minute = String(get(time, '分', '--')).padStart(2, '0');

          return `${era} ${year}年${month}月${day}日 ${hour}:${minute}`;
        };

        const processAndWriteSummary = async (
          content: string,
          entryName: string,
          toastrTitle: string,
          timestamp: string,
        ) => {
          // 检查摘要是否重复
          const existingSummaries = await lorebookService.readFromLorebook(entryName);
          if (existingSummaries && existingSummaries.includes(content)) {
            console.log(`[Actions] Summary content already exists in "${entryName}". Skipping.`);
            return;
          }
          notificationService.info(toastrTitle, content);
          const formattedSummary = `【${timestamp}】\n${content}`;
          await lorebookService.appendToEntry(entryName, formattedSummary, '\n\n---\n\n');
        };

        // 新格式: <摘要 a_id="...">
        while ((match = summaryRegex.exec(fullMessageContent)) !== null) {
          const worldId = match[1];
          const summaryContent = match[2].trim();
          const world = get(store.worldState, `世界.${worldId}`);
          if (world) {
            const worldName = get(world, '名称', '未知世界');
            const location = get(world, '状态.定位[0]');
            const entryName = location === '主世界' ? '[系统]主世界摘要' : '[系统]化身世界摘要';
            const worldTime = formatWorldTime(get(world, '状态.当前时间'));
            await processAndWriteSummary(summaryContent, entryName, `${worldName} 动态`, worldTime);
          }
        }

        // 旧格式: <主世界摘要> / <化身世界摘要>
        if ((match = mainWorldSummaryRegex.exec(fullMessageContent)) !== null) {
          const mainWorld = Object.values(get(store.worldState, '世界', {})).find(
            (w: any) => get(w, '状态.定位[0]') === '主世界',
          );
          const worldTime = formatWorldTime(get(mainWorld, '状态.当前时间'));
          await processAndWriteSummary(match[1].trim(), '[系统]主世界摘要', '主世界动态', worldTime);
        }
        if ((match = avatarWorldSummaryRegex.exec(fullMessageContent)) !== null) {
          const avatarWorld = Object.values(get(store.worldState, '世界', {})).find(
            (w: any) => get(w, '状态.定位[0]') === '当前化身世界',
          );
          const worldTime = formatWorldTime(get(avatarWorld, '状态.当前时间'));
          await processAndWriteSummary(match[1].trim(), '[系统]化身世界摘要', '化身世界动态', worldTime);
        }

        // 3. 提取并处理可选化身
        const avatarOptionsMatch = fullMessageContent.match(/<可选化身>([\s\S]+?)<\/可选化身>/i);
        if (avatarOptionsMatch) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(`<root>${avatarOptionsMatch[1]}</root>`, 'application/xml');
          const avatars = Array.from(xmlDoc.getElementsByTagName('化身')).map(el => {
            return {
              姓名: el.getElementsByTagName('姓名')[0]?.textContent || '未知',
              身份: el.getElementsByTagName('身份')[0]?.textContent || '未知',
              简介: el.getElementsByTagName('简介')[0]?.textContent || '未知',
            };
          });
          store.reincarnationAvatarOptions = avatars;
        }

        console.log('[Roo Debug] fetchCoreData: New message content detected. Processing world tags...');
        console.log('[Roo Debug] fetchCoreData: New message content detected. Processing world tags...');

        const mainWorldRegex = /<主世界>([\s\S]*?)<\/主世界>/g;
        const newWorldRegex = /<新世界>([\s\S]*?)<\/新世界>/g;
        const worldLogRegex = /<世界日志>([\s\S]+?)<\/世界日志>/g;
        const processLogRegex = /<本世历程>([\s\S]+?)<\/本世历程>/g;
        const settlementRegex = /<往世涟漪>([\s\S]+?)<\/往世涟漪>/g;
        const mainWorldUpdateRegex = /<主世界修改>([\s\S]+?)<\/主世界修改>/g;
        const avatarWorldUpdateRegex = /<化身世界修改>([\s\S]+?)<\/化身世界修改>/g;

        const parseAndCreateWorldEntry = async (blockContent: string) => {
          const content = blockContent.trim();
          let worldName: string | null = null;
          let worldId: string | null = null;
          let worldScale = '未知';
          let worldComplexity = '未知';

          try {
            // 优先尝试使用YAML解析器
            const parsedData = parseSimpleYaml(content);
            if (parsedData && parsedData['基础信息']) {
              worldName = parsedData['基础信息']['名称'] || null;
              worldId = parsedData['基础信息']['ID'] || null;
            }
            if (parsedData && parsedData['规则']) {
              worldScale = parsedData['规则']['物理尺度'] || '未知';
              worldComplexity = parsedData['规则']['世界能级'] || '未知';
            }
          } catch (e) {
            console.warn('[Actions] YAML parsing failed, falling back to regex.', e);
          }

          // 如果YAML解析失败或未找到信息，则回退到正则表达式
          if (!worldName || !worldId) {
            const nameMatch = content.match(/(?:世界名称\||名称:\s)(.*?)\n/);
            const idMatch = content.match(/(?:世界ID\||ID:\s)(.*?)\n/);
            const scaleMatch = content.match(/(?:规模\||物理尺度:\s)(.*?)\n/);
            const complexityMatch = content.match(/(?:复杂度\||世界能级:\s)(.*?)\n/);

            worldName = nameMatch ? nameMatch[1].trim() : worldName;
            worldId = idMatch ? idMatch[1].trim() : worldId;
            worldScale = scaleMatch ? scaleMatch[1].trim() : worldScale;
            worldComplexity = complexityMatch ? complexityMatch[1].trim() : worldComplexity;
          }

          const entryName = `【诸天】${worldName || worldId || '未知世界'}`;

          console.log(
            `[Actions] Parsing world entry: ID=${worldId}, Name=${worldName}, Scale=${worldScale}, Complexity=${worldComplexity}`,
          );

          const existingEntry = await lorebookService.readFromLorebook(entryName);
          if (!existingEntry) {
            console.log(`[Actions] Creating new worldbook entry: "${entryName}"`);
            // 写入完整的自动化规则内容
            await lorebookService.writeToLorebook(entryName, content, { isEnabled: false, keys: [entryName] });
          }
        };

        if ((match = mainWorldRegex.exec(fullMessageContent)) !== null) {
          const mainWorldContent = match[1].trim();
          console.log('[Actions] Found <主世界> tag. Overwriting "主世界" lorebook entry.');
          await lorebookService.writeToLorebook('主世界', mainWorldContent, { isEnabled: true, keys: ['主世界'] });
        }

        if ((match = newWorldRegex.exec(fullMessageContent)) !== null) {
          const allWorldsContent = match[1].trim();
          const worldBlocks = allWorldsContent.split(/(?=世界ID\|)/g).filter(b => b.trim());

          for (const block of worldBlocks) {
            const nameMatch = block.match(/世界名称\|(.*?)\n/);
            const idMatch = block.match(/世界ID\|(.*?)\n/);
            const worldName = nameMatch ? nameMatch[1].trim() : null;
            const worldId = idMatch ? idMatch[1].trim() : null;
            const entryName = `【诸天】${worldName || worldId || '未知世界'}`;

            // 只提取并录入`自动化规则`之后的内容
            const automationRuleMatch = block.match(/自动化规则:([\s\S]*)/);
            let contentToWrite = block; // 默认为整个块
            if (automationRuleMatch && automationRuleMatch[1]) {
              contentToWrite = `自动化规则:${automationRuleMatch[1]}`;
            }

            const allEntries = await lorebookService.getEntries(true);
            const existingEntry = allEntries.find((e: any) => e.name === entryName || e.comment === entryName);

            if (existingEntry) {
              await lorebookService.writeToLorebook(entryName, contentToWrite, {
                isEnabled: existingEntry.enabled,
                keys: existingEntry.keys,
              });
            } else {
              await lorebookService.writeToLorebook(entryName, contentToWrite, { isEnabled: false, keys: [entryName] });
            }
          }
        }

        if ((match = worldLogRegex.exec(fullMessageContent)) !== null) {
          const newLog = match[1].trim();
          const existingLogs = await lorebookService.readFromLorebook('世界日志');
          if (!existingLogs || !existingLogs.includes(newLog)) {
            await lorebookService.appendToEntry('世界日志', newLog);
          }
        }

        // 解析 <本世历程>
        while ((match = processLogRegex.exec(fullMessageContent)) !== null) {
          const block = parseBlock(match[1]);
          const newLogEntry: any = {
            ...block,
            序号: parseInt(block['序号'], 10),
            标签: block['标签']
              ? block['标签']
                  .replace(/[[\]"]/g, '')
                  .split(',')
                  .map(t => t.trim())
                  .filter(t => t)
              : [],
          };

          // 检查日志是否已存在
          const isDuplicate = store.worldLog.some(log => log.序号 === newLogEntry.序号);
          if (!isDuplicate) {
            store.worldLog.push(newLogEntry);
          }
        }
        // 按序号排序
        store.worldLog.sort((a, b) => a.序号 - b.序号);

        // 优化：只追加新的日志，而不是重写整个文件
        const latestLog = store.worldLog.length > 0 ? store.worldLog[store.worldLog.length - 1] : null;
        if (latestLog) {
          const existingLogs = await lorebookService.readFromLorebook('本世历程');
          const newLogContent = Object.entries(latestLog)
            .map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return `${key}|${JSON.stringify(value, null, 2)}`;
              }
              return `${key}|${value}`;
            })
            .join('\n');

          if (!existingLogs || !existingLogs.includes(`序号|${latestLog.序号}`)) {
            console.log(`[Actions] Appending new log (序号: ${latestLog.序号}) to "本世历程".`);
            await lorebookService.appendToEntry('本世历程', newLogContent, '\n\n---\n\n');
          }
        }

        // 解析 <往世涟漪>
        if ((match = settlementRegex.exec(fullMessageContent)) !== null) {
          const block = parseBlock(match[1]);
          const settlementData = {
            第x世: parseInt(block['第x世'], 10) || 0,
            事件脉络: block['事件脉络'] || '',
            本世概述: block['本世概述'] || '',
            本世成就: block['本世成就'] || '',
            本世获得物品: block['本世获得物品'] || '',
            本世人物关系网: block['本世人物关系网'] || '',
            死亡原因: block['死亡原因'] || '',
            本世总结: block['本世总结'] || '',
            本世评价: block['本世评价'] || '',
          };
          store.settlementData = settlementData;

          // 写入“往世涟漪”到世界书
          const settlementContent = Object.entries(settlementData)
            .map(([key, value]) => `${key}|${value}`)
            .join('\n');
          await lorebookService.writeToLorebook('往世涟漪', settlementContent, { isEnabled: true, keys: ['往世涟漪'] });

          // 清空“本世历程”
          await lorebookService.writeToLorebook('本世历程', '', { isEnabled: true, keys: ['本世历程'] });
          store.worldLog = []; // 同时清空前端状态
        }

        // --- 世界书修改指令处理 ---
        if ((match = mainWorldUpdateRegex.exec(fullMessageContent)) !== null) {
          console.log('[Actions] Found <主世界修改> tag. Applying modifications...');
          await worldUpdateService.applyModifications(match[1].trim(), '主世界');
        }
        if ((match = avatarWorldUpdateRegex.exec(fullMessageContent)) !== null) {
          console.log('[Actions] Found <化身世界修改> tag. Applying modifications...');
          await worldUpdateService.applyModifications(match[1].trim(), '化身世界');
        }

        await syncWorldEntries();

        // 核心修复：在处理完所有指令后，更新最后处理的消息ID
        lastProcessedMessageId = currentMessageId;

        // 自动更新世界记忆系统
        await memoryService.updateMemory(store.worldLog);
      }
    }
  } catch (error) {
    console.error('获取核心数据时出错:', error);
  }
}

async function syncWorldEntries() {
  console.log('[Roo Debug] Syncing world entries based on World ID...');
  const worlds = get(store.worldState, '世界', {}) as { [id: string]: any };
  const allEntries = await lorebookService.getEntries(true); // Force refresh cache
  if (!allEntries) return;

  // 归档“化身世界”
  const avatarWorldEntry = allEntries.find((e: any) => e.name === '化身世界');
  if (avatarWorldEntry && avatarWorldEntry.content && avatarWorldEntry.content.trim() !== '') {
    const idMatch = avatarWorldEntry.content.match(/ID:\s*(\S+)/);
    const nameMatch = avatarWorldEntry.content.match(/名称:\s*(.*)/);
    if (idMatch && nameMatch) {
      const worldId = idMatch[1].trim();
      const worldName = nameMatch[1].trim();
      const targetEntryName = `【诸天】${worldName || worldId}`;

      console.log(`[Actions] Archiving '化身世界' to '${targetEntryName}'...`);

      // 写入或覆盖目标条目
      await lorebookService.writeToLorebook(targetEntryName, avatarWorldEntry.content, {
        isEnabled: false, // 归档后默认禁用
        keys: [targetEntryName],
      });

      // 清空“化身世界”
      await lorebookService.writeToLorebook('化身世界', '', { isEnabled: true, keys: ['化身世界'] });
      console.log(`[Actions] '化身世界' has been cleared and archived.`);
    }
  }

  // --- 原有的新世界同步逻辑 ---
  const worldIdToLocation: { [id: string]: string } = {};
  for (const worldId in worlds) {
    if (worldId === '$meta') continue;
    const location = get(worlds[worldId], '状态.定位[0]');
    if (location === '主世界' || location === '当前化身世界') {
      worldIdToLocation[worldId] = location;
    }
  }

  for (const sourceEntry of allEntries) {
    const entryIdentifier = (sourceEntry as any).comment || sourceEntry.name;
    if (!entryIdentifier || typeof entryIdentifier !== 'string' || !entryIdentifier.startsWith('【诸天】')) {
      continue;
    }
    if (!sourceEntry.content) continue;

    const match = sourceEntry.content.match(/ID:\s*(\S+)/);
    if (match && match[1]) {
      const entryWorldId = match[1].trim();
      const location = worldIdToLocation[entryWorldId];

      if (location) {
        const targetEntryName = location === '主世界' ? '主世界' : '化身世界';
        if (entryIdentifier !== targetEntryName) {
          console.log(`[Roo Debug] Found match: Moving content from "${entryIdentifier}" to "${targetEntryName}"`);
          await lorebookService.writeToLorebook(targetEntryName, sourceEntry.content, {
            isEnabled: true,
            keys: [targetEntryName],
          });
          await lorebookService.writeToLorebook(entryIdentifier, '', { isEnabled: false, keys: [entryIdentifier] });
          delete worldIdToLocation[entryWorldId];
        }
      }
    }
  }
}

async function loadAllData() {
  // Load the full log history only on the first run
  if (!isLogHistoryLoaded) {
    await loadWorldLogFromLorebook();
    isLogHistoryLoaded = true;
  }

  await fetchCoreData();
  // Force a refresh of the lorebook cache after fetching new data
  await lorebookService.getEntries(true);
  store.isReady = true;
  console.log('[Store] Core data loaded and lorebook cache refreshed.');
}

/**
 * 处理带前缀的用户行动指令
 * @param prefixedInput 带有【主世界】或【化身世界】前缀的用户输入
 */
async function processAiResponse(response: string, prefixedInput: string) {
  if (!response) return;

  // 1. 提取并更新叙事文本
  const gameTextMatch = response.match(/<gametxt>([\s\S]+?)<\/gametxt>/i);
  const narrative = gameTextMatch ? gameTextMatch[1].trim() : null;

  if (narrative) {
    if (prefixedInput.startsWith('【主世界】')) {
      store.mainWorldNarrative = narrative;
    } else if (prefixedInput.startsWith('【化身世界】')) {
      store.avatarWorldNarrative = narrative;
    } else {
      store.mainWorldNarrative = narrative;
    }
  } else {
    // 如果AI的回复中没有gametxt（例如在创世或身份选择阶段），则尝试恢复缓存的叙事
    const cachedNarrative = workflowService.popNarrative();
    if (cachedNarrative) {
      if (store.activeView === 'mainWorld') {
        store.mainWorldNarrative = cachedNarrative;
      } else {
        store.avatarWorldNarrative = cachedNarrative;
      }
    }
  }

  // 2. 提取并显示所有摘要
  const summaryRegex = /<摘要 a_id="(.+?)">([\s\S]+?)<\/摘要>/g;
  let summaryMatch;
  while ((summaryMatch = summaryRegex.exec(response)) !== null) {
    const worldId = summaryMatch[1];
    const summaryContent = summaryMatch[2];
    const worldName = get(store.worldState, `世界.${worldId}.名称`, '未知世界');
    notificationService.info(`${worldName} 动态`, summaryContent);
  }

  // 3. 提取并处理可选化身
  const avatarOptionsMatch = response.match(/<可选化身>([\s\S]+?)<\/可选化身>/i);
  if (avatarOptionsMatch) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(`<root>${avatarOptionsMatch[1]}</root>`, 'application/xml');
    const avatars = Array.from(xmlDoc.getElementsByTagName('化身')).map(el => {
      return {
        姓名: el.getElementsByTagName('姓名')[0]?.textContent || '未知',
        身份: el.getElementsByTagName('身份')[0]?.textContent || '未知',
        简介: el.getElementsByTagName('简介')[0]?.textContent || '未知',
      };
    });
    store.reincarnationAvatarOptions = avatars;

    // 可以在这里自动切换到“可选化身”标签页
    // 但为了更好的控制，暂时只缓存数据
  }

  // 注意：世界书标签的处理逻辑已移至 fetchCoreData，以捕获轮询更新
  // 这里保留变量更新脚本的处理

  // 4. 提取并执行变量更新脚本
  const updateScriptMatch = response.match(/<UpdateVariable>([\s\S]+?)<\/UpdateVariable>/i);
  let updateScript = updateScriptMatch ? updateScriptMatch[1].trim() : null;

  // 暂存逻辑：如果回复中包含 gametxt 或 updateScript，则进行缓存
  if (narrative) {
    workflowService.cacheNarrative(narrative);
  }
  if (updateScript) {
    workflowService.cacheUpdateScript(updateScript);
  }

  // [Roo-Fix] 移除错误的恢复逻辑，拼接操作已移至 handleAction
  // // 恢复逻辑：如果回复中没有 gametxt，则尝试恢复缓存
  // if (!narrative) {
  //   const cachedNarrative = workflowService.popNarrative();
  //   if (cachedNarrative) {
  //     if (store.activeView === 'mainWorld') {
  //       store.mainWorldNarrative = cachedNarrative;
  //     } else {
  //       store.avatarWorldNarrative = cachedNarrative;
  //     }
  //   }
  // }

  // 执行脚本逻辑：现在总是在 processAiResponse 中执行
  if (updateScript) {
    // [PATCH] 修复AI错误地对'当前时间'对象的原始值属性使用数组索引[0]的问题
    // 使用字符串操作替代正则表达式，避免构建时错误
    const scriptLines = updateScript.split('\n');
    const patchedLines = scriptLines.map(line => {
      if (line.includes('.当前时间.') && line.includes('[0]')) {
        return line.replace('[0]', '');
      }
      return line;
    });
    const patchedScript = patchedLines.join('\n');
    if (patchedScript !== updateScript) {
      console.log('[PATCH] Corrected invalid [0] access in UpdateVariable script for 当前时间.');
      updateScript = patchedScript;
    }

    // [PATCH] 解决因指令执行顺序问题导致的 "Cannot assign into path" 错误
    const commands = updateScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(Boolean);
    const creationCommands = commands.filter(cmd => cmd.startsWith("_.assign('角色',"));
    const relationCommands = commands.filter(cmd => cmd.startsWith("_.assign('角色.") && cmd.includes(".人际关系'"));
    const otherCommands = commands.filter(cmd => !creationCommands.includes(cmd) && !relationCommands.includes(cmd));

    const sortedScript = [...creationCommands, ...relationCommands, ...otherCommands].join(';\n') + ';';

    if (sortedScript !== updateScript) {
      console.log('[PATCH] Reordered UpdateVariable script to ensure correct execution order.');
      updateScript = sortedScript;
    }

    const latestState = (await tavernService.fetchTavernData())?.[0]?.data ?? store.worldState;
    const oldState = JSON.parse(JSON.stringify(store.worldState)); // Deep copy for comparison
    const newVariables = await tavernService.invokeMvuScript(updateScript, latestState);
    if (newVariables) {
      try {
        store.worldState = WorldStateSchema.parse(newVariables) as any;
      } catch (error) {
        console.error('Zod validation failed for newVariables from MVU script:', error);
        notificationService.error('数据校验失败', '变量更新脚本返回的数据格式不正确，请检查控制台。');
        // 即使校验失败，也可能需要保留部分数据以供调试
        store.worldState = newVariables as any;
      }
      store.character = get(store.worldState, ['角色', store.userId]) || null;
      checkForChangesAndNotify(oldState, store.worldState);
    }
  }
}

async function handleAction(actionText: string) {
  if (!actionText.trim()) return;
  if (!store.isReady) await loadAllData();

  store.isGenerating = true;
  try {
    const currentState = workflowService.getCurrentState();

    // 1. 只发送原始指令给AI
    const aiResponseString = await tavernService.generateAiResponse(actionText);

    // 2. 检查是否需要拼接缓存内容
    const preservedContent = workflowService.popPreservedContent();
    const finalResponseString = aiResponseString + preservedContent;

    // 3. 使用拼接后的完整响应进行后续处理
    await processAiResponse(finalResponseString, actionText);

    // 5. 更新世界记忆系统
    await memoryService.updateMemory(store.worldLog);

    // 6. 保存拼接后的完整响应到消息记录
    const messages = await tavernService.fetchTavernData();
    if (messages && messages.length > 0) {
      const messageZero = messages[0];
      messageZero.message = finalResponseString; // 保存拼接后的完整响应
      messageZero.data = JSON.parse(JSON.stringify(store.worldState));
      await TavernHelper.setChatMessages([messageZero], { refresh: 'none' });
    }

    // 关键修复：如果是在创世流程后，则自动重新加载页面
    // 新增：在常规输入提交后，也执行页面重载
    if (currentState === 'CREATION' || currentState === 'NORMAL') {
      window.location.reload();
    }
  } catch (error) {
    console.error('处理动作时出错:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    store.generationError = `AI响应失败: ${errorMessage}`;
    notificationService.error('操作失败', '与AI交互失败，请检查控制台。');
  } finally {
    // 延迟一小段时间再关闭加载界面，以便用户能看到错误信息
    if (store.generationError) {
      setTimeout(() => {
        store.isGenerating = false;
        store.generationError = null; // 重置错误状态
      }, 5000);
    } else {
      store.isGenerating = false;
    }
  }
}

let isInitialized = false;

import { silentUpdater } from '../services/updater';

function initializeEventListeners() {
  if (isInitialized) return;
  console.log('[Store] Initializing data synchronization...');

  // 监听AI生成结束事件
  eventOn(tavern_events.GENERATION_ENDED, async () => {
    console.log('[Store] Generation ended. Fetching all data.');
    await loadAllData();
  });

  // 启动静默更新轮询
  silentUpdater.start(loadAllData, 5000); // 5秒轮询一次

  isInitialized = true;
  console.log('[Store] Data synchronization listeners and polling are active.');
}

async function fetchReincarnationWorlds() {
  // 如果模拟正在进行中，或者已经有选项了，则不重新获取
  if (isSimulationRunning.value || store.reincarnationWorldOptions.length > 0) {
    return;
  }

  const allWorlds = await lorebookService.getEntries();
  if (!allWorlds) {
    return;
  }

  const zhutianWorlds = allWorlds.filter((w: WorldbookEntry) => {
    const name = w.name || (w as any).comment || '';
    return name.startsWith('【诸天】') && w.content && w.content.trim() !== '';
  });
  const randomWorlds = zhutianWorlds.sort(() => 0.5 - Math.random()).slice(0, 3);

  const parseJson = (jsonString: string) => {
    try {
      const cleanedString = jsonString.trim().replace(/,$/, '');
      return JSON.parse(cleanedString);
    } catch {
      return null;
    }
  };

  // 直接缓存完整的世界书条目对象
  store.reincarnationWorldOptions = randomWorlds;
}

function resetReincarnationSelection() {
  store.reincarnationWorldOptions = [];
  store.selectedWorldForReincarnation = null;
  console.log('[Actions] Reincarnation selection has been reset.');
}

async function prepareReincarnation(world: WorldbookEntry) {
  if (world) {
    const worldIdMatch = world.content.match(/ID:\s*(.*)/);
    if (worldIdMatch && worldIdMatch[1]) {
      const worldId = worldIdMatch[1].trim();
      const command = `<轮回行动 世界ID="${worldId}">`;
      // 核心修复：直接执行指令，而不是加入队列
      handleAction(command);
      store.selectedWorldForReincarnation = world; // 更新选中的世界
      notificationService.success('准备轮回', `已发送轮回指令【${world.name || worldId}】`);
    } else {
      notificationService.error('错误', '无法从世界书中解析出世界ID。');
    }
  }
}

async function clearSettlementData() {
  const script = `
    _.set('模拟器.结算.待处理', false);
    _.set('模拟器.结算.宿命抉择', {});
  `;
  try {
    const latestState = (await tavernService.fetchTavernData())?.[0]?.data ?? store.worldState;
    const newVariables = await tavernService.invokeMvuScript(script, latestState);
    if (newVariables) {
      store.worldState = newVariables;
      notificationService.success('结算完成', '轮回结算数据已清除。');
    }
  } catch (error) {
    console.error('Failed to clear settlement data:', error);
    notificationService.error('操作失败', '清除结算数据时出错。');
  }
}

export const actions = {
  loadAllData,
  handleAction,
  initializeEventListeners,
  fetchReincarnationWorlds,
  prepareReincarnation,
  clearSettlementData,
  triggerCreationWorkflow: async () => {
    console.log('[Actions] Triggering CREATION workflow...');
    // 1. 暂存当前 gametxt
    const currentNarrative = store.activeView === 'mainWorld' ? store.mainWorldNarrative : store.avatarWorldNarrative;
    if (currentNarrative) {
      workflowService.cacheNarrative(currentNarrative);
    }
    // 2. 切换到创世CoT
    await workflowService.switchTo('CREATION');
    workflowService.setPreserveMode('gametxt'); // 设置为只保存 gametxt
    // 关键修复：在切换CoT后，强制刷新一次世界书缓存，以确保酒馆助手能立即应用新的CoT
    await lorebookService.getEntries(true);
    // 3. 立即执行指令
    notificationService.info('创世', '已发送“重演天机”指令，等待AI创造新世界...');
    await handleAction('<重演天机>');
  },
  triggerIdentityWorkflow: async (world: WorldbookEntry) => {
    console.log('[Actions] Triggering IDENTITY workflow...');
    // 1. 暂存当前 gametxt
    const currentNarrative = store.activeView === 'mainWorld' ? store.mainWorldNarrative : store.avatarWorldNarrative;
    if (currentNarrative) {
      workflowService.cacheNarrative(currentNarrative);
    }
    // 2. 切换到身份CoT
    await workflowService.switchTo('IDENTITY');
    workflowService.setPreserveMode('full'); // 设置为保存 gametxt 和 UpdateVariable
    // 关键：在切换CoT后，立即将被选中的世界内容写入“化身世界”条目
    if (world && world.content) {
      await lorebookService.writeToLorebook('化身世界', world.content, { isEnabled: true, keys: ['化身世界'] });
      // 同时清空并禁用源条目
      const sourceEntryName = world.name || world.comment || '';
      if (sourceEntryName) {
        await lorebookService.writeToLorebook(sourceEntryName, '', { isEnabled: false, keys: [sourceEntryName] });
      }
    }
    // 3. 发送指令（此处的指令已在 prepareReincarnation 中处理）
    await prepareReincarnation(world);
  },
  selectAvatarAndStart: async (avatarName: string) => {
    console.log(`[Actions] Avatar "${avatarName}" selected. Switching to NORMAL workflow and sending action...`);

    // 1. 暂存当前 gametxt (如果需要)
    const currentNarrative = store.activeView === 'mainWorld' ? store.mainWorldNarrative : store.avatarWorldNarrative;
    if (currentNarrative) {
      workflowService.cacheNarrative(currentNarrative);
    }

    // 2. 切换回常规CoT
    await workflowService.switchTo('NORMAL');

    // 关键修复：在切换CoT后，强制刷新一次世界书缓存，以确保酒馆助手能立即应用新的CoT
    await lorebookService.getEntries(true);

    // 3. 构造并直接发送指令
    const command = `<选择化身 “${avatarName}”>`;
    notificationService.info('轮回开始', `已选定化身【${avatarName}】，轮回开始...`);

    // 4. 直接调用 handleAction
    await handleAction(command);

    // 5. 清理化身选择
    store.reincarnationAvatarOptions = [];
  },
  setActiveView(view: 'mainWorld' | 'avatarWorld') {
    store.activeView = view;
  },
  switchFocus(targetWorld: 'mainWorld' | 'avatarWorld') {
    // 立即更新前端视图状态以获得即时反馈
    store.activeView = targetWorld;

    const targetName = targetWorld === 'mainWorld' ? '主世界' : '化身世界';
    const command = `<意识切换至 ${targetName}>`;
    commandService.addCommand(command);
    notificationService.info('行动队列', `已将“意识切换至${targetName}”加入行动队列`);
  },
  // 添加占位方法以修复编译错误
  addActionToQueue(action: any) {
    console.warn('[Actions] addActionToQueue is not implemented yet.', action);
  },
  resetReincarnationSelection,
};

/**
 * 提取键值对的辅助函数
 */
function parseBlock(block: string): { [key: string]: string } {
  const data: { [key: string]: string } = {};
  const lines = block.trim().split('\n');
  let currentKey = '';
  for (const line of lines) {
    const separatorIndex = line.indexOf('|');
    if (separatorIndex !== -1) {
      // This line defines a new key-value pair
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      data[key] = value;
      currentKey = key;
    } else if (currentKey && line.trim()) {
      // This is a continuation of the previous key's value. Append with a newline.
      // The `.trim()` check prevents adding empty lines.
      data[currentKey] += '\n' + line;
    }
  }
  // Trim the final value for each key to remove leading/trailing whitespace from multi-line content
  for (const key in data) {
    data[key] = data[key].trim();
  }
  return data;
}
