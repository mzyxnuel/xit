import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

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

    async onload() {
        await this.loadSettings();

        // Sync git repository at startup if enabled
        if (this.settings.gitAutoSync) {
            this.gitSyncAtStartup();
        }

        // Add command to manually sync git repository
        this.addCommand({
            id: 'git-sync',
            name: 'Sync Git repository',
            callback: () => this.gitSyncAtStartup()
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    async gitSyncAtStartup() {
        try {
            if(!this.settings.githubToken) {
                new Notice('GitHub token is not set. Please configure it in the settings.');
                return;
            }

            new Notice('Syncing Git repository...');
            
            // Get the path to the vault
            const vaultPath = (this.app.vault.adapter as any).basePath;
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                const util = require('util');
                const exec = util.promisify(require('child_process').exec);
                
                // Set Git credentials if token is provided
                if (this.settings.githubToken) {
                    // Configure Git to use the token for HTTPS authentication
                    await exec(`cd "${vaultPath}" && git config --local credential.helper '!f() { echo "username=x-access-token"; echo "password=${this.settings.githubToken}"; }; f'`);
                }
                
                // Execute git commands
                await exec(`cd "${vaultPath}" && git fetch --all`);
                await exec(`cd "${vaultPath}" && git reset --hard origin/main`);
                await exec(`cd "${vaultPath}" && git clean -fd`);
                
                new Notice('Git repository synchronized successfully');
            } else {
                // For web version, we'd need to implement with isomorphic-git
                throw new Error('Git operations in web version are not implemented yet');
            }
        } catch (error) {
            console.error('Error synchronizing git repository:', error);
            new Notice('Error synchronizing git repository: ' + error.message);
        }
    }

    async gitCloneRepository() {
        try {
            if (!this.settings.repoUrl) {
                new Notice('Please provide a repository URL in the settings');
                return;
            }

            new Notice('Cloning Git repository...');
            
            // Get the path to the vault
            const vaultPath = (this.app.vault.adapter as any).basePath;
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                const util = require('util');
                const exec = util.promisify(require('child_process').exec);
                
                // Set Git credentials if token is provided
                const authUrl = this.settings.githubToken 
                    ? this.settings.repoUrl.replace('https://', `https://x-access-token:${this.settings.githubToken}@`)
                    : this.settings.repoUrl;
                
                // Execute git clone command
                await exec(`cd "${vaultPath}" && git init`);
                await exec(`cd "${vaultPath}" && git remote add origin ${authUrl}`);
                await exec(`cd "${vaultPath}" && git fetch --all`);
                await exec(`cd "${vaultPath}" && git reset --hard origin/main`);
                await exec(`cd "${vaultPath}" && git clean -fd`); // Remove untracked files

                new Notice('Git repository cloned successfully');
            } else {
                // For web version, we'd need to implement with isomorphic-git
                throw new Error('Git operations in web version are not implemented yet');
            }
        } catch (error) {
            console.error('Error cloning git repository:', error);
            new Notice('Error cloning git repository: ' + error.message);
        }
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

class SampleSettingTab extends PluginSettingTab {
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
                    this.plugin.gitCloneRepository();
                });
        });
    }
}
