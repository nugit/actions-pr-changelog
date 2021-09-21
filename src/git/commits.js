const cp = require('child_process');
const core = require('@actions/core');

function getMergeCommits(base, branch) {
  if (core.isDebug()) {
    core.startGroup('getMergeCommits');
  }

  cp.execSync('git fetch --all');

  const cmd = `git log ${base}...${branch} --merges --first-parent --oneline --right-only --format=%H`;
  const output = cp.execSync(cmd);

  core.debug(`Executing command: ${cmd}`);
  core.debug(`Got output:\n${output}`);

  const commits = output
    .toString()
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  if (core.isDebug()) {
    core.endGroup();
  }

  return new Set(commits);
}

module.exports = {
  getMergeCommits,
};
