async function getPullRequest(octokit, repo, mergeCommit) {
  const result = await octokit.rest.search.issuesAndPullRequests({
    q: `${mergeCommit}+repo:${repo}+state:closed`,
  });

  if (result.data.total_count !== 1) {
    throw new Error(
      "Unexpected getPullRequest result length, got " + result.total_count
    );
  }

  return result.data.items[0];
}

module.exports = {
  getPullRequest,
};
