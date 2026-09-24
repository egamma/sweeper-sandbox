import * as vscode from 'vscode';
import { computeStats, formatStats, formatStatsTooltip, formatTimestamp, slugify, TimestampFormat } from './stats';

let statusItem: vscode.StatusBarItem;
let visible = true;

export function activate(context: vscode.ExtensionContext): void {
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusItem.command = 'noteStats.toggle';
  context.subscriptions.push(statusItem);

  const showCharacters = vscode.workspace.getConfiguration('noteStats').get<boolean>('showCharacters', false);

  const refresh = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !visible) {
      statusItem.hide();
      return;
    }
    const stats = computeStats(editor.document.getText());
    statusItem.text = formatStats(stats, showCharacters);
    statusItem.tooltip = formatStatsTooltip(stats);
    statusItem.show();
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === vscode.window.activeTextEditor?.document) {
        refresh();
      }
    }),
    vscode.commands.registerCommand('noteStats.toggle', () => {
      visible = !visible;
      refresh();
    }),
    vscode.commands.registerCommand('noteStats.insertTimestamp', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const format = vscode.workspace.getConfiguration('noteStats').get<TimestampFormat>('timestampFormat', 'iso');
      const stamp = formatTimestamp(new Date(), format);
      await editor.edit((edit) => edit.insert(editor.selection.active, stamp));
    }),
    vscode.commands.registerCommand('noteStats.slugifyHeading', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const line = editor.document.lineAt(editor.selection.active.line);
      await editor.edit((edit) => edit.replace(line.range, slugify(line.text)));
    }),
  );

  refresh();
}

export function deactivate(): void {
  statusItem?.dispose();
}
