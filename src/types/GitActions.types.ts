export interface GitActions {
    push: () => Promise<void>;
    clone: () => Promise<void>;
    sync: () => Promise<void>;
}