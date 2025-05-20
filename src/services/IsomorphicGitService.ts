import { XitSettings } from "../types/XitSettings.types";
import { GitActions } from "../types/GitActions.types";
import git from 'isomorphic-git';
import type { AuthCallback, AuthFailureCallback, GitHttpRequest, GitHttpResponse, HttpClient } from "isomorphic-git";
import { IsomorphicGitAdapter } from "src/adapters/IsomorphicGitAdapter";
import { Notice, requestUrl, Vault } from "obsidian";
import { UnstagedFile } from "src/types/Git.types";

export class IsomorphicGitService implements GitActions {
    private settings: XitSettings;
    private readonly fs: IsomorphicGitAdapter;
    private readonly noticeLength = 999_999;

    constructor(vault: Vault, settings: XitSettings) {
        this.settings = settings;
        this.fs = new IsomorphicGitAdapter(vault);
    }

    getRepo(): {
        fs: IsomorphicGitAdapter;
        dir: string;
        gitdir?: string;
        onAuth: AuthCallback;
        onAuthFailure: AuthFailureCallback;
        http: HttpClient;
    } {
        return {
            fs: this.fs,
            dir: ".",
            // Omit gitdir: let isomorphic-git use default ".git" directory under `dir`
            onAuth: () => {
                return {
                    username: 'x-access-token',
                    password: this.settings.githubToken,
                };
            },
            onAuthFailure: async () => {
                new Notice(
                    "Authentication failed. Please try with different credentials"
                );
            },
            http: {
                async request({
                    url,
                    method,
                    headers,
                    body,
                }: GitHttpRequest): Promise<GitHttpResponse> {
                    // We can't stream yet, so collect body and set it to the ArrayBuffer
                    // because that's what requestUrl expects
                    let collectedBody: ArrayBuffer | undefined;
                    if (body) {
                        collectedBody = (await collect(body)).buffer;
                    }

                    const res = await requestUrl({
                        url,
                        method,
                        headers,
                        body: collectedBody,
                        throw: false,
                    });
                    return {
                        url,
                        method,
                        headers: res.headers,
                        // Wrap the single Uint8Array in an async iterable iterator as required by GitHttpResponse.body
                        body: (async function*() {
                            yield new Uint8Array(res.arrayBuffer);
                        })(),
                        statusCode: res.status,
                        statusMessage: res.status.toString(),
                    };
                },
            },
        };
    }

    async clone(): Promise<void> {
        /*try {
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
            await this.wrapFS(
                this.git.clone({
                    ...this.getRepo(),
                    url: this.settings.repoUrl,
                    ref: this.settings.branchName,
                    singleBranch: true,
                    depth: 1,
                    noTags: true,
                    noCheckout: false
                })
            );
        } catch (error) {
            console.error('Error cloning repository:', error);
            throw error;
        }*/
    }

    async sync(): Promise<void> {        
        /* Fetch latest
        await this.wrapFS(
            this.git.fetch({
                ...this.getRepo(),
                url: this.settings.repoUrl,
                ref: this.settings.branchName,
                depth: 1,
                singleBranch: true,
                tags: false
            })
        );
        
        // Get current branch 
        try {
            await this.wrapFS(
                this.git.checkout({
                    ...this.getRepo(),
                    ref: this.settings.branchName,
                    force: true
                })
            );
        } catch (e) {
            // If checking current branch fails, force checkout
            await this.wrapFS(
                this.git.checkout({
                    ...this.getRepo(),
                    ref: this.settings.branchName,
                    force: true
                })
            );
        }
        
        // Get latest commit from remote branch
        const remoteRef = `refs/remotes/origin/${this.settings.branchName}`;
        const latestCommit = await this.wrapFS(
            this.git.resolveRef({
                ...this.getRepo(),
                ref: remoteRef
            })
        );
        
        // Reset to latest commit (equivalent to reset --hard)
        await this.wrapFS(
            this.git.reset({
                ...this.getRepo(),
                ref: latestCommit,
                hard: true
            })
        );
        
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
        }*/
    }

    async push(): Promise<void> {
        try {
            this.commitAll();

            await this.wrapFS(
                git.push({
                    ...this.getRepo()
                })
            );
        } catch (error) {
            throw error;
        }
    }

    async commitAll(): Promise<number | undefined> {
        try {
            await this.stageAll();
            return this.commit();
        } catch (error) {
            throw error;
        }
    }

    async stageAll(): Promise<void> {
        try {
            const filesToStage = await this.getUnstagedFiles();
            await Promise.all(
                filesToStage.map(({ path, deleted }) =>
                    deleted
                        ? git.remove({ ...this.getRepo(), filepath: path })
                        : this.wrapFS(
                                git.add({ ...this.getRepo(), filepath: path })
                            )
                )
            );
        } catch (error) {
            throw error;
        }
    }

    async getUnstagedFiles(): Promise<UnstagedFile[]> {
        let notice: Notice | undefined;
        const timeout = window.setTimeout(() => {
            notice = new Notice(
                "This takes longer: Getting status",
                this.noticeLength
            );
        }, 20000);
        try {
            const repo = this.getRepo();
            const res = await this.wrapFS<Promise<UnstagedFile[]>>(
                //Modified from `git.statusMatrix`
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                git.walk({
                    ...repo,
                    trees: [git.WORKDIR(), git.STAGE()],
                    map: async function (
                        filepath,
                        [workdir, stage]
                    ): Promise<UnstagedFile | null | undefined> {
                        // Ignore ignored files, but only if they are not already tracked.
                        if (!stage && workdir) {
                            const isIgnored = await git.isIgnored({
                                ...repo,
                                filepath,
                            });
                            if (isIgnored) {
                                return null;
                            }
                        }

                        const [workdirType, stageType] = await Promise.all([
                            workdir && workdir.type(),
                            stage && stage.type(),
                        ]);

                        const isBlob = [workdirType, stageType].includes(
                            "blob"
                        );

                        // For now, bail on directories unless the file is also a blob in another tree
                        if (
                            (workdirType === "tree" ||
                                workdirType === "special") &&
                            !isBlob
                        )
                            return;

                        if (stageType === "commit") return null;
                        if (
                            (stageType === "tree" || stageType === "special") &&
                            !isBlob
                        )
                            return;

                        // Figure out the oids for files, using the staged oid for the working dir oid if the stats match.
                        const stageOid =
                            stageType === "blob"
                                ? await stage!.oid()
                                : undefined;
                        let workdirOid;
                        if (workdirType === "blob" && stageType !== "blob") {
                            // We don't actually NEED the sha. Any sha will do
                            workdirOid = "42";
                        } else if (workdirType === "blob") {
                            workdirOid = await workdir!.oid();
                        }
                        if (!workdirOid) {
                            return {
                                path: filepath,
                                deleted: true,
                            };
                        }

                        if (workdirOid !== stageOid) {
                            return {
                                path: filepath,
                                deleted: false,
                            };
                        }
                        return null;
                    },
                })
            );
            window.clearTimeout(timeout);
            notice?.hide();
            return res;
        } catch (error) {
            window.clearTimeout(timeout);
            notice?.hide();
            throw error;
        }
    }

    async commit(): Promise<undefined> {
        try {
            let parent: string[] | undefined = undefined;

            await this.wrapFS(
                git.commit({
                    ...this.getRepo(),
                    message: `vault mobile sync ${new Date().toISOString()}`,
                    parent: parent,
                })
            );
            return;
        } catch (error) {
            throw error;
        }
    }

    async wrapFS<T>(call: Promise<T>): Promise<T> {
        try {
            const res = await call;
            await this.fs.saveAndClear();
            return res;
        } catch (error) {
            await this.fs.saveAndClear();
            throw error;
        }
    }
}

function fromValue(value: any) {
    let queue = [value];
    return {
        next() {
            return Promise.resolve({
                done: queue.length === 0,
                value: queue.pop(),
            });
        },
        return() {
            queue = [];
            return {};
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    };
}

function getIterator(iterable: any) {
    if (iterable[Symbol.asyncIterator]) {
        return iterable[Symbol.asyncIterator]();
    }
    if (iterable[Symbol.iterator]) {
        return iterable[Symbol.iterator]();
    }
    if (iterable.next) {
        return iterable;
    }
    return fromValue(iterable);
}

async function forAwait(iterable: any, cb: any) {
    const iter = getIterator(iterable);
    while (true) {
        const { value, done } = await iter.next();
        if (value) await cb(value);
        if (done) break;
    }
    if (iter.return) iter.return();
}

async function collect(iterable: any): Promise<Uint8Array> {
    let size = 0;
    const buffers: Uint8Array[] = [];
    // This will be easier once `for await ... of` loops are available.
    await forAwait(iterable, (value: any) => {
        buffers.push(value);
        size += value.byteLength;
    });
    const result = new Uint8Array(size);
    let nextIndex = 0;
    for (const buffer of buffers) {
        result.set(buffer, nextIndex);
        nextIndex += buffer.byteLength;
    }
    return result;
}