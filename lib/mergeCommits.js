const cp = require("child_process");
const core = require('@actions/core');

const commitRegex = /^(\w+) (.*)$/;

async function getCommit(octokit, owner, repo, sha) {
  const result = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: sha,
  });

  return result.data;
}

async function getFirstCommit(octokit, owner, repo, base, head) {
  const result = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base, 
    head,
  });

  return result.data.commits[0];
}

function getMergeCommits(base, branch) {
  if (core.isDebug()) {
    core.startGroup('getMergeCommits');
  }

  cp.execSync(`git fetch --all`);

  const cmd = `git log ${base}...${branch} --merges --first-parent --oneline --right-only`;
  const output = cp.execSync(cmd);

  core.debug(`Executing command: ${cmd}`);
  core.debug(`Got output: ${output}`);

  const commits = output
    .toString()
    .split("\n")
    .map((line) => {
      const matches = line.match(commitRegex);

      return matches !== null ? matches[1] : null;
    })
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
