const core = require('@actions/core');

async function getPullRequest(octokit, owner, repo, prNumber) {
  const result = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return result.data;
}

async function findPullRequest(octokit, repo, mergeCommit) {
  const result = await octokit.rest.search.issuesAndPullRequests({
    q: `${mergeCommit}+repo:${repo}+state:closed`,
  });

  if (result.data.total_count !== 1) {
    throw new Error(
      `Unexpected findPullRequest result length, got ${result.total_count}`,
    );
  }

  return getPullRequest(octokit, repo, result.data.items[0].number);
}

async function findPullRequestFrom(octokit, owner, repo, from) {
  const q = `repo:${owner}/${repo}+merged:>${from}`;
  const pageSize = 100;
  const result = await octokit.rest.search.issuesAndPullRequests({
    q,
    per_page: pageSize,
  });

  const {
    data: { total_count: totalCount, items },
  } = result;

  const pageCount = Math.ceil(totalCount / pageSize);
  const pages = [items];
  for (let i = 2; i < pageCount; i += 1) {
    pages.push(
      octokit.rest.search
        .issuesAndPullRequests({
          q,
          per_page: pageSize,
          page: i,
        })
        .then(d => d.data.items),
    );
  }

  const data = await Promise.all(pages);

  const prs = await Promise.all(
    data.flat().map(item => getPullRequest(octokit, owner, repo, item.number)),
  );

  return prs;
}

async function getPullRequestCommits(octokit, repo, prNumber) {
  const result = await octokit.rest.pulls.listCommits({
    owner: repo.split('/')[0],
    repo: repo.split('/')[1],
    pull_number: prNumber,
  });

  return result.data;
}

async function findOpenPullRequests(octokit, owner, repo, head, base) {
  const result = await octokit.rest.pulls.list({
    owner,
    repo,
    head: `${owner}:${head}`,
    base,
    state: 'open',
  });

  return result.data[0] || null;
}

async function createPullRequest(octokit, owner, repo, head, base, title, reviewers) {
  const pull = await findOpenPullRequests(octokit, owner, repo, head, base);

  if (pull !== null) {
    core.info(`Pull request already exists: ${pull.html_url}`);
    return;
  }

  const compare = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`,
  });

  if (compare.data.ahead_by === 0) {
    core.info('No changes');
    return;
  }

  const newPull = await octokit.rest.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    draft: true,
  });

  core.info('Pull request created');

  await octokit.rest.pulls.requestReviewers({
    owner,
    repo,
    pull_number: newPull.data.number,
    reviewers,
  });

  core.info('Reviews requested');
}

module.exports = {
  findPullRequest,
  findOpenPullRequests,
  getPullRequest,
  getPullRequestCommits,
  findPullRequestFrom,
  createPullRequest,
};
