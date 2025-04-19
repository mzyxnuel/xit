import { Notice, Plugin } from 'obsidian';
import { GitController } from './controllers/GitController';
import { DEFAULT_SETTINGS, XitSettings } from './types/XitSettings.types';
import { SettingsTab } from './views/SettingTab';

export default class Xit extends Plugin {
    settings: XitSettings;
    git: GitController;

    async onload() {
        try {
            await this.loadSettings();
            this.git = new GitController((this.app.vault.adapter as any).basePath, this.settings);
    
            // Sync git repository at startup if enabled
            this.git.sync();
    
            // Add command to manually sync git repository
            this.addCommand({
                id: 'xit-push',
                name: 'Push to Git',
                callback: () => this.git.push()
            });
    
            // This adds a settings tab so the user can configure various aspects of the plugin
            this.addSettingTab(new SettingsTab(this.app, this));
    
            // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
            this.registerInterval(window.setInterval(() => this.git.push(), 60 * 1000));
        } catch (error) {
            console.error('Error loading Xit plugin:', error);
            new Notice('Error loading Xit plugin: ' + error.message);
        }
    }
 
    onunload() {
        this.git.push();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

