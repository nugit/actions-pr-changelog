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
      "Unexpected findPullRequest result length, got " + result.total_count
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
    data: { total_count, items },
  } = result;

  const pageCount = Math.ceil(total_count / pageSize);
  const pages = [items];
  for (let i = 2; i < pageCount; i+=1) {
    pages.push(
      octokit.rest.search
        .issuesAndPullRequests({
          q,
          per_page: pageSize,
          page: i,
        })
        .then((d) => d.data.items)
    );
  }

  const data = await Promise.all(pages);

  const prs = await Promise.all(
    data.flat().map(item => getPullRequest(octokit, owner, repo, item.number))
  );

  return prs;
}

async function getPullRequestCommits(octokit, repo, prNumber) {
  const result = await octokit.rest.pulls.listCommits({
    owner: repo.split("/")[0],
    repo: repo.split("/")[1],
    pull_number: prNumber,
  });

  return result.data;
}

module.exports = {
  findPullRequest,
  getPullRequest,
  getPullRequestCommits,
  findPullRequestFrom,
};
