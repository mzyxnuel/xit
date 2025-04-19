# Xit

**Xit** is an [Obsidian](https://obsidian.md/) plugin designed to seamlessly synchronize your notes with a Git repository directly from within Obsidian. Keep your vault version-controlled and backed up effortlessly.

## Features

*   **Automatic & Manual Sync:** Configure automatic synchronization or trigger sync operations manually.
*   **Git Operations:** Supports common Git actions like commit, push, and pull.
*   **Settings Tab:** Configure your Git repository details and plugin behavior through the Obsidian settings.
*   **Cross-Platform:** Works wherever Obsidian runs (desktop).

## Installation

1.  Open Obsidian's **Settings**.
2.  Go to **Community plugins**.
3.  Ensure **Restricted mode** is **off**.
4.  Click **Browse** community plugins.
5.  Search for "Xit".
6.  Click **Install**.
7.  Once installed, click **Enable**.
8.  Configure the plugin settings (see Usage).

*(Alternatively, manual installation instructions can be added here if you plan to support that)*

## Usage

1.  After enabling the plugin, go to the **Xit** settings tab in Obsidian's **Settings**.
2.  Configure the path to your local Git repository (usually your Obsidian vault path if it's already a Git repo, or initialize one).
3.  Set up remote repository details if you want to push/pull (URL, authentication).
4.  Configure sync frequency and other options as needed.
5.  Use the command palette or configured hotkeys/buttons to perform Git actions (Commit, Push, Pull, Sync).

## Development

To contribute or build the plugin locally:

1.  Clone the repository.
2.  Install dependencies:
    ```sh
    pnpm install
    ```
3.  Run the development build (watches for changes):
    ```sh
    pnpm run dev
    ```
4.  Run the production build:
    ```sh
    pnpm run build
    ```
5.  Run tests:
    ```sh
    pnpm test
    ```

## License

This plugin is licensed under the [0BSD License](LICENSE). See the [LICENSE](LICENSE) file for details.
