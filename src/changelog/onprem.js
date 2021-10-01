const core = require('@actions/core');
const { getPullRequest } = require('../github/pulls');
const { getBodyChangelog, addChangelog } = require('./body');
const { getPrType, getPrsBetween } = require('./pulls');

function getOnPremChangelog(subPrs) {
  const [releasePrs, otherPrs] = subPrs.reduce(
    (acc, p) => {
      if (getPrType(p) === 'release') {
        acc[0].push(p);
      } else {
        acc[1].push(p);
      }

      return acc;
    },
    [[], []],
  );

  if (otherPrs.length > 0) {
    core.warning(`Found ${otherPrs.length} non-release PRs: ${otherPrs.map(p => p.number).join(', ')}`);
  }

  if (core.isDebug()) {
    core.startGroup('release-PRs:');
    core.debug(JSON.stringify(releasePrs, null, 2));
    core.endGroup();
  }

  if (core.isDebug()) {
    core.startGroup('other-PRs:');
    core.debug(JSON.stringify(otherPrs, null, 2));
    core.endGroup();
  }

  return subPrs.map(p => getBodyChangelog(p));
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
