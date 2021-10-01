const mainConfig = {
  branches: [
    'master',
    { name: 'develop', channel: 'beta', prerelease: 'beta' },
  ],
  repositoryUrl: 'https://github.com/nugit/actions-pr-changelog.git',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'dist/**'],
        message:
          // eslint-disable-next-line no-template-curly-in-string
          'chore(release): ${nextRelease.version}',
      },
    ],
    [
      '@semantic-release/github', {
        assets: ['dist/**'],
      },
    ],
    [
      'semantic-release-slack-bot',
      {
        notifyOnSuccess: true,
        notifyOnFail: true,
        markdownReleaseNotes: true,
      },
    ],
  ],
};

module.exports = mainConfig;
