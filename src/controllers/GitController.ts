import { Notice } from "obsidian";
import { XitSettings } from "../types/XitSettings.types";
import { GitService } from "src/services/GitService";
import { IsomorphicGitService } from "src/services/IsomorphicGitService";

export class GitController {
    private settings: XitSettings;
    private desktop: GitService;
    private mobile: IsomorphicGitService;

    constructor(vaultPath: any, settings: XitSettings) {
        this.settings = settings;
        this.desktop = new GitService(vaultPath, settings);
        this.mobile = new IsomorphicGitService(vaultPath, settings);
    }

    async guard() {
        if(!this.settings.githubToken) {
            new Notice('GitHub token is not set. Please configure it in the settings.');
            return;
        }

        if (!this.settings.repoUrl) {
            new Notice('Please provide a repository URL in the settings');
            return;
        }
    }

    async clone() {
        try {
            this.guard();

            new Notice('Cloning Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                this.desktop.clone();
            } else {
                
            }

            new Notice('Git repository cloned successfully');
        } catch (error) {
            console.error('Error cloning git repository:', error);
            new Notice('Error cloning git repository: ' + error.message);
        }
    }

    async sync() {
        try {
            this.guard();

            new Notice('Syncing Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                this.desktop.sync();
            } else {
                await this.mobile.sync();
            }

            new Notice('Git repository synchronized successfully');
        } catch (error) {
            console.error('Error synchronizing git repository:', error);
            new Notice('Error synchronizing git repository: ' + error.message);
        }
    }

    async push() {
        try {
            this.guard();

            new Notice('Pushing to Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                this.desktop.push();
            } else {

            }

            new Notice('Changes pushed to Git repository successfully');
        } catch (error) {
            console.error('Error pushing to git repository:', error);
            new Notice('Error pushing to git repository: ' + error.message);
        }
    }
}