const core = require('@actions/core');
const { getPullRequest } = require('../github/pulls');
const { getBodyChangelog, addChangelog } = require('./body');
const { getPrType, getPrsBetween } = require('./pulls');

function getOnPremChangelog(subPrs) {
  const releasePrs = subPrs.filter(
    p => getPrType(p) === 'release',
  );

  if (core.isDebug()) {
    core.startGroup('release-PRs:');
    core.debug(JSON.stringify(releasePrs, null, 2));
    core.endGroup();
  }

  return releasePrs.map(p => getBodyChangelog(p));
}

async function updateOnPremPR(octokit, owner, repo, prNumber) {
  const pr = await getPullRequest(octokit, owner, repo, prNumber);

  const includesPrs = await getPrsBetween(octokit, owner, repo, pr.base.sha, pr.head.sha);

  const changelog = getOnPremChangelog(includesPrs);
  const body = await addChangelog(octokit, owner, repo, pr, changelog);

  if (!pr.labels.some(l => l.name === 'onprem')) {
    core.info('Adding onprem label');
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: ['onprem'],
    });
  }

  return body;
}

module.exports = {
  updateOnPremPR,
};
