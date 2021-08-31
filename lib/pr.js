const { getPullRequest, findPullRequestFrom } = require("./getPullRequest");
const { getFirstCommit, getMergeCommits } = require("./mergeCommits");
const core = require('@actions/core');

const MARKER = "=== DO NOT EDIT BELOW THIS LINE ===";

function getPrType(pr) {
  if (pr.base.ref === "develop") {
    return pr.labels.some((l) => l.name === "dependencies") ? "deps" : "feat";
  }

  if (pr.base.ref === "master") {
    return "release";
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

  core.debug(`main PRs: ${JSON.stringify(prs, null, 2)}`);
  core.debug(`deps PRs: ${JSON.stringify(depsPRs, null, 2)}`);

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

async function updateReleasePR(octokit, owner, repo, prNumber) {
  const pr = await getPullRequest(octokit, owner, repo, prNumber);

  const firstCommit = await getFirstCommit(
    octokit,
    owner,
    repo,
    pr.base.sha,
    pr.head.sha
  );

  core.debug(`first commit is ${JSON.stringify(firstCommit, null, 2)}`);

  const possiblePrs = await findPullRequestFrom(
    octokit,
    owner,
    repo,
    firstCommit.commit.committer.date
  );

  core.debug(`possible PRs are ${JSON.stringify(possiblePrs, null, 2)}`);

  const mergeCommits = await getMergeCommits(pr.base.sha, pr.head.sha);

  core.debug(`merge commits are ${JSON.stringify(mergeCommits, null, 2)}`);

  const subPrs = possiblePrs.filter((pr) => {
    return mergeCommits.has(pr.merge_commit_sha.slice(0, 9));
  });

  core.debug(`sub-PRs are ${JSON.stringify(subPrs, null, 2)}`);

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

module.exports = {
  getPrType,
  getReleaseChangelog,
  updateReleasePR,
};
