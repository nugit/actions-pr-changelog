async function getCommit(octokit, owner, repo, sha) {
  const result = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: sha,
  });

  return result.data;
}

async function getFirstCommit(octokit, owner, repo, base, head) {
  const result = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`,
    page: 1,
    per_page: 1,
  });

  return result.data.commits[0];
}

async function findMergeCommits(octokit, owner, repo, base, head) {
  const pageSize = 5;
  const result = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`,
    page: 1,
    per_page: pageSize,
  });

  const {
    data: { total_commits: totalCount, commits },
  } = result;

  const pageCount = Math.ceil(totalCount / pageSize);
  const pages = [commits];
  for (let i = 2; i <= pageCount; i += 1) {
    pages.push(
      octokit.rest.repos
        .compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${base}...${head}`,
          page: i,
          per_page: pageSize,
        })
        .then(d => d.data.commits),
    );
  }

  const data = await Promise.all(pages);

  return data
    .flat()
    .filter(c => c.parents.length > 1)
    .map(c => c.sha);
}

module.exports = {
  getFirstCommit,
  getCommit,
  findMergeCommits,
};
