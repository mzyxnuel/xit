import { Notice } from "obsidian";
import { XitSettings } from "../types/XitSettings.types";

export class GitService {
    private vaultPath: any;
    private settings: XitSettings;

    constructor(vaultPath: any, settings: XitSettings) {
        this.vaultPath = vaultPath;
        this.settings = settings;
    }

    async clone() {
        try {
            if (!this.settings.repoUrl) {
                new Notice('Please provide a repository URL in the settings');
                return;
            }

            new Notice('Cloning Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                const util = require('util');
                const exec = util.promisify(require('child_process').exec);
                
                // Set Git credentials if token is provided
                const authUrl = this.settings.githubToken 
                    ? this.settings.repoUrl.replace('https://', `https://x-access-token:${this.settings.githubToken}@`)
                    : this.settings.repoUrl;
                
                // Execute git clone command
                await exec(`cd "${this.vaultPath}" && git init`);
                await exec(`cd "${this.vaultPath}" && git remote add origin ${authUrl}`);
                await exec(`cd "${this.vaultPath}" && git fetch --all`);
                await exec(`cd "${this.vaultPath}" && git reset --hard origin/${this.settings.branchName}`);
                await exec(`cd "${this.vaultPath}" && git clean -fd`); // Remove untracked files

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

    async sync() {
        try {
            if(!this.settings.githubToken) {
                new Notice('GitHub token is not set. Please configure it in the settings.');
                return;
            }

            new Notice('Syncing Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                const util = require('util');
                const exec = util.promisify(require('child_process').exec);
                
                // Set Git credentials if token is provided
                if (this.settings.githubToken) {
                    // Configure Git to use the token for HTTPS authentication
                    await exec(`cd "${this.vaultPath}" && git config --local credential.helper '!f() { echo "username=x-access-token"; echo "password=${this.settings.githubToken}"; }; f'`);
                }
                
                // Execute git commands
                await exec(`cd "${this.vaultPath}" && git fetch --all`);
                await exec(`cd "${this.vaultPath}" && git reset --hard origin/${this.settings.branchName}`);
                await exec(`cd "${this.vaultPath}" && git clean -fd`);
                
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

    async push() {
        try {
            if(!this.settings.githubToken) {
                new Notice('GitHub token is not set. Please configure it in the settings.');
                return;
            }

            new Notice('Pushing to Git repository...');
            
            // Using Node.js capabilities for desktop version of Obsidian
            if (typeof require === 'function') {
                const util = require('util');
                const exec = util.promisify(require('child_process').exec);
                
                // Execute git commands
                await exec(`cd "${this.vaultPath}" && git add .`);
                await exec(`cd "${this.vaultPath}" && git commit -m "vault sync ${new Date().toISOString()}"`);
                await exec(`cd "${this.vaultPath}" && git push origin ${this.settings.branchName}`);
                
                new Notice('Changes pushed to Git repository successfully');
            } else {
                // For web version, we'd need to implement with isomorphic-git
                throw new Error('Git operations in web version are not implemented yet');
            }
        } catch (error) {
            console.error('Error pushing to git repository:', error);
            new Notice('Error pushing to git repository: ' + error.message);
        }
    }
}