import { store, GAME_DATA } from '../store';

// 定义判词的片段
const destinyParts = {
  opening: [
    { text: '汝之命途，如风中残烛，摇曳不定', condition: () => store.remainingPoints < 0 },
    { text: '汝之命途，似荆棘丛生，步步维艰', condition: () => store.remainingPoints >= 0 && store.remainingPoints < 15 },
    { text: '汝之命途，若逆水行舟，不进则退', condition: () => store.remainingPoints >= 15 && store.remainingPoints < 30 },
    { text: '汝之命途，如平湖秋月，波澜不惊', condition: () => store.remainingPoints >= 30 && store.remainingPoints < 50 },
    { text: '汝之命途，若旭日初升，霞光万道', condition: () => store.remainingPoints >= 50 && store.remainingPoints < 70 },
    { text: '汝之命途，似鲲鹏展翅，扶摇直上', condition: () => store.remainingPoints >= 70 },
    { text: '汝之命途，乃天选之子，鸿运当头', condition: () => store.selections.talents.includes('talent-lucky-star') },
    { text: '汝之命途，自混沌中来，前路未卜', condition: () => store.selections.blueprint === 'bp-myriad' },
    { text: '汝之命途，承载着旧日的辉光与诅咒', condition: () => store.selections.identity === 'id-noble' },
  ],
  focus: [
    { text: '此行或将饱受磨难，九死一生', condition: () => store.selections.tags.length >= 3 },
    { text: '前路潜藏着足以颠覆世界的奇遇', condition: () => store.selections.relics.length >= 3 },
    { text: '你的力量将引来无数觊觎与纷争', condition: () => store.potentialPoints.气 > 12 || store.potentialPoints.精 > 12 },
    { text: '你的智慧将照亮时代的黑暗角落', condition: () => store.potentialPoints.神 > 12 },
    { text: '你的命运充满了不可预知的变数', condition: () => store.potentialPoints.运 > 12 },
    { text: '你将以凡人之躯，比肩神明', condition: () => store.selections.tone === 'tone-tech' && store.potentialPoints.神 > 10 },
    { text: '你将在爱恨情仇中挣扎，勘破心魔', condition: () => store.selections.past_experiences.some(id => id.includes('revenge') || id.includes('love')) },
    { text: '你将背负着众人的期望，砥砺前行', condition: () => store.selections.identity.includes('prince') || store.selections.identity.includes('protector') },
    { text: '你将以手中之艺，刻画属于自己的传奇', condition: () => store.selections.arts.length > 0 },
    { text: '你的双手既能创造奇迹，亦能带来毁灭', condition: () => store.selections.arts.includes('art-alchemy') || store.selections.arts.includes('art-smithing') },
  ],
  ending: [
    { text: '然，星星之火，亦可燎原。', condition: () => store.selections.arts.includes('art-swordsmanship') },
    { text: '但，求知之心，终将窥见天道。', condition: () => store.selections.arts.includes('art-divination') },
    { text: '然，心有归宿，虽死无憾。', condition: () => store.selections.identity === 'id-wanderer' },
    { text: '但，自由之魂，必将挣脱一切枷锁。', condition: () => store.selections.identity === 'id-gladiator-slave' },
    { text: '然，复仇之火，也能锻造不朽新生。', condition: () => store.selections.past_experiences.includes('pe-xiuxian-1') },
    { text: '但，锻造之锤，亦能敲响时代的洪钟。', condition: () => store.selections.arts.includes('art-smithing') },
    { text: '然，医者仁心，可于乱世中开辟一方净土。', condition: () => store.selections.arts.includes('art-medicine') },
    { text: '但，影中利刃，亦是守护秩序的最后手段。', condition: () => store.selections.arts.includes('art-stealth') },
    { text: '然，与兽同行者，其心必怀赤诚。', condition: () => store.selections.arts.includes('art-beast-taming') },
    { text: '但，权谋之术，终将反噬其主。', condition: () => store.selections.arts.includes('art-rhetoric') },
  ],
};

/**
 * 根据当前的选择生成天命判词
 */
export function generateDestiny(): string {
  let destiny = '';

  // 选择开篇
  const opening = destinyParts.opening.find(part => part.condition());
  destiny += opening ? opening.text : '汝之命途，深邃如夜。';

  // 选择核心
  const focus = destinyParts.focus.find(part => part.condition());
  destiny += focus ? `，${focus.text}` : '，前路漫漫，祸福相依';

  // 选择结尾
  const ending = destinyParts.ending.find(part => part.condition());
  destiny += ending ? `。${ending.text}` : '。';

  return destiny;
}