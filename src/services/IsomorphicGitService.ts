import { XitSettings } from "../types/XitSettings.types";
import { GitActions } from "../types/GitActions.types";

export class IsomorphicGitService implements GitActions {
    private vaultPath: any;
    private settings: XitSettings;
    private git: any;
    private http: any;
    private fs: any;

    constructor(vaultPath: any, settings: XitSettings) {
        this.vaultPath = vaultPath;
        this.settings = settings;
        
        this.build()
    }

    private build = async () => {
        if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
            // @ts-ignore
            window.Buffer = await import('buffer/').Buffer;
        }

        this.git = await import('isomorphic-git');
        this.http = await import('isomorphic-git/http/web');
        const LightningFS = await import('@isomorphic-git/lightning-fs');
        this.fs = new LightningFS('obsidian-git-fs');
    }

    private onAuth = () => ({
        username: 'x-access-token',
        password: this.settings.githubToken
    });
    
    async clone(): Promise<void> {
        try {
            // Clear the directory first (if it exists and has files)
            try {
                const files = await this.fs.promises.readdir(this.vaultPath);
                
                // Only proceed with deletion if the directory is not empty
                // and doesn't have a .git folder (indicating it's already a repo)
                if (files.length > 0 && !files.includes('.git')) {
                    for (const file of files) {
                        const filepath = `${this.vaultPath}/${file}`;
                        const stats = await this.fs.promises.lstat(filepath);
                        
                        if (stats.isDirectory()) {
                            await this.fs.promises.rm(filepath, { 
                                recursive: true, 
                                force: true 
                            });
                        } else {
                            await this.fs.promises.unlink(filepath);
                        }
                    }
                }
            } catch (error) {
                // Directory might not exist yet, which is fine
                await this.fs.promises.mkdir(this.vaultPath, { recursive: true });
            }
            
            // Clone the repository
            await this.git.clone({
                fs: this.fs,
                http: this.http,
                dir: this.vaultPath,
                url: this.settings.repoUrl,
                ref: this.settings.branchName,
                singleBranch: true,
                depth: 1,
                onAuth: this.onAuth,
                noTags: true,
                noCheckout: false
            });
        } catch (error) {
            console.error('Error cloning repository:', error);
            throw error;
        }
    }

    async sync(): Promise<void> {        
        // Fetch latest
        await this.git.fetch({
            fs: this.fs,
            http: this.http,
            dir: this.vaultPath,
            url: this.settings.repoUrl,
            ref: this.settings.branchName,
            depth: 1,
            singleBranch: true,
            tags: false,
            onAuth: this.onAuth
        });
        
        // Get current branch 
        try {
            await this.git.checkout({
                fs: this.fs,
                dir: this.vaultPath,
                ref: this.settings.branchName,
                force: true
            });
        } catch (e) {
            // If checking current branch fails, force checkout
            await this.git.checkout({
                fs: this.fs,
                dir: this.vaultPath,
                ref: this.settings.branchName,
                force: true
            });
        }
        
        // Get latest commit from remote branch
        const remoteRef = `refs/remotes/origin/${this.settings.branchName}`;
        const latestCommit = await this.git.resolveRef({
            fs: this.fs,
            dir: this.vaultPath,
            ref: remoteRef
        });
        
        // Reset to latest commit (equivalent to reset --hard)
        await this.git.reset({
            fs: this.fs,
            dir: this.vaultPath,
            ref: latestCommit,
            hard: true
        });
        
        // Clean untracked files (similar to git clean -fd)
        const statusMatrix = await this.git.statusMatrix({
            fs: this.fs,
            dir: this.vaultPath,
            patterns: ['.']
        });
        
        // Find and remove untracked files
        for (const [filepath, headStatus] of statusMatrix) {
            if (headStatus === 0) { // untracked file
                try {
                    const stats = await this.fs.promises.lstat(`${this.vaultPath}/${filepath}`);
                    
                    if (stats.isDirectory()) {
                        await this.fs.promises.rm(`${this.vaultPath}/${filepath}`, { 
                            recursive: true, 
                            force: true 
                        });
                    } else {
                        await this.fs.promises.unlink(`${this.vaultPath}/${filepath}`);
                    }
                } catch (e) {
                    console.log(`Could not remove untracked file: ${filepath}`, e);
                }
            }
        }
    }

    async push(): Promise<void> {
        try {
            // Add all changes
            await this.git.add({
                fs: this.fs,
                dir: this.vaultPath,
                filepath: '.'
            });
            
            // Create commit
            const commitMessage = `vault sync ${new Date().toISOString()}`;
            
            // Get status to check if there are changes to commit
            const status = await this.git.status({
                fs: this.fs,
                dir: this.vaultPath,
                filepath: '.'
            });
            
            if (status !== 'unmodified') {
                // Create commit with message
                await this.git.commit({
                    fs: this.fs,
                    dir: this.vaultPath,
                    message: commitMessage,
                    author: {
                        name: 'Obsidian Git',
                        email: 'obsidian@example.com'
                    }
                });
                
                // Push to remote
                await this.git.push({
                    fs: this.fs,
                    http: this.http,
                    dir: this.vaultPath,
                    remote: 'origin',
                    ref: this.settings.branchName,
                    onAuth: this.onAuth
                });
            } else {
                console.log('No changes to commit');
            }
        } catch (error) {
            console.error('Error pushing changes:', error);
            throw error;
        }
    }
}