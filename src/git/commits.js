const cp = require('child_process');
const core = require('@actions/core');

function getMergeCommits(base, branch, since) {
  if (core.isDebug()) {
    core.startGroup('getMergeCommits');
  }

  // @action/checkout shallow clone the repo, we need to extend
  const cmd = `git fetch --update-shallow --shallow-since ${since} && git log ${base}...${branch} --merges --first-parent --oneline --right-only --format=%H`;
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
