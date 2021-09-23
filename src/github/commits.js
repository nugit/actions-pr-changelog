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

module.exports = {
  getFirstCommit,
  getCommit,
};
