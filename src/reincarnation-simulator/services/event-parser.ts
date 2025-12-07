import { readFromLorebook } from './lorebook';

interface WorldEvent {
    id: string;
    name: string;
    type: string;
    duration: number;
    description: string;
}

interface Trigger {
    type: 'date';
    condition: string;
    eventId: string;
}

async function parseEvents(text: string | null): Promise<Map<string, WorldEvent>> {
    const events = new Map<string, WorldEvent>();
    if (!text) return events;

    text.split('\n').filter(Boolean).forEach(line => {
        if (line.startsWith('#')) return;
        const parts = line.split('|');
        if (parts.length >= 5) {
            events.set(parts[0], {
                id: parts[0],
                name: parts[1],
                type: parts[2],
                duration: parseInt(parts[3], 10),
                description: parts[4],
            });
        }
    });
    return events;
}

async function parseTriggers(text: string | null): Promise<Trigger[]> {
    const triggers: Trigger[] = [];
    if (!text) return triggers;

    text.split('\n').filter(Boolean).forEach(line => {
        if (line.startsWith('#')) return;
        const parts = line.split('|');
        if (parts[0] === 'date' && parts.length >= 3) {
            triggers.push({
                type: 'date',
                condition: parts[1],
                eventId: parts[2],
            });
        }
    });
    return triggers;
}

export async function getUpcomingEvents(year: number, month: number): Promise<{ [key: string]: any[] }> {
    const events: { [key: string]: any[] } = {};
    const eventTriggersText = await readFromLorebook('[系统]事件触发器');
    const eventLibraryText = await readFromLorebook('[世界观]世界事件库');

    if (!eventTriggersText || !eventLibraryText) return events;

    const triggers = await parseTriggers(eventTriggersText);
    const library = await parseEvents(eventLibraryText);

    triggers.forEach(trigger => {
        if (trigger.type === 'date') {
            const [m, d] = trigger.condition.split('-').map(Number);
            if (m === month + 1) {
                const eventInfo = library.get(trigger.eventId);
                if (eventInfo) {
                    const date = new Date(year, month, d);
                    const dateStr = date.toISOString().split('T')[0];
                    if (!events[dateStr]) {
                        events[dateStr] = [];
                    }
                    events[dateStr].push({
                        id: trigger.eventId,
                        name: eventInfo.name,
                        type: 'upcoming',
                    });
                }
            }
        }
    });

    return events;
}