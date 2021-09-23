const MARKER = '=== DO NOT EDIT BELOW THIS LINE ===';
const core = require('@actions/core');

const emptyLineRegex = /^\s*$/;

function trimEmptyLines(body) {
  const result = [];
  let isPreviousEmpty = true;

  for (let i = 0; i < body.length; i += 1) {
    const isEmpty = emptyLineRegex.test(body[i]);
    if (!isEmpty) {
      result.push(body[i]);
    } else if (!isPreviousEmpty) {
      result.push('');
    }
    isPreviousEmpty = isEmpty;
  }

  return result;
}

async function addChangelog(octokit, owner, repo, pr, changelog) {
  const lines = pr.body ? pr.body.split('\n') : [];
  const body = [];

  for (let i = 0; i < lines.length; i += 1) {
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
    body: trimEmptyLines(body).join('\n'),
  });

  return body;
}

function getBodyChangelog(pr) {
  const [, changes = null] = pr.body.split(MARKER);

  const lines = [
    `## ${pr.title} #${pr.number}`,
  ];

  if (changes === null) {
    core.error(`Changelog not found on ${pr.number}`);
    lines.push(pr.body);
  } else {
    lines.push(changes);
  }

  lines.push('\n');

  return lines.join('\n');
}

module.exports = {
  addChangelog,
  getBodyChangelog,
};
