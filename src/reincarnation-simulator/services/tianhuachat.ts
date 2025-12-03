/**
 * @file TianhuaChat-specific services
 * This module handles the business logic related to the TianhuaChat app,
 * such as processing chat messages, contacts, and moments from the raw world state.
 */

import { get } from 'lodash';
import { store } from '../store/state';
import { Character, ContactGroup } from '../types/character';
import { getCharacterById, safeGetValue } from '../utils/character-utils';


import { lorebookService } from './LorebookService';
import { parseSocialData } from './SocialDataParser';

export async function getGroupedContacts(): Promise<ContactGroup[]> {
    if (!store.worldState) return [];
    const allCharacters = get(store.worldState, '角色', {}) as { [id: string]: Character };
    const currentUserRelations = get(allCharacters, `${store.userId}.人际关系`, {}) as { [id: string]: any };

    const groups: { [key: string]: any[] } = {
        '新的朋友': [],
        '群聊': [],
        '我的同学': [],
        '我的好友': [],
        '黑名单': [],
    };

    // 1. Iterate through ALL characters to find who has a special relationship TO the user
    Object.keys(allCharacters).filter(id => id !== store.userId && id !== '$meta').forEach(id => {
        const character = allCharacters[id];
        if (!character) return;

        const contactData = {
            id: id,
            name: `${safeGetValue(character, '姓', '', true)}${safeGetValue(character, '名', '', true)}` || id,
            avatarName: safeGetValue(character, '姓', '?', true),
            signature: safeGetValue(character, '签名', '...', true),
        };

        // Check THEIR relationship status TO the user for friend requests
        const theirRelationToUser = get(character, `人际关系.${store.userId}`);
        if (theirRelationToUser) {
            const statusToUser = safeGetValue(theirRelationToUser, '聊天状态', '陌生人', true);
            if (statusToUser === '待确认好友') {
                groups['新的朋友'].push(contactData);
            }
        }

        // Check the USER's relationship status TO them for friend list
        const userRelationToThem = currentUserRelations[id];
        if (userRelationToThem) {
            const status = safeGetValue(userRelationToThem, '聊天状态', '陌生人', true);
            if (status === '好友') {
                const userClass = safeGetValue(allCharacters[store.userId], '班级', null, true);
                const charClass = safeGetValue(character, '班级', null, true);
                if (userClass && charClass && userClass === charClass) {
                    groups['我的同学'].push(contactData);
                } else {
                    groups['我的好友'].push(contactData);
                }
            } else if (status === '黑名单') {
                groups['黑名单'].push(contactData);
            }
        }
    });

    // 2. Group Chats from Lorebook
    // 2. Group Chats from Lorebook, using the standardized parser
    const groupChatContent = await lorebookService.readFromLorebook('聊天群组-主');
    const parsedGroups = parseSocialData(groupChatContent);
    
    groups['群聊'] = parsedGroups
        .filter(g => g.ID && g.群名称)
        .map(g => ({
            id: g.ID,
            name: g.群名称,
            isGroup: true,
            avatarName: g.群名称 || '群',
            signature: `${(g.成员 || []).length}个成员`,
        }));
    

    // Sort contacts within each group
    for (const groupName in groups) {
        groups[groupName].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN-u-co-pinyin'));
    }

    return Object.entries(groups)
        .filter(([, contacts]) => contacts.length > 0)
        .map(([name, contacts]) => ({ name, contacts }));
}
