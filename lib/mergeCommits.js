const cp = require('child_process');
const core = require('@actions/core');

async function getCommit(octokit, owner, repo, sha) {
  const result = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: sha,
  });

  return result.data;
}

async function getFirstCommit(octokit, owner, repo, base, head) {
  const result = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`,
    page: 1,
    per_page: 1,
  });

  return result.data.commits[0];
}

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
  getFirstCommit,
  getCommit,
};
