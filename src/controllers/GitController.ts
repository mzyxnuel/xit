import { Notice, Platform, Vault } from "obsidian";
import { XitSettings } from "../types/XitSettings.types";
import { GitService } from "../services/GitService";
import { IsomorphicGitService } from "../services/IsomorphicGitService";
import { GitActions } from "src/types/GitActions.types";

export class GitController {
    private settings: XitSettings;
    private vault: Vault;

    constructor(vault: Vault, settings: XitSettings) {
        this.settings = settings;
        this.vault = vault;
    }

    private guard = (): void => {
        if (!this.settings.githubToken) {
            new Notice('GitHub token is not set. Please configure it in the settings.');
            throw new Error('GitHub token is not set');
        }

        if (!this.settings.repoUrl) {
            new Notice('Please provide a repository URL in the settings');
            throw new Error('Repository URL is not set');
        }
    }

    private service(): GitActions {
        return Platform.isDesktop
            ? new GitService((this.vault.adapter as any).basePath, this.settings) 
            : new IsomorphicGitService(this.vault, this.settings);
    }

    async clone() {
        try {
            this.guard();

            new Notice('Cloning Git repository...');

            this.service().clone();

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
            
            this.service().sync();

            new Notice('Git repository synchronized successfully');
        } catch (error) {
            console.error('Error synchronizing git repository:', error);
            new Notice('Error synchronizing git repository: ' + error.message);
        }
    }

    async push(isManual: boolean = false) {
        try {
            this.guard();

            const canNotice = (Platform.isMobile && isManual) || Platform.isDesktop

            if (canNotice) {
                new Notice('Pushing to Git repository...');    
            }
                        
            this.service().push();

            if (canNotice) {
                new Notice('Changes pushed to Git repository successfully');
            }
        } catch (error) {
            console.error('Error pushing to git repository:', error);
            new Notice('Error pushing to git repository: ' + error.message);
        }
    }
}