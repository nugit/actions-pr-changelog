const core = require('@actions/core');
const { getPullRequest } = require('../github/pulls');
const { addChangelog } = require('./body');
const { findJiraTicket } = require('./jira');
const { getPrsBetween, getPrType } = require('./pulls');

function getReleaseChangelog(subPrs) {
  const [prs, depsPRs] = subPrs.reduce(
    (acc, p) => {
      if (getPrType(p) === 'deps') {
        acc[1].push(p);
      } else {
        acc[0].push(p);
      }

      return acc;
    },
    [[], []],
  );

  const tickets = findJiraTicket(subPrs);

  if (core.isDebug()) {
    core.startGroup('main-PRs:');
    core.debug(JSON.stringify(prs, null, 2));
    core.endGroup();
  }

  if (core.isDebug()) {
    core.startGroup('deps-PRs:');
    core.debug(JSON.stringify(depsPRs, null, 2));
    core.endGroup();
  }

  const changelog = [
    '\n**JIRA Tickets:**',
    tickets.length > 0 ? '' : '- N/A',
    ...tickets,
    prs.length > 0 ? '\n**PRs:**' : '',
    ...prs.map(p => `- ${p.title} #${p.number}`),
    depsPRs.length > 0 ? '\n**Dependabot PRs:**' : '',
    ...depsPRs.map(p => `- ${p.title} #${p.number}`),
  ].filter(Boolean);

  return changelog;
}

async function updateReleasePR(octokit, owner, repo, prNumber) {
  const pr = await getPullRequest(octokit, owner, repo, prNumber);

  const includesPrs = await getPrsBetween(octokit, owner, repo, pr.base.sha, pr.head.sha);

  const changelog = getReleaseChangelog(includesPrs);
  const body = await addChangelog(octokit, owner, repo, pr, changelog);

  if (!pr.labels.some(l => l.name === 'release')) {
    core.info('Adding release label');
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: ['release'],
    });
  }

  return body;
}

module.exports = {
  updateReleasePR,
};
