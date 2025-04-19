export interface XitSettings {
    githubToken: string;
    repoUrl: string;
    branchName: string;
}

export const DEFAULT_SETTINGS: XitSettings = {
    githubToken: '',
    repoUrl: '',
    branchName: 'main'
}