import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { GitService } from 'src/GitService';

interface XitSettings {
    githubToken: string;
    gitAutoSync: boolean;
    repoUrl: string;
}

const DEFAULT_SETTINGS: XitSettings = {
    githubToken: '',
    gitAutoSync: true,
    repoUrl: ''
}

export default class Xit extends Plugin {
    settings: XitSettings;
    git: GitService;

    async onload() {
        await this.loadSettings();
        this.git = new GitService((this.app.vault.adapter as any).basePath, this.settings);

        // Sync git repository at startup if enabled
        if (this.settings.gitAutoSync) {
            this.git.sync();
        }

        // Add command to manually sync git repository
        this.addCommand({
            id: 'git-sync',
            name: 'Sync Git repository',
            callback: () => this.git.sync()
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SettingsTab(this.app, this));

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }
 
    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SettingsTab extends PluginSettingTab {
    plugin: Xit;

    constructor(app: App, plugin: Xit) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

		new Setting(containerEl)
			.setName('GitHub Token')
			.setDesc('Personal access token for GitHub authentication')
			.addText(text => text
				.setPlaceholder('ghp_xxxxxxxxxxxxxxxxxxxx')
				.setValue(this.plugin.settings.githubToken)
				.onChange(async (value) => {
					this.plugin.settings.githubToken = value;
					await this.plugin.saveSettings();
				}));
        
                
        new Setting(containerEl)
            .setName('Auto Sync Git Repository')
            .setDesc('Automatically synchronize Git repository at startup')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.gitAutoSync)
                .onChange(async (value) => {
                    this.plugin.settings.gitAutoSync = value;
                    await this.plugin.saveSettings();
                }));

        const repoSetting = new Setting(containerEl)
            .setName('Repository URL')
            .setDesc('URL of the Git repository to clone (e.g., https://github.com/username/repo.git)')
            .addText(text => text
                .setPlaceholder('https://github.com/username/repo.git')
                .setValue(this.plugin.settings.repoUrl)
                .onChange(async (value) => {
                    this.plugin.settings.repoUrl = value;
                    await this.plugin.saveSettings();
                }));

        // Add a button to clone the repository
        repoSetting.addButton(button => {
            button
                .setButtonText('Clone Repository')
                .setClass('mod-cta')
                .onClick(() => {
                    this.plugin.git.clone();
                });
        });
    }
}
