const { getPullRequest, findPullRequestFrom } = require("./getPullRequest");
const { getFirstCommit, getMergeCommits } = require("./mergeCommits");
const core = require('@actions/core');

const MARKER = "=== DO NOT EDIT BELOW THIS LINE ===";

function getPrType(pr) {
  if (pr.base.ref === "develop") {
    return pr.labels.some((l) => l.name === "dependencies") ? "deps" : "feat";
  }

  if (pr.labels.some((l) => l.name === "release")) {
    return 'release';
  }

  if (pr.base.ref === "onprem-master") {
    return "onprem";
  }

  return "unknown";
}

function findJiraTicket(prs) {
  const lines = prs.flatMap((pr) => {
    return pr.body ? pr.body.split(`\n`) : [];
  });
  const linesMap = new Map(
    lines
      .filter((line) => line.includes("atlassian.net"))
      .map((line) => {
        const match = line.match(
          /https:\/\/nugitco.atlassian.net\/browse\/(\w+-\w+)/
        );
        return [match[1], line];
      })
  );

  return Array.from(linesMap.values());
}

function findPrChangelog(pr) {
  const [,changes = null] = pr.body.split(MARKER);

  const lines = [
    `## ${pr.title} #${pr.number}`,
  ]

  if (changes === null) {
    core.error(`Changelog not found on ${pr.number}`);
    lines.push(pr.body);
  } else {
    lines.push(changes);
  }

  lines.push(`\n`);

  return lines.join('\n');
}

function getReleaseChangelog(subPrs) {
  const [prs, depsPRs] = subPrs.reduce(
    (acc, p) => {
      if (getPrType(p) === "deps") {
        acc[1].push(p);
      } else {
        acc[0].push(p);
      }

      return acc;
    },
    [[], []]
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
    "\n**JIRA Tickets:**",
    tickets.length > 0 ? "" : "- N/A",
    ...tickets,
    prs.length > 0 ? "\n**PRs:**" : "",
    ...prs.map((p) => `- ${p.title} #${p.number}`),
    depsPRs.length > 0 ? "\n**Dependabot PRs:**" : "",
    ...depsPRs.map((p) => `- ${p.title} #${p.number}`),
  ].filter(Boolean);

  return changelog;
}

function getOnPremChangelog(subPrs) {
  const [releasePrs, otherPrs] = subPrs.reduce(
    (acc, p) => {
      if (getPrType(p) === "release") {
        acc[0].push(p);
      } else {
        acc[1].push(p);
      }

      return acc;
    },
    [[], []]
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

  return subPrs.map(p => findPrChangelog(p)).join('\n');
}

async function updateReleasePR(octokit, owner, repo, prNumber) {
  const pr = await getPullRequest(octokit, owner, repo, prNumber);

  const firstCommit = await getFirstCommit(
    octokit,
    owner,
    repo,
    pr.base.sha,
    pr.head.sha
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
    firstCommit.commit.committer.date
  );

  if (core.isDebug()) {
    core.startGroup('possible PRs:');
    core.debug(JSON.stringify(possiblePrs, null, 2));
    core.endGroup();
  }

  const mergeCommits = await getMergeCommits(pr.base.sha, pr.head.sha);

  if (core.isDebug()) {
    core.startGroup('merge commits:');
    core.debug(JSON.stringify(Array.from(mergeCommits), null, 2));
    core.endGroup();
  }

  const subPrs = possiblePrs.filter((pr) => {
    return mergeCommits.has(pr.merge_commit_sha);
  });

  if (core.isDebug()) {
    core.startGroup('sub-PRs:');
    core.debug(JSON.stringify(subPrs, null, 2));
    core.endGroup();
  }

  const changelog = getReleaseChangelog(subPrs);
  const lines = pr.body ? pr.body.split(`\n`) : [];
  const body = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(MARKER)) {
      break;
    }
    body.push(lines[i]);
  }
  body.push('\n', MARKER);
  body.push(...changelog);

  core.info('Updating changelog');

  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: pr.number,
    body: body.join('\n'),
  });

  if (!pr.labels.some((l) => l.name === "release")) {
    core.info('Adding release label');
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: ["release"],
    });
  }

  return body;
};

async function updateOnPremPR(octokit, owner, repo, prNumber) {
  const pr = await getPullRequest(octokit, owner, repo, prNumber);

  const firstCommit = await getFirstCommit(
    octokit,
    owner,
    repo,
    pr.base.sha,
    pr.head.sha
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
    firstCommit.commit.committer.date
  );

  if (core.isDebug()) {
    core.startGroup('possible PRs:');
    core.debug(JSON.stringify(possiblePrs, null, 2));
    core.endGroup();
  }

  const mergeCommits = await getMergeCommits(pr.base.sha, pr.head.sha);

  if (core.isDebug()) {
    core.startGroup('merge commits:');
    core.debug(JSON.stringify(Array.from(mergeCommits), null, 2));
    core.endGroup();
  }

  const possiblePrsByMergeCommit = possiblePrs.reduce((acc, pr) => {
    acc.set(pr.merge_commit_sha, pr);
    return acc;
  }, new Map());

  const subPrs = Array.from(mergeCommits).reduce((acc, c) => {
    if (possiblePrsByMergeCommit.has(c)) {
      acc.push(possiblePrsByMergeCommit.get(c));
    } else {
      core.warning(`No Pr found for merge-commit ${c}`);
    }

    return acc;
  }, []);

  if (core.isDebug()) {
    core.startGroup('sub-PRs:');
    core.debug(JSON.stringify(subPrs, null, 2));
    core.endGroup();
  }

  const changelog = getOnPremChangelog(subPrs);
  const lines = pr.body ? pr.body.split(`\n`) : [];
  const body = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(MARKER)) {
      break;
    }
    body.push(lines[i]);
  }
  if (body[body.length - 1] !== `\n`) {
    body.push('\n');
  }
  body.push(MARKER, ...changelog);

  core.info('Updating release changelog');
  if (core.isDebug()) {
    core.startGroup('changelog:');
    core.debug(JSON.stringify(changelog, null, 2));
    core.endGroup();
  }

  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: pr.number,
    body: body.join('\n'),
  });

  if (!pr.labels.some((l) => l.name === "onprem")) {
    core.info('Adding onprem label');
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: ["onprem"],
    });
  }

  return body;
};

module.exports = {
  getPrType,
  getReleaseChangelog,
  updateReleasePR,
  updateOnPremPR,
};
