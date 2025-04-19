import { Notice } from "obsidian";
import { XitSettings } from "../types/XitSettings.types";
import { GitService } from "../services/GitService";
import { IsomorphicGitService } from "../services/IsomorphicGitService";

export class GitController {
    private settings: XitSettings;
    private vaultPath: any;

    constructor(vaultPath: any, settings: XitSettings) {
        this.settings = settings;
        this.vaultPath = vaultPath;
    }

    private guard(): void {
        if(!this.settings.githubToken) {
            new Notice('GitHub token is not set. Please configure it in the settings.');
            throw new Error('GitHub token is not set');
        }

        if (!this.settings.repoUrl) {
            new Notice('Please provide a repository URL in the settings');
            throw new Error('Repository URL is not set');
        }
    }

    async clone() {
        try {
            this.guard();

            new Notice('Cloning Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                await new GitService(this.vaultPath, this.settings).clone();
            } else {
                await new IsomorphicGitService(this.vaultPath, this.settings).clone();
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
                await new GitService(this.vaultPath, this.settings).sync();
            } else {
                await new IsomorphicGitService(this.vaultPath, this.settings).sync();
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
                await new GitService(this.vaultPath, this.settings).push();
            } else {
                await new IsomorphicGitService(this.vaultPath, this.settings).push();
            }

            new Notice('Changes pushed to Git repository successfully');
        } catch (error) {
            console.error('Error pushing to git repository:', error);
            new Notice('Error pushing to git repository: ' + error.message);
        }
    }
}