export interface XitSettings {
    githubToken: string;
    repoUrl: string;
    branchName: string;
    autoCommitInterval: number
}

export const DEFAULT_SETTINGS: XitSettings = {
    githubToken: '',
    repoUrl: '',
    branchName: 'main',
    autoCommitInterval: 5, 
}