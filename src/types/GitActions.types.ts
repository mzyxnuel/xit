export interface GitAction {
    push: () => Promise<void>;
    clone: () => Promise<void>;
    sync: () => Promise<void>;
}