import { reactive, computed, watch } from 'vue';
import { simulatorCooldown } from '../store/getters';

interface CooldownState {
  remainingSeconds: number;
  intervalId: number | null;
}

const state = reactive<CooldownState>({
  remainingSeconds: 0,
  intervalId: null,
});

function parseCooldownTime(timeData: string | any[]): number {
  if (!timeData) return 0;

  let days = 0, hours = 0, minutes = 0;
  let dataToParse: any = timeData;

  // 检查是否为数组形式的字符串，如果是，则尝试解析
  if (typeof dataToParse === 'string' && dataToParse.startsWith('[') && dataToParse.endsWith(']')) {
    try {
      // 替换中文引号为英文引号以确保JSON解析正确
      dataToParse = JSON.parse(dataToParse.replace(/“|”/g, '"'));
    } catch (e) {
      console.error('Failed to parse cooldown time string as JSON:', timeData, e);
      dataToParse = []; // 解析失败则视为空数组
    }
  }
  
  if (Array.isArray(dataToParse)) {
    // 处理数组格式: [6, "天", 23, "小时", 35, "分钟"]
    const dayIndex = dataToParse.indexOf('天');
    if (dayIndex > 0) days = Number(dataToParse[dayIndex - 1]) || 0;

    const hourIndex = dataToParse.indexOf('小时');
    if (hourIndex > 0) hours = Number(dataToParse[hourIndex - 1]) || 0;
    
    const minIndex = dataToParse.indexOf('分钟');
    if (minIndex > 0) minutes = Number(dataToParse[minIndex - 1]) || 0;

  } else if (typeof dataToParse === 'string') {
    // 处理字符串格式: "7天0小时0分"
    const daysMatch = dataToParse.match(/(\d+)天/);
    const hoursMatch = dataToParse.match(/(\d+)小时/);
    const minutesMatch = dataToParse.match(/(\d+)分/);
    days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
    hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  }

  return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '冷却完毕';

  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  const minutes = Math.floor(seconds / 60);

  return `${days}天${hours}小时${minutes}分`;
}

function startCountdown() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
  }
  state.intervalId = window.setInterval(() => {
    if (state.remainingSeconds > 0) {
      state.remainingSeconds--;
    } else {
      stopCountdown();
    }
  }, 1000); // Update every second
}

function stopCountdown() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

watch(simulatorCooldown, (newCooldown) => {
  if (newCooldown.status === '冷却中') {
    const totalSeconds = parseCooldownTime(newCooldown.time);
    if (state.remainingSeconds <= 0 || Math.abs(state.remainingSeconds - totalSeconds) > 5) {
        state.remainingSeconds = totalSeconds;
    }
    if (!state.intervalId) {
        startCountdown();
    }
  } else {
    state.remainingSeconds = 0;
    stopCountdown();
  }
}, { immediate: true, deep: true });


export const cooldownService = {
  remainingTime: computed(() => formatRemainingTime(state.remainingSeconds)),
  isCoolingDown: computed(() => state.remainingSeconds > 0 && simulatorCooldown.value.status === '冷却中'),
};