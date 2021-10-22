const core = require('@actions/core');
const { getFirstCommit, findMergeCommits } = require('../github/commits');
const { findPullRequestFrom } = require('../github/pulls');

function getPrType(pr) {
  if (pr.base.ref === 'develop') {
    return pr.labels.some(l => l.name === 'dependencies') ? 'deps' : 'feat';
  }

  if (pr.base.ref === 'master') {
    return 'release';
  }

  if (pr.base.ref === 'onprem-master') {
    return 'onprem';
  }

  return 'unknown';
}

async function getPrsBetween(octokit, owner, repo, baseSha, headSha) {
  const firstCommit = await getFirstCommit(
    octokit,
    owner,
    repo,
    baseSha,
    headSha,
  );

  if (core.isDebug()) {
    core.startGroup('first commit:');
    core.debug(JSON.stringify(firstCommit, null, 2));
    core.endGroup();
  }

  const possiblePrs = await findPullRequestFrom(
    octokit,
    owner,
    repo,
    firstCommit.commit.committer.date,
  );

  if (core.isDebug()) {
    core.startGroup('possible PRs:');
    core.debug(JSON.stringify(possiblePrs, null, 2));
    core.endGroup();
  }

  const mergeCommits = await findMergeCommits(octokit, owner, repo, baseSha, headSha);

  if (core.isDebug()) {
    core.startGroup('merge commits:');
    core.debug(JSON.stringify(Array.from(mergeCommits), null, 2));
    core.endGroup();
  }

  const possiblePrsByMergeCommit = possiblePrs.reduce((acc, p) => {
    acc.set(p.merge_commit_sha, p);
    return acc;
  }, new Map());

  const includesPrs = Array.from(mergeCommits).reduce((acc, c) => {
    if (possiblePrsByMergeCommit.has(c)) {
      acc.push(possiblePrsByMergeCommit.get(c));
    } else {
      core.warning(`No Pr found for merge-commit ${c}`);
    }

    return acc;
  }, []);

  if (core.isDebug()) {
    core.startGroup('included-PRs:');
    core.debug(JSON.stringify(includesPrs, null, 2));
    core.endGroup();
  }

  return includesPrs;
}

module.exports = {
  getPrType,
  getPrsBetween,
};
