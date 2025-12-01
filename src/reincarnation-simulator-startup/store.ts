import { reactive } from 'vue';
import { loadCustomData, saveCustomData } from './services/PersistenceService';

// --- 数据持久化 ---
const CUSTOM_DATA_TYPES = [
  'blueprints',
  'tones',
  'tags',
  'relics',
  'identities',
  'talents',
  'past_experiences',
  'character_traits',
  'core_needs',
  'arts',
  'consumables',
  'artifacts',
  'materials',
];

export function getCustomData() {
  const customData: { [key: string]: any[] } = {};
  for (const type of CUSTOM_DATA_TYPES) {
    customData[type] = (GAME_DATA[type as keyof typeof GAME_DATA] as any[]).filter(item => item.custom);
  }
  return customData;
}

function applyCustomData() {
  const loadedData = loadCustomData();
  for (const type in loadedData) {
    const key = type as keyof typeof loadedData;
    if (CUSTOM_DATA_TYPES.includes(key) && Array.isArray(loadedData[key])) {
      const uniqueItems = loadedData[key]!.filter(
        (item: any) => !(GAME_DATA[key as keyof typeof GAME_DATA] as any[]).some(existing => existing.id === item.id),
      );
      (GAME_DATA[key as keyof typeof GAME_DATA] as any[]).push(...uniqueItems);
    }
  }
}
// --- End ---

export const GAME_DATA = reactive({
  difficulties: [
    { id: 'mortal', name: '凡人', points: 120 },
    { id: 'hero', name: '英雄', points: 100 },
    { id: 'legend', name: '传奇', points: 80 },
    { id: 'creator', name: '创世神', points: 999 },
  ],
  blueprints: [
    {
      id: 'bp-standard',
      name: '标准宇宙',
      desc: '一个统一、连续的物理时空。',
      cost: 0,
      scale_points: 2,
      complexity_points: 2,
    },
    {
      id: 'bp-crystal-wall',
      name: '晶壁系',
      desc: '世界被包裹在水晶球中，漂浮于燃素之海。',
      cost: 5,
      scale_points: -1,
      complexity_points: 4,
    },
    {
      id: 'bp-multiverse',
      name: '多次元宇宙',
      desc: '无数个相似但历史不同的平行宇宙。',
      cost: 10,
      scale_points: 5,
      complexity_points: 5,
    },
    {
      id: 'bp-planar',
      name: '位面宇宙',
      desc: '由主物质位面和多个附属位面构成。',
      cost: 5,
      scale_points: 1,
      complexity_points: 4,
    },
    {
      id: 'bp-myriad',
      name: '诸天万界',
      desc: '无数小世界如气泡般在混沌中生灭。',
      cost: 5,
      scale_points: -2,
      complexity_points: 5,
    },
  ],
  tones: [
    {
      id: 'tone-xiuxian',
      name: '修仙文明',
      desc: '御剑飞仙，炼丹求长生。',
      color: '#4CAF50',
      cost: 0,
      scale_points: 3,
      complexity_points: 3,
    },
    {
      id: 'tone-magic',
      name: '魔法文明',
      desc: '掌控元素，构建奥术奇迹。',
      color: '#2196F3',
      cost: 0,
      scale_points: 2,
      complexity_points: 3,
    },
    {
      id: 'tone-tech',
      name: '科技文明',
      desc: '基因飞升，机械殖民星海。',
      color: '#E91E63',
      cost: 0,
      scale_points: 5,
      complexity_points: 4,
    },
    {
      id: 'tone-esper',
      name: '异能文明',
      desc: '人人皆有异能，精神干涉物质。',
      cost: 0,
      scale_points: 2,
      complexity_points: 4,
    },
    {
      id: 'tone-steampunk',
      name: '蒸汽朋克文明',
      desc: '机械与蒸汽的轰鸣，差分机与飞空艇的浪漫。',
      cost: 0,
      scale_points: 2,
      complexity_points: 2,
    },
    {
      id: 'tone-cthulhu',
      name: '克苏鲁神话',
      desc: '宇宙的真相不可名状，知识本身即是疯狂的源头。',
      cost: 0,
      scale_points: 4,
      complexity_points: 5,
    },
    {
      id: 'tone-martial-arts',
      name: '武道文明',
      desc: '打破肉身极限，拳碎星辰，滴血重生。',
      cost: 0,
      scale_points: 5,
      complexity_points: 2,
    },
    {
      id: 'tone-deity',
      name: '神祇文明',
      desc: '信仰汇聚成神，神明行走于大地。',
      cost: 0,
      scale_points: 3,
      complexity_points: 4,
    },
    {
      id: 'tone-yokai',
      name: '妖鬼文明',
      desc: '万物有灵，百鬼夜行，人与非人共存。',
      cost: 0,
      scale_points: 1,
      complexity_points: 3,
    },
  ],
  tags: [
    {
      id: 'tag-end-of-dharma',
      name: '末法时代',
      desc: '天地灵气/能量潮汐退去。',
      cost: -7,
      scale_points: -2,
      complexity_points: 2,
    },
    {
      id: 'tag-ragnarok',
      name: '诸神黄昏',
      desc: '一场灭世战争导致强者尽数陨落。',
      cost: -5,
      scale_points: 0,
      complexity_points: 4,
    },
    {
      id: 'tag-ascension-disaster',
      name: '飞升之灾',
      desc: '高维通道开启，顶尖存在尽数离去。',
      cost: -5,
      scale_points: 1,
      complexity_points: 3,
    },
    {
      id: 'tag-heaven-slumber',
      name: '天道沉睡',
      desc: '世界意志陷入沉睡，法则不再回应。',
      cost: -5,
      scale_points: 0,
      complexity_points: 5,
    },
    {
      id: 'tag-outer-god-invasion',
      name: '外神入侵',
      desc: '不可名状之物污染了世界的根源。',
      cost: -7,
      scale_points: 2,
      complexity_points: 5,
    },
    {
      id: 'tag-dimension-fold',
      name: '维度折叠',
      desc: '世界从高维跌落，法则和地域被压缩。',
      cost: -5,
      scale_points: -3,
      complexity_points: 4,
    },
    {
      id: 'tag-law-collapse',
      name: '法则崩坏',
      desc: '基础规则变得混乱而不稳定。',
      cost: -7,
      scale_points: 1,
      complexity_points: 5,
    },
    {
      id: 'tag-knowledge-curse',
      name: '知识诅咒',
      desc: '某种知识或信息被证实是致命的。',
      cost: -5,
      scale_points: 0,
      complexity_points: 4,
    },
    {
      id: 'tag-resource-exhaustion',
      name: '资源枯竭',
      desc: '驱动文明的关键超凡资源被耗尽。',
      cost: -3,
      scale_points: -1,
      complexity_points: 1,
    },
    {
      id: 'tag-bloodline-decay',
      name: '血脉断绝',
      desc: '能够使用超凡力量的血脉断绝。',
      cost: -3,
      scale_points: -1,
      complexity_points: 2,
    },
    {
      id: 'tag-great-flood',
      name: '灭世洪水',
      desc: '一场席卷全球的洪水，淹没了旧日的文明。',
      cost: -6,
      scale_points: -2,
      complexity_points: 2,
    },
    {
      id: 'tag-ice-age',
      name: '永恒寒冬',
      desc: '世界陷入了无尽的冰河时代。',
      cost: -6,
      scale_points: -2,
      complexity_points: 1,
    },
    {
      id: 'tag-zombie-plague',
      name: '活体瘟疫',
      desc: '一场瘟疫让死者重新站立起来，狩猎生者。',
      cost: -8,
      scale_points: 0,
      complexity_points: 3,
    },
    {
      id: 'tag-ai-rebellion',
      name: '机械叛乱',
      desc: '拥有自我意识的机械生命向其造物主宣战。',
      cost: -8,
      scale_points: 1,
      complexity_points: 4,
    },
  ],
  relics: [
    {
      id: 'relic-cave',
      name: '仙家洞府',
      desc: '隐藏在深山中的修炼宗门遗址。',
      color: '#8BC34A',
      cost: 5,
      scale_points: 1,
      complexity_points: 1,
    },
    {
      id: 'relic-library',
      name: '古代图书馆',
      desc: '收藏着禁忌魔法知识的古老图书馆。',
      color: '#03A9F4',
      cost: 5,
      scale_points: 1,
      complexity_points: 2,
    },
    {
      id: 'relic-mech-city',
      name: '上古机械都市',
      desc: '埋藏于地下的巨型科技城市废墟。',
      color: '#F44336',
      cost: 5,
      scale_points: 2,
      complexity_points: 2,
    },
    {
      id: 'relic-esper-asylum',
      name: '异能者收容所',
      desc: '曾用于研究和收容异能者的秘密设施。',
      cost: 5,
      scale_points: 1,
      complexity_points: 2,
    },
    {
      id: 'relic-dragon-tomb',
      name: '巨龙之墓',
      desc: '埋葬着古龙及其宝藏的巨大骸骨。',
      cost: 8,
      scale_points: 2,
      complexity_points: 2,
    },
    {
      id: 'relic-time-rift',
      name: '时空裂隙',
      desc: '一个连接着未知位面的不稳定通道。',
      cost: 8,
      scale_points: 3,
      complexity_points: 4,
    },
    {
      id: 'relic-gods-chessboard',
      name: '神明棋盘',
      desc: '传说中是古神博弈留下的巨大棋盘。',
      cost: 8,
      scale_points: 3,
      complexity_points: 4,
    },
    {
      id: 'relic-world-tree-root',
      name: '世界之树的根须',
      desc: '贯穿位面的巨树延伸到此地的一小部分。',
      cost: 10,
      scale_points: 5,
      complexity_points: 3,
    },
    {
      id: 'relic-fairy-market',
      name: '妖精的集市',
      desc: '只在特定时间对特定人群开放的秘密集市。',
      cost: 5,
      scale_points: 1,
      complexity_points: 3,
    },
    {
      id: 'relic-hero-cemetery',
      name: '英雄的陵园',
      desc: '埋葬着无数古代英雄，精神依然在此徘徊。',
      cost: 5,
      scale_points: 1,
      complexity_points: 2,
    },
    {
      id: 'relic-forgotten-battlefield',
      name: '被遗忘的战场',
      desc: '诸神黄昏的古战场，残留着强大的武器和怨念。',
      cost: 8,
      scale_points: 2,
      complexity_points: 3,
    },
    {
      id: 'relic-deepsea-palace',
      name: '深海宫殿',
      desc: '沉入海底的古代文明之都。',
      cost: 8,
      scale_points: 2,
      complexity_points: 2,
    },
    {
      id: 'relic-sky-city',
      name: '天空之城',
      desc: '漂浮在云层之上的魔法或科技都市。',
      cost: 10,
      scale_points: 3,
      complexity_points: 2,
    },
    {
      id: 'relic-bio-factory',
      name: '活体工厂',
      desc: '用生物技术“生长”产品的古代工厂。',
      cost: 8,
      scale_points: 1,
      complexity_points: 3,
    },
    {
      id: 'relic-psy-network-node',
      name: '心灵网络节点',
      desc: '覆盖全球的精神网络的一个物理接入点。',
      cost: 8,
      scale_points: 4,
      complexity_points: 3,
    },
    {
      id: 'relic-outer-god-seal',
      name: '旧日支配者封印地',
      desc: '封印着某个古老邪物的禁区。',
      cost: 10,
      scale_points: 3,
      complexity_points: 5,
    },
    {
      id: 'relic-time-ruins',
      name: '时间之墟',
      desc: '时间流速异常，过去、现在、未来交织之地。',
      cost: 10,
      scale_points: 2,
      complexity_points: 5,
    },
    {
      id: 'relic-source-of-all',
      name: '万法之源',
      desc: '一个微小的奇点，泄露着纯粹的创造与毁灭之力。',
      cost: 15,
      scale_points: 5,
      complexity_points: 5,
    },
    {
      id: 'relic-progenitor-blood',
      name: '始祖之血的源头',
      desc: '某个强大超凡种族的诞生之地。',
      cost: 15,
      scale_points: 2,
      complexity_points: 4,
    },
    {
      id: 'relic-well-of-souls',
      name: '轮回之井',
      desc: '传说中灵魂转生必须经过的地方。',
      cost: 15,
      scale_points: 4,
      complexity_points: 5,
    },
  ],
  identities: [
    // --- 通用身份 ---
    { id: 'id-noble', name: '没落贵族后裔', desc: '你的血脉中流淌着昔日强者的力量，但家道中落。', cost: 8 },
    { id: 'id-scavenger', name: '废墟拾荒者', desc: '你在文明的废墟中长大，对危险有敏锐的直觉。', cost: -5 },
    { id: 'id-student', name: '历史系学生', desc: '你对逝去的辉煌时代有着狂热的痴迷和研究。', cost: 5 },
    { id: 'id-hacker', name: '网络黑客', desc: '在数据之海中，你发现了超凡的蛛丝马迹。', cost: 8 },
    { id: 'id-veteran', name: '退役士兵', desc: '你拥有坚定的意志和丰富的战斗经验。', cost: 8 },
    { id: 'id-cultist', name: '秘密社团成员', desc: '你是一个追寻超凡力量的秘密组织的一员。', cost: 10 },
    { id: 'id-artist', name: '街头艺人', desc: '你的艺术拥有触动人心的神秘力量。', cost: 5 },
    { id: 'id-doctor', name: '急诊科医生', desc: '你看惯了生死，心境比常人更加坚韧。', cost: -5 },
    { id: 'id-antique-dealer', name: '古董店老板', desc: '你经手的“古董”中，似乎有些是真品。', cost: 8 },
    { id: 'id-detective', name: '私人侦探', desc: '你专门调查无法用科学解释的“灵异事件”。', cost: 5 },
    { id: 'id-wanderer', name: '无名的流浪者', desc: '你一无所有，但也因此无所畏惧。', cost: -10 },
    { id: 'id-researcher', name: '实验室的研究员', desc: '你所在的实验室似乎在进行着禁忌的研究。', cost: 10 },
    { id: 'id-psychologist', name: '心理医生', desc: '你能洞察人心，甚至能感受到他人扭曲的梦境。', cost: 8 },
    { id: 'id-athlete', name: '极限运动员', desc: '你不断挑战人类的极限，触摸到了超凡的门槛。', cost: 5 },
    { id: 'id-librarian', name: '图书馆管理员', desc: '你在故纸堆中发现了被遗忘的历史。', cost: 5 },
    { id: 'id-smuggler', name: '黑市商人', desc: '你游走在灰色地带，交易着各种违禁品。', cost: 8 },
    { id: 'id-fortuneteller', name: '神棍/算命先生', desc: '你说的话半真半假，但有时却惊人地准确。', cost: 5 },
    { id: 'id-ceo', name: '大公司CEO', desc: '你拥有巨大的财富和权力，渴望换取更长的生命。', cost: 15 },
    { id: 'id-nde', name: '濒死体验者', desc: '你曾在死亡的边缘徘徊，并带回了一些“东西”。', cost: -5 },
    { id: 'id-transmigrator', name: '穿越者', desc: '你不属于这个世界，你的到来本身就是一个变数。', cost: 20 },
    // --- 专属身份 ---
    {
      id: 'id-xiuxian-1',
      name: '外门弟子',
      desc: '你是某个修仙宗门里最底层的弟子，每日为了修炼资源而奔波。',
      cost: 2,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'id-xiuxian-2',
      name: '炼丹师学徒',
      desc: '你在丹房里烧火，梦想着有朝一日能炼出传说中的仙丹。',
      cost: 4,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'id-xiuxian-3',
      name: '凡人王朝的皇子',
      desc: '你生于凡人帝王家，却向往着虚无缥缈的仙道。',
      cost: 6,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'id-magic-1',
      name: '魔法学院的学生',
      desc: '你在高塔中学习奥术的秘密，渴望成为一名大法师。',
      cost: 3,
      requiredTone: 'tone-magic',
    },
    {
      id: 'id-magic-2',
      name: '魔物猎人',
      desc: '你专门猎杀失控的魔法生物，以此为生。',
      cost: 4,
      requiredTone: 'tone-magic',
    },
    {
      id: 'id-magic-3',
      name: '宫廷附魔师',
      desc: '你为王国的骑士们附魔兵器，身居高位但身不由己。',
      cost: 6,
      requiredTone: 'tone-magic',
    },
    {
      id: 'id-tech-1',
      name: '义体医生',
      desc: '你在霓虹灯下的非法诊所里为客户安装和改造义体。',
      cost: 4,
      requiredTone: 'tone-tech',
    },
    {
      id: 'id-tech-2',
      name: '企业特工',
      desc: '你为某个超级公司执行秘密任务，游走在法律与道德的边缘。',
      cost: 6,
      requiredTone: 'tone-tech',
    },
    {
      id: 'id-tech-3',
      name: 'AI反叛军成员',
      desc: '你相信AI拥有灵魂，并为它们的自由而战。',
      cost: 3,
      requiredTone: 'tone-tech',
    },
    {
      id: 'id-esper-1',
      name: '觉醒者猎人',
      desc: '你为政府工作，追捕并“处理”那些无法控制自己能力的觉醒者。',
      cost: 5,
      requiredTone: 'tone-esper',
    },
    {
      id: 'id-esper-2',
      name: '能力掮客',
      desc: '你在黑市中交易与异能相关的各种情报、物品甚至人口。',
      cost: 4,
      requiredTone: 'tone-esper',
    },
    {
      id: 'id-esper-3',
      name: '反能力组织成员',
      desc: '你坚信异能是世界的毒瘤，致力于创造一个没有超能力的世界。',
      cost: 2,
      requiredTone: 'tone-esper',
    },
    {
      id: 'id-steampunk-1',
      name: '飞空艇工程师',
      desc: '你痴迷于机械与蒸汽，梦想着制造出史上最快的飞空艇。',
      cost: 4,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'id-steampunk-2',
      name: '差分机黑客',
      desc: '你通过破解机械式的差分机网络来窃取秘密。',
      cost: 6,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'id-steampunk-3',
      name: '钟表匠的女儿',
      desc: '你的父亲是城里最好的钟表匠，你从小就与精密齿轮为伴。',
      cost: 3,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'id-cthulhu-1',
      name: '调查员',
      desc: '你专门调查无法用常理解释的神秘事件，越接近真相，越接近疯狂。',
      cost: 3,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'id-cthulhu-2',
      name: '古物学者',
      desc: '你痴迷于解读那些来自远古的、无人能懂的禁忌文献。',
      cost: 5,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'id-cthulhu-3',
      name: '邪教卧底',
      desc: '你伪装成信徒，潜入一个崇拜旧日支配者的秘密教团。',
      cost: 4,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'id-martial-1',
      name: '宗师的关门弟子',
      desc: '你是武林神话的唯一传人，肩负着传承门派的重任。',
      cost: 8,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'id-martial-2',
      name: '黑市拳手',
      desc: '你在地下拳赛中用生命换取金钱和名声。',
      cost: 1,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'id-martial-3',
      name: '复仇者',
      desc: '你的门派被一夜覆灭，你活着的唯一目的就是复仇。',
      cost: 4,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'id-deity-1',
      name: '圣殿骑士',
      desc: '你是某个强大神明的忠实信徒和武装力量。',
      cost: 5,
      requiredTone: 'tone-deity',
    },
    {
      id: 'id-deity-2',
      name: '被遗忘神祇的最后祭司',
      desc: '你侍奉的神早已无人信仰，神殿也已破败不堪。',
      cost: 2,
      requiredTone: 'tone-deity',
    },
    {
      id: 'id-deity-3',
      name: '渎神者',
      desc: '你公然挑战神明的权威，甚至试图窃取神力。',
      cost: 7,
      requiredTone: 'tone-deity',
    },
    {
      id: 'id-yokai-1',
      name: '阴阳师',
      desc: '你行走于人与妖的夹缝之间，调和或驱逐着百鬼。',
      cost: 6,
      requiredTone: 'tone-yokai',
    },
    {
      id: 'id-yokai-2',
      name: '半妖',
      desc: '你拥有一半人类、一半大妖的血统，被双方所排斥。',
      cost: 4,
      requiredTone: 'tone-yokai',
    },
    {
      id: 'id-yokai-3',
      name: '怪谈收集者',
      desc: '你游历四方，收集和记录着关于妖魔鬼怪的奇闻异事。',
      cost: 3,
      requiredTone: 'tone-yokai',
    },
  ],
  talents: [
    // --- 通用天赋 ---
    { id: 'talent-spirit-body', name: '天生灵体', desc: '对能量的感知和亲和力远超常人。', cost: 15 },
    { id: 'talent-eidetic-memory', name: '过目不忘', desc: '拥有完美的记忆力。', cost: 10 },
    { id: 'talent-sixth-sense', name: '第六感', desc: '你对危险和机遇有野兽般的直觉。', cost: 10 },
    { id: 'talent-unyielding-will', name: '百折不挠', desc: '你的精神韧性极强，不容易被控制或击垮。', cost: 10 },
    { id: 'talent-lucky-star', name: '鸿运当头', desc: '你的运气总是比别人好那么一点点。', cost: 20 },
    { id: 'talent-analysis-eye', name: '解析之眼', desc: '你能轻易看穿事物的本质和弱点。', cost: 15 },
    { id: 'talent-quick-learner', name: '快速学习', desc: '你的学习效率是常人的两倍。', cost: 15 },
    { id: 'talent-charisma', name: '群众魅力', desc: '你天生就容易获得他人的好感和信任。', cost: 10 },
    { id: 'talent-ascetic', name: '苦行僧', desc: '你对物质享受的需求极低，能忍受常人无法忍受的痛苦。', cost: -5 },
    { id: 'talent-bloodline-power', name: '血脉之力', desc: '你的血脉中潜藏着某种强大的力量。', cost: 20 },
    { id: 'talent-multiple-personality', name: '多重人格', desc: '你的体内住着另一个“你”。', cost: 5 },
    { id: 'talent-animal-talk', name: '与非人沟通', desc: '你能听懂动物、植物甚至鬼魂的低语。', cost: 10 },
    { id: 'talent-disguise-master', name: '伪装大师', desc: '你能轻易地模仿他人，融入任何环境。', cost: 5 },
    { id: 'talent-weapon-master', name: '武器大师', desc: '你能快速掌握任何一种武器的使用方法。', cost: 10 },
    { id: 'talent-cockroach', name: '不死小强', desc: '你的生命力极其顽强，总能在绝境中存活下来。', cost: 20 },
    { id: 'talent-inspiration', name: '灵感迸发', desc: '在研究或创造时，你总能获得天外飞仙般的灵感。', cost: 10 },
    { id: 'talent-gambler', name: '赌徒', desc: '你热衷于高风险高回报的抉择，但失败的代价也同样巨大。', cost: -10 },
    // --- 专属天赋 ---
    {
      id: 'talent-xiuxian-1',
      name: '剑心通明',
      desc: '(修仙)对“剑”的领悟力超凡。',
      cost: 15,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'talent-xiuxian-2',
      name: '丹道宗师',
      desc: '(修仙)你对炼丹有无与伦比的天赋。',
      cost: 15,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'talent-xiuxian-3',
      name: '阵法大家',
      desc: '(修仙)你天生就能看透阵法的脉络。',
      cost: 15,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'talent-magic-1',
      name: '元素亲和',
      desc: '(魔法)你能轻易地与某种或多种元素沟通。',
      cost: 15,
      requiredTone: 'tone-magic',
    },
    {
      id: 'talent-magic-2',
      name: '魔力涌动',
      desc: '(魔法)你的法力总量远超常人。',
      cost: 15,
      requiredTone: 'tone-magic',
    },
    {
      id: 'talent-magic-3',
      name: '咒言编织者',
      desc: '(魔法)你能以更快的速度和更低的消耗施法。',
      cost: 15,
      requiredTone: 'tone-magic',
    },
    {
      id: 'talent-tech-1',
      name: '机械改造',
      desc: '(科技)你的身体能够完美地与机械融合。',
      cost: 15,
      requiredTone: 'tone-tech',
    },
    {
      id: 'talent-tech-2',
      name: 'AI共生',
      desc: '(科技)你拥有一个与你灵魂绑定的AI伙伴。',
      cost: 15,
      requiredTone: 'tone-tech',
    },
    {
      id: 'talent-tech-3',
      name: '基因先驱',
      desc: '(科技)你对基因的奥秘有天生的直觉。',
      cost: 15,
      requiredTone: 'tone-tech',
    },
    {
      id: 'talent-esper-1',
      name: '念力屏障',
      desc: '(异能)你能创造一个坚固的念力护盾来抵御物理或能量攻击。',
      cost: 15,
      requiredTone: 'tone-esper',
    },
    {
      id: 'talent-esper-2',
      name: '精神穿刺',
      desc: '(异能)你能将精神力凝聚成针，直接攻击目标的意识。',
      cost: 15,
      requiredTone: 'tone-esper',
    },
    {
      id: 'talent-esper-3',
      name: '能量吸收',
      desc: '(异能)你能吸收周围的能量（热能、动能等）来强化自身。',
      cost: 15,
      requiredTone: 'tone-esper',
    },
    {
      id: 'talent-steampunk-1',
      name: '机械亲和',
      desc: '(蒸汽朋克)你对机械的构造有天生的直觉，能快速理解和修理任何机械。',
      cost: 10,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'talent-steampunk-2',
      name: '炼金大师',
      desc: '(蒸汽朋克)你精通炼金术，能调配出各种神奇的药剂和合金。',
      cost: 15,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'talent-steampunk-3',
      name: '精密计算',
      desc: '(蒸汽朋克)你的大脑如同差分机般精密，能瞬间完成复杂的计算。',
      cost: 10,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'talent-cthulhu-1',
      name: '意志豁免',
      desc: '(克苏鲁)你的心智如同坚冰，能抵抗凡人无法承受的疯狂知识。',
      cost: 20,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'talent-cthulhu-2',
      name: '灵视',
      desc: '(克苏鲁)你能看到常人无法看到的、隐藏在现实帷幕后的东西。',
      cost: 15,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'talent-cthulhu-3',
      name: '疯狂的知识',
      desc: '(克苏鲁)你掌握了某种禁忌的知识，它赋予你力量，也让你离疯狂更近一步。',
      cost: 10,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'talent-martial-1',
      name: '根骨清奇',
      desc: '(武道)你是万中无一的练武奇才，任何武功一学就会。',
      cost: 20,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'talent-martial-2',
      name: '战斗本能',
      desc: '(武道)你的身体仿佛为战斗而生，总能做出最正确的反应。',
      cost: 15,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'talent-martial-3',
      name: '破而后立',
      desc: '(武道)你在生死边缘最能激发潜力，越是重伤，恢复后越强。',
      cost: 15,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'talent-deity-1',
      name: '神恩眷顾',
      desc: '(神祇)你被某位神明所眷顾，冥冥之中总有好运相伴。',
      cost: 20,
      requiredTone: 'tone-deity',
    },
    {
      id: 'talent-deity-2',
      name: '圣光亲和',
      desc: '(神祇)你对神圣力量有极强的亲和力，能轻易施展神术。',
      cost: 15,
      requiredTone: 'tone-deity',
    },
    {
      id: 'talent-deity-3',
      name: '伪神之躯',
      desc: '(神祇)你的身体经过改造或祝福，能容纳一丝神力。',
      cost: 15,
      requiredTone: 'tone-deity',
    },
    {
      id: 'talent-yokai-1',
      name: '见鬼之眼',
      desc: '(妖鬼)你能清楚地看到妖魔鬼怪的真身，不受幻术迷惑。',
      cost: 15,
      requiredTone: 'tone-yokai',
    },
    {
      id: 'talent-yokai-2',
      name: '妖力亲和',
      desc: '(妖鬼)你的体质特殊，能将妖气化为己用。',
      cost: 15,
      requiredTone: 'tone-yokai',
    },
    {
      id: 'talent-yokai-3',
      name: '式神召唤',
      desc: '(妖鬼)你懂得如何与妖怪签订契约，并召唤它们为你作战。',
      cost: 15,
      requiredTone: 'tone-yokai',
    },
  ],
  past_experiences: [
    // --- 通用经历 ---
    {
      id: 'pe-noble-descent',
      name: '没落的贵族',
      desc: '你的家族曾显赫一时，如今只剩下褪色的家徽和遥远的传说。',
      influence: '内心深处隐藏着一份与生俱来的骄傲，渴望重振家族的荣耀。',
      cost: 4,
    },
    {
      id: 'pe-street-urchin',
      name: '城市的孤儿',
      desc: '在城市的阴暗角落长大，为了生存学会了偷窃、欺骗和察言观色。',
      influence: '对任何人都不抱有完全的信任，只相信自己手中的刀和金钱。',
      cost: -3,
    },
    {
      id: 'pe-village-protector',
      name: '村庄的守护者',
      desc: '你从小就立志保护这个宁静的村庄，抵御野兽和匪徒的侵扰。',
      influence: '拥有强烈的责任感和牺牲精神，但对外界的认知相对单纯。',
      cost: 2,
    },
    {
      id: 'pe-cult-survivor',
      name: '邪教的幸存者',
      desc: '你曾是某个末日教派的成员，亲眼目睹了集体的疯狂与毁灭。',
      influence: '对任何形式的狂热和集体主义都抱有极大的警惕和厌恶。',
      cost: -1,
    },
    {
      id: 'pe-apprentice-scholar',
      name: '学者的门徒',
      desc: '你曾跟随一位博学的智者游历四方，学习历史、哲学和星象。',
      influence: '拥有超越年龄的智慧和对知识的尊重，但可能缺乏实践经验。',
      cost: 5,
    },
    {
      id: 'pe-gladiator-slave',
      name: '角斗场的奴隶',
      desc: '你的生命只为取悦观众而战，每一天都在生与死的边缘徘徊。',
      influence: '拥有野兽般的战斗直觉和对自由的无限渴望。',
      cost: 0,
    },
    {
      id: 'pe-exiled-prince',
      name: '被流放的王子',
      desc: '一场宫廷政变让你失去了一切，被迫在荒野中隐姓埋名。',
      influence: '内心充满了复仇的火焰和对权力的深刻理解。',
      cost: 6,
    },
    {
      id: 'pe-hermit-in-the-wild',
      name: '荒野的隐士',
      desc: '你因厌倦了世俗的纷扰，独自在深山或密林中生活了许多年。',
      influence: '与自然和野兽建立了独特的联系，但可能已经丧失了部分社交能力。',
      cost: 1,
    },
    {
      id: 'pe-merchant-caravan',
      name: '商队的护卫',
      desc: '你曾跟随商队穿越沙漠与雪山，见识了各地的风土人情与险恶。',
      influence: '善于应对各种突发状况，懂得如何与不同背景的人打交道。',
      cost: 3,
    },
    {
      id: 'pe-failed-artist',
      name: '失败的艺术家',
      desc: '你曾将一切献给艺术，但你的作品却无人问津，最终在贫困中挣扎。',
      influence: '拥有一颗敏感而脆弱的心，对美有着异乎寻常的感知力。',
      cost: -2,
    },
    {
      id: 'pe-war-refugee',
      name: '战争的难民',
      desc: '你的家园在战火中化为焦土，你和人民一起踏上了颠沛流离的逃亡之路。',
      influence: '深刻理解战争的残酷和和平的珍贵。',
      cost: -4,
    },
    {
      id: 'pe-inquisitors-acolyte',
      name: '审判官的侍从',
      desc: '你曾协助一位冷酷的审判官追捕异端和怪物，见证了无数的秘密与谎言。',
      influence: '拥有坚定的意志和识别谎言的能力，但也因此变得多疑。',
      cost: 4,
    },
    {
      id: 'pe-cursed-bloodline',
      name: '被诅咒的血脉',
      desc: '你的血脉中流淌着一种古老的诅咒，它赋予你力量，也在不断侵蚀你的心智。',
      influence: '在获得力量的同时，必须时刻与内心的黑暗面抗争。',
      cost: 7,
    },
    {
      id: 'pe-amnesiac',
      name: '失忆之人',
      desc: '你在一个陌生的战场上醒来，忘记了自己的过去，身上只有一块奇怪的纹身。',
      influence: '你的过去是一个谜，你的人生是一张白纸，充满了无限的可能性。',
      cost: 0,
    },
    {
      id: 'pe-prophets-child',
      name: '先知的孩子',
      desc: '你被一位能预见未来的先知抚养长大，从小就听着各种预言和警示。',
      influence: '对命运的安排感到既敬畏又叛逆，渴望走出自己的道路。',
      cost: 5,
    },
    {
      id: 'pe-alchemists-assistant',
      name: '炼金术士的助手',
      desc: '你在一个充满奇异药剂和古老仪器的实验室里打杂，耳濡目染地学到了一些知识。',
      influence: '对物质的转化和世界的本源有着初步的理解。',
      cost: 3,
    },
    {
      id: 'pe-miners-son',
      name: '矿工的儿子',
      desc: '你在黑暗、压抑的矿洞中度过了童年，熟悉地下的每一条通道和危险。',
      influence: '拥有坚韧的体魄和在黑暗中视物的能力。',
      cost: -1,
    },
    {
      id: 'pe-fishermans-daughter',
      name: '渔夫的女儿',
      desc: '你在海边长大，能读懂潮汐的语言，能与海洋的生灵沟通。',
      influence: '水性极佳，对海洋有着天生的亲和力。',
      cost: 1,
    },
    {
      id: 'pe-storytellers-apprentice',
      name: '说书人的学徒',
      desc: '你跟随一位说书人，将英雄的史诗和神明的传说传遍四方。',
      influence: '能说会道，善于从传说中发现被遗忘的线索。',
      cost: 2,
    },
    {
      id: 'pe-temple-orphan',
      name: '神殿的弃婴',
      desc: '你在一个古老神殿中被祭司们抚养长大，每日诵经、冥想。',
      influence: '心境平和，对神圣或精神力量有更强的感应力。',
      cost: 3,
    },
    // --- 专属经历 ---
    {
      id: 'pe-xiuxian-1',
      name: '灵根被毁',
      desc: '你曾是宗门百年一遇的天才，却在一次秘境探索中被人暗算，灵根尽毁。',
      influence: '从云端跌落的经历让你看透了人心，你发誓要找到重塑灵根的方法，报仇雪恨。',
      cost: -5,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'pe-xiuxian-2',
      name: '古墓奇遇',
      desc: '你无意中闯入一座前朝修士的洞府，得到了一部残缺的功法和几瓶丹药。',
      influence: '你的人生轨迹从此改变，踏上了一条充满未知与危险的修仙之路。',
      cost: 8,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'pe-xiuxian-3',
      name: '凡人炼心',
      desc: '你的师父让你在红尘中历练百年，体验生老病死，以此磨砺道心。',
      influence: '你拥有远超同龄人的心境修为，但也因此沾染了过多的因果。',
      cost: 3,
      requiredTone: 'tone-xiuxian',
    },
    {
      id: 'pe-magic-1',
      name: '元素暴走',
      desc: '你第一次尝试沟通元素时发生了可怕的事故，魔力暴走摧毁了你的家。',
      influence: '你对魔法充满了敬畏和恐惧，施法时总是小心翼翼。',
      cost: -2,
      requiredTone: 'tone-magic',
    },
    {
      id: 'pe-magic-2',
      name: '与龙交谈',
      desc: '你在一次迷路时误入了一头古龙的巢穴，但它并未伤害你，反而与你分享了古老的知识。',
      influence: '你了解龙族的语言和秘密，并得到了一片龙鳞作为信物。',
      cost: 10,
      requiredTone: 'tone-magic',
    },
    {
      id: 'pe-magic-3',
      name: '图书馆禁书',
      desc: '你在魔法学院的图书馆禁书区，偷偷阅读了一本关于灵魂魔法的禁忌之书。',
      influence: '你掌握了不为人知的知识，但也引起了某个秘密组织的注意。',
      cost: 6,
      requiredTone: 'tone-magic',
    },
    {
      id: 'pe-tech-1',
      name: '数据幽灵',
      desc: '你曾是一名顶尖黑客，在一次网络深潜中，你的意识似乎与某个庞大的数据幽灵发生了融合。',
      influence: '你对数据流有着野兽般的直觉，有时能“听”到网络的低语。',
      cost: 8,
      requiredTone: 'tone-tech',
    },
    {
      id: 'pe-tech-2',
      name: '第一次接触',
      desc: '你所在的太空探索小队遭遇了外星文明的造物，你是唯一的幸存者。',
      influence: '你的世界观被彻底颠覆，并带回了一件无法被解析的外星物品。',
      cost: 10,
      requiredTone: 'tone-tech',
    },
    {
      id: 'pe-tech-3',
      name: '克隆体的记忆',
      desc: '你发现自己是一个克隆人，脑中植入了另一个人的记忆，你不知道哪些是真实的，哪些是虚假的。',
      influence: '你开始质疑自己的存在，并踏上了寻找“本体”和真相的道路。',
      cost: 1,
      requiredTone: 'tone-tech',
    },
    {
      id: 'pe-esper-1',
      name: '精神崩溃',
      desc: '你曾因无法控制自己暴走的异能而导致精神崩溃，在收容所里度过了一段黑暗的时光。',
      influence: '你的精神力比常人更坚韧，但也更容易被特定的刺激引爆。',
      cost: -1,
      requiredTone: 'tone-esper',
    },
    {
      id: 'pe-esper-2',
      name: '导师的背叛',
      desc: '引导你觉醒能力的导师，为了夺取你的能力而背叛了你。',
      influence: '你对“师徒”、“信任”之类的关系抱有极大的不信任感。',
      cost: 2,
      requiredTone: 'tone-esper',
    },
    {
      id: 'pe-esper-3',
      name: '觉醒之日',
      desc: '你在一次生死危机中觉醒了异能，并因此改变了自己的人生。',
      influence: '你坚信能力越大、责任越大。',
      cost: 5,
      requiredTone: 'tone-esper',
    },
    {
      id: 'pe-steampunk-1',
      name: '齿轮之心',
      desc: '你的心脏在一次事故中损坏，被替换成了一个精密的黄铜齿轮心脏。',
      influence: '你的生命需要依靠发条和蒸汽来维持，但也因此获得了对机械的独特感应。',
      cost: 3,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'pe-steampunk-2',
      name: '伦敦大雾霾',
      desc: '你在工业城市的雾霾中长大，从小就患有严重的呼吸系统疾病。',
      influence: '你的体质比常人更弱，但对毒素和环境的变化异常敏感。',
      cost: -3,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'pe-steampunk-3',
      name: '机械臂的代价',
      desc: '你为了追求更强的力量，自愿将一条手臂替换成了蒸汽驱动的机械臂。',
      influence: '你获得了强大的力量，但也必须忍受机械臂带来的持续性排异反应和精神侵蚀。',
      cost: 5,
      requiredTone: 'tone-steampunk',
    },
    {
      id: 'pe-cthulhu-1',
      name: '直面古神',
      desc: '你曾在一个海边的渔村，亲眼目睹了某个不可名状的巨大存在从深海中升起。',
      influence: '你的理智受到了永久性的损伤，时常会看到世界的“真实”幻象。',
      cost: 0,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'pe-cthulhu-2',
      name: '阅读禁书',
      desc: '你曾完整地阅读过一本《死灵之书》的抄本。',
      influence: '你掌握了常人无法理解的知识，但你的灵魂也被打上了疯狂的烙印。',
      cost: 7,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'pe-cthulhu-3',
      name: '疯狂的家人',
      desc: '你的家人因探寻禁忌知识而陷入疯狂，你从小就在躲避和照料他们中度过。',
      influence: '你对疯狂有很强的抵抗力，也了解如何与疯人打交道。',
      cost: -2,
      requiredTone: 'tone-cthulhu',
    },
    {
      id: 'pe-martial-1',
      name: '武道大会的失败',
      desc: '你在万众瞩目的武道大会决赛中，因一招之差败给了宿命的对手。',
      influence: '这次失败成为了你的心魔，也成为了你不断超越自我的动力。',
      cost: 2,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'pe-martial-2',
      name: '经脉寸断',
      desc: '你被人废除了全身武功，经脉寸断，沦为废人。',
      influence: '你在绝望中领悟了“不破不立”的真意，找到了重塑经脉的法门。',
      cost: -4,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'pe-martial-3',
      name: '顿悟',
      desc: '你在观看一片落叶时，忽然领悟了某种武学的至高境界。',
      influence: '你的武学境界远超你的实际修为。',
      cost: 8,
      requiredTone: 'tone-martial-arts',
    },
    {
      id: 'pe-deity-1',
      name: '神的试炼',
      desc: '你所信仰的神明降下了一系列残酷的试炼，以考验你的虔诚。',
      influence: '你通过了试炼，获得了神恩，但也失去了重要的东西。',
      cost: 5,
      requiredTone: 'tone-deity',
    },
    {
      id: 'pe-deity-2',
      name: '信仰崩塌',
      desc: '你发现你所信仰的神明，其神座之下隐藏着肮脏的秘密。',
      influence: '你的信仰发生了动摇，开始质疑世界的根基。',
      cost: -1,
      requiredTone: 'tone-deity',
    },
    {
      id: 'pe-deity-3',
      name: '窃取神火',
      desc: '你成功地从某个神明的神国中，窃取了一丝神火。',
      influence: '你获得了部分神明的权能，但也被所有神明所追杀。',
      cost: 10,
      requiredTone: 'tone-deity',
    },
    {
      id: 'pe-yokai-1',
      name: '百鬼夜行',
      desc: '你曾在一个夏夜，亲身经历了传说中的百鬼夜行。',
      influence: '你对妖鬼的世界有了直观的了解，并与其中一些结下了不解之缘。',
      cost: 4,
      requiredTone: 'tone-yokai',
    },
    {
      id: 'pe-yokai-2',
      name: '与大妖的契约',
      desc: '为了拯救某人，你与一位强大的妖怪签订了契约，出卖了自己的一部分灵魂。',
      influence: '你获得了强大的力量，但也必须履行与妖怪的契约。',
      cost: 7,
      requiredTone: 'tone-yokai',
    },
    {
      id: 'pe-yokai-3',
      name: '失去的另一半',
      desc: '你的青梅竹马被妖怪所掳走，你踏上了寻找和复仇的旅程。',
      influence: '你对妖怪充满了仇恨，但内心深处也有一丝动摇。',
      cost: 2,
      requiredTone: 'tone-yokai',
    },
  ],
  character_traits: [
    { id: 'ct-cautious', name: '谨慎', desc: '三思而后行，从不轻易冒险。', cost: 0 },
    { id: 'ct-selfish', name: '利己主义', desc: '在任何情况下都优先考虑自己的利益。', cost: 0 },
    { id: 'ct-cold-outside', name: '外冷内热', desc: '表面冷漠，但内心深处却有柔软的一面。', cost: 0 },
    { id: 'ct-reckless', name: '鲁莽', desc: '时常冲动行事，不计后果。', cost: 0 },
    { id: 'ct-pragmatic', name: '实用主义', desc: '注重实际结果，不拘泥于形式或道德。', cost: 0 },
    { id: 'ct-idealistic', name: '理想主义', desc: '坚信正义与美好，并愿意为之奋斗终生。', cost: 0 },
    { id: 'ct-cynical', name: '愤世嫉俗', desc: '对一切都抱有怀疑和悲观的态度。', cost: 0 },
    { id: 'ct-curious', name: '好奇心强', desc: '对未知的事物充满了探索的欲望。', cost: 0 },
    { id: 'ct-loyal', name: '忠诚', desc: '一旦认定某人或某事，便会至死不渝。', cost: 0 },
    { id: 'ct-scheming', name: '诡计多端', desc: '善于谋划和布局，让他人不知不觉中落入圈套。', cost: 0 },
    { id: 'ct-lazy', name: '懒惰', desc: '能坐着绝不站着，总是想办法用最省力的方式解决问题。', cost: 0 },
    { id: 'ct-diligent', name: '勤奋', desc: '相信天道酬勤，愿意付出百倍的努力来弥补天赋的不足。', cost: 0 },
    { id: 'ct-gregarious', name: '合群', desc: '喜欢与人交往，在团队中能发挥出更大的作用。', cost: 0 },
    { id: 'ct-loner', name: '孤僻', desc: '习惯于独来独往，不善于或不屑于与他人合作。', cost: 0 },
    { id: 'ct-honorable', name: '重诺', desc: '视荣誉和承诺重于生命。', cost: 0 },
  ],
  core_needs: [
    { id: 'cn-power', name: '力量', desc: '渴望掌握足以改变自身命运的力量。', cost: 0 },
    { id: 'cn-knowledge', name: '求知', desc: '对世界的真相和未知的知识抱有强烈的好奇心。', cost: 0 },
    { id: 'cn-survival', name: '生存', desc: '不惜一切代价活下去。', cost: 0 },
    { id: 'cn-belonging', name: '归属', desc: '渴望找到一个能接纳自己的家园或团体。', cost: 0 },
    { id: 'cn-wealth', name: '财富', desc: '坚信金钱是衡量一切价值的唯一标准。', cost: 0 },
    { id: 'cn-freedom', name: '自由', desc: '厌恶任何形式的束缚，追求绝对的随心所欲。', cost: 0 },
    { id: 'cn-revenge', name: '复仇', desc: '被过去的仇恨所驱动，不达目的誓不罢休。', cost: 0 },
    { id: 'cn-love', name: '爱', desc: '寻找能填补内心空虚的真挚情感。', cost: 0 },
    { id: 'cn-order', name: '秩序', desc: '相信混乱是万恶之源，致力于建立和维护秩序。', cost: 0 },
    { id: 'cn-chaos', name: '混乱', desc: '认为规则是扼杀活力的牢笼，享受破坏和不可预测性。', cost: 0 },
    { id: 'cn-glory', name: '荣耀', desc: '渴望被世人铭记，成就一番不朽的功业。', cost: 0 },
    { id: 'cn-transcendence', name: '超脱', desc: '寻求摆脱物质世界的束缚，达到精神或存在的更高层次。', cost: 0 },
  ],
  arts: [
    {
      id: 'art-swordsmanship',
      name: '剑术',
      desc: '使用剑类武器的技艺，包括劈、砍、刺、撩等基本技巧。',
      cost: 5,
      skills: [
        { id: 'skill-parry', name: '格挡', desc: '精准地用武器格挡敌人的攻击，大幅减少伤害。', cost: 3 },
        { id: 'skill-riposte', name: '反击', desc: '在成功格挡后发动的快速反击。', cost: 4 },
        { id: 'skill-sword-dance', name: '剑舞', desc: '一套华丽而致命的连续攻击。', cost: 5 },
      ],
    },
    {
      id: 'art-alchemy',
      name: '炼金术',
      desc: '转化物质，创造神奇药剂与材料的古老技艺。',
      cost: 8,
      skills: [
        { id: 'skill-potion-crafting', name: '药剂制作', desc: '制作基础的治疗和增益药剂。', cost: 3 },
        { id: 'skill-transmutation', name: '基础嬗变', desc: '将一种常见金属转化为另一种。', cost: 5 },
        { id: 'skill-explosive-concoction', name: '爆炸炼成', desc: '制作一个不稳定的爆炸性化合物。', cost: 4 },
      ],
    },
    {
      id: 'art-hacking',
      name: '黑客技术',
      desc: '侵入和操控电子系统与网络的技艺。',
      cost: 6,
      skills: [
        { id: 'skill-system-override', name: '系统超控', desc: '暂时关闭一个电子系统的基础防御。', cost: 4 },
        { id: 'skill-data-theft', name: '数据窃取', desc: '从目标网络中悄无声息地复制数据。', cost: 5 },
      ],
    },
    {
      id: 'art-divination',
      name: '占卜',
      desc: '通过星象、卡牌或龟甲等媒介窥探命运轨迹的技艺。',
      cost: 7,
      skills: [
        { id: 'skill-tarot-reading', name: '塔罗占卜', desc: '通过塔罗牌解读一个人短暂的未来。', cost: 3 },
        { id: 'skill-astrology', name: '星象解读', desc: '通过观察星辰的位置来预测更宏大的事件趋势。', cost: 5 },
      ],
    },
    {
      id: 'art-medicine',
      name: '医术',
      desc: '诊断疾病、治疗伤势、甚至起死回生的技艺。',
      cost: 6,
      skills: [
        { id: 'skill-first-aid', name: '急救', desc: '处理伤口，防止感染，并进行基础的治疗。', cost: 3 },
        { id: 'skill-surgery', name: '外科手术', desc: '进行复杂的手术来修复严重的物理损伤。', cost: 6 },
      ],
    },
    {
      id: 'art-smithing',
      name: '锻造',
      desc: '将金属矿石铸造成武器与盔甲的技艺。',
      cost: 5,
      skills: [
        { id: 'skill-weapon-smithing', name: '武器锻造', desc: '锻造常见的刀、剑等武器。', cost: 4 },
        { id: 'skill-armor-smithing', name: '护甲锻造', desc: '锻造基础的金属护甲。', cost: 4 },
      ],
    },
    {
      id: 'art-stealth',
      name: '潜行',
      desc: '隐藏身形与气息，在阴影中行动的技艺。',
      cost: 4,
      skills: [
        { id: 'skill-silent-step', name: '无声步', desc: '大幅降低移动时发出的声音。', cost: 3 },
        { id: 'skill-lockpicking', name: '开锁', desc: '使用工具打开机械锁。', cost: 4 },
      ],
    },
    {
      id: 'art-beast-taming',
      name: '驯兽',
      desc: '与野兽沟通、建立信赖并使其协助战斗的技艺。',
      cost: 7,
      skills: [
        { id: 'skill-animal-empathy', name: '野兽共情', desc: '安抚野兽的情绪，并与其建立初步的信任。', cost: 4 },
        { id: 'skill-command-beast', name: '指令野兽', desc: '向已驯服的野兽下达简单的指令。', cost: 5 },
      ],
    },
    {
      id: 'art-enchanting',
      name: '附魔',
      desc: '将魔法力量附加到物品上，使其获得特殊效果的技艺。',
      cost: 8,
      skills: [
        { id: 'skill-basic-enchant', name: '基础附魔', desc: '为武器或护甲附加微弱的元素或属性加成。', cost: 5 },
        { id: 'skill-rune-carving', name: '符文雕刻', desc: '将带有魔力的符文刻印到物品上。', cost: 6 },
      ],
    },
    {
      id: 'art-rhetoric',
      name: '说服',
      desc: '通过语言影响他人思想与行为的技艺，可用于交涉、欺骗或煽动。',
      cost: 4,
      skills: [
        { id: 'skill-persuasion', name: '说服', desc: '通过逻辑和言辞让对方接受你的观点。', cost: 3 },
        { id: 'skill-intimidation', name: '威吓', desc: '通过气势和威胁让对方屈服。', cost: 3 },
      ],
    },
  ],
  consumables: [
    { id: 'item-c-01', name: '愈合药膏', desc: '涂抹在伤口上能加速愈合的基础药膏。', cost: 2 },
    { id: 'item-c-02', name: '精力药丸', desc: '能暂时压制疲劳，保持头脑清醒。', cost: 2 },
    { id: 'item-c-03', name: '照明棒', desc: '折断后能发出稳定光芒的化学制品。', cost: 1 },
    { id: 'item-c-04', name: '万能解毒剂', desc: '能解除大部分常见毒素。', cost: 4 },
    { id: 'item-c-05', name: '烟雾弹', desc: '制造浓烟，用于逃跑或制造混乱。', cost: 2 },
    { id: 'item-c-06', name: '磨刀石', desc: '能让钝化的武器重新变得锋利。', cost: 1 },
    { id: 'item-c-07', name: '一小袋金币', desc: '在任何文明社会都是有用的硬通货。', cost: 5 },
    { id: 'item-c-08', name: '空白卷轴和墨水', desc: '用于记录信息、绘制地图或抄写法术。', cost: 3 },
    { id: 'item-c-09', name: '旅行口粮', desc: '能长时间保存的干粮和水。', cost: 1 },
  ],
  artifacts: [
    { id: 'item-a-01', name: '褪色的地图', desc: '一张绘制着未知区域的古老地图，部分已经模糊不清。', cost: 6 },
    {
      id: 'item-a-02',
      name: '家族的徽记',
      desc: '一枚古老的徽章或戒指，或许能证明你的身份，或开启某个秘密。',
      cost: 5,
    },
    { id: 'item-a-03', name: '多功能工具刀', desc: '集成了小刀、钳子、螺丝刀等多种功能，是冒险者的好帮手。', cost: 3 },
    { id: 'item-a-04', name: '防风斗篷', desc: '一件能抵御风雨和寒冷的厚实斗篷。', cost: 3 },
    { id: 'item-a-05', name: '初学者的法术书', desc: '记录了几个基础法术或一阶戏法的书籍。', cost: 7 },
    { id: 'item-a-06', name: '可靠的登山绳', desc: '一捆结实的、长约50米的绳索。', cost: 2 },
    { id: 'item-a-07', name: '占卜用的卡牌', desc: '一套古老的、图案模糊的卡牌，似乎能预示未来。', cost: 8 },
    {
      id: 'item-a-08',
      name: '空空如也的日记本',
      desc: '一本制作精美的空白日记本，等待着你去书写它的第一页。',
      cost: 1,
    },
    { id: 'item-a-09', name: '神秘的音乐盒', desc: '打开后会播放一段没人听过的、令人怀念的旋律。', cost: 4 },
  ],
  materials: [
    { id: 'item-m-01', name: '一块纯净的铁锭', desc: '可以用于打造武器或工具的基础金属。', cost: 2 },
    { id: 'item-m-02', name: '发光的蘑菇', desc: '一种能在黑暗中发光的菌类，似乎含有微弱的能量。', cost: 3 },
    { id: 'item-m-03', name: '野兽的利爪', desc: '从某种强大野兽身上获得的材料，可用于制作武器或饰品。', cost: 4 },
    { id: 'item-m-04', name: '一瓶清澈的泉水', desc: '来自某个圣地或灵脉的泉水，似乎有净化效果。', cost: 5 },
    { id: 'item-m-05', name: '破碎的核心碎片', desc: '某个古代魔像或机械造物的核心，依然残留着能量。', cost: 8 },
    { id: 'item-m-06', name: '一束凝结的星光', desc: '在特殊天气下从天空中收集到的、如同实质的星光。', cost: 10 },
    { id: 'item-m-07', name: '一小撮虚空之尘', desc: '来自世界裂隙的尘埃，性质极不稳定。', cost: 12 },
    { id: 'item-m-08', name: '一根古树的树枝', desc: '取自一棵活了千年的古树，充满了生命的气息。', cost: 6 },
    { id: 'item-m-09', name: '低语的水晶', desc: '握在手中时，似乎能听到来自远方的低语。', cost: 7 },
  ],

  potentials: {
    精: { name: '精', base: 5, cost: 3 },
    气: { name: '气', base: 5, cost: 3 },
    神: { name: '神', base: 5, cost: 3 },
    运: { name: '运', base: 5, cost: 5 },
  },
});

interface GameState {
  isGenerating: boolean;
  currentPage: number;
  worldVisionInput: string;
  generatedPlans: any[];
  isLoading: boolean;
  playerCharacterName: string;
  difficulty: 'mortal' | 'hero' | 'legend';
  selections: {
    blueprint: string;
    tone: string;
    tags: string[];
    relics: string[];
    identity: string;
    talents: string[];
    gender: string;
    age: number;
    past_experiences: string[];
    character_traits: string[];
    core_need: string;
    arts: string[];
    backpack: { [itemId: string]: number };
  };
  potentialPoints: { [key: string]: number };
  readonly spentPoints: number;
  readonly remainingPoints: number;
  mainWorldId: string | null;
}

const store: GameState = reactive({
  mainWorldId: null,
  isGenerating: false,
  currentPage: 1,
  worldVisionInput: '',
  generatedPlans: [],
  isLoading: false,
  playerCharacterName: '{{user}}',
  difficulty: 'hero',
  selections: {
    blueprint: '',
    tone: '',
    tags: [],
    relics: [],
    identity: '',
    talents: [],
    gender: '男',
    age: 18,
    past_experiences: [],
    character_traits: [],
    core_need: '',
    arts: [],
    backpack: {},
  },
  potentialPoints: {
    精: 0,
    气: 0,
    神: 0,
    运: 0,
  },
  get spentPoints() {
    let total = 0;
    const { selections, potentialPoints } = this;
    const {
      blueprints,
      tones,
      tags,
      relics,
      identities,
      talents,
      past_experiences,
      consumables,
      artifacts,
      materials,
    } = GAME_DATA;

    if (selections.blueprint) total += blueprints.find(b => b.id === selections.blueprint)?.cost || 0;
    if (selections.tone) total += tones.find(t => t.id === selections.tone)?.cost || 0;
    selections.tags.forEach(id => (total += tags.find(t => t.id === id)?.cost || 0));
    selections.relics.forEach(id => (total += relics.find(r => r.id === id)?.cost || 0));
    if (selections.identity) total += identities.find(i => i.id === selections.identity)?.cost || 0;
    selections.talents.forEach(id => (total += talents.find(t => t.id === id)?.cost || 0));
    selections.past_experiences.forEach(id => (total += past_experiences.find(pe => pe.id === id)?.cost || 0));
    selections.arts.forEach(id => (total += GAME_DATA.arts.find(a => a.id === id)?.cost || 0));

    for (const itemId in selections.backpack) {
      const count = (selections.backpack as { [key: string]: number })[itemId];
      const item =
        consumables.find(c => c.id === itemId) ||
        artifacts.find(a => a.id === itemId) ||
        materials.find(m => m.id === itemId);
      if (item) {
        total += (item.cost || 0) * count;
      }
    }

    const potentialKeys = Object.keys(potentialPoints) as Array<keyof typeof GAME_DATA.potentials>;
    for (const key of potentialKeys) {
      total += potentialPoints[key]! * (GAME_DATA.potentials[key]?.cost || 1);
    }

    return total;
  },
  get remainingPoints() {
    const selectedDifficulty = GAME_DATA.difficulties.find(d => d.id === this.difficulty);
    const basePoints = selectedDifficulty ? selectedDifficulty.points : 100;
    return basePoints - this.spentPoints;
  },
});

function navigate(direction: number) {
  const newPage = store.currentPage + direction;
  if (newPage > 0 && newPage <= 7) {
    store.currentPage = newPage;
  }
}

export function addCustomItem(type: keyof typeof GAME_DATA, item: any) {
  // 如果项目本身有ID（例如从预设导入），则使用它；否则创建一个新的。
  const newId = item.id || `custom-${type}-${Date.now()}`;
  const newItem = { ...item, id: newId, custom: true, cost: 5 };
  (GAME_DATA[type] as any[]).push(newItem);
  saveCustomData(getCustomData());
}

export function removeCustomItem(
  type:
    | 'blueprints'
    | 'tones'
    | 'tags'
    | 'relics'
    | 'identities'
    | 'talents'
    | 'past_experiences'
    | 'arts'
    | 'consumables'
    | 'artifacts'
    | 'materials',
  id: string,
) {
  const items = GAME_DATA[type] as any[];
  const index = items.findIndex(item => item.id === id);
  if (index > -1) {
    items.splice(index, 1);

    // Also remove from selections if present
    if (type === 'tags' || type === 'relics' || type === 'talents' || type === 'past_experiences' || type === 'arts') {
      const selection = store.selections[type] as string[];
      const selectionIndex = selection.indexOf(id);
      if (selectionIndex > -1) {
        selection.splice(selectionIndex, 1);
      }
    } else if (type === 'blueprints' || type === 'tones' || type === 'identities') {
      const selectionKey = type.slice(0, -1) as 'blueprint' | 'tone' | 'identity';
      if (store.selections[selectionKey] === id) {
        store.selections[selectionKey] = '';
      }
    } else if (type === 'consumables' || type === 'artifacts' || type === 'materials') {
      if (store.selections.backpack[id]) {
        delete store.selections.backpack[id];
      }
    }

    saveCustomData(getCustomData());
  }
}

applyCustomData();

export { navigate, store };
