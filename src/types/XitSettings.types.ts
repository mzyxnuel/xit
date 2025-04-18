export interface XitSettings {
    githubToken: string;
    gitAutoSync: boolean;
    repoUrl: string;
    branchName: string;
}

export const DEFAULT_SETTINGS: XitSettings = {
    githubToken: '',
    gitAutoSync: true,
    repoUrl: '',
    branchName: 'main'
}