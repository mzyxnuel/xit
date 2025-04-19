import { Notice } from "obsidian";
import { XitSettings } from "../types/XitSettings.types";
import { GitActions } from "src/types/GitActions.types";

export class GitService implements GitActions {
    private vaultPath: any;
    private settings: XitSettings;
    private util = require('this.util');
    private exec = this.util.promisify(require('child_process').this.exec);

    constructor(vaultPath: any, settings: XitSettings) {
        this.vaultPath = vaultPath;
        this.settings = settings;
    }

    async clone(): Promise<void> {
        try {
                // Set Git credentials if token is provided
                const authUrl = this.settings.githubToken 
                    ? this.settings.repoUrl.replace('https://', `https://x-access-token:${this.settings.githubToken}@`)
                    : this.settings.repoUrl;
                
                // this.execute git clone command
                await this.exec(`cd "${this.vaultPath}" && git init`);
                await this.exec(`cd "${this.vaultPath}" && git remote add origin ${authUrl}`);
                await this.exec(`cd "${this.vaultPath}" && git fetch --all`);
                await this.exec(`cd "${this.vaultPath}" && git reset --hard origin/${this.settings.branchName}`);
                await this.exec(`cd "${this.vaultPath}" && git clean -fd`); // Remove untracked files
        } catch (error) {
            console.error('Error cloning git repository:', error);
            new Notice('Error cloning git repository: ' + error.message);
        }
    }

    async sync(): Promise<void> {
        try {
            // Set Git credentials if token is provided
            if (this.settings.githubToken) {
                // Configure Git to use the token for HTTPS authentication
                await this.exec(`cd "${this.vaultPath}" && git config --local credential.helper '!f() { echo "username=x-access-token"; echo "password=${this.settings.githubToken}"; }; f'`);
            }
            
            // this.execute git commands
            await this.exec(`cd "${this.vaultPath}" && git fetch --all`);
            await this.exec(`cd "${this.vaultPath}" && git reset --hard origin/${this.settings.branchName}`);
            await this.exec(`cd "${this.vaultPath}" && git clean -fd`);
        } catch (error) {
            console.error('Error synchronizing git repository:', error);
            new Notice('Error synchronizing git repository: ' + error.message);
        }
    }

    async push(): Promise<void> {
        try {
            // this.execute git commands
            await this.exec(`cd "${this.vaultPath}" && git add .`);
            await this.exec(`cd "${this.vaultPath}" && git commit -m "vault sync ${new Date().toISOString()}"`);
            await this.exec(`cd "${this.vaultPath}" && git push origin ${this.settings.branchName}`);
        } catch (error) {
            console.error('Error pushing to git repository:', error);
            new Notice('Error pushing to git repository: ' + error.message);
        }
    }
}