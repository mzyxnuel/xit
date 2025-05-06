import Xit from '../main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export class SettingsTab extends PluginSettingTab {
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
            .setName('Branch Name')
            .setDesc('Name of the Git branch to clone and sync (e.g., main, master, develop)')
            .addText(text => text
                .setPlaceholder('main')
                .setValue(this.plugin.settings.branchName)
                .onChange(async (value) => {
                    this.plugin.settings.branchName = value;
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
                .setButtonText('Clone/Sync Repository')
                .setClass('mod-cta')
                .onClick(() => {
                    this.plugin.git.clone();
                });
        });
    }
}