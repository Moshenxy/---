type CommandListener = (commands: string[]) => void;

class CommandService {
  private commands: string[] = [];
  private listeners: CommandListener[] = [];

  subscribe(listener: CommandListener) {
    this.listeners.push(listener);
  }

  unsubscribe(listener: CommandListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.commands]));
  }

  addCommand(command: string) {
    this.commands.push(command);
    this.notify();
  }

  getCommands(): string[] {
    return [...this.commands];
  }

  clearCommands() {
    this.commands = [];
    this.notify();
  }
}

export const commandService = new CommandService();
