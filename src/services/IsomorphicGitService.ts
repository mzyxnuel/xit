import { Notice } from "obsidian";
import { XitSettings } from "../types/XitSettings.types";
import { GitAction } from "src/types/GitActions.types";

export class IsomorphicGitService implements GitAction {
    private vaultPath: any;
    private settings: XitSettings;

    constructor(vaultPath: any, settings: XitSettings) {
        this.vaultPath = vaultPath;
        this.settings = settings;
    }
    
    async clone(): Promise<void> {
        
    }

    async sync(): Promise<void> {
        // Import required modules - make sure to add these to your package.json
        const git = require('isomorphic-git');
        const http = require('isomorphic-git/http/web');
        
        const LightningFS = require('@isomorphic-git/lightning-fs');
        const fs = new LightningFS('obsidian-git-fs');
        
        // Authentication for GitHub
        const onAuth = () => ({
            username: 'x-access-token',
            password: this.settings.githubToken
        });
        
        // Fetch latest
        await git.fetch({
            fs,
            http,
            dir: this.vaultPath,
            url: this.settings.repoUrl,
            ref: this.settings.branchName,
            depth: 1,
            singleBranch: true,
            tags: false,
            onAuth
        });
        
        // Get current branch 
        try {
            await git.checkout({
                fs,
                dir: this.vaultPath,
                ref: this.settings.branchName,
                force: true
            });
        } catch (e) {
            // If checking current branch fails, force checkout
            await git.checkout({
                fs,
                dir: this.vaultPath,
                ref: this.settings.branchName,
                force: true
            });
        }
        
        // Get latest commit from remote branch
        const remoteRef = `refs/remotes/origin/${this.settings.branchName}`;
        const latestCommit = await git.resolveRef({
            fs,
            dir: this.vaultPath,
            ref: remoteRef
        });
        
        // Reset to latest commit (equivalent to reset --hard)
        await git.reset({
            fs,
            dir: this.vaultPath,
            ref: latestCommit,
            hard: true
        });
        
        // Clean untracked files (similar to git clean -fd)
        const statusMatrix = await git.statusMatrix({
            fs,
            dir: this.vaultPath,
            patterns: ['.']
        });
        
        // Find and remove untracked files
        for (const [filepath, headStatus] of statusMatrix) {
            if (headStatus === 0) { // untracked file
                try {
                    const stats = await fs.promises.lstat(`${this.vaultPath}/${filepath}`);
                    
                    if (stats.isDirectory()) {
                        await fs.promises.rm(`${this.vaultPath}/${filepath}`, { 
                            recursive: true, 
                            force: true 
                        });
                    } else {
                        await fs.promises.unlink(`${this.vaultPath}/${filepath}`);
                    }
                } catch (e) {
                    console.log(`Could not remove untracked file: ${filepath}`, e);
                }
            }
        }
    }

    async push(): Promise<void> {
        
    }
}